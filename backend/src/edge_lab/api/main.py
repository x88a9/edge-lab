from fastapi import FastAPI
from edge_lab.api.routes import runs, variants,systems, trades

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="edge lab API")

app.include_router(trades.router, prefix="/trades")
app.include_router(runs.router, prefix="/runs")
app.include_router(variants.router, prefix="/variants")
app.include_router(systems.router, prefix="/systems")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

