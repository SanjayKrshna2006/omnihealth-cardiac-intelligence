# OMNIHEALTH — Agentic IDE Implementation Plan
> Multimodal AI for Explainable Cardiac Assessment  
> Optimized for Agentic IDEs (Cursor / Windsurf / Antigravity)

---

## 🗺️ Master Architecture Reference

```
omnihealth/
├── backend/
│   ├── agents/
│   │   ├── ecg_agent.py
│   │   ├── echo_agent.py
│   │   ├── fusion_agent.py
│   │   ├── history_agent.py
│   │   └── final_reasoning_agent.py
│   ├── graph/
│   │   ├── workflow.py          # LangGraph graph definition
│   │   └── state.py             # Shared AgentState schema
│   ├── models/
│   │   ├── ecg_model.py         # ECG-JEPA / PTB-XL wrapper
│   │   └── echo_model.py        # EchoNet-Dynamic wrapper
│   ├── explainability/
│   │   ├── gradcam.py
│   │   └── ecg_explainer.py
│   ├── api/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── routers/
│   │   │   ├── analysis.py
│   │   │   ├── patients.py
│   │   │   └── reports.py
│   │   └── schemas.py           # Pydantic models
│   ├── db/
│   │   ├── mongo.py             # MongoDB Atlas connection
│   │   └── repositories/
│   │       ├── patient_repo.py
│   │       └── report_repo.py
│   ├── utils/
│   │   ├── signal_processing.py # NeuroKit2 preprocessing
│   │   ├── video_processing.py  # OpenCV Echo preprocessing
│   │   └── file_handlers.py
│   ├── config.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── upload/
│   │   │   ├── analysis/
│   │   │   ├── report/
│   │   │   └── shared/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PatientSelect.tsx
│   │   │   ├── Upload.tsx
│   │   │   ├── Analysis.tsx
│   │   │   └── Report.tsx
│   │   ├── api/
│   │   │   └── client.ts        # Axios API client
│   │   ├── store/
│   │   │   └── analysisStore.ts # Zustand/Context state
│   │   └── types/
│   │       └── index.ts
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── notebooks/
│   ├── 01_ecg_model_eval.ipynb
│   ├── 02_echo_model_eval.ipynb
│   ├── 03_fusion_experiments.ipynb
│   └── 04_research_results.ipynb
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
└── .env.example
```

---

## 📋 Phase Overview

| Phase | Name | Duration | Deliverable |
|-------|------|----------|-------------|
| 0 | Environment & Project Scaffold | Day 1 | Repo, env, CI skeleton |
| 1 | Data Layer & Schema Foundation | Day 1–2 | MongoDB, Pydantic schemas, DTOs |
| 2 | ECG Agent | Day 2–4 | Working ECG analysis pipeline |
| 3 | Echo Agent | Day 4–6 | Working Echo analysis pipeline |
| 4 | Multimodal Fusion Layer | Day 6–8 | Fusion logic + evidence comparison |
| 5 | History Agent | Day 8–9 | History comparison pipeline |
| 6 | LangGraph Orchestration | Day 9–11 | Full agent graph + LangSmith traces |
| 7 | Final Reasoning Agent | Day 11–12 | Explainable final assessment |
| 8 | FastAPI Backend + REST Layer | Day 12–14 | Full API with endpoints |
| 9 | React Frontend | Day 14–18 | Complete UI with upload + report view |
| 10 | Explainability Layer | Day 18–19 | Grad-CAM, waveform highlights |
| 11 | Research Experiments | Day 19–21 | Metrics, ablation studies |
| 12 | Docker + Deployment | Day 21–22 | Containerized deployable system |

---

## ⚙️ PHASE 0 — Environment & Project Scaffold

### Goal
Bootstrap the full monorepo so the agentic IDE has a clear, navigable project structure from day one.

### Agentic Prompt to Use
```
Create a monorepo called `omnihealth` with two top-level directories: 
`backend/` (Python/FastAPI) and `frontend/` (React/Vite/TypeScript/Tailwind). 
Initialize a Python virtual environment, install the listed requirements, 
scaffold the folder structure exactly as in the architecture reference, 
create placeholder __init__.py files in every Python package, 
and create a .env.example with all required environment variable keys.
```

### Steps

**0.1 — Repository Initialization**
```bash
git init omnihealth && cd omnihealth
touch .gitignore .env.example README.md
mkdir -p backend/{agents,graph,models,explainability,api/routers,db/repositories,utils,tests}
mkdir -p frontend/src/{components/{upload,analysis,report,shared},pages,api,store,types}
mkdir -p notebooks docker
```

**0.2 — Backend Requirements File**

Create `backend/requirements.txt`:
```
fastapi==0.111.0
uvicorn[standard]==0.30.0
pydantic==2.7.0
pydantic-settings==2.2.1
python-multipart==0.0.9
pymongo==4.7.0
motor==3.4.0
langchain==0.2.0
langgraph==0.1.0
langsmith==0.1.60
langchain-anthropic==0.1.15
torch==2.3.0
torchvision==0.18.0
torchaudio==0.18.0
monai==1.3.0
scikit-learn==1.5.0
numpy==1.26.4
scipy==1.13.0
neurokit2==0.2.9
opencv-python-headless==4.9.0.80
Pillow==10.3.0
grad-cam==1.5.0
shap==0.45.0
wfdb==4.1.2
python-dotenv==1.0.1
httpx==0.27.0
pytest==8.2.0
pytest-asyncio==0.23.6
```

**0.3 — Frontend Scaffold**
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install axios recharts zustand @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
```

**0.4 — Environment Variables**

`.env.example`:
```env
# Anthropic
ANTHROPIC_API_KEY=

# LangSmith
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=omnihealth

# MongoDB
MONGODB_URI=
MONGODB_DB_NAME=omnihealth

# App
SECRET_KEY=
ENVIRONMENT=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=100

# Model paths
ECG_MODEL_PATH=./models/ecg_model.pt
ECHO_MODEL_PATH=./models/echo_model.pt
```

**0.5 — Config Module**

`backend/config.py`:
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    anthropic_api_key: str
    langchain_api_key: str
    langchain_project: str = "omnihealth"
    mongodb_uri: str
    mongodb_db_name: str = "omnihealth"
    ecg_model_path: str = "./models/ecg_model.pt"
    echo_model_path: str = "./models/echo_model.pt"
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 100
    environment: str = "development"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

---

## 🗃️ PHASE 1 — Data Layer & Schema Foundation

### Goal
Define all Pydantic schemas, MongoDB collections, and data transfer objects before any model code. This gives the agentic IDE a clear contract every subsequent phase can reference.

### Agentic Prompt to Use
```
Using Pydantic v2, create all the schemas in `backend/api/schemas.py` 
for the OMNIHEALTH system: PatientSchema, ECGEvidenceSchema, EchoEvidenceSchema, 
FusionResultSchema, HistoryAnalysisSchema, FinalAssessmentSchema, 
and OmniHealthReportSchema. 
Then create MongoDB repository classes using Motor (async PyMongo) 
in `backend/db/repositories/`.
```

### 1.1 — Core Pydantic Schemas

`backend/api/schemas.py`:
```python
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime
from enum import Enum

class FusionStatus(str, Enum):
    AGREEMENT = "agreement"
    COMPLEMENTARY = "complementary"
    CONFLICT = "conflict"
    MISSING_MODALITY = "missing_modality"
    INSUFFICIENT = "insufficient"

class HistoryRelationship(str, Enum):
    SIMILAR = "similar"
    PERSISTENT = "persistent"
    CHANGED = "changed"
    NEW = "new"
    CONFLICTING = "conflicting"
    UNKNOWN = "unknown"

class ECGEvidenceSchema(BaseModel):
    modality: Literal["ECG"] = "ECG"
    finding: str
    confidence: Optional[float] = None  # Only if calibrated
    supporting_evidence: List[str]
    model_name: str
    model_version: str
    limitations: List[str]
    raw_predictions: Optional[dict] = None
    waveform_regions: Optional[List[dict]] = None  # For explainability

