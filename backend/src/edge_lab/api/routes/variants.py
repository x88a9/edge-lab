from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from edge_lab.persistence.database import SessionLocal
from edge_lab.persistence.models import Variant, Run
from edge_lab.analytics.variant_analyzer import VariantAnalyzer
import uuid

router = APIRouter(tags=["Variants"])

@router.get("/")
def list_variants():
    db: Session = SessionLocal()
    try:
        variants = db.query(Variant).all()

        if not variants:
            raise ValueError("No variants found.")

        return [
            {
                "id": v.id,
                "strategy_id": v.strategy_id,
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


@router.get("/{variant_id}")
def get_variant(variant_id: str):
    db: Session = SessionLocal()
    try:
        variant = db.query(Variant).filter_by(id=uuid.UUID(variant_id)).first()

        if not variant:
            raise ValueError("Variant not found.")

        return {
            "id": variant.id,
            "name": variant.name,
            "version": variant.version_number,
            "strategy_id": variant.strategy_id,
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        db.close()

@router.get("/{variant_id}/runs")
def list_runs_for_variant(variant_id: str):
    db: Session = SessionLocal()
    try:
        runs = db.query(Run).filter_by(
            variant_id=uuid.UUID(variant_id)
        ).all()

        if not runs:
            raise ValueError("No runs found for this variant.")

        return [
            {
                "id": r.id,
                "status": r.status,
                "run_type": r.run_type,
                "initial_capital": r.initial_capital,
                "trade_limit": r.trade_limit,
            }
            for r in runs
        ]

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        db.close()

@router.get("/{variant_id}/analysis")
def analyze_variant(variant_id: str):
    db: Session = SessionLocal()
    try:
        result = VariantAnalyzer.analyze_variant(
            db=db,
            variant_id=uuid.UUID(variant_id),
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        db.close()
