from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import (
    Portfolio,
    PortfolioAnalytics,
    Strategy,
    StrategyAnalytics,
    User,
)
from edge_lab.security.auth import get_current_user
from edge_lab.analytics.hierarchy_compute import HierarchyComputeService
import uuid
from pydantic import BaseModel

router = APIRouter(tags=["Portfolio"])


# ==========================================================
# SCHEMAS
# ==========================================================

class PortfolioCreate(BaseModel):
    name: str


# ==========================================================
# HELPERS
# ==========================================================

def get_owned_portfolio(pid: str, db: Session, user: User):
    portfolio = (
        db.query(Portfolio)
        .filter(
            Portfolio.id == uuid.UUID(pid),
            Portfolio.user_id == user.id,
        )
        .first()
    )
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found.")
    return portfolio


def get_default_portfolio(db: Session, user: User):
    portfolio = (
        db.query(Portfolio)
        .filter(
            Portfolio.user_id == user.id,
            Portfolio.is_default == True,
        )
        .first()
    )
    if not portfolio:
        raise HTTPException(status_code=500, detail="Default portfolio missing.")
    return portfolio


# ==========================================================
# LIST PORTFOLIOS (Governance)
# ==========================================================

@router.get("/")
def list_portfolios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolios = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": p.id,
            "name": p.name,
            "is_default": p.is_default,
            "is_dirty": p.is_dirty,
            "updated_at": p.updated_at,
        }
        for p in portfolios
    ]


# ==========================================================
# CREATE PORTFOLIO
# ==========================================================

@router.post("/")
def create_portfolio(
    data: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = Portfolio(
        user_id=current_user.id,
        name=data.name,
        is_default=False,
        is_dirty=True,
    )

    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)

    return {"id": portfolio.id}


# ==========================================================
# DELETE PORTFOLIO
# ==========================================================

@router.delete("/{portfolio_id}")
def delete_portfolio(
    portfolio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = get_owned_portfolio(portfolio_id, db, current_user)

    if portfolio.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default portfolio.")

    default_portfolio = get_default_portfolio(db, current_user)

    strategies = (
        db.query(Strategy)
        .filter(
            Strategy.user_id == current_user.id,
            Strategy.portfolio_id == portfolio.id,
        )
        .all()
    )

    for s in strategies:
        s.portfolio_id = default_portfolio.id

    default_portfolio.is_dirty = True

    db.delete(portfolio)
    db.commit()

    return {"status": "deleted"}


# ==========================================================
# MOVE STRATEGY
# ==========================================================

@router.put("/{portfolio_id}/systems/{strategy_id}")
def move_strategy(
    portfolio_id: str,
    strategy_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_portfolio = get_owned_portfolio(portfolio_id, db, current_user)

    strategy = (
        db.query(Strategy)
        .filter(
            Strategy.id == uuid.UUID(strategy_id),
            Strategy.user_id == current_user.id,
        )
        .first()
    )

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found.")

    old_portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == strategy.portfolio_id)
        .first()
    )

    if old_portfolio.id == new_portfolio.id:
        return {"status": "no_change"}

    strategy.portfolio_id = new_portfolio.id

    old_portfolio.is_dirty = True
    new_portfolio.is_dirty = True

    db.commit()

    return {"status": "moved"}


# ==========================================================
# COMPUTE PORTFOLIO (Analytics Snapshot)
# ==========================================================

@router.post("/{portfolio_id}/compute")
def compute_portfolio(
    portfolio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    HierarchyComputeService.compute_portfolio(portfolio_id, db, current_user)
    return {"status": "computed"}


# ==========================================================
# GET PORTFOLIO (Governance)
# ==========================================================

@router.get("/{portfolio_id}")
def get_portfolio(
    portfolio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = get_owned_portfolio(portfolio_id, db, current_user)

    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "is_default": portfolio.is_default,
        "is_dirty": portfolio.is_dirty,
        "updated_at": portfolio.updated_at,
    }


# ==========================================================
# GET PORTFOLIO ANALYTICS
# ==========================================================

@router.get("/{portfolio_id}/analytics")
def get_portfolio_analytics(
    portfolio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = get_owned_portfolio(portfolio_id, db, current_user)

    snapshot = (
        db.query(PortfolioAnalytics)
        .filter(
            PortfolioAnalytics.user_id == current_user.id,
            PortfolioAnalytics.id == portfolio.id,
        )
        .first()
    )

    if not snapshot:
        raise HTTPException(status_code=404, detail="Portfolio analytics not computed.")

    return {
        "combined_metrics": snapshot.combined_metrics_json,
        "combined_equity": snapshot.combined_equity_json,
        "strategy_count": snapshot.strategy_count,
        "is_dirty": snapshot.is_dirty,
        "updated_at": snapshot.updated_at,
    }# ==========================================================
# LIST SYSTEMS FOR PORTFOLIO
# ==========================================================

@router.get("/{portfolio_id}/systems")
def list_portfolio_systems(
    portfolio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = get_owned_portfolio(portfolio_id, db, current_user)

    strategies = (
        db.query(Strategy)
        .filter(
            Strategy.user_id == current_user.id,
            Strategy.portfolio_id == portfolio.id,
        )
        .all()
    )

    return [
        {
            "id": s.id,
            "name": s.name,
            "display_name": s.display_name or s.name,
            "asset": s.asset,
            "created_at": s.created_at,
        }
        for s in strategies
    ]

# ==========================================================
# LIST SYSTEMS FOR PORTFOLIO
# ==========================================================

@router.get("/{portfolio_id}/systems")
def list_portfolio_systems(
    portfolio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = get_owned_portfolio(portfolio_id, db, current_user)

    strategies = (
        db.query(Strategy)
        .filter(
            Strategy.user_id == current_user.id,
            Strategy.portfolio_id == portfolio.id,
        )
        .all()
    )

    return [
        {
            "id": s.id,
            "name": s.name,
            "display_name": s.display_name or s.name,
            "asset": s.asset,
            "created_at": s.created_at,
        }
        for s in strategies
    ]
