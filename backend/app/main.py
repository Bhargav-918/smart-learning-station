from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.learning import router as learning_router
from app.db.database import Base, engine
from app.db import models

from app.routes.auth import router as auth_router
from app.routes import ai_tutor
from app.routes.assessment import router as assessment_router
from app.routes import parent


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI Adaptive Smart Learning Station",
    version="1.0.0"
)


# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication routes
# IMPORTANT:
# auth.py already has prefix="/auth"
# So DO NOT add prefix="/auth" here.
app.include_router(auth_router)


# Learning routes
app.include_router(learning_router)


# Assessment routes
app.include_router(assessment_router)


# AI Tutor routes
app.include_router(ai_tutor.router)


# Parent routes
app.include_router(parent.router)


@app.get("/")
def root():
    return {
        "message": "Smart Learning Station API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }