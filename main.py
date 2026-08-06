from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.attendance import router as attendance_router
from routes.face import router as face_router
from routes.location import router as location_router

app = FastAPI(
    title="Smart Internship Verification Backend",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(attendance_router)
app.include_router(face_router)
app.include_router(location_router)

@app.get("/")
def root():
    return {
        "message": "Smart Internship Verification Backend is Running!"
    }