class EchoEvidenceSchema(BaseModel):
    modality: Literal["Echocardiogram"] = "Echocardiogram"
    finding: str
    confidence: Optional[float] = None
    evidence: List[str]
    visual_evidence_path: Optional[str] = None  # Grad-CAM output
    model_name: str
    model_version: str
    limitations: List[str]
    raw_predictions: Optional[dict] = None

class FusionResultSchema(BaseModel):
    status: FusionStatus
    ecg_finding: Optional[str]
    echo_finding: Optional[str]
    agreement_summary: str
    conflict_description: Optional[str] = None
    missing_modalities: List[str] = []
    combined_evidence: List[str]
    fusion_confidence: Optional[float] = None

class HistoryAnalysisSchema(BaseModel):
    relationship: HistoryRelationship
    previous_ecg_finding: Optional[str]
    previous_echo_finding: Optional[str]
    current_summary: str
    changes_detected: List[str]
    persistent_findings: List[str]
    new_findings: List[str]
    analysis_notes: str

class FinalAssessmentSchema(BaseModel):
    supported_findings: List[str]
    primary_assessment: str
    ecg_evidence_summary: str
    echo_evidence_summary: str
    historical_evidence_summary: str
    cross_modal_analysis: str
    explanation: str
    limitations: List[str]
    evidence_sufficiency: Literal["sufficient", "partial", "insufficient"]
    requires_clinical_review: bool = True

class OmniHealthReportSchema(BaseModel):
    report_id: str
    patient_id: str
    assessment_date: datetime
    ecg_analysis: Optional[ECGEvidenceSchema]
    echo_analysis: Optional[EchoEvidenceSchema]
    fusion_result: FusionResultSchema
    history_analysis: Optional[HistoryAnalysisSchema]
    final_assessment: FinalAssessmentSchema
    pipeline_version: str = "0.1.0"
    disclaimer: str = (
        "This is an AI-assisted research prototype. "
        "Not for clinical diagnosis. Always consult a qualified physician."
    )
```

### 1.2 — Agent State (LangGraph Shared State)

`backend/graph/state.py`:
```python
from typing import Optional, TypedDict, Annotated
from backend.api.schemas import (
    ECGEvidenceSchema, EchoEvidenceSchema,
    FusionResultSchema, HistoryAnalysisSchema, FinalAssessmentSchema
)
import operator

class OmniHealthState(TypedDict):
    # Inputs
    patient_id: str
    ecg_file_path: Optional[str]
    echo_file_path: Optional[str]
    previous_ecg_path: Optional[str]
    previous_echo_path: Optional[str]
    previous_reports: Optional[list[str]]

    # Agent outputs (accumulated, not overwritten)
    ecg_evidence: Optional[ECGEvidenceSchema]
    echo_evidence: Optional[EchoEvidenceSchema]
    fusion_result: Optional[FusionResultSchema]
    history_analysis: Optional[HistoryAnalysisSchema]
    final_assessment: Optional[FinalAssessmentSchema]

    # Pipeline control
    errors: Annotated[list[str], operator.add]
    pipeline_stage: str
    missing_modalities: list[str]
```

### 1.3 — MongoDB Repositories

`backend/db/mongo.py`:
```python
from motor.motor_asyncio import AsyncIOMotorClient
from backend.config import get_settings

_client: AsyncIOMotorClient | None = None

async def get_db():
    global _client
    settings = get_settings()
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client[settings.mongodb_db_name]

async def close_db():
    global _client
    if _client:
        _client.close()
        _client = None
```

`backend/db/repositories/report_repo.py`:
```python
from datetime import datetime
from bson import ObjectId
from backend.db.mongo import get_db
from backend.api.schemas import OmniHealthReportSchema

class ReportRepository:
    COLLECTION = "reports"

    async def save_report(self, report: OmniHealthReportSchema) -> str:
        db = await get_db()
        doc = report.model_dump()
        doc["created_at"] = datetime.utcnow()
        result = await db[self.COLLECTION].insert_one(doc)
        return str(result.inserted_id)

    async def get_report(self, report_id: str) -> dict | None:
        db = await get_db()
        return await db[self.COLLECTION].find_one({"_id": ObjectId(report_id)})

    async def get_patient_reports(self, patient_id: str) -> list[dict]:
        db = await get_db()
        cursor = db[self.COLLECTION].find(
            {"patient_id": patient_id}
        ).sort("assessment_date", -1)
        return await cursor.to_list(length=50)
```

---

## ❤️ PHASE 2 — ECG Agent

### Goal
Build a self-contained ECG analysis pipeline: signal loading → preprocessing → model inference → structured evidence output.

### Agentic Prompt to Use
```
Build the ECG Agent in `backend/agents/ecg_agent.py`. 
It should: load a .hea/.dat WFDB file or .csv ECG signal, 
preprocess with NeuroKit2 (clean, R-peak detection, HRV features), 
run inference through a pretrained 12-lead ECG classifier compatible 
with PTB-XL, and return a structured ECGEvidenceSchema object. 
Add a stub/mock mode if the model weights aren't loaded, 
so the pipeline can still be tested end-to-end.
```

### 2.1 — Signal Preprocessing

`backend/utils/signal_processing.py`:
```python
import numpy as np
import neurokit2 as nk
import wfdb
from pathlib import Path
from typing import Union

def load_ecg_signal(file_path: str, sampling_rate: int = 500) -> tuple[np.ndarray, int]:
    """Load ECG from WFDB (.hea/.dat) or CSV format."""
    path = Path(file_path)
    if path.suffix in [".hea", ".dat", ""]:
        record = wfdb.rdrecord(str(path.with_suffix("")))
        return record.p_signal, record.fs
    elif path.suffix == ".csv":
        data = np.loadtxt(file_path, delimiter=",", skiprows=1)
        return data, sampling_rate
    raise ValueError(f"Unsupported ECG format: {path.suffix}")

def preprocess_ecg(signal: np.ndarray, fs: int) -> dict:
    """
    Preprocess ECG signal using NeuroKit2.
    Returns cleaned signals, R-peaks, and HRV features per lead.
    """
    results = {}
    n_leads = signal.shape[1] if signal.ndim > 1 else 1
    signals_matrix = signal if signal.ndim > 1 else signal.reshape(-1, 1)

    for lead_idx in range(n_leads):
        lead_signal = signals_matrix[:, lead_idx]
        try:
            cleaned = nk.ecg_clean(lead_signal, sampling_rate=fs)
            _, rpeaks = nk.ecg_peaks(cleaned, sampling_rate=fs)
            hrv_time = nk.hrv_time(rpeaks, sampling_rate=fs, show=False)
            results[f"lead_{lead_idx}"] = {
                "cleaned_signal": cleaned,
                "rpeaks": rpeaks["ECG_R_Peaks"],
                "hrv": hrv_time.to_dict("records")[0] if not hrv_time.empty else {},
            }
        except Exception as e:
            results[f"lead_{lead_idx}"] = {"error": str(e)}

    return results

def extract_ecg_features(preprocessed: dict) -> np.ndarray:
    """Extract a feature vector from preprocessed ECG for model input."""
    features = []
    for lead_data in preprocessed.values():
        if "error" not in lead_data and "hrv" in lead_data:
            hrv = lead_data["hrv"]
            features.extend([
                hrv.get("HRV_MeanNN", 0),
                hrv.get("HRV_SDNN", 0),
                hrv.get("HRV_RMSSD", 0),
                hrv.get("HRV_pNN50", 0),
            ])
    return np.array(features, dtype=np.float32)
```

### 2.2 — ECG Model Wrapper

`backend/models/ecg_model.py`:
```python
import torch
import torch.nn as nn
import numpy as np
from pathlib import Path
from backend.config import get_settings

# PTB-XL has 71 superclass + subclass labels; use 5 superclasses for prototype
ECG_LABELS = ["NORM", "MI", "STTC", "CD", "HYP"]

