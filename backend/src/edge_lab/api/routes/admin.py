from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import uuid

from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import (
    User,
    Strategy,
    Variant,
    Run,
    Trade,
    PortfolioAnalytics,
    Portfolio,
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

    # Create Default Portfolio
    default_portfolio = Portfolio(
        user_id=admin.id,
        name="Default",
        is_default=True,
        is_dirty=True,
    )

    db.add(default_portfolio)
    db.commit()

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
# ADMIN USER CREATION
# ==========================================================

class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    is_admin: bool
    is_active: bool | None = True


@router.post("/users")
def create_user(
    payload: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_admin=payload.is_admin,
        is_active=payload.is_active if payload.is_active is not None else True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create Default Portfolio
    default_portfolio = Portfolio(
        user_id=user.id,
        name="Default",
        is_default=True,
        is_dirty=True,
    )

    db.add(default_portfolio)
    db.commit()

    return {
        "id": user.id,
        "email": user.email,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }


# ==========================================================
# ADMIN PASSWORD RESET
# ==========================================================

class AdminResetPasswordRequest(BaseModel):
    new_password: str


@router.put("/users/{user_id}/reset-password")
def reset_password(
    user_id: str,
    payload: AdminResetPasswordRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    user = db.get(User, uuid.UUID(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {"status": "password_reset"}


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