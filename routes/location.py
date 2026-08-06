from fastapi import APIRouter

router = APIRouter(
    prefix="/location",
    tags=["Location"]
)

@router.get("/")
def location():
    return {
        "status": "Location route is ready."
    }