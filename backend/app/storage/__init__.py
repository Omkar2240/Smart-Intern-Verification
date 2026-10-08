from app.storage.cloudinary_storage import CloudinaryStorage
from app.storage.local import LocalStorage

_default_storage = None


def get_storage():
    global _default_storage
    if _default_storage is None:
        _default_storage = CloudinaryStorage()
    return _default_storage


__all__ = ["CloudinaryStorage", "LocalStorage", "get_storage"]
