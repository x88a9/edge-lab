from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import random

from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import User
from edge_lab.security.password import verify_password
from edge_lab.security.auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


# ==========================================================
# IN-MEMORY CAPTCHA STORE
# ==========================================================

_CAPTCHA_STORE: dict[str, dict] = {}
_CAPTCHA_EXPIRATION_SECONDS = 120


# ==========================================================
# SCHEMAS
# ==========================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_id: str
    captcha_answer: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: str
    email: EmailStr
    is_admin: bool
    is_active: bool


class CaptchaResponse(BaseModel):
    captcha_id: str
    question: str


# ==========================================================
# CAPTCHA ENDPOINT
# ==========================================================

@router.get("/captcha", response_model=CaptchaResponse)
def get_captcha():
    a = random.randint(1, 20)
    b = random.randint(1, 20)

    captcha_id = str(uuid.uuid4())
    expected_answer = str(a + b)

    _CAPTCHA_STORE[captcha_id] = {
        "expected_answer": expected_answer,
        "expires_at": datetime.utcnow() + timedelta(seconds=_CAPTCHA_EXPIRATION_SECONDS),
    }

    return CaptchaResponse(
        captcha_id=captcha_id,
        question=f"What is {a} + {b}?"
    )


# ==========================================================
# LOGIN (WITH CAPTCHA)
# ==========================================================

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):

    # 1️⃣ Validate captcha existence
    captcha_entry = _CAPTCHA_STORE.get(payload.captcha_id)
    if not captcha_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid captcha",
        )

    # 2️⃣ Validate expiration
    if datetime.utcnow() > captcha_entry["expires_at"]:
        _CAPTCHA_STORE.pop(payload.captcha_id, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captcha expired",
        )

    # 3️⃣ Validate answer
    if payload.captcha_answer.strip() != captcha_entry["expected_answer"]:
        _CAPTCHA_STORE.pop(payload.captcha_id, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid captcha",
        )

    # 4️⃣ Delete captcha (single-use)
    _CAPTCHA_STORE.pop(payload.captcha_id, None)

    # 5️⃣ Proceed with normal authentication
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    access_token = create_access_token(user.id)

    return TokenResponse(access_token=access_token)


# ==========================================================
# ME
# ==========================================================

@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
    return MeResponse(
        id=str(current_user.id),
        email=current_user.email,
        is_admin=current_user.is_admin,
        is_active=current_user.is_active,
    )