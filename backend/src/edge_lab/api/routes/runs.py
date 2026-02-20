from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import Run, Trade, User
from edge_lab.security.auth import get_current_user

from edge_lab.analytics.metrics import MetricsEngine
from edge_lab.analytics.equity import EquityBuilder
from edge_lab.analytics.monte_carlo import MonteCarloEngine
from edge_lab.analytics.risk_of_ruin import RiskOfRuinEngine
from edge_lab.analytics.walk_forward import WalkForwardEngine
from edge_lab.analytics.regime_detection import RegimeDetectionEngine
from edge_lab.analytics.kelly_simulation import KellySimulationEngine

import numpy as np
import uuid

router = APIRouter(tags=["Runs"])


# ==========================================================
# HELPER — HARD OWNERSHIP CHECK
# ==========================================================

def get_owned_run(
    run_id: str,
    db: Session,
    current_user: User,
) -> Run:
    run = (
        db.query(Run)
        .filter(
            Run.id == uuid.UUID(run_id),
            Run.user_id == current_user.id,
        )
        .first()
    )

    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    return run


# ==========================================================
# LIST RUNS
# ==========================================================

@router.get("/")
def list_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    runs = (
        db.query(Run)
        .filter(Run.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": r.id,
            "variant_id": r.variant_id,
            "display_name": r.display_name or "Unnamed Run",
            "status": r.status,
            "run_type": r.run_type,
            "initial_capital": r.initial_capital,
        }
        for r in runs
    ]


# ==========================================================
# GET RUN
# ==========================================================

@router.get("/{run_id}")
def get_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = get_owned_run(run_id, db, current_user)

    return {
        "id": run.id,
        "variant_id": run.variant_id,
        "display_name": run.display_name,
        "status": run.status,
        "run_type": run.run_type,
        "initial_capital": run.initial_capital,
        "trade_limit": run.trade_limit,
        "created_at": run.created_at,
    }


# ==========================================================
# CREATE RUN
# ==========================================================

@router.post("/")
def create_run(
    variant_id: str,
    display_name: str,
    initial_capital: float,
    run_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = Run(
        user_id=current_user.id,
        variant_id=uuid.UUID(variant_id),
        display_name=display_name,
        initial_capital=initial_capital,
        run_type=run_type,
    )

    db.add(run)
    db.commit()
    db.refresh(run)

    return {
        "id": run.id,
        "display_name": run.display_name,
    }


# ==========================================================
# DELETE RUN
# ==========================================================

@router.delete("/{run_id}")
def delete_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = get_owned_run(run_id, db, current_user)

    db.delete(run)
    db.commit()

    return {"status": "deleted"}


# ==========================================================
# METRICS
# ==========================================================

@router.get("/{run_id}/metrics")
def metrics(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_run(run_id, db, current_user)

    return MetricsEngine.generate_for_run(
        db=db,
        run_id=uuid.UUID(run_id),
    )


# ==========================================================
# EQUITY
# ==========================================================

@router.get("/{run_id}/equity")
def equity_curve(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = get_owned_run(run_id, db, current_user)

    trades = (
        db.query(Trade)
        .filter(
            Trade.run_id == run.id,
            Trade.user_id == current_user.id,
        )
        .all()
    )

    if not trades:
        return {"equity": [], "drawdown": []}

    r_values = np.array([t.r_multiple for t in trades if t.r_multiple is not None])

    risk_fraction = 0.01
    equity = 1.0
    equity_curve = []

    for r in r_values:
        equity *= (1 + r * risk_fraction)
        equity_curve.append(float(equity))

    equity_series = np.array(equity_curve)
    peak = np.maximum.accumulate(equity_series)
    drawdown = ((equity_series - peak) / peak).tolist()

    return {
        "equity": equity_curve,
        "drawdown": drawdown,
    }


# ==========================================================
# WALK FORWARD
# ==========================================================

@router.get("/{run_id}/walk-forward")
def walk_forward(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_run(run_id, db, current_user)

    return WalkForwardEngine.run(
        db=db,
        run_id=uuid.UUID(run_id),
    )


# ==========================================================
# REGIME DETECTION
# ==========================================================

@router.get("/{run_id}/regime-detection")
def regime_detection(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_run(run_id, db, current_user)

    return RegimeDetectionEngine.detect(
        db=db,
        run_id=uuid.UUID(run_id),
    )


# ==========================================================
# KELLY SIMULATION
# ==========================================================

@router.get("/{run_id}/kelly-simulation")
def kelly_simulation(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_run(run_id, db, current_user)

    return KellySimulationEngine.generate_for_run(
        db=db,
        run_id=uuid.UUID(run_id),
    )


# ==========================================================
# MONTE CARLO
# ==========================================================

@router.get("/{run_id}/monte-carlo")
def monte_carlo(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_run(run_id, db, current_user)

    return MonteCarloEngine.bootstrap_run(
        db=db,
        run_id=uuid.UUID(run_id),
        simulations=3000,
    )


# ==========================================================
# RISK OF RUIN
# ==========================================================

@router.get("/{run_id}/risk-of-ruin")
def risk_of_ruin(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_run(run_id, db, current_user)

    return RiskOfRuinEngine.simulate(
        db=db,
        run_id=uuid.UUID(run_id),
        simulations=3000,
        position_fraction=0.01,
        ruin_threshold=0.7,
    )


# ==========================================================
# TRADES FOR RUN
# ==========================================================

@router.get("/{run_id}/trades")
def list_trades_for_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = get_owned_run(run_id, db, current_user)

    trades = (
        db.query(Trade)
        .filter(
            Trade.run_id == run.id,
            Trade.user_id == current_user.id,
        )
        .all()
    )

    return [
        {
            "id": t.id,
            "entry_price": t.entry_price,
            "exit_price": t.exit_price,
            "stop_loss": t.stop_loss,
            "size": t.size,
            "direction": t.direction,
            "timestamp": t.timestamp,
            "timeframe": t.timeframe,
            "r_multiple": t.r_multiple,
            "is_win": t.is_win,
            "raw_return": t.raw_return,
            "log_return": t.log_return,
            "created_at": t.created_at,
        }
        for t in trades
    ]