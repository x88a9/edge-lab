from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from edge_lab.persistence.database import SessionLocal
from edge_lab.persistence.models import Trade, Run
import uuid
import math

router = APIRouter(tags=["Trades"])


# 🔹 Create Trade
@router.post("/")
def create_trade(
    run_id: str,
    entry_price: float,
    exit_price: float,
    size: float,
    direction: str,
):
    db: Session = SessionLocal()
    try:
        run = db.query(Run).filter_by(id=uuid.UUID(run_id)).first()
        if not run:
            raise ValueError("Run not found.")

        raw_return = (
            (exit_price - entry_price) / entry_price
            if direction == "long"
            else (entry_price - exit_price) / entry_price
        )

        log_return = math.log(1 + raw_return)

        trade = Trade(
            run_id=uuid.UUID(run_id),
            entry_price=entry_price,
            exit_price=exit_price,
            size=size,
            direction=direction,
            raw_return=raw_return,
            log_return=log_return,
        )

        db.add(trade)
        db.commit()
        db.refresh(trade)

        return {"id": trade.id}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        db.close()


# 🔹 Update Trade
@router.put("/{trade_id}")
def update_trade(
    trade_id: str,
    entry_price: float,
    exit_price: float,
    size: float,
    direction: str,
):
    db: Session = SessionLocal()
    try:
        trade = db.query(Trade).filter_by(id=uuid.UUID(trade_id)).first()
        if not trade:
            raise ValueError("Trade not found.")

        raw_return = (
            (exit_price - entry_price) / entry_price
            if direction == "long"
            else (entry_price - exit_price) / entry_price
        )

        trade.entry_price = entry_price
        trade.exit_price = exit_price
        trade.size = size
        trade.direction = direction
        trade.raw_return = raw_return
        trade.log_return = math.log(1 + raw_return)

        db.commit()

        return {"status": "updated"}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        db.close()


# 🔹 Delete Trade
@router.delete("/{trade_id}")
def delete_trade(trade_id: str):
    db: Session = SessionLocal()
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
    finally:
        db.close()
@router.get("/")
def list_trades():
    db: Session = SessionLocal()
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
                "size": t.size,
                "direction": t.direction,
                "raw_return": t.raw_return,
                "log_return": t.log_return,
                "created_at": t.created_at,
            }
            for t in trades
        ]

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()
@router.get("/{trade_id}")
def get_trade(trade_id: str):
    db: Session = SessionLocal()
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
            "size": trade.size,
            "direction": trade.direction,
            "raw_return": trade.raw_return,
            "log_return": trade.log_return,
            "created_at": trade.created_at,
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    finally:
        db.close()
