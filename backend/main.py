from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from upload import router as upload_router

app = FastAPI(title="3D词云后端API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api", tags=["upload"])

@app.get("/")
def root():
    return {"message": "3D词云后端API服务"}

@app.get("/health")
def health():
    return {"status": "ok"}
