FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libomp-dev build-essential && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir torch==2.2.2 --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt . 
RUN pip install --no-cache-dir --user -r requirements.txt

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libomp-dev && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local 
COPY --from=builder /root/.cache/huggingface /root/.cache/huggingface

COPY . .

ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]