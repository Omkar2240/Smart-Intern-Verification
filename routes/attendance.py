from fastapi import APIRouter

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)

@router.get("/")
def attendance():
    return {
        "status": "Attendance route is ready."
    }