from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoModelForCausalLM, AutoTokenizer
from sentence_transformers import SentenceTransformer
from google.cloud import storage, firestore
import faiss
import fitz  # PyMuPDF
import numpy as np
import torch
import os
import uuid
import json
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "../gcs_key.json"
BUCKET_NAME = "pdf-faiss-bucket"

storage_client = storage.Client()
bucket = storage_client.bucket(BUCKET_NAME)
firestore_client = firestore.Client()

# Device detection
device = (
    "cuda" if torch.cuda.is_available() else 
    "mps" if torch.backends.mps.is_available() else 
    "cpu"
)
print(f"Using device: {device}")
if device == "cuda":
    print(f"GPU: {torch.cuda.get_device_name(0)}")
elif device == "mps":
    print("Running on Apple Silicon MPS")

embedder = SentenceTransformer("all-MiniLM-L6-v2", device=device)
print("Warming up embedder...")
embedder.encode(["Warm-up query"], convert_to_numpy=True)
print("Embedder warmed up.")

# Chat history to improve context-awareness
chat_history = {}

active_indices = {}
active_chunks_dict = {}

MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"  # Your chosen model

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

model_kwargs = {
    "pretrained_model_name_or_path": MODEL_NAME,
    "torch_dtype": torch.float16,  # FP16 to reduce memory usage
    "low_cpu_mem_usage": True,     # Optimize CPU memory during loading
}

# Load model directly onto MPS without offloading
model = AutoModelForCausalLM.from_pretrained(**model_kwargs).to(device)
print(f"Model {MODEL_NAME} loaded successfully on {device}.")
print("Warming up model...")
dummy_input = tokenizer(
    "<|system|>You are a helpful PDF chatbot.<|user|>Warm-up query<|assistant|>Warm-up response",
    return_tensors="pt"
).to(device)
model.generate(**dummy_input, max_new_tokens=20)
print("Model warmed up.")

def generate_uid():
    return str(uuid.uuid4())

def upload_to_gcs(source_file, destination_blob_name):
    try:
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(source_file)
        print(f"File {source_file} uploaded to gs://{BUCKET_NAME}/{destination_blob_name}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to GCS: {str(e)}")

def extract_text_from_pdf(file_path):
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text("text")
        doc.close()
        if not text.strip():
            raise ValueError("No extractable text found in the PDF.")
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting PDF: {str(e)}")

async def save_pdf_locally(upload_file: UploadFile):
    temp_pdf_path = f"./{upload_file.filename}"
    with open(temp_pdf_path, "wb") as f:
        while chunk := await upload_file.read(4096):
            f.write(chunk)
    return temp_pdf_path

def process_pdf_and_store_index(text, uid, pdf_name):
    try:
        words = text.split()
        pdf_chunks = [" ".join(words[i:i + 200]) for i in range(0, len(words), 200)]
        if not pdf_chunks:
            raise Exception("No text extracted from PDF")

        embeddings = embedder.encode(pdf_chunks, convert_to_numpy=True)
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings)

        index_file = f"{pdf_name}.index"
        faiss.write_index(index, index_file)
        index_gcs_path = f"{uid}/index/{index_file}"
        upload_to_gcs(index_file, index_gcs_path)
        os.remove(index_file)
        print(f"FAISS index uploaded and deleted locally: {index_gcs_path}")

        chunks_file = f"{pdf_name}.chunks.json"
        with open(chunks_file, "w") as f:
            json.dump(pdf_chunks, f)
        chunks_gcs_path = f"{uid}/chunks/{chunks_file}"
        upload_to_gcs(chunks_file, chunks_gcs_path)
        os.remove(chunks_file)
        print(f"Chunks uploaded and deleted locally: {chunks_gcs_path}")

        return index_gcs_path, chunks_gcs_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