class ECGClassifier(nn.Module):
    """
    Lightweight 1D-CNN classifier for 12-lead ECG.
    Replace with ECG-JEPA backbone when weights are available.
    """
    def __init__(self, n_leads: int = 12, n_classes: int = 5, seq_len: int = 5000):
        super().__init__()
        self.conv_block = nn.Sequential(
            nn.Conv1d(n_leads, 32, kernel_size=15, padding=7),
            nn.BatchNorm1d(32), nn.ReLU(),
            nn.MaxPool1d(4),
            nn.Conv1d(32, 64, kernel_size=11, padding=5),
            nn.BatchNorm1d(64), nn.ReLU(),
            nn.MaxPool1d(4),
            nn.Conv1d(64, 128, kernel_size=7, padding=3),
            nn.BatchNorm1d(128), nn.ReLU(),
            nn.AdaptiveAvgPool1d(32),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 32, 256),
            nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, n_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.conv_block(x))

class ECGModelWrapper:
    def __init__(self, mock_mode: bool = False):
        self.mock_mode = mock_mode
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: ECGClassifier | None = None
        self.labels = ECG_LABELS
        if not mock_mode:
            self._load_model()

    def _load_model(self):
        settings = get_settings()
        model_path = Path(settings.ecg_model_path)
        self.model = ECGClassifier()
        if model_path.exists():
            state = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state)
        self.model.eval().to(self.device)

    def predict(self, signal: np.ndarray) -> dict:
        if self.mock_mode:
            return self._mock_prediction()
        # Prepare input: (batch=1, leads=12, seq_len)
        tensor = torch.tensor(signal.T, dtype=torch.float32).unsqueeze(0).to(self.device)
        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.sigmoid(logits).cpu().numpy()[0]
        return {label: float(prob) for label, prob in zip(self.labels, probs)}

    def _mock_prediction(self) -> dict:
        """Returns deterministic stub for testing."""
        return {"NORM": 0.72, "MI": 0.08, "STTC": 0.12, "CD": 0.05, "HYP": 0.03}
```

### 2.3 — ECG Agent

`backend/agents/ecg_agent.py`:
```python
from backend.graph.state import OmniHealthState
from backend.api.schemas import ECGEvidenceSchema
from backend.utils.signal_processing import load_ecg_signal, preprocess_ecg
from backend.models.ecg_model import ECGModelWrapper
from backend.config import get_settings
import logging

logger = logging.getLogger(__name__)

_ecg_model: ECGModelWrapper | None = None

def get_ecg_model() -> ECGModelWrapper:
    global _ecg_model
    if _ecg_model is None:
        settings = get_settings()
        mock = settings.environment == "development"
        _ecg_model = ECGModelWrapper(mock_mode=mock)
    return _ecg_model

def ecg_agent_node(state: OmniHealthState) -> OmniHealthState:
    """
    LangGraph node: ECG Agent.
    Loads, preprocesses, and classifies the ECG signal.
    """
    logger.info(f"ECG Agent starting for patient {state['patient_id']}")
    state["pipeline_stage"] = "ecg_analysis"

    if not state.get("ecg_file_path"):
        logger.warning("No ECG file provided.")
        state["missing_modalities"].append("ECG")
        return state

    try:
        signal, fs = load_ecg_signal(state["ecg_file_path"])
        preprocessed = preprocess_ecg(signal, fs)
        model = get_ecg_model()
        predictions = model.predict(signal)

        # Determine primary finding
        top_label = max(predictions, key=predictions.get)
        top_conf = predictions[top_label]

        evidence = ECGEvidenceSchema(
            finding=_map_label_to_finding(top_label),
            confidence=round(top_conf, 3) if model.mock_mode is False else None,
            supporting_evidence=_generate_supporting_evidence(predictions, preprocessed),
            model_name="ECG-CNN-PTB-XL",
            model_version="0.1.0",
            limitations=[
                "Model trained on PTB-XL — performance may vary on other populations.",
                "Confidence scores not clinically validated.",
                "Does not replace professional ECG interpretation.",
            ],
            raw_predictions=predictions,
        )

        state["ecg_evidence"] = evidence
        logger.info(f"ECG Agent complete. Finding: {evidence.finding}")

    except Exception as e:
        logger.error(f"ECG Agent error: {e}")
        state["errors"].append(f"ECG Agent failed: {str(e)}")

    return state

def _map_label_to_finding(label: str) -> str:
    mapping = {
        "NORM": "Normal sinus rhythm — no significant electrical abnormalities detected.",
        "MI": "ECG pattern consistent with myocardial infarction changes.",
        "STTC": "ST/T-wave changes detected — possible ischemia or repolarization abnormality.",
        "CD": "Conduction disturbance detected — possible bundle branch block or AV block.",
        "HYP": "Voltage criteria suggestive of hypertrophy.",
    }
    return mapping.get(label, f"ECG pattern classified as: {label}")

def _generate_supporting_evidence(predictions: dict, preprocessed: dict) -> list[str]:
    evidence = []
    for label, conf in sorted(predictions.items(), key=lambda x: -x[1])[:3]:
        evidence.append(f"{label}: model probability {conf:.2%}")
    return evidence
```

---

## 🫀 PHASE 3 — Echo Agent

### Goal
Build the echocardiogram video analysis pipeline using EchoNet-Dynamic for LVEF estimation and a classification head.

### Agentic Prompt to Use
```
Build the Echo Agent in `backend/agents/echo_agent.py`. 
It should: accept an .avi or .mp4 echocardiogram video, 
preprocess frames with OpenCV (resize to 112x112, normalize), 
run inference through an EchoNet-Dynamic-compatible PyTorch model 
(R2Plus1D backbone), and return a structured EchoEvidenceSchema. 
Include a mock mode. Also build the Grad-CAM explainability wrapper 
in `backend/explainability/gradcam.py` for the echo model.
```

### 3.1 — Video Preprocessing

`backend/utils/video_processing.py`:
```python
import cv2
import numpy as np
from pathlib import Path
import torch

ECHO_FRAME_SIZE = (112, 112)
ECHO_FRAME_COUNT = 32  # Standard clip length for EchoNet-Dynamic

def load_echo_video(file_path: str) -> np.ndarray:
    """
    Load echo video and return as (T, H, W, C) numpy array.
    Samples ECHO_FRAME_COUNT evenly-spaced frames.
    """
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {file_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    indices = np.linspace(0, total_frames - 1, ECHO_FRAME_COUNT, dtype=int)
    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            frame = cv2.resize(frame, ECHO_FRAME_SIZE)
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            frames.append(frame)
    cap.release()

    if len(frames) < ECHO_FRAME_COUNT:
        raise ValueError(f"Insufficient frames in video: {len(frames)}")

    return np.stack(frames)  # (T, H, W)

def preprocess_echo_for_model(frames: np.ndarray) -> torch.Tensor:
    """
    Normalize and reshape echo frames for model input.
    Output: (1, 1, T, H, W) — batch, channel, time, height, width
    """
    normalized = frames.astype(np.float32) / 255.0
    mean, std = 0.1307, 0.3081  # EchoNet-Dynamic normalization
    normalized = (normalized - mean) / std
    tensor = torch.tensor(normalized).unsqueeze(0).unsqueeze(0)  # (1,1,T,H,W)
    return tensor
```

### 3.2 — Echo Model Wrapper

`backend/models/echo_model.py`:
```python
import torch
import torch.nn as nn
import numpy as np
from backend.config import get_settings
from pathlib import Path

class EchoNetLite(nn.Module):
    """
    Lightweight R2Plus1D-style video classifier for echo.
    Replace with full EchoNet-Dynamic weights when available.
    Output: LVEF estimate + categorical classification.
    """
    def __init__(self):
        super().__init__()
        self.backbone = nn.Sequential(
            nn.Conv3d(1, 16, kernel_size=(3, 7, 7), padding=(1, 3, 3)),
            nn.BatchNorm3d(16), nn.ReLU(),
            nn.MaxPool3d((1, 2, 2)),
            nn.Conv3d(16, 32, kernel_size=(3, 5, 5), padding=(1, 2, 2)),
            nn.BatchNorm3d(32), nn.ReLU(),
            nn.AdaptiveAvgPool3d((4, 7, 7)),
        )
        self.lvef_head = nn.Sequential(
            nn.Flatten(), nn.Linear(32 * 4 * 7 * 7, 256),
            nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, 1),  # LVEF regression
        )
        self.class_head = nn.Sequential(
            nn.Flatten(), nn.Linear(32 * 4 * 7 * 7, 256),
            nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, 3),  # Normal / Mildly reduced / Severely reduced
        )

    def forward(self, x):
        feat = self.backbone(x)
        return self.lvef_head(feat), self.class_head(feat)

