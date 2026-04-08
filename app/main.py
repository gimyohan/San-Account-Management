from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import category, auth, payer, receipt, stats
from app.core.config import config
from app.core.log import setup_logging
from app.db.schema import Base, engine
from app.core.handler import register_handlers

setup_logging()
Base.metadata.create_all(bind=engine)

app = FastAPI(title = config.app_name)

register_handlers(app)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(category.router, prefix="/api", tags=["categories"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(payer.router, prefix="/api", tags=["payers"])
app.include_router(receipt.router, prefix="/api", tags=["receipts"])
app.include_router(stats.router, prefix="/api", tags=["stats"])