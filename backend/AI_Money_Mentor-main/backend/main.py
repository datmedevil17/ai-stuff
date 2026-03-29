from fastapi import FastAPI
from config import settings
import uvicorn
from api.agents import router as agents_router

app = FastAPI(
    title="FinPersona API",
    description="Agentic framework for Financial Strategies",
    version="1.0.0"
)

app.include_router(agents_router)

@app.get("/")
def health_check():
    return {"status": "ok", "app": "FinPersona Backend"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