LVEF_CLASSES = ["Normal EF (≥55%)", "Mildly Reduced EF (41-54%)", "Reduced EF (≤40%)"]

class EchoModelWrapper:
    def __init__(self, mock_mode: bool = False):
        self.mock_mode = mock_mode
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: EchoNetLite | None = None
        if not mock_mode:
            self._load_model()

    def _load_model(self):
        settings = get_settings()
        self.model = EchoNetLite()
        model_path = Path(settings.echo_model_path)
        if model_path.exists():
            state = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state)
        self.model.eval().to(self.device)

    def predict(self, tensor: "torch.Tensor") -> dict:
        if self.mock_mode:
            return self._mock_prediction()
        tensor = tensor.to(self.device)
        with torch.no_grad():
            lvef_out, class_out = self.model(tensor)
            lvef = float(lvef_out.squeeze())
            class_probs = torch.softmax(class_out, dim=1).cpu().numpy()[0]
        return {
            "lvef_estimate": round(lvef, 1),
            "class_probabilities": {
                label: float(prob)
                for label, prob in zip(LVEF_CLASSES, class_probs)
            },
            "predicted_class": LVEF_CLASSES[int(np.argmax(class_probs))],
        }

    def _mock_prediction(self) -> dict:
        return {
            "lvef_estimate": 58.2,
            "class_probabilities": {
                "Normal EF (≥55%)": 0.78,
                "Mildly Reduced EF (41-54%)": 0.15,
                "Reduced EF (≤40%)": 0.07,
            },
            "predicted_class": "Normal EF (≥55%)",
        }
```

### 3.3 — Echo Agent

`backend/agents/echo_agent.py`:
```python
from backend.graph.state import OmniHealthState
from backend.api.schemas import EchoEvidenceSchema
from backend.utils.video_processing import load_echo_video, preprocess_echo_for_model
from backend.models.echo_model import EchoModelWrapper
from backend.config import get_settings
import logging

logger = logging.getLogger(__name__)
_echo_model: EchoModelWrapper | None = None

def get_echo_model() -> EchoModelWrapper:
    global _echo_model
    if _echo_model is None:
        settings = get_settings()
        _echo_model = EchoModelWrapper(mock_mode=(settings.environment == "development"))
    return _echo_model

def echo_agent_node(state: OmniHealthState) -> OmniHealthState:
    state["pipeline_stage"] = "echo_analysis"
    logger.info(f"Echo Agent starting for patient {state['patient_id']}")

    if not state.get("echo_file_path"):
        logger.warning("No Echo file provided.")
        state["missing_modalities"].append("Echo")
        return state

    try:
        frames = load_echo_video(state["echo_file_path"])
        tensor = preprocess_echo_for_model(frames)
        model = get_echo_model()
        predictions = model.predict(tensor)

        evidence = EchoEvidenceSchema(
            finding=predictions["predicted_class"],
            confidence=round(max(predictions["class_probabilities"].values()), 3)
                       if not model.mock_mode else None,
            evidence=[
                f"Estimated LVEF: {predictions['lvef_estimate']}%",
                f"Classification: {predictions['predicted_class']}",
            ] + [
                f"{cls}: {prob:.1%}"
                for cls, prob in predictions["class_probabilities"].items()
            ],
            model_name="EchoNet-Dynamic (Lite)",
            model_version="0.1.0",
            limitations=[
                "LVEF estimation accuracy depends on video quality.",
                "Model trained on EchoNet-Dynamic dataset (apical 4-chamber view).",
                "Requires full cardiac cycles for accurate estimation.",
                "Not validated for clinical use.",
            ],
            raw_predictions=predictions,
        )

        state["echo_evidence"] = evidence
        logger.info(f"Echo Agent complete. Finding: {evidence.finding}")

    except Exception as e:
        logger.error(f"Echo Agent error: {e}")
        state["errors"].append(f"Echo Agent failed: {str(e)}")

    return state
```

### 3.4 — Grad-CAM for Echo

`backend/explainability/gradcam.py`:
```python
import torch
import numpy as np
import cv2
from PIL import Image

