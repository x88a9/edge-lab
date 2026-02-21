from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import Trade, Run, User
from edge_lab.security.auth import get_current_user
import uuid
import math
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["Trades"])

# ==========================================================
# HELPER — OWNERSHIP CHECKS
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


def get_owned_trade(
    trade_id: str,
    db: Session,
    current_user: User,
) -> Trade:
    trade = (
        db.query(Trade)
        .filter(
            Trade.id == uuid.UUID(trade_id),
            Trade.user_id == current_user.id,
        )
        .first()
    )

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found.")

    return trade


# ==========================================================
# SCHEMA
# ==========================================================

class TradeCreate(BaseModel):
    run_id: str
    entry_price: float
    exit_price: float
    stop_loss: float
    size: float
    direction: str
    timestamp: datetime | None = None
    timeframe: str | None = None

class TradeUpdate(BaseModel):
    entry_price: float
    exit_price: float
    stop_loss: float
    size: float
    direction: str
    timestamp: datetime
    timeframe: Optional[str] = None


# ==========================================================
# CREATE TRADE (ISOLATED)
# ==========================================================

@router.post("/")
def create_trade(
    trade_data: TradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = get_owned_run(trade_data.run_id, db, current_user)

    entry = trade_data.entry_price
    exit_ = trade_data.exit_price
    stop = trade_data.stop_loss
    direction = trade_data.direction.lower()

    if direction not in ["long", "short"]:
        raise HTTPException(status_code=400, detail="Direction must be long or short.")

    if entry == stop:
        raise HTTPException(status_code=400, detail="Stop loss cannot equal entry.")

    if direction == "long":
        raw_return = (exit_ - entry) / entry
        risk = entry - stop
        r_multiple = (exit_ - entry) / risk
    else:
        raw_return = (entry - exit_) / entry
        risk = stop - entry
        r_multiple = (entry - exit_) / risk

    log_return = math.log(1 + raw_return)
    is_win = r_multiple > 0

    trade = Trade(
        user_id=current_user.id,
        run_id=run.id,
        entry_price=entry,
        exit_price=exit_,
        stop_loss=stop,
        size=trade_data.size,
        direction=direction,
        timestamp=trade_data.timestamp,
        timeframe=trade_data.timeframe,
        raw_return=raw_return,
        log_return=log_return,
        r_multiple=r_multiple,
        is_win=is_win,
    )

    db.add(trade)
    db.commit()
    db.refresh(trade)

    return {
        "id": trade.id,
        "r_multiple": r_multiple,
    }


# ==========================================================
# UPDATE TRADE (ISOLATED)
# ==========================================================

@router.put("/{trade_id}")
def update_trade(
    trade_id: str,
    trade_data: TradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trade = get_owned_trade(trade_id, db, current_user)

    # Risk calculation identical to create; guard maintained
    risk = abs(trade_data.entry_price - trade_data.stop_loss)
    if risk == 0:
        raise HTTPException(status_code=400, detail="Stop loss cannot equal entry.")

    direction = trade_data.direction.lower()
    if direction == "long":
        r_multiple = (trade_data.exit_price - trade_data.entry_price) / risk
        raw_return = (trade_data.exit_price - trade_data.entry_price) / trade_data.entry_price
    else:
        r_multiple = (trade_data.entry_price - trade_data.exit_price) / risk
        raw_return = (trade_data.entry_price - trade_data.exit_price) / trade_data.entry_price

    trade.entry_price = trade_data.entry_price
    trade.exit_price = trade_data.exit_price
    trade.stop_loss = trade_data.stop_loss
    trade.size = trade_data.size
    trade.direction = direction
    trade.timestamp = trade_data.timestamp
    trade.timeframe = trade_data.timeframe
    trade.raw_return = raw_return
    trade.log_return = math.log(1 + raw_return)
    trade.r_multiple = r_multiple
    trade.is_win = r_multiple > 0

    db.commit()

    return {"status": "updated"}


# ==========================================================
# DELETE TRADE (ISOLATED)
# ==========================================================

@router.delete("/{trade_id}")
def delete_trade(
    trade_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trade = get_owned_trade(trade_id, db, current_user)

    db.delete(trade)
    db.commit()

    return {"status": "deleted"}


# ==========================================================
# LIST TRADES (ISOLATED)
# ==========================================================

@router.get("/")
def list_trades(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trades = (
        db.query(Trade)
        .filter(Trade.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": t.id,
            "run_id": t.run_id,
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


# ==========================================================
# GET SINGLE TRADE (ISOLATED)
# ==========================================================

@router.get("/{trade_id}")
def get_trade(
    trade_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trade = get_owned_trade(trade_id, db, current_user)

    return {
        "id": trade.id,
        "run_id": trade.run_id,
        "entry_price": trade.entry_price,
        "exit_price": trade.exit_price,
        "stop_loss": trade.stop_loss,
        "size": trade.size,
        "direction": trade.direction,
        "timestamp": trade.timestamp,
        "timeframe": trade.timeframe,
        "r_multiple": trade.r_multiple,
        "is_win": trade.is_win,
        "raw_return": trade.raw_return,
        "log_return": trade.log_return,
        "created_at": trade.created_at,
    }