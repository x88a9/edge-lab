from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List
import uuid

from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import (
    User,
    Strategy,
    Variant,
    Run,
    Trade,
    PortfolioAnalytics,
)
from edge_lab.security.auth import require_admin_user
from edge_lab.security.password import hash_password


router = APIRouter(prefix="/admin", tags=["Admin"])


# ==========================================================
# BOOTSTRAP FIRST ADMIN
# ==========================================================

class AdminBootstrapRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/bootstrap")
def bootstrap_admin(
    payload: AdminBootstrapRequest,
    db: Session = Depends(get_db),
):
    existing_admin = db.query(User).filter(User.is_admin == True).first()

    if existing_admin:
        raise HTTPException(status_code=403, detail="Admin already exists")

    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    admin = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_admin=True,
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {"status": "admin_created"}


# ==========================================================
# ADMIN OVERVIEW
# ==========================================================

@router.get("/overview")
def admin_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    return {
        "total_users": db.query(User).count(),
        "total_strategies": db.query(Strategy).count(),
        "total_variants": db.query(Variant).count(),
        "total_runs": db.query(Run).count(),
        "total_trades": db.query(Trade).count(),
        "total_portfolios": db.query(PortfolioAnalytics).count(),
    }


# ==========================================================
# USER MANAGEMENT
# ==========================================================

@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    users = db.query(User).all()

    return [
        {
            "id": u.id,
            "email": u.email,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.put("/users/{user_id}/activate")
def activate_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    user = db.get(User, uuid.UUID(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    db.commit()

    return {"status": "activated"}


@router.put("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    user = db.get(User, uuid.UUID(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.commit()

    return {"status": "deactivated"}


# ==========================================================
# TENANT INSPECTION (READ ONLY)
# ==========================================================

@router.get("/users/{user_id}/strategies")
def inspect_user_strategies(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    return db.query(Strategy).filter(
        Strategy.user_id == uuid.UUID(user_id)
    ).all()


@router.get("/users/{user_id}/variants")
def inspect_user_variants(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    return db.query(Variant).filter(
        Variant.user_id == uuid.UUID(user_id)
    ).all()


@router.get("/users/{user_id}/runs")
def inspect_user_runs(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    return db.query(Run).filter(
        Run.user_id == uuid.UUID(user_id)
    ).all()