class EchoGradCAM:
    """Grad-CAM for 3D echo model — extracts saliency from final conv layer."""

    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0].detach()

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate(self, input_tensor: torch.Tensor, class_idx: int = 0) -> np.ndarray:
        self.model.zero_grad()
        _, class_out = self.model(input_tensor)
        score = class_out[0, class_idx]
        score.backward()

        # Pool gradients across spatial dims — keep temporal
        weights = self.gradients.mean(dim=[3, 4], keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = torch.relu(cam).squeeze().cpu().numpy()

        # Normalize to [0, 1]
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam  # Shape: (T, H, W)

    def overlay_on_frame(self, frame: np.ndarray, cam_slice: np.ndarray) -> np.ndarray:
        heatmap = cv2.resize(cam_slice, (frame.shape[1], frame.shape[0]))
        heatmap = np.uint8(255 * heatmap)
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(frame, 0.6, heatmap, 0.4, 0)
        return overlay
```

---

## 🔀 PHASE 4 — Multimodal Fusion Layer

### Goal
Build the fusion layer that compares ECG and Echo evidence and classifies their relationship.

### Agentic Prompt to Use
```
Build the multimodal fusion agent in `backend/agents/fusion_agent.py`. 
It receives ECGEvidenceSchema and EchoEvidenceSchema from state, 
uses an LLM (Claude via langchain-anthropic) to reason about their 
relationship, and returns a FusionResultSchema with status: 
agreement/complementary/conflict/missing_modality/insufficient.
The LLM prompt must instruct the model to reason about 
cardiac physiology — electrical vs structural/functional evidence.
```

`backend/agents/fusion_agent.py`:
```python
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import OmniHealthState
from backend.api.schemas import FusionResultSchema, FusionStatus
import json, logging

logger = logging.getLogger(__name__)

FUSION_SYSTEM_PROMPT = """You are a specialized cardiac evidence fusion system.
You receive structured findings from two cardiac investigations:
1. ECG (electrocardiogram) — electrical activity of the heart
2. Echocardiogram — structural and functional cardiac parameters

Your job is to analyze whether these two investigations provide:
- AGREEMENT: Both support the same clinical finding
- COMPLEMENTARY: Each provides different evidence about the same clinical question (expected, since ECG=electrical, Echo=structural)
- CONFLICT: Findings appear clinically inconsistent with each other
- MISSING_MODALITY: One modality is absent
- INSUFFICIENT: Evidence is too weak to determine a relationship

Respond ONLY with a JSON object:
{
  "status": "<one of the above>",
  "agreement_summary": "<summary of how the findings relate>",
  "conflict_description": "<only if status is CONFLICT>",
  "combined_evidence": ["<evidence point 1>", "<evidence point 2>"],
  "reasoning": "<clinical reasoning for this classification>"
}"""

def fusion_agent_node(state: OmniHealthState) -> OmniHealthState:
    state["pipeline_stage"] = "multimodal_fusion"
    logger.info("Multimodal Fusion Agent starting.")

    ecg = state.get("ecg_evidence")
    echo = state.get("echo_evidence")

    # Handle missing modalities
    missing = []
    if not ecg:
        missing.append("ECG")
    if not echo:
        missing.append("Echo")

    if len(missing) == 2:
        state["fusion_result"] = FusionResultSchema(
            status=FusionStatus.MISSING_MODALITY,
            ecg_finding=None, echo_finding=None,
            agreement_summary="No modality data available for fusion.",
            missing_modalities=missing,
            combined_evidence=[],
        )
        return state

    if len(missing) == 1:
        available_finding = (ecg.finding if ecg else echo.finding)
        state["fusion_result"] = FusionResultSchema(
            status=FusionStatus.MISSING_MODALITY,
            ecg_finding=ecg.finding if ecg else None,
            echo_finding=echo.finding if echo else None,
            agreement_summary=f"Only {missing[0]!r} modality available. Fusion limited.",
            missing_modalities=missing,
            combined_evidence=[f"Available finding: {available_finding}"],
        )
        return state

    try:
        llm = ChatAnthropic(model="claude-sonnet-4-6", max_tokens=1000)
        user_msg = f"""
ECG Finding: {ecg.finding}
ECG Supporting Evidence: {json.dumps(ecg.supporting_evidence)}

Echo Finding: {echo.finding}
Echo Evidence: {json.dumps(echo.evidence)}

Analyze the relationship between these two cardiac investigation findings.
"""
        response = llm.invoke([
            SystemMessage(content=FUSION_SYSTEM_PROMPT),
            HumanMessage(content=user_msg),
        ])

        result = json.loads(response.content)
        state["fusion_result"] = FusionResultSchema(
            status=FusionStatus(result["status"].lower()),
            ecg_finding=ecg.finding,
            echo_finding=echo.finding,
            agreement_summary=result["agreement_summary"],
            conflict_description=result.get("conflict_description"),
            missing_modalities=[],
            combined_evidence=result.get("combined_evidence", []),
        )

    except Exception as e:
        logger.error(f"Fusion Agent error: {e}")
        state["errors"].append(f"Fusion Agent failed: {str(e)}")
        # Fallback: rule-based fusion
        state["fusion_result"] = FusionResultSchema(
            status=FusionStatus.COMPLEMENTARY,
            ecg_finding=ecg.finding,
            echo_finding=echo.finding,
            agreement_summary="Fusion via rule-based fallback (LLM unavailable).",
            combined_evidence=[ecg.finding, echo.finding],
            missing_modalities=[],
        )

    return state
```

---

## 🔄 PHASE 5 — History Agent

### Goal
Compare previous cardiac records against the current fused analysis to detect persistence, changes, or new findings.

### Agentic Prompt to Use
```
Build the History Agent in `backend/agents/history_agent.py`. 
It accepts previous ECG and Echo report text (extracted from PDFs or 
plain text) plus the current FusionResultSchema, and uses Claude to 
compare them, returning a HistoryAnalysisSchema with the detected 
relationship type: similar/persistent/changed/new/conflicting/unknown.
```

`backend/agents/history_agent.py`:
```python
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import OmniHealthState
from backend.api.schemas import HistoryAnalysisSchema, HistoryRelationship
import json, logging

logger = logging.getLogger(__name__)

HISTORY_SYSTEM_PROMPT = """You are a cardiac history comparison specialist.
You receive:
1. Previous cardiac investigation findings (ECG/Echo reports)
2. Current multimodal cardiac analysis

Your task: compare previous and current findings and determine:
- SIMILAR: Previous and current findings are essentially the same
- PERSISTENT: A specific finding from before continues to appear
- CHANGED: Current findings differ from previous (could be improvement or worsening)
- NEW: Current finding was not present in previous records
- CONFLICTING: Previous and current evidence appear clinically inconsistent
- UNKNOWN: Insufficient information to determine the relationship

Return ONLY a JSON object:
{
  "relationship": "<one of the above>",
  "previous_summary": "<brief summary of previous findings>",
  "current_summary": "<brief summary of current findings>",
  "changes_detected": ["<specific change 1>"],
  "persistent_findings": ["<persistent finding 1>"],
  "new_findings": ["<new finding 1>"],
  "analysis_notes": "<clinical reasoning for the relationship classification>"
}"""

def history_agent_node(state: OmniHealthState) -> OmniHealthState:
    state["pipeline_stage"] = "history_analysis"
    logger.info("History Agent starting.")

    previous_ecg = state.get("previous_ecg_path")
    previous_echo = state.get("previous_echo_path")
    previous_reports = state.get("previous_reports", [])
    fusion = state.get("fusion_result")

    if not any([previous_ecg, previous_echo, previous_reports]):
        logger.info("No previous history available.")
        state["history_analysis"] = HistoryAnalysisSchema(
            relationship=HistoryRelationship.UNKNOWN,
            current_summary=fusion.agreement_summary if fusion else "No current analysis.",
            changes_detected=[],
            persistent_findings=[],
            new_findings=[],
            analysis_notes="No previous cardiac records provided for comparison.",
        )
        return state

    try:
        # Combine previous record text
        history_text = "\n".join(filter(None, [
            f"Previous ECG path: {previous_ecg}" if previous_ecg else None,
            f"Previous Echo path: {previous_echo}" if previous_echo else None,
            *([r for r in previous_reports] if previous_reports else []),
        ]))

        current_analysis = (
            f"ECG finding: {fusion.ecg_finding}\n"
            f"Echo finding: {fusion.echo_finding}\n"
            f"Fusion status: {fusion.status}\n"
            f"Summary: {fusion.agreement_summary}"
        ) if fusion else "No current analysis available."

        llm = ChatAnthropic(model="claude-sonnet-4-6", max_tokens=1000)
        response = llm.invoke([
            SystemMessage(content=HISTORY_SYSTEM_PROMPT),
            HumanMessage(content=(
                f"PREVIOUS RECORDS:\n{history_text}\n\n"
                f"CURRENT ANALYSIS:\n{current_analysis}"
            )),
        ])

        result = json.loads(response.content)
        state["history_analysis"] = HistoryAnalysisSchema(
            relationship=HistoryRelationship(result["relationship"].lower()),
            previous_ecg_finding=result.get("previous_summary"),
            previous_echo_finding=None,
            current_summary=result.get("current_summary", ""),
            changes_detected=result.get("changes_detected", []),
            persistent_findings=result.get("persistent_findings", []),
            new_findings=result.get("new_findings", []),
            analysis_notes=result.get("analysis_notes", ""),
        )

    except Exception as e:
        logger.error(f"History Agent error: {e}")
        state["errors"].append(f"History Agent failed: {str(e)}")

    return state
```

---

## 🧠 PHASE 6 — LangGraph Orchestration

### Goal
Wire all agents into a LangGraph StateGraph with conditional edges for missing modalities, error handling, and proper execution order.

### Agentic Prompt to Use
```
Build the LangGraph workflow in `backend/graph/workflow.py`. 
Define a StateGraph using OmniHealthState. Add nodes for: 
ecg_agent, echo_agent, multimodal_fusion, history_agent, final_reasoning. 
ECG and Echo agents should run in parallel (as a fan-out then fan-in), 
then fusion, then history, then final. Add conditional edges: 
skip echo_agent if no echo_file_path, skip history_agent if no 
previous records. Compile the graph with LangSmith tracing enabled.
```

`backend/graph/workflow.py`:
```python
from langgraph.graph import StateGraph, END, START
from backend.graph.state import OmniHealthState
from backend.agents.ecg_agent import ecg_agent_node
from backend.agents.echo_agent import echo_agent_node
from backend.agents.fusion_agent import fusion_agent_node
from backend.agents.history_agent import history_agent_node
from backend.agents.final_reasoning_agent import final_reasoning_node
from langsmith import traceable

def has_echo(state: OmniHealthState) -> str:
    return "run_echo" if state.get("echo_file_path") else "skip_echo"

def has_history(state: OmniHealthState) -> str:
    has_prev = any([
        state.get("previous_ecg_path"),
        state.get("previous_echo_path"),
        state.get("previous_reports"),
    ])
    return "run_history" if has_prev else "skip_history"

def build_omnihealth_graph() -> StateGraph:
    graph = StateGraph(OmniHealthState)

    # Register all agent nodes
    graph.add_node("ecg_agent", ecg_agent_node)
    graph.add_node("echo_agent", echo_agent_node)
    graph.add_node("fusion", fusion_agent_node)
    graph.add_node("history_agent", history_agent_node)
    graph.add_node("final_reasoning", final_reasoning_node)

    # Entry → ECG Agent always runs
    graph.add_edge(START, "ecg_agent")

    # After ECG, conditionally run Echo
    graph.add_conditional_edges(
        "ecg_agent",
        has_echo,
        {"run_echo": "echo_agent", "skip_echo": "fusion"},
    )

    # Echo → Fusion
    graph.add_edge("echo_agent", "fusion")

    # Fusion → conditionally run History
    graph.add_conditional_edges(
        "fusion",
        has_history,
        {"run_history": "history_agent", "skip_history": "final_reasoning"},
    )

    # History → Final
    graph.add_edge("history_agent", "final_reasoning")
    graph.add_edge("final_reasoning", END)

    return graph.compile()

# Singleton compiled graph
_graph = None

def get_graph():
    global _graph
    if _graph is None:
        _graph = build_omnihealth_graph()
    return _graph
```

---

## 🎯 PHASE 7 — Final Reasoning Agent

`backend/agents/final_reasoning_agent.py`:
```python
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import OmniHealthState
from backend.api.schemas import FinalAssessmentSchema
import json, logging

logger = logging.getLogger(__name__)

FINAL_REASONING_PROMPT = """You are the final reasoning engine of OMNIHEALTH, 
a research-grade multimodal cardiac assessment prototype.

You receive structured outputs from specialized cardiac AI agents:
- ECG Agent: electrical cardiac evidence
- Echo Agent: structural/functional cardiac evidence  
- Multimodal Fusion: cross-modal evidence relationship
- History Agent: comparison with previous records

Your task: generate a unified, explainable final assessment.

CRITICAL RULES:
1. Only state what the evidence actually supports — never speculate beyond it.
2. Explicitly state where evidence is missing, conflicting, or insufficient.
3. Always include limitations.
4. Never make definitive diagnostic claims. Use "consistent with", "suggestive of", "evidence supports".
5. Always note: AI-assisted prototype, not for clinical diagnosis.

Return ONLY a JSON object:
{
  "supported_findings": ["<finding 1>", "<finding 2>"],
  "primary_assessment": "<main summary>",
  "ecg_evidence_summary": "<ECG contribution>",
  "echo_evidence_summary": "<Echo contribution>",
  "historical_evidence_summary": "<History contribution>",
  "cross_modal_analysis": "<How ECG and Echo relate>",
  "explanation": "<Step-by-step reasoning>",
  "limitations": ["<limitation 1>"],
  "evidence_sufficiency": "sufficient | partial | insufficient",
  "requires_clinical_review": true
}"""

def final_reasoning_node(state: OmniHealthState) -> OmniHealthState:
    state["pipeline_stage"] = "final_reasoning"
    logger.info("Final Reasoning Agent starting.")

    ecg = state.get("ecg_evidence")
    echo = state.get("echo_evidence")
    fusion = state.get("fusion_result")
    history = state.get("history_analysis")

    context = f"""
ECG AGENT OUTPUT:
{ecg.model_dump_json(indent=2) if ecg else "Not available"}

ECHO AGENT OUTPUT:
{echo.model_dump_json(indent=2) if echo else "Not available"}

MULTIMODAL FUSION RESULT:
{fusion.model_dump_json(indent=2) if fusion else "Not available"}

HISTORY ANALYSIS:
{history.model_dump_json(indent=2) if history else "Not available"}

ERRORS DURING PIPELINE:
{state.get('errors', [])}
"""

    try:
        llm = ChatAnthropic(model="claude-sonnet-4-6", max_tokens=2000)
        response = llm.invoke([
            SystemMessage(content=FINAL_REASONING_PROMPT),
            HumanMessage(content=context),
        ])

        result = json.loads(response.content)
        state["final_assessment"] = FinalAssessmentSchema(
            supported_findings=result["supported_findings"],
            primary_assessment=result["primary_assessment"],
            ecg_evidence_summary=result["ecg_evidence_summary"],
            echo_evidence_summary=result["echo_evidence_summary"],
            historical_evidence_summary=result["historical_evidence_summary"],
            cross_modal_analysis=result["cross_modal_analysis"],
            explanation=result["explanation"],
            limitations=result["limitations"],
            evidence_sufficiency=result["evidence_sufficiency"],
            requires_clinical_review=True,
        )

    except Exception as e:
        logger.error(f"Final Reasoning Agent error: {e}")
        state["errors"].append(f"Final Reasoning failed: {str(e)}")

    return state
```

---

## 🌐 PHASE 8 — FastAPI Backend

### Goal
Expose the LangGraph pipeline through REST endpoints. Handle file uploads, async analysis execution, and report retrieval.

### Agentic Prompt to Use
```
Build the FastAPI application in `backend/api/main.py` and routers in 
`backend/api/routers/`. Create: POST /api/analysis/run (accepts 
multipart files for ECG, Echo, previous records; triggers the LangGraph 
pipeline asynchronously; returns analysis_id), 
GET /api/analysis/{analysis_id}/status, 
GET /api/reports/{report_id}, 
GET /api/patients/{patient_id}/reports. 
Use BackgroundTasks for async pipeline execution.
```

### 8.1 — Main FastAPI App

`backend/api/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.db.mongo import get_db, close_db
from backend.api.routers import analysis, patients, reports
import logging

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_db()  # Initialize DB connection
    yield
    await close_db()

app = FastAPI(
    title="OMNIHEALTH API",
    description="Multimodal AI for Explainable Cardiac Assessment",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "OMNIHEALTH API"}
```

### 8.2 — Analysis Router

`backend/api/routers/analysis.py`:
```python
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import uuid, shutil, asyncio
from backend.graph.workflow import get_graph
from backend.graph.state import OmniHealthState
from backend.db.repositories.report_repo import ReportRepository
from backend.api.schemas import OmniHealthReportSchema
from datetime import datetime
from backend.config import get_settings

router = APIRouter()
_jobs: dict[str, dict] = {}  # In-memory job store; replace with Redis in prod

async def save_upload(file: UploadFile, dest: Path) -> str:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return str(dest)

async def run_pipeline(job_id: str, state: OmniHealthState):
    _jobs[job_id] = {"status": "running", "stage": "starting"}
    try:
        graph = get_graph()
        result_state = await asyncio.to_thread(graph.invoke, state)
        _jobs[job_id]["status"] = "complete"
        _jobs[job_id]["result"] = result_state
    except Exception as e:
        _jobs[job_id] = {"status": "failed", "error": str(e)}

@router.post("/run")
async def run_analysis(
    background_tasks: BackgroundTasks,
    patient_id: str,
    ecg_file: UploadFile | None = File(None),
    echo_file: UploadFile | None = File(None),
    previous_ecg: UploadFile | None = File(None),
    previous_echo: UploadFile | None = File(None),
):
    job_id = str(uuid.uuid4())
    settings = get_settings()
    upload_dir = Path(settings.upload_dir) / job_id

    # Save uploaded files
    ecg_path = await save_upload(ecg_file, upload_dir / "ecg" / ecg_file.filename) if ecg_file else None
    echo_path = await save_upload(echo_file, upload_dir / "echo" / echo_file.filename) if echo_file else None
    prev_ecg_path = await save_upload(previous_ecg, upload_dir / "prev_ecg" / previous_ecg.filename) if previous_ecg else None
    prev_echo_path = await save_upload(previous_echo, upload_dir / "prev_echo" / previous_echo.filename) if previous_echo else None

    initial_state = OmniHealthState(
        patient_id=patient_id,
        ecg_file_path=ecg_path,
        echo_file_path=echo_path,
        previous_ecg_path=prev_ecg_path,
        previous_echo_path=prev_echo_path,
        previous_reports=[],
        ecg_evidence=None,
        echo_evidence=None,
        fusion_result=None,
        history_analysis=None,
        final_assessment=None,
        errors=[],
        pipeline_stage="initialized",
        missing_modalities=[],
    )

    _jobs[job_id] = {"status": "queued"}
    background_tasks.add_task(run_pipeline, job_id, initial_state)
    return {"job_id": job_id, "status": "queued"}

@router.get("/{job_id}/status")
async def get_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
```

---

## 💻 PHASE 9 — React Frontend

### Goal
Build a clean, medical-grade UI with file upload, real-time analysis status polling, and the final explainable report view.

### Agentic Prompt to Use
```
Build the React frontend using Vite + TypeScript + Tailwind CSS. 
Create: an Upload page (drag-and-drop for ECG, Echo, Previous files 
with clear labeling), an Analysis page (shows pipeline stages with 
live status polling every 2 seconds via Axios), and a Report page 
(shows ECG findings, Echo findings, fusion status badge, history 
comparison, and the final assessment with evidence sections). 
Use Recharts for confidence visualization. 
Include a prominent disclaimer banner on the Report page.
```

### 9.1 — API Client

`frontend/src/api/client.ts`:
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

export interface AnalysisJob {
  job_id: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  stage?: string;
  result?: OmniHealthState;
  error?: string;
}

export const runAnalysis = async (formData: FormData): Promise<{ job_id: string }> => {
  const res = await apiClient.post('/api/analysis/run', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getJobStatus = async (jobId: string): Promise<AnalysisJob> => {
  const res = await apiClient.get(`/api/analysis/${jobId}/status`);
  return res.data;
};
```

### 9.2 — Key Component: Analysis Status Tracker

`frontend/src/components/analysis/PipelineTracker.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { getJobStatus, AnalysisJob } from '../../api/client';

const STAGES = [
  { key: 'ecg_analysis', label: 'ECG Agent', icon: '❤️' },
  { key: 'echo_analysis', label: 'Echo Agent', icon: '🫀' },
  { key: 'multimodal_fusion', label: 'Multimodal Fusion', icon: '🔀' },
  { key: 'history_analysis', label: 'History Agent', icon: '🔄' },
  { key: 'final_reasoning', label: 'Final Reasoning', icon: '🧠' },
];

export function PipelineTracker({ jobId, onComplete }: {
  jobId: string;
  onComplete: (result: any) => void;
}) {
  const [job, setJob] = useState<AnalysisJob | null>(null);

  useEffect(() => {
    const poll = setInterval(async () => {
      const status = await getJobStatus(jobId);
      setJob(status);
      if (status.status === 'complete') {
        clearInterval(poll);
        onComplete(status.result);
      }
      if (status.status === 'failed') {
        clearInterval(poll);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [jobId]);

  const currentStageIdx = STAGES.findIndex(s => s.key === job?.stage);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        OMNIHEALTH Analysis Pipeline
      </h2>
      <div className="space-y-4">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentStageIdx;
          const isActive = idx === currentStageIdx;
          return (
            <div key={stage.key} className={`flex items-center gap-4 p-4 rounded-lg border
              ${isDone ? 'bg-green-50 border-green-200' :
                isActive ? 'bg-blue-50 border-blue-300 animate-pulse' :
                'bg-gray-50 border-gray-200'}`}>
              <span className="text-2xl">{stage.icon}</span>
              <span className="font-medium text-gray-700">{stage.label}</span>
              <span className="ml-auto text-sm">
                {isDone ? '✓ Complete' : isActive ? '⟳ Running...' : '○ Waiting'}
              </span>
            </div>
          );
        })}
      </div>
      {job?.status === 'failed' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          Analysis failed: {job.error}
        </div>
      )}
    </div>
  );
}
```

### 9.3 — Report Component

`frontend/src/components/report/OmniHealthReport.tsx`:
```tsx
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

const FUSION_BADGE_COLORS = {
  agreement: 'bg-green-100 text-green-800',
  complementary: 'bg-blue-100 text-blue-800',
  conflict: 'bg-red-100 text-red-800',
  missing_modality: 'bg-yellow-100 text-yellow-800',
  insufficient: 'bg-gray-100 text-gray-800',
};

export function OmniHealthReport({ state }: { state: any }) {
  const { ecg_evidence, echo_evidence, fusion_result, history_analysis, final_assessment } = state;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-amber-800 text-sm font-medium">
        ⚠️ AI-ASSISTED RESEARCH PROTOTYPE — Not for clinical diagnosis. 
        All findings require review by a qualified cardiologist.
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">OMNIHEALTH Assessment</h1>
        <p className="text-gray-500 mt-1">Multimodal Cardiac Analysis</p>
      </div>

      {/* Evidence Grid */}
      <div className="grid grid-cols-2 gap-4">
        <EvidenceCard title="ECG Analysis" icon="❤️" evidence={ecg_evidence} />
        <EvidenceCard title="Echo Analysis" icon="🫀" evidence={echo_evidence} />
      </div>

      {/* Fusion */}
      {fusion_result && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-3">🔀 Multimodal Fusion</h2>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3
            ${FUSION_BADGE_COLORS[fusion_result.status] || 'bg-gray-100'}`}>
            {fusion_result.status.toUpperCase().replace('_', ' ')}
          </span>
          <p className="text-gray-700">{fusion_result.agreement_summary}</p>
          {fusion_result.conflict_description && (
            <p className="mt-2 text-red-600 font-medium">
              ⚠️ {fusion_result.conflict_description}
            </p>
          )}
        </div>
      )}

      {/* Final Assessment */}
      {final_assessment && (
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold mb-4">🧠 Final AI-Assisted Assessment</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Primary Assessment</h3>
              <p className="text-gray-700 mt-1">{final_assessment.primary_assessment}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Supported Findings</h3>
              <ul className="mt-1 space-y-1">
                {final_assessment.supported_findings.map((f: string, i: number) => (
                  <li key={i} className="flex gap-2 text-gray-700">
                    <span className="text-blue-500">•</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Explanation</h3>
              <p className="text-gray-700 mt-1 text-sm">{final_assessment.explanation}</p>
            </div>
            <div>
              <h3 className="font-medium text-red-700">Limitations</h3>
              <ul className="mt-1 space-y-1">
                {final_assessment.limitations.map((l: string, i: number) => (
                  <li key={i} className="text-red-600 text-sm">• {l}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EvidenceCard({ title, icon, evidence }: any) {
  if (!evidence) return (
    <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300">
      <h2 className="font-semibold text-gray-500">{icon} {title}</h2>
      <p className="text-sm text-gray-400 mt-2">Not provided</p>
    </div>
  );
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="font-semibold text-gray-800 mb-2">{icon} {title}</h2>
      <p className="text-sm font-medium text-gray-900">{evidence.finding}</p>
      {evidence.confidence && (
        <div className="mt-2">
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${Math.round(evidence.confidence * 100)}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Model confidence: {Math.round(evidence.confidence * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔬 PHASE 10 — Explainability Layer

### Agentic Prompt to Use
```
Build ECG explainability in `backend/explainability/ecg_explainer.py`. 
It should take the ECG signal, the model's attention weights or 
gradient w.r.t. input, and return highlighted waveform regions 
as JSON (start_sample, end_sample, attribution_score). 
For Echo, wire the EchoGradCAM to run after echo_agent_node 
and save the overlay frame to disk, returning its path.
```

`backend/explainability/ecg_explainer.py`:
```python
import numpy as np
import torch
from dataclasses import dataclass

@dataclass
class WaveformRegion:
    lead: int
    start_sample: int
    end_sample: int
    attribution_score: float
    label: str

def compute_ecg_saliency(
    model, signal: np.ndarray, target_class: int
) -> list[WaveformRegion]:
    """
    Input gradient saliency for ECG classification.
    Returns the top contributing signal regions.
    """
    tensor = torch.tensor(signal.T, dtype=torch.float32).unsqueeze(0)
    tensor.requires_grad_(True)

    logits = model(tensor)
    logits[0, target_class].backward()

    saliency = tensor.grad.data.abs().squeeze().numpy()  # (leads, time)
    regions = []

    for lead_idx in range(saliency.shape[0]):
        lead_sal = saliency[lead_idx]
        # Find top-scoring windows (non-overlapping, 50-sample windows)
        window_size = 50
        n_windows = len(lead_sal) // window_size
        window_scores = [
            lead_sal[i * window_size:(i + 1) * window_size].mean()
            for i in range(n_windows)
        ]
        top_window = int(np.argmax(window_scores))
        regions.append(WaveformRegion(
            lead=lead_idx,
            start_sample=top_window * window_size,
            end_sample=(top_window + 1) * window_size,
            attribution_score=float(window_scores[top_window]),
            label=f"Lead {lead_idx} — highest attribution region",
        ))

    return sorted(regions, key=lambda r: -r.attribution_score)[:5]
```

---

## 📊 PHASE 11 — Research Experiments

### Goal
Implement the ablation study framework comparing 4 experimental configurations.

### Agentic Prompt to Use
```
Create `notebooks/03_fusion_experiments.ipynb`. 
Load PTB-XL dataset, split into train/val/test. 
Run 4 experimental configurations: ECG-only, Echo-only (simulated), 
ECG+Echo fusion, ECG+Echo+History. 
Compute Precision, Recall, F1, AUROC, Sensitivity, Specificity 
for each configuration. Plot results using matplotlib. 
Include a calibration curve for confidence scores.
```

`notebooks/03_fusion_experiments.ipynb` — key code cells:

```python
# Cell 1: Load PTB-XL
import wfdb, ast
import pandas as pd, numpy as np
from pathlib import Path

PTBXL_PATH = Path("./data/ptb-xl/")
Y = pd.read_csv(PTBXL_PATH / "ptbxl_database.csv", index_col="ecg_id")
Y["scp_codes"] = Y["scp_codes"].apply(ast.literal_eval)

# Map to 5 superclasses
SUPERCLASS_MAP = {"NORM": 0, "MI": 1, "STTC": 2, "CD": 3, "HYP": 4}

# Cell 2: Evaluation function
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

def evaluate_config(y_true, y_pred, y_prob, config_name):
    results = {
        "config": config_name,
        "precision": precision_score(y_true, y_pred, average="macro", zero_division=0),
        "recall": recall_score(y_true, y_pred, average="macro", zero_division=0),
        "f1": f1_score(y_true, y_pred, average="macro", zero_division=0),
        "auroc": roc_auc_score(y_true, y_prob, multi_class="ovr", average="macro"),
    }
    tn, fp, fn, tp = confusion_matrix(y_true.ravel(), y_pred.ravel()).ravel()
    results["sensitivity"] = tp / (tp + fn + 1e-8)
    results["specificity"] = tn / (tn + fp + 1e-8)
    return results

# Cell 3: Run 4 experiments and collect results into DataFrame
# (Replace with actual model outputs from your experiments)
experiments = ["ECG Only", "Echo Only", "ECG + Echo", "ECG + Echo + History"]
results_df = pd.DataFrame([
    evaluate_config(y_true_ecg, y_pred_ecg, y_prob_ecg, "ECG Only"),
    evaluate_config(y_true_echo, y_pred_echo, y_prob_echo, "Echo Only"),
    evaluate_config(y_true_fused, y_pred_fused, y_prob_fused, "ECG + Echo"),
    evaluate_config(y_true_full, y_pred_full, y_prob_full, "ECG + Echo + History"),
])
print(results_df.to_markdown())
```

---

## 🐳 PHASE 12 — Docker & Deployment

### Goal
Containerize the full stack for reproducible deployment.

`docker/Dockerfile.backend`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY .env .

EXPOSE 8000
CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`docker/Dockerfile.frontend`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json .
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

`docker/docker-compose.yml`:
```yaml
version: "3.9"
services:
  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    ports:
      - "8000:8000"
    env_file: ../.env
    volumes:
      - ../uploads:/app/uploads
      - ../models:/app/models
    depends_on:
      - mongo

  frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

---

## ✅ Complete Phase Checklist

### Phase 0 — Scaffold
- [ ] Monorepo created, all folders exist
- [ ] `requirements.txt` pinned and installed
- [ ] `.env.example` committed, `.env` in `.gitignore`
- [ ] Frontend Vite project initialized with Tailwind

### Phase 1 — Data Layer
- [ ] All Pydantic schemas defined and importable
- [ ] `OmniHealthState` TypedDict created
- [ ] MongoDB Atlas cluster created, connection string in `.env`
- [ ] `ReportRepository` and `PatientRepository` implemented

### Phase 2 — ECG Agent
- [ ] Signal loading (WFDB + CSV) working
- [ ] NeuroKit2 preprocessing pipeline tested on PTB-XL sample
- [ ] ECGClassifier architecture defined
- [ ] Mock mode verified end-to-end
- [ ] `ecg_agent_node` returns valid `ECGEvidenceSchema`

### Phase 3 — Echo Agent
- [ ] Video loading and frame extraction tested
- [ ] EchoNetLite architecture defined
- [ ] Mock mode verified
- [ ] `echo_agent_node` returns valid `EchoEvidenceSchema`
- [ ] GradCAM overlay generates a valid image file

### Phase 4 — Fusion Layer
- [ ] LLM call to Claude working with structured JSON response
- [ ] All 4 fusion scenarios (agreement/complementary/conflict/missing) tested
- [ ] Fallback rule-based fusion works if LLM fails

### Phase 5 — History Agent
- [ ] All 6 history relationship types handled
- [ ] Works gracefully when no history is provided

### Phase 6 — LangGraph
- [ ] Graph compiles without errors
- [ ] `has_echo` conditional edge tested with/without echo file
- [ ] `has_history` conditional edge tested
- [ ] LangSmith traces appear in dashboard
- [ ] Full pipeline run (all agents) completes

### Phase 7 — Final Reasoning
- [ ] Structured JSON output parsed correctly
- [ ] `requires_clinical_review: true` always set
- [ ] Disclaimer in output

### Phase 8 — FastAPI
- [ ] `/health` endpoint returns 200
- [ ] `/api/analysis/run` accepts multipart form
- [ ] Async background pipeline runs correctly
- [ ] `/api/analysis/{job_id}/status` returns correct stage
- [ ] CORS configured for frontend dev server

### Phase 9 — Frontend
- [ ] File upload with drag-and-drop works
- [ ] Pipeline tracker polls and updates in real time
- [ ] Report page renders all sections
- [ ] Disclaimer banner visible on Report page
- [ ] Mobile-responsive layout

### Phase 10 — Explainability
- [ ] Grad-CAM overlay saved to disk for Echo
- [ ] ECG saliency regions returned in ECGEvidenceSchema
- [ ] Frontend displays visual evidence with appropriate label

### Phase 11 — Research
- [ ] PTB-XL dataset loaded in Jupyter
- [ ] All 4 experimental configurations run
- [ ] Metrics computed from real experiment results (not invented)
- [ ] Research results saved to `notebooks/04_research_results.ipynb`

### Phase 12 — Docker
- [ ] `docker-compose up` builds and starts all three services
- [ ] Backend health check passes inside container
- [ ] Frontend served correctly by nginx
- [ ] Uploads directory mounted as volume

---

## 🚨 Critical Safety Rules (Enforce Throughout)

```
1. NEVER use real patient data — PTB-XL and EchoNet are de-identified public datasets only.
2. NEVER send raw patient data to external LLM APIs — only de-identified findings/summaries.
3. NEVER display raw model confidence as a "diagnosis probability" to end users.
4. ALWAYS include the disclaimer: "AI-assisted research prototype. Not for clinical diagnosis."
5. ALWAYS set requires_clinical_review: true in FinalAssessmentSchema.
6. NEVER hard-code API keys — always use environment variables via pydantic-settings.
7. ALWAYS store uploaded files with UUID-namespaced paths, not original filenames.
8. NEVER expose MongoDB credentials in logs or API responses.
9. ALWAYS redact patient identifiers before they appear in LangSmith traces.
10. NEVER invent evaluation metrics — all numbers must come from actual experiments.
```

---

## 🔑 Agentic IDE Usage Tips

When working in an agentic IDE like Antigravity, Cursor, or Windsurf:

1. **Start each phase** by pasting the "Agentic Prompt to Use" box into the IDE's agent panel.
2. **Reference schemas** — tell the agent: *"Follow the Pydantic schemas in `backend/api/schemas.py` exactly — never modify the schema contracts."*
3. **Use the state as the contract** — the `OmniHealthState` TypedDict is the single source of truth connecting all agents.
4. **Test incrementally** — after each agent is built, write a quick test in `backend/tests/` before moving to the next phase.
5. **Mock mode first** — set `ENVIRONMENT=development` in `.env` so all agents use mock models during frontend development.
6. **One node at a time** — ask the agentic IDE to implement one LangGraph node, test it with `graph.invoke()`, then move on.

---

*OMNIHEALTH Implementation Plan v1.0 — Research Prototype*  
*Always consult a qualified cardiologist for clinical decisions.*
