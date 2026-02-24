from sqlalchemy.orm import Session
from edge_lab.persistence.models import (
    Variant,
    VariantAnalytics,
    StrategyAnalytics,
    Portfolio,
)

class DirtyPropagationService:

    @staticmethod
    def from_run(db: Session, user_id, variant_id):
        # Variant dirty
        variant_snapshot = (
            db.query(VariantAnalytics)
            .filter_by(user_id=user_id, variant_id=variant_id)
            .first()
        )
        if variant_snapshot:
            variant_snapshot.is_dirty = True

        # propagate upward
        DirtyPropagationService.from_variant(db, user_id, variant_id)

    @staticmethod
    def from_variant(db: Session, user_id, variant_id):

        variant = (
            db.query(Variant)
            .filter_by(id=variant_id, user_id=user_id)
            .first()
        )
        if not variant:
            return

        # Strategy dirty
        strategy_snapshot = (
            db.query(StrategyAnalytics)
            .filter_by(
                user_id=user_id,
                strategy_id=variant.strategy_id
            )
            .first()
        )
        if strategy_snapshot:
            strategy_snapshot.is_dirty = True

        # Portfolio dirty (strategy scoped)
        DirtyPropagationService.from_strategy(
            db,
            user_id,
            variant.strategy_id
        )

    @staticmethod
    def from_strategy(db: Session, user_id, strategy_id):

        # find portfolio of this strategy
        from edge_lab.persistence.models import Strategy

        strategy = (
            db.query(Strategy)
            .filter_by(id=strategy_id, user_id=user_id)
            .first()
        )
        if not strategy:
            return

        portfolio = (
            db.query(Portfolio)
            .filter_by(id=strategy.portfolio_id, user_id=user_id)
            .first()
        )

        if portfolio:
            portfolio.is_dirty = True