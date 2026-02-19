from fastapi import APIRouter
from sqlalchemy.orm import Session
from edge_lab.persistence.database import SessionLocal
from edge_lab.analytics.variant_analyzer import VariantAnalyzer
import uuid

router = APIRouter()


@router.get("/{variant_id}/analysis")
def analyze_variant(variant_id: str):
    db: Session = SessionLocal()
    result = VariantAnalyzer.analyze_variant(
        db=db,
        variant_id=uuid.UUID(variant_id),
    )
    return result
