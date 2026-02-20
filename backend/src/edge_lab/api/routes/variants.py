from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import Variant, Run, Strategy, User
from edge_lab.security.auth import get_current_user
from edge_lab.analytics.variant_analyzer import VariantAnalyzer
import uuid

router = APIRouter(tags=["Variants"])


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
    strategy_id: str,
    name: str,
    display_name: str,
    version_number: int,
    parameter_hash: str,
    parameter_json: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ensure strategy belongs to user
    strategy = (
        db.query(Strategy)
        .filter(
            Strategy.id == uuid.UUID(strategy_id),
            Strategy.user_id == current_user.id,
        )
        .first()
    )

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found.")

    variant = Variant(
        user_id=current_user.id,
        strategy_id=strategy.id,
        name=name,
        display_name=display_name,
        version_number=version_number,
        parameter_hash=parameter_hash,
        parameter_json=parameter_json,
    )

    db.add(variant)
    db.commit()
    db.refresh(variant)

    return {
        "id": variant.id,
        "display_name": variant.display_name,
    }