def save_file_metadata(uid, pdf_name, pdf_gcs_path, index_gcs_path, chunks_gcs_path):
    try:
        fileid = str(uuid.uuid4())
        file_data = {
            "filename": pdf_name,
            "pdfUrl": f"https://storage.googleapis.com/{BUCKET_NAME}/{pdf_gcs_path}",
            "indexUrl": f"https://storage.googleapis.com/{BUCKET_NAME}/{index_gcs_path}",
            "chunksUrl": f"https://storage.googleapis.com/{BUCKET_NAME}/{chunks_gcs_path}",
            "upload_date": firestore.SERVER_TIMESTAMP,
        }
        doc_ref = firestore_client.collection("users").document(uid).collection("files").document(fileid)
        doc_ref.set(file_data)
        print(f"File metadata saved for {uid} under file id {fileid}")
        return fileid
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving metadata to Firestore: {str(e)}")

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...), uid: str = Form(None)):
    try:
        if not uid:
            uid = generate_uid()
        pdf_name = file.filename

        pdf_local_path = await save_pdf_locally(file)
        pdf_gcs_path = f"{uid}/pdf/{pdf_name}"
        upload_to_gcs(pdf_local_path, pdf_gcs_path)

        text = extract_text_from_pdf(pdf_local_path)
        index_gcs_path, chunks_gcs_path = process_pdf_and_store_index(text, uid, pdf_name)
        fileid = save_file_metadata(uid, pdf_name, pdf_gcs_path, index_gcs_path, chunks_gcs_path)

        os.remove(pdf_local_path)
        return {
            "message": "PDF uploaded and processed successfully",
            "uid": uid,
            "id": fileid,
            "filename": pdf_name,
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/load_index")
async def load_index(uid: str = Form(...), fileid: str = Form(...)):
    try:
        doc_ref = firestore_client.collection("users").document(uid).collection("files").document(fileid)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="File metadata not found")
        data = doc.to_dict()
        index_url = data.get("indexUrl")
        chunks_url = data.get("chunksUrl")

        prefix = f"https://storage.googleapis.com/{BUCKET_NAME}/"
        if not (index_url.startswith(prefix) and chunks_url.startswith(prefix)):
            raise HTTPException(status_code=400, detail="Invalid URL format")
        index_path = index_url[len(prefix):]
        chunks_path = chunks_url[len(prefix):]

        local_index_file = f"./temp_index_{uid}.index"
        blob = bucket.blob(index_path)
        blob.download_to_filename(local_index_file)
        active_indices[uid] = faiss.read_index(local_index_file)
        os.remove(local_index_file)
        print(f"Index for file {fileid} loaded for user {uid}")

        local_chunks_file = f"./temp_chunks_{uid}.json"
        blob = bucket.blob(chunks_path)
        blob.download_to_filename(local_chunks_file)
        with open(local_chunks_file, "r") as f:
            active_chunks_dict[uid] = json.load(f)
        os.remove(local_chunks_file)
        print(f"Chunks for file {fileid} loaded for user {uid}")

        return {"message": "Index and chunks loaded successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading index and chunks: {str(e)}")

@app.post("/query")
async def query_pdf(query: str = Form(...), uid: str = Form(...)):
    try:
        if uid not in active_indices or active_indices[uid] is None:
            raise HTTPException(status_code=400, detail="No FAISS index loaded. Please select a PDF first.")
        if uid not in active_chunks_dict or not active_chunks_dict[uid]:
            raise HTTPException(status_code=400, detail="No chunks loaded. Please select a PDF first.")

        index = active_indices[uid]
        chunks = active_chunks_dict[uid]

        start_time = time.time()

        t1 = time.time()
        query_embedding = embedder.encode([query], convert_to_numpy=True)
        print(f"Embedding time: {time.time() - t1:.2f}s")

        t2 = time.time()
        distances, indices = index.search(query_embedding, k=3)
        print(f"FAISS search time: {time.time() - t2:.2f}s")

        t3 = time.time()
        context = "\n".join([chunks[idx] for idx in indices[0] if idx < len(chunks)])
        print(f"Context building time: {time.time() - t3:.2f}s")

        # Add chat history for context-awareness
        if uid not in chat_history:
            chat_history[uid] = []
        history_str = "\n".join([f"User: {q}\nAssistant: {r}" for q, r in chat_history[uid][-5:]])  # Last 5 exchanges

        t4 = time.time()
        prompt = f"""<|system|>You are a helpful PDF chatbot. Provide clear, organized answers with bullet points for lists, proper punctuation, and a friendly tone.

Chat History:
{history_str}

Context:
{context}

Question: {query}<|user|>"""
        inputs = tokenizer(prompt, return_tensors="pt").to(device)
        print(f"Tokenization time: {time.time() - t4:.2f}s")

        t5 = time.time()
        outputs = model.generate(
            **inputs,
            max_new_tokens=200,  # Increased for detailed responses
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id,  # Avoid padding warnings
        )
        print(f"Generation time: {time.time() - t5:.2f}s")

        t6 = time.time()
        output_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"Decoding time: {time.time() - t6:.2f}s")

        t7 = time.time()
        # Clean up output to remove prompt and system tags
        if "<|system|>" in output_text:
            output_text = output_text.split("<|user|>")[1].strip()
        chat_history[uid].append((query, output_text))
        print(f"Post-processing time: {time.time() - t7:.2f}s")

        total_time = time.time() - start_time
        print(f"Total query time: {total_time:.2f}s")
        print(f"User: {uid}")
        print(f"Query: {query}")
        print(f"Output: {output_text}")

        return {"response": output_text}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    import signal
    import sys

    def signal_handler(sig, frame):
        print("Shutting down gracefully...")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)