from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import Trade, Run
import uuid
import math
from datetime import datetime
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(tags=["Trades"])

class TradeCreate(BaseModel):
    run_id: str
    entry_price: float
    exit_price: float
    stop_loss: float
    size: float
    direction: str
    timestamp: Optional[datetime] = None
    timeframe: Optional[str] = None

@router.post("/")
def create_trade(trade_data: TradeCreate, db: Session = Depends(get_db)):
    try:
        run = db.query(Run).filter_by(id=uuid.UUID(trade_data.run_id)).first()
        if not run:
            raise HTTPException(status_code=404, detail="Run not found.")

        entry = trade_data.entry_price
        exit_ = trade_data.exit_price
        stop = trade_data.stop_loss
        direction = trade_data.direction.lower()

        if direction == "long":
            raw_return = (exit_ - entry) / entry
            r_multiple = (exit_ - entry) / (entry - stop)
        else:
            raw_return = (entry - exit_) / entry
            r_multiple = (entry - exit_) / (stop - entry)

        log_return = math.log(1 + raw_return)
        is_win = r_multiple > 0

        trade = Trade(
            run_id=uuid.UUID(trade_data.run_id),
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

        return {"id": trade.id, "r_multiple": r_multiple}

    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")


# 🔹 Update Trade
@router.put("/{trade_id}")
def update_trade(
    trade_id: str,
    entry_price: float,
    exit_price: float,
    stop_loss: float,
    size: float,
    direction: str,
    timestamp: datetime,
    timeframe: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        trade = db.query(Trade).filter_by(id=uuid.UUID(trade_id)).first()
        if not trade:
            raise ValueError("Trade not found.")

        risk = abs(entry_price - stop_loss)

        if risk == 0:
            raise ValueError("Stop loss cannot equal entry.")

        if direction == "long":
            r_multiple = (exit_price - entry_price) / risk
            raw_return = (exit_price - entry_price) / entry_price
        else:
            r_multiple = (entry_price - exit_price) / risk
            raw_return = (entry_price - exit_price) / entry_price

        trade.entry_price = entry_price
        trade.exit_price = exit_price
        trade.stop_loss = stop_loss
        trade.size = size
        trade.direction = direction
        trade.timestamp = timestamp
        trade.timeframe = timeframe
        trade.raw_return = raw_return
        trade.log_return = math.log(1 + raw_return)
        trade.r_multiple = r_multiple
        trade.is_win = r_multiple > 0

        db.commit()

        return {"status": "updated"}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")


# 🔹 Delete Trade
@router.delete("/{trade_id}")
def delete_trade(trade_id: str, db: Session = Depends(get_db)):
    try:
        trade = db.query(Trade).filter_by(id=uuid.UUID(trade_id)).first()
        if not trade:
            raise ValueError("Trade not found.")

        db.delete(trade)
        db.commit()

        return {"status": "deleted"}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")


# 🔹 List Trades
@router.get("/")
def list_trades(db: Session = Depends(get_db)):
    try:
        trades = db.query(Trade).all()

        if not trades:
            raise ValueError("No trades found.")

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

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔹 Get Single Trade
@router.get("/{trade_id}")
def get_trade(trade_id: str, db: Session = Depends(get_db)):
    try:
        trade = db.query(Trade).filter_by(
            id=uuid.UUID(trade_id)
        ).first()

        if not trade:
            raise ValueError("Trade not found.")

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

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))