from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from edge_lab.persistence.database import SessionLocal
from edge_lab.persistence.models import Strategy, Variant
import uuid

router = APIRouter(tags=["Systems"])


@router.get("")
def list_systems():
    db: Session = SessionLocal()
    try:
        systems = db.query(Strategy).all()

        if not systems:
            raise ValueError("No systems found.")

        return [
            {
                "id": s.id,
                "name": s.name,
                "asset": s.asset,
                "created_at": s.created_at,
            }
            for s in systems
        ]

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        db.close()


@router.get("/{system_id}")
def get_system(system_id: str):
    db: Session = SessionLocal()
    try:
        system = db.query(Strategy).filter_by(id=uuid.UUID(system_id)).first()

        if not system:
            raise ValueError("System not found.")

        return {
            "id": system.id,
            "name": system.name,
            "asset": system.asset,
            "created_at": system.created_at,
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        db.close()

@router.get("/{system_id}/variants")
def list_variants_for_system(system_id: str):
    db: Session = SessionLocal()
    try:
        variants = db.query(Variant).filter_by(strategy_id=uuid.UUID(system_id)).all()

        if not variants:
            raise ValueError("No variants found for this system.")

        return [
            {
                "id": v.id,
                "name": v.name,
                "version": v.version_number,
            }
            for v in variants
        ]

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        db.close()