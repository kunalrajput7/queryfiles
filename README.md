# 📄 QueryFile – AI-Powered Document Assistant

**QueryFile** is a full-stack web application that enables users to upload PDF documents and interact with them through a chat-based AI interface.  
It extracts information from PDFs, supports semantic search, and provides an intuitive experience for document analysis and Q&A.

[Check this project out - LIVE](https://www.queryfiles.com/)

---

## 🚀 Project Overview

QueryFile combines a **FastAPI backend** and a **Next.js (React) frontend** to deliver an **AI-powered PDF assistant**.  
The system supports **OCR-based text extraction, RAG-based semantic search, and LLM-powered Q&A**, making it ideal for quickly understanding, querying, and summarizing large documents (up to 30MB).

---

## 🛠️ Backend (`/backend`)

- **Framework & Language**: Python with **FastAPI**.  
- **Core Responsibilities**:
  - Handle **PDF uploads** from frontend.  
  - Extract text from PDFs (via **PyPDF2**, **unstructured**, OCR for scanned PDFs).  
  - Integrate with **Mistral-7B LLM** (via LangChain) for document Q&A.  
  - Use **Sentence Transformers** + **FAISS** for semantic vector search.  
  - Store and retrieve files in **Google Cloud Storage (GCS)**.  
  - Manage **multi-threaded uploads**, handling 15+ concurrent documents.  
  - Serve APIs behind **Nginx reverse proxy** for reliability.  
- **Deployment**:
  - Containerized with **Docker**.  
  - Deployed on **Google Cloud T4 GPU VM** for scalable RAG inference.  
- **Dependencies**: Managed via `requirements.txt`.  

---

## 🎨 Frontend (`/frontend`)

- **Framework**: **Next.js** (React) with Vite for fast builds.  
- **Core Responsibilities**:
  - **User-friendly UI** for uploading PDFs and chatting with AI.  
  - Authentication (login/signup) via **Firebase**.  
  - Display of chat responses, previews, and user interactions.  
  - Navigation with components like **Navbar**, **Sidebar**, and **MainPage**.  
  - Communication with backend via `axios`.  
- **Deployment**: Configured and deployed via **Vercel**.  

---

## 🔐 Authentication

- **Firebase Authentication** for user login, registration, and session management.  
- Key Components:  
  - `Login.jsx`  
  - `Signup.jsx`  
  - `AuthPage.jsx`  

---

## ☁️ Cloud Integration

- **Google Cloud Storage (GCS)**: Secure storage for uploaded PDFs.  
- **Google Cloud VM (T4 GPU)**: Hosts the backend, optimized for vector search + LLM inference.  
- **Nginx Reverse Proxy**: Manages routing, scalability, and fault tolerance.  

---

## 🤖 AI & Document Processing

- **LLM Integration**: Uses **Mistral-7B** (via LangChain) for natural language querying over PDFs.  
- **RAG Pipeline**: Combines **Sentence Transformers embeddings + FAISS** for semantic search.  
- **PDF Processing**: Extract text with **PyPDF2** and **unstructured**, including OCR for scanned documents.  

---

## 🚢 Deployment

- **Backend**:  
  - Dockerized FastAPI app with Nginx proxy.  
  - Deployed on **Google Cloud T4 GPU VM** for high-performance inference.  

- **Frontend**:  
  - Next.js React app deployed on **Vercel**.  

---

## 📑 Typical User Flow

1. User visits QueryFile web app.  
2. Registers or logs in via **Firebase Authentication**.  
3. Uploads a PDF document (up to 30MB).  
4. Asks questions in the **chat interface**.  
5. Backend processes document via OCR + RAG pipeline.  
6. AI generates answers based on semantic search + context retrieval.  
7. User can continue querying, view, or download results.  

---

## 📌 Summary

**QueryFile** is a **cloud-deployed, AI-powered document analysis platform**.  
It integrates:  
- A **Dockerized FastAPI backend** with Nginx proxy,  
- A **Next.js frontend** for user experience,  
- **Firebase** for authentication,  
- **Google Cloud (T4 GPU + GCS)** for scalable storage & inference,  
- A **RAG pipeline** with **Mistral-7B, Sentence Transformers, and FAISS** for semantic search.  

This project demonstrates an end-to-end, production-ready pipeline for **chat-based document analysis**, with strong focus on **scalability, performance, and user experience**.

---


## 🗺️ Architecture & Flow

### System Architecture

```mermaid
flowchart LR
  %% --- Client ---
  subgraph Client
    U[User Browser]
  end

  %% --- Frontend ---
  subgraph Frontend["Frontend (Vercel)"]
    FE[Next.js (React)]
    FB[Firebase Auth]
  end

  %% --- Backend ---
  subgraph Backend["Backend (GCP VM • T4 GPU)"]
    NGINX[Nginx Reverse Proxy]
    API[FastAPI (Docker)]
    OCR[PDF & OCR: PyPDF2 / unstructured]
    EMB[Sentence Transformers]
    IDX[FAISS Vector Index]
    LLM[Mistral-7B (via LangChain)]
  end

  %% --- Storage ---
  subgraph Storage["Google Cloud Storage (GCS)"]
    GCS[PDFs / Chunk Store]
  end

  %% --- Flows ---
  U --> FE
  FE --> FB
  FE <-->|JWT / Session| FB

  FE -->|Upload PDF / Ask| NGINX --> API
  API -->|Store / Fetch| GCS
  API -->|Extract text| OCR
  API -->|Embed chunks| EMB --> IDX
  API -->|Retrieve top-k| IDX --> API
  API -->|RAG (context + query)| LLM --> API
  API -->|Stream response (SSE / Web)| FE