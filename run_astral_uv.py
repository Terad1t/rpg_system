# run_astral_uv.py
from backend.master.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, factory=False)
