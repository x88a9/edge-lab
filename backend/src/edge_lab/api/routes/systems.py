from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import Strategy, Variant, User
from edge_lab.security.auth import get_current_user
import uuid
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["Systems"])

class SystemCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    asset: str


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
            "description": s.description,
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
        "description": system.description,
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
    system_data: SystemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    strategy = Strategy(
        user_id=current_user.id,
        name=system_data.name,
        display_name=system_data.display_name,
        asset=system_data.asset,
        description=system_data.description,
    )

    db.add(strategy)
    db.commit()
    db.refresh(strategy)

    return {
        "id": strategy.id,
        "display_name": strategy.display_name
    }