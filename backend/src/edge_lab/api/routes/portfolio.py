from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from edge_lab.persistence.database import get_db
from edge_lab.persistence.models import (
    PortfolioAnalytics,
    StrategyAnalytics,
    User,
)
from edge_lab.security.auth import get_current_user
import uuid
from pydantic import BaseModel

router = APIRouter(tags=["Portfolio"])


class PortfolioCreate(BaseModel):
    name: str
    allocation_mode: str
    allocation_config: dict | None = None


def get_owned_portfolio(pid: str, db: Session, user: User):
    portfolio = (
        db.query(PortfolioAnalytics)
        .filter(
            PortfolioAnalytics.id == uuid.UUID(pid),
            PortfolioAnalytics.user_id == user.id,
        )
        .first()
    )
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found.")
    return portfolio

# ==========================================================
# LIST PORTFOLIOS (ISOLATED)
# ==========================================================

@router.get("/")
def list_portfolios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolios = (
        db.query(PortfolioAnalytics)
        .filter(PortfolioAnalytics.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": p.id,
            "name": p.name,
            "allocation_mode": p.allocation_mode,
            "strategy_count": p.strategy_count,
            "is_dirty": p.is_dirty,
            "updated_at": p.updated_at,
        }
        for p in portfolios
    ]

@router.post("/")
def create_portfolio(
    data: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = PortfolioAnalytics(
        user_id=current_user.id,
        name=data.name,
        allocation_mode=data.allocation_mode,
        allocation_config_json=data.allocation_config,
        combined_metrics_json={},
        combined_equity_json={},
        strategy_count=0,
        is_dirty=True,
    )

    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)

    return {"id": portfolio.id}


@router.post("/{portfolio_id}/compute")
def compute_portfolio(
    portfolio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = get_owned_portfolio(portfolio_id, db, current_user)

    strategies = (
        db.query(StrategyAnalytics)
        .filter(
            StrategyAnalytics.user_id == current_user.id,
            StrategyAnalytics.is_dirty == False,
        )
        .all()
    )

    if not strategies:
        raise HTTPException(status_code=400, detail="No strategy analytics available.")

    weights = []

    if portfolio.allocation_mode == "equal_weight":
        weights = [1 / len(strategies)] * len(strategies)

    elif portfolio.allocation_mode == "kelly_weighted":
        growths = [
            s.aggregated_metrics_json.get("mean_log_growth", 0) or 0
            for s in strategies
        ]
        total = sum(growths) or 1
        weights = [g / total for g in growths]

    elif portfolio.allocation_mode == "fixed_weight":
        config = portfolio.allocation_config_json or {}
        weights = [config.get(str(s.strategy_id), 0) for s in strategies]
        total = sum(weights) or 1
        weights = [w / total for w in weights]

    horizon = 50
    capital = 1
    equity = []

    for _ in range(horizon):
        step = 0
        for w, s in zip(weights, strategies):
            g = s.aggregated_metrics_json.get("mean_log_growth", 0) or 0
            step += w * g
        capital *= (1 + step)
        equity.append(capital)

    combined_metrics = {
        "combined_mean_log_growth": sum(
            w * (s.aggregated_metrics_json.get("mean_log_growth", 0) or 0)
            for w, s in zip(weights, strategies)
        ),
        "combined_expectancy": sum(
            w * (s.aggregated_metrics_json.get("mean_expectancy", 0) or 0)
            for w, s in zip(weights, strategies)
        ),
    }

    portfolio.combined_metrics_json = combined_metrics
    portfolio.combined_equity_json = {"equity": equity}
    portfolio.strategy_count = len(strategies)
    portfolio.is_dirty = False

    db.commit()

    return {"status": "computed"}


@router.get("/{portfolio_id}")
def get_portfolio(
    portfolio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = get_owned_portfolio(portfolio_id, db, current_user)

    return {
        "name": portfolio.name,
        "allocation_mode": portfolio.allocation_mode,
        "allocation_config": portfolio.allocation_config_json,
        "combined_metrics": portfolio.combined_metrics_json,
        "combined_equity": portfolio.combined_equity_json,
        "strategy_count": portfolio.strategy_count,
        "is_dirty": portfolio.is_dirty,
        "updated_at": portfolio.updated_at,
    }