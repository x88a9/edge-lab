from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import Run, Trade, User, RunAnalytics
from edge_lab.security.auth import get_current_user

from edge_lab.analytics.metrics import MetricsEngine
from edge_lab.analytics.equity import EquityBuilder
from edge_lab.analytics.monte_carlo import MonteCarloEngine
from edge_lab.analytics.risk_of_ruin import RiskOfRuinEngine
from edge_lab.analytics.walk_forward import WalkForwardEngine
from edge_lab.analytics.regime_detection import RegimeDetectionEngine
from edge_lab.analytics.kelly_simulation import KellySimulationEngine
import time
import uuid
from pydantic import BaseModel

router = APIRouter(tags=["Runs"])


class RunCreate(BaseModel):
    variant_id: str
    display_name: str
    description: str | None = None
    initial_capital: float
    run_type: str


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
            "description": r.description,
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
        "description": run.description,
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
    run_data: RunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = Run(
        user_id=current_user.id,
        variant_id=uuid.UUID(run_data.variant_id),
        display_name=run_data.display_name,
        description=run_data.description,
        initial_capital=run_data.initial_capital,
        run_type=run_data.run_type,
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
# COMPUTE ANALYTICS (PERSISTED)
# ==========================================================

@router.post("/{run_id}/compute-analytics")
def compute_analytics(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = get_owned_run(run_id, db, current_user)

    start = time.time()
    metrics = MetricsEngine.generate_for_run(
        db=db,
        run_id=run.id,
        user_id=current_user.id,
    )
    print("metrics:", time.time() - start)

    start = time.time()
    equity_df = EquityBuilder.build_equity_series(
        db=db,
        run_id=run.id,
        user_id=current_user.id,
    )
    equity = {
        "equity": equity_df["equity"].tolist(),
        "drawdown": equity_df["drawdown"].tolist(),
    }
    print("equity:", time.time() - start)

    start = time.time()
    walk_forward = WalkForwardEngine.run(
        db=db,
        run_id=run.id,
        user_id=current_user.id,
    )
    print("walk:", time.time() - start)

    start = time.time()
    monte_carlo = MonteCarloEngine.bootstrap_run(
        db=db,
        run_id=run.id,
        user_id=current_user.id,
        simulations=3000,
    )
    print("mc:", time.time() - start)

    start = time.time()
    risk_of_ruin = RiskOfRuinEngine.simulate(
        db=db,
        run_id=run.id,
        user_id=current_user.id,
        simulations=3000,
        position_fraction=0.01,
        ruin_threshold=0.7,
    )
    print("ror:", time.time() - start)

    start = time.time()
    regime = RegimeDetectionEngine.detect(
        db=db,
        run_id=run.id,
        user_id=current_user.id,
    )
    print("regimedetection:", time.time() - start)

    start = time.time()
    kelly = KellySimulationEngine.generate_for_run(
        db=db,
        run_id=run.id,
        user_id=current_user.id,
    )
    print("kelly:", time.time() - start)
    existing = (
        db.query(RunAnalytics)
        .filter(
            RunAnalytics.user_id == current_user.id,
            RunAnalytics.run_id == run.id,
        )
        .first()
    )

    if existing:
        existing.metrics_json = metrics
        existing.equity_json = equity
        existing.walk_forward_json = walk_forward
        existing.monte_carlo_json = monte_carlo
        existing.risk_of_ruin_json = risk_of_ruin
        existing.regime_json = regime
        existing.kelly_json = kelly
        existing.is_dirty = False
    else:
        analytics = RunAnalytics(
            user_id=current_user.id,
            run_id=run.id,
            metrics_json=metrics,
            equity_json=equity,
            walk_forward_json=walk_forward,
            monte_carlo_json=monte_carlo,
            risk_of_ruin_json=risk_of_ruin,
            regime_json=regime,
            kelly_json=kelly,
            is_dirty=False,
        )
        db.add(analytics)

    db.commit()

    return {"status": "computed"}


# ==========================================================
# GET ANALYTICS (PERSISTED ONLY)
# ==========================================================

@router.get("/{run_id}/analytics")
def get_analytics(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = get_owned_run(run_id, db, current_user)

    analytics = (
        db.query(RunAnalytics)
        .filter(
            RunAnalytics.user_id == current_user.id,
            RunAnalytics.run_id == run.id,
        )
        .first()
    )

    if not analytics:
        raise HTTPException(
            status_code=404,
            detail="Analytics not computed.",
        )

    return {
        "metrics": analytics.metrics_json,
        "equity": analytics.equity_json,
        "walk_forward": analytics.walk_forward_json,
        "monte_carlo": analytics.monte_carlo_json,
        "risk_of_ruin": analytics.risk_of_ruin_json,
        "regime": analytics.regime_json,
        "kelly": analytics.kelly_json,
        "is_dirty": analytics.is_dirty,
    }


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