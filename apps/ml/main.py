import os
import random
import hashlib
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from PIL import Image
import io

app = FastAPI(title="GREVORO ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_MOCK = os.getenv("USE_MOCK", "true").lower() == "true"

MATERIAL_CLASSES = [
    "PET_PLASTIC",
    "HDPE_PLASTIC",
    "MIXED_PLASTIC",
    "PAPER",
    "CARDBOARD",
    "METAL_FERROUS",
    "METAL_NON_FERROUS",
    "GLASS",
    "ORGANIC",
    "MIXED",
]

CONTAMINATION_RANGES = {
    "PET_PLASTIC": (0, 8),
    "HDPE_PLASTIC": (0, 6),
    "MIXED_PLASTIC": (5, 20),
    "PAPER": (2, 15),
    "CARDBOARD": (1, 10),
    "METAL_FERROUS": (0, 5),
    "METAL_NON_FERROUS": (0, 3),
    "GLASS": (0, 5),
    "ORGANIC": (10, 40),
    "MIXED": (15, 45),
}

class ClassifyRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None

class ClassifyResponse(BaseModel):
    material: str
    confidence: float
    contamination_pct: float
    model_used: str

def mock_classify(seed: str) -> ClassifyResponse:
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    material = MATERIAL_CLASSES[h % len(MATERIAL_CLASSES)]
    confidence = 70.0 + (h % 25) + (h % 5) * 0.2
    lo, hi = CONTAMINATION_RANGES.get(material, (0, 20))
    contamination = lo + (h % max(1, hi - lo))
    return ClassifyResponse(
        material=material,
        confidence=round(confidence, 2),
        contamination_pct=round(contamination, 2),
        model_used="mock-deterministic-v1",
    )

@app.get("/health")
def health():
    return {"status": "ok", "service": "grevoro-ml", "mock": USE_MOCK}

@app.post("/classify", response_model=ClassifyResponse)
async def classify(req: ClassifyRequest):
    if not req.image_url and not req.image_base64:
        raise HTTPException(status_code=400, detail="image_url or image_base64 required")

    seed = req.image_url or req.image_base64 or "default"

    if USE_MOCK:
        return mock_classify(seed)

    try:
        if req.image_url:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(req.image_url)
                resp.raise_for_status()
                img_bytes = resp.content
        else:
            import base64
            img_bytes = base64.b64decode(req.image_base64)

        img = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((224, 224))

        return mock_classify(seed)

    except Exception as e:
        print(f"[ML] Real inference failed, falling back to mock: {e}")
        return mock_classify(seed)

@app.get("/materials")
def list_materials():
    return {"materials": MATERIAL_CLASSES, "count": len(MATERIAL_CLASSES)}
