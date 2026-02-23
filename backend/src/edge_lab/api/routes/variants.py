from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import Variant, Run, Strategy, User, VariantAnalytics, RunAnalytics
from edge_lab.security.auth import get_current_user
from edge_lab.analytics.variant_analyzer import VariantAnalyzer
import uuid, statistics
from pydantic import BaseModel

router = APIRouter(tags=["Variants"])

class VariantCreate(BaseModel):
    strategy_id: str
    name: str
    display_name: str
    description: str | None = None
    version_number: int
    parameter_hash: str
    parameter_json: str


# ==========================================================
# HELPER — OWNERSHIP CHECK
# ==========================================================

def get_owned_variant(
    variant_id: str,
    db: Session,
    current_user: User,
) -> Variant:
    variant = (
        db.query(Variant)
        .filter(
            Variant.id == uuid.UUID(variant_id),
            Variant.user_id == current_user.id,
        )
        .first()
    )

    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found.")

    return variant


# ==========================================================
# LIST VARIANTS (ISOLATED)
# ==========================================================

@router.get("/")
def list_variants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    variants = (
        db.query(Variant)
        .filter(Variant.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": v.id,
            "strategy_id": v.strategy_id,
            "display_name": v.display_name or v.name,
            "description": v.description,
            "name": v.name,
            "version": v.version_number,
        }
        for v in variants
    ]


# ==========================================================
# GET VARIANT (ISOLATED)
# ==========================================================

@router.get("/{variant_id}")
def get_variant(
    variant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    variant = get_owned_variant(variant_id, db, current_user)

    return {
        "id": variant.id,
        "name": variant.name,
        "display_name": variant.display_name or variant.name,
        "description": variant.description,
        "version": variant.version_number,
        "strategy_id": variant.strategy_id,
    }


# ==========================================================
# LIST RUNS FOR VARIANT (ISOLATED)
# ==========================================================

@router.get("/{variant_id}/runs")
def list_runs_for_variant(
    variant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    variant = get_owned_variant(variant_id, db, current_user)

    runs = (
        db.query(Run)
        .filter(
            Run.variant_id == variant.id,
            Run.user_id == current_user.id,
        )
        .all()
    )

    return [
        {
            "id": r.id,
            "display_name": r.display_name,
            "description": r.description,
            "status": r.status,
            "run_type": r.run_type,
            "initial_capital": r.initial_capital,
            "trade_limit": r.trade_limit,
        }
        for r in runs
    ]


# ==========================================================
# ANALYZE VARIANT (ISOLATED)
# ==========================================================

@router.get("/{variant_id}/analysis")
def analyze_variant(
    variant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_variant(variant_id, db, current_user)

    return VariantAnalyzer.analyze_variant(
        db=db,
        variant_id=uuid.UUID(variant_id),
    )


# ==========================================================
# CREATE VARIANT (ISOLATED)
# ==========================================================

@router.post("/")
def create_variant(
    variant_data: VariantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ensure strategy belongs to user
    strategy = (
        db.query(Strategy)
        .filter(
            Strategy.id == uuid.UUID(variant_data.strategy_id),
            Strategy.user_id == current_user.id,
        )
        .first()
    )

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found.")

    variant = Variant(
        user_id=current_user.id,
        strategy_id=strategy.id,
        name=variant_data.name,
        display_name=variant_data.display_name,
        description=variant_data.description,
        version_number=variant_data.version_number,
        parameter_hash=variant_data.parameter_hash,
        parameter_json=variant_data.parameter_json,
    )

    db.add(variant)
    db.commit()
    db.refresh(variant)

    return {
        "id": variant.id,
        "display_name": variant.display_name,
    }

# ==========================================================
# COMPUTE VARIANT ANALYTICS (SNAPSHOT)
# ==========================================================

@router.post("/{variant_id}/compute-analytics")
def compute_variant_analytics(
    variant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    variant = get_owned_variant(variant_id, db, current_user)

    # load run analytics snapshots (clean only)
    run_snapshots = (
        db.query(RunAnalytics)
        .join(Run, RunAnalytics.run_id == Run.id)
        .filter(
            Run.user_id == current_user.id,
            Run.variant_id == variant.id,
            RunAnalytics.is_dirty == False,
        )
        .all()
    )

    if not run_snapshots:
        raise HTTPException(
            status_code=400,
            detail="No valid run analytics snapshots available.",
        )

    expectancies = []
    log_growths = []
    sharpes = []
    max_drawdowns = []

    for snapshot in run_snapshots:
        metrics = snapshot.metrics_json or {}

        # ⚠️ Verwende echte Keys aus RunAnalytics
        e = metrics.get("expectancy_R")
        g = metrics.get("log_growth")
        s = metrics.get("sharpe")  # falls später ergänzt
        d = metrics.get("max_drawdown_R")

        if e is not None:
            expectancies.append(e)

        if g is not None:
            log_growths.append(g)

        if s is not None:
            sharpes.append(s)

        if d is not None:
            max_drawdowns.append(d)

    if not expectancies:
        raise HTTPException(
            status_code=400,
            detail="No valid expectancy values to aggregate."
        )

    aggregated = {
        "mean_expectancy": statistics.mean(expectancies),
        "mean_log_growth": statistics.mean(log_growths) if log_growths else None,
        "mean_sharpe": statistics.mean(sharpes) if sharpes else None,
        "mean_max_drawdown": statistics.mean(max_drawdowns) if max_drawdowns else None,
        "std_expectancy": statistics.pstdev(expectancies) if len(expectancies) > 1 else 0.0,
        "best_run_expectancy": max(expectancies),
        "worst_run_expectancy": min(expectancies),
    }

    existing = (
        db.query(VariantAnalytics)
        .filter(
            VariantAnalytics.user_id == current_user.id,
            VariantAnalytics.variant_id == variant.id,
        )
        .first()
    )

    if existing:
        existing.aggregated_metrics_json = aggregated
        existing.run_count = len(run_snapshots)
        existing.is_dirty = False
    else:
        analytics = VariantAnalytics(
            user_id=current_user.id,
            variant_id=variant.id,
            aggregated_metrics_json=aggregated,
            run_count=len(run_snapshots),
            is_dirty=False,
        )
        db.add(analytics)

    db.commit()

    return {"status": "computed"}

# ==========================================================
# GET VARIANT ANALYTICS (SNAPSHOT ONLY)
# ==========================================================

@router.get("/{variant_id}/analytics")
def get_variant_analytics(
    variant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    variant = get_owned_variant(variant_id, db, current_user)

    snapshot = (
        db.query(VariantAnalytics)
        .filter(
            VariantAnalytics.user_id == current_user.id,
            VariantAnalytics.variant_id == variant.id,
        )
        .first()
    )

    if not snapshot:
        raise HTTPException(
            status_code=404,
            detail="Variant analytics not computed.",
        )

    return {
        "aggregated_metrics": snapshot.aggregated_metrics_json,
        "run_count": snapshot.run_count,
        "is_dirty": snapshot.is_dirty,
        "updated_at": snapshot.updated_at,
    }