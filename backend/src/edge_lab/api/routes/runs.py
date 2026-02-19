from fastapi import APIRouter
from sqlalchemy.orm import Session
from edge_lab.persistence.database import SessionLocal
from edge_lab.analytics.monte_carlo import MonteCarloEngine
from edge_lab.analytics.risk_of_ruin import RiskOfRuinEngine
from fastapi import HTTPException
import uuid

router = APIRouter()


@router.get("/{run_id}/monte-carlo")
def monte_carlo(run_id: str):
    db = SessionLocal()
    try:
        result = MonteCarloEngine.bootstrap_run(
            db=db,
            run_id=uuid.UUID(run_id),
            simulations=3000,
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{run_id}/risk-of-ruin")
def risk_of_ruin(run_id: str):
    db: Session = SessionLocal()
    try:
        result = RiskOfRuinEngine.simulate(
            db=db,
            run_id=uuid.UUID(run_id),
            simulations=3000,
            position_fraction=0.01,
            ruin_threshold=0.7,
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


