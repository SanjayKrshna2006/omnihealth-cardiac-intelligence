# OMNIHEALTH — Multimodal AI for Explainable Cardiac Assessment

OMNIHEALTH is a research prototype for explainable, multimodal cardiac assessment that integrates:
- **12-Lead Electrocardiogram (ECG)** signal analysis (NeuroKit2, 1D-CNN / ECG-JEPA).
- **Echocardiogram (Echo)** video analysis (EchoNet-Dynamic, R2Plus1D, Grad-CAM).
- **Multimodal Fusion Agent** (LLM-driven cardiac electrical vs. structural evidence fusion).
- **History Comparison Agent** (Prior records vs. current multimodal state).
- **Final Reasoning Engine** (Safety-first structured clinical assessment).
- **LangGraph Orchestration** (Stateful multi-agent execution with conditional branching).
- **FastAPI Backend & React Frontend** (Real-time pipeline monitoring and explainable reporting).

---

## 🏗️ Architecture

```
omnihealth/
├── backend/
│   ├── agents/          # ECG, Echo, Fusion, History, Final Reasoning
│   ├── graph/           # LangGraph state and workflow definition
│   ├── models/          # ECG and Echo model wrappers
│   ├── explainability/  # Grad-CAM and ECG waveform saliency
│   ├── api/             # FastAPI routers, schemas, and entrypoint
│   ├── db/              # MongoDB connection and repositories
│   └── utils/           # Signal & video processing helpers
├── frontend/            # Vite + React + TypeScript + Tailwind CSS UI
├── notebooks/           # Research experiments & evaluation notebooks
└── docker/              # Multi-container deployment configurations
```

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate   # Windows

# Install requirements
pip install -r backend/requirements.txt

# Run FastAPI server
uvicorn backend.api.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## ⚠️ Disclaimer
*OMNIHEALTH is an AI-assisted research prototype. Not intended for direct clinical diagnosis or medical treatment decisions. Always consult a qualified cardiologist.*
