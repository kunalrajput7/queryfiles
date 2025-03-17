from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from sentence_transformers import SentenceTransformer
import faiss
import PyPDF2
import numpy as np
import torch
import os

app = FastAPI()

# Add CORS middleware to allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite’s default dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model configuration (flexible for local vs. cloud)
MODEL_NAME = os.getenv("MODEL_NAME", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")
USE_QUANTIZATION = torch.cuda.is_available() and torch.cuda.get_device_properties(0).total_memory < 6e9

print(f"Initializing model: {MODEL_NAME}")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# Optional quantization config if needed for limited GPU memory
quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16
) if USE_QUANTIZATION else None

model_kwargs = {
    "pretrained_model_name_or_path": MODEL_NAME,
    "device_map": "auto",
    "torch_dtype": torch.float16,
    "low_cpu_mem_usage": True
}
if quant_config:
    model_kwargs["quantization_config"] = quant_config
if MODEL_NAME == "microsoft/phi-2":
    model_kwargs["trust_remote_code"] = True

model = AutoModelForCausalLM.from_pretrained(**model_kwargs)
print(f"Model {MODEL_NAME} loaded successfully.")

# Load an embedding model for generating vector representations
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Global FAISS index and list of PDF chunks
index = None
pdf_chunks = []

# Function to extract text from a PDF file
def extract_text_from_pdf(file):
    try:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text
    except Exception as e:
        raise Exception(f"Error extracting PDF: {str(e)}")

# Process the PDF text into chunks and build a FAISS index
def process_pdf(text):
    global index, pdf_chunks
    words = text.split()
    # Split text into chunks of 200 words each
    pdf_chunks = [' '.join(words[i:i+200]) for i in range(0, len(words), 200)]
    if not pdf_chunks:
        raise Exception("No text extracted from PDF")
    
    embeddings = embedder.encode(pdf_chunks, convert_to_numpy=True)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    print(f"Processed {len(pdf_chunks)} chunks into FAISS index.")

# Generate a response to a user query using RAG (Retrieval-Augmented Generation)
def generate_response(query):
    if index is None or not pdf_chunks:
        return "Please upload a PDF first."
    
    query_embedding = embedder.encode([query])
    D, I = index.search(query_embedding, k=3)  # Get top 3 relevant chunks
    relevant_chunks = [pdf_chunks[i] for i in I[0]]
    context = "\n".join(relevant_chunks)

    prompt = f"Context:\n{context}\n\nQuestion: {query}\nAnswer:"
    inputs = tokenizer(prompt, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")
    
    outputs = model.generate(
        **inputs,
        max_new_tokens=100,
        do_sample=True,
        temperature=0.7,
        top_p=0.9
    )
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Remove prompt text from the beginning of the response if present
    if response.startswith(prompt):
        response = response[len(prompt):].strip()
    return response

# API endpoint to upload and process a PDF file
@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        text = extract_text_from_pdf(file.file)
        process_pdf(text)
        return {"message": "PDF processed successfully"}
    except Exception as e:
        return {"error": str(e)}

# API endpoint to handle queries against the processed PDF
@app.get("/query")
async def query_pdf(query: str):
    try:
        response = generate_response(query)
        return {"response": response}
    except Exception as e:
        return {"error": str(e)}

# Run the app with Uvicorn when this script is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
