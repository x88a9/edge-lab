from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import Strategy, Variant
import uuid

router = APIRouter(tags=["Systems"])


@router.get("/")
def list_systems(db: Session = Depends(get_db)):
    try:
        systems = db.query(Strategy).all()

        if not systems:
            raise ValueError("No systems found.")

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

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.get("/{system_id}")
def get_system(system_id: str, db: Session = Depends(get_db)):
    try:
        system = db.query(Strategy).filter_by(id=uuid.UUID(system_id)).first()

        if not system:
            raise ValueError("System not found.")

        return {
            "id": system.id,
            "name": system.name,
            "display_name": system.display_name or system.name,
            "asset": system.asset,
            "created_at": system.created_at,
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.get("/{system_id}/variants")
def list_variants_for_system(system_id: str, db: Session = Depends(get_db)):
    try:
        variants = db.query(Variant).filter_by(strategy_id=uuid.UUID(system_id)).all()

        if not variants:
            raise ValueError("No variants found for this system.")

        return [
            {
                "id": v.id,
                "display_name": v.display_name or v.name,
                "name": v.name,
                "version": v.version_number,
            }
            for v in variants
        ]

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.post("/")
def create_system(
    user_id: str,
    name: str,
    display_name: str,
    asset: str,
    db: Session = Depends(get_db),
):
    try:
        strategy = Strategy(
            user_id=uuid.UUID(user_id),
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

    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")