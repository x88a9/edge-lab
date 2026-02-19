from fastapi import FastAPI
from edge_lab.api.routes import runs, variants

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="edge lab API")

app.include_router(runs.router, prefix="/runs")
app.include_router(variants.router, prefix="/variants")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

