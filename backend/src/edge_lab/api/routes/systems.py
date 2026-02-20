from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import Strategy, Variant, User
from edge_lab.security.auth import get_current_user
import uuid

router = APIRouter(tags=["Systems"])


# ==========================================================
# LIST SYSTEMS (ISOLATED)
# ==========================================================

@router.get("/")
def list_systems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    systems = (
        db.query(Strategy)
        .filter(Strategy.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": s.id,
            "name": s.name,
            "display_name": s.display_name or s.name,
            "asset": s.asset,
            "created_at": s.created_at,
        }
        for s in systems
    ]


# ==========================================================
# GET SYSTEM (ISOLATED)
# ==========================================================

@router.get("/{system_id}")
def get_system(
    system_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    system = (
        db.query(Strategy)
        .filter(
            Strategy.id == uuid.UUID(system_id),
            Strategy.user_id == current_user.id,
        )
        .first()
    )

    if not system:
        raise HTTPException(status_code=404, detail="System not found.")

    return {
        "id": system.id,
        "name": system.name,
        "display_name": system.display_name or system.name,
        "asset": system.asset,
        "created_at": system.created_at,
    }


# ==========================================================
# LIST VARIANTS FOR SYSTEM (ISOLATED)
# ==========================================================

@router.get("/{system_id}/variants")
def list_variants_for_system(
    system_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # First ensure system belongs to user
    system = (
        db.query(Strategy)
        .filter(
            Strategy.id == uuid.UUID(system_id),
            Strategy.user_id == current_user.id,
        )
        .first()
    )

    if not system:
        raise HTTPException(status_code=404, detail="System not found.")

    variants = (
        db.query(Variant)
        .filter(
            Variant.strategy_id == system.id,
            Variant.user_id == current_user.id,
        )
        .all()
    )

    return [
        {
            "id": v.id,
            "display_name": v.display_name or v.name,
            "name": v.name,
            "version": v.version_number,
        }
        for v in variants
    ]


# ==========================================================
# CREATE SYSTEM (ISOLATED)
# ==========================================================

@router.post("/")
def create_system(
    name: str,
    display_name: str,
    asset: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    strategy = Strategy(
        user_id=current_user.id,
        name=name,
        display_name=display_name,
        asset=asset,
    )

    db.add(strategy)
    db.commit()
    db.refresh(strategy)

    return {
        "id": strategy.id,
        "display_name": strategy.display_name,
    }