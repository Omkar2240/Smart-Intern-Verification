from fastapi import APIRouter

router = APIRouter(
    prefix="/face",
    tags=["Face"]
)

@router.get("/")
def face():
    return {
        "status": "Face route is ready."
    }