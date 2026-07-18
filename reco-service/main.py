import logging
import os
from contextlib import asynccontextmanager

import py_eureka_client.eureka_client as eureka_client
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import recommend as recommend_routes

load_dotenv()

logger = logging.getLogger("reco-service")

EUREKA_SERVER_URL = os.getenv("EUREKA_SERVER_URL", "http://localhost:8761/eureka/")
APP_NAME = os.getenv("APP_NAME", "reco-service")
INSTANCE_HOST = os.getenv("INSTANCE_HOST", "localhost")
AI_PORT = int(os.getenv("AI_PORT", "5003"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Dang ky Eureka: %s (app=%s, port=%s)", EUREKA_SERVER_URL, APP_NAME, AI_PORT)
    try:
        await eureka_client.init_async(
            eureka_server=EUREKA_SERVER_URL,
            app_name=APP_NAME,
            instance_host=INSTANCE_HOST,
            instance_port=AI_PORT,
            health_check_url="/actuator/health",
        )
        logger.info("Dang ky Eureka THANH CONG.")
    except Exception as exc:  # noqa: BLE001
        logger.error("Loi dang ky Eureka: %s", exc)

    yield

    try:
        await eureka_client.stop_async()
    except Exception as exc:  # noqa: BLE001
        logger.error("Loi huy dang ky Eureka: %s", exc)


app = FastAPI(
    title="Electro Store — Recommendation Service",
    description="Item-based Collaborative Filtering (reco-service)",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend_routes.router)


@app.get("/")
def root():
    return {
        "service": "reco-service",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
@app.get("/actuator/health")
def health():
    return {"status": "UP"}
