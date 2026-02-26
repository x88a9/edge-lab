from fastapi import HTTPException
from sqlalchemy.orm import Session
import uuid
import statistics

from edge_lab.persistence.models import (
    User,
    Run,
    RunAnalytics,
    Variant,
    VariantAnalytics,
    Strategy,
    StrategyAnalytics,
    Portfolio,
    PortfolioAnalytics,
)

from edge_lab.analytics.metrics import MetricsEngine
from edge_lab.analytics.equity import EquityBuilder
from edge_lab.analytics.monte_carlo import MonteCarloEngine
from edge_lab.analytics.risk_of_ruin import RiskOfRuinEngine
from edge_lab.analytics.walk_forward import WalkForwardEngine
from edge_lab.analytics.regime_detection import RegimeDetectionEngine
from edge_lab.analytics.kelly_simulation import KellySimulationEngine
from edge_lab.services.dirty_propagation import DirtyPropagationService


class HierarchyComputeService:
    @staticmethod
    def _get_owned_run(run_id: str, db: Session, current_user: User) -> Run:
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

    @staticmethod
    def _get_owned_variant(variant_id: str, db: Session, current_user: User) -> Variant:
        variant = (
            db.query(Variant)
            .filter(
                Variant.id == uuid.UUID(variant_id),
                Variant.user_id == current_user.id,
            )
            .first()
        )
        if not variant:
            raise HTTPException(status_code=404, detail="Variant not found.")
        return variant

    @staticmethod
    def _get_owned_strategy(strategy_id: str, db: Session, current_user: User) -> Strategy:
        strategy = (
            db.query(Strategy)
            .filter(
                Strategy.id == uuid.UUID(strategy_id),
                Strategy.user_id == current_user.id,
            )
            .first()
        )
        if not strategy:
            raise HTTPException(status_code=404, detail="System not found.")
        return strategy

    @staticmethod
    def _get_owned_portfolio(portfolio_id: str, db: Session, current_user: User) -> Portfolio:
        portfolio = (
            db.query(Portfolio)
            .filter(
                Portfolio.id == uuid.UUID(portfolio_id),
                Portfolio.user_id == current_user.id,
            )
            .first()
        )
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found.")
        return portfolio

    @staticmethod
    def compute_run(run_id: str, db: Session, current_user: User) -> RunAnalytics:
        run = HierarchyComputeService._get_owned_run(run_id, db, current_user)

        snapshot = (
            db.query(RunAnalytics)
            .filter(
                RunAnalytics.user_id == current_user.id,
                RunAnalytics.run_id == run.id,
            )
            .first()
        )
        if snapshot and snapshot.is_dirty is False:
            return snapshot

        metrics = MetricsEngine.generate_for_run(
            db=db,
            run_id=run.id,
            user_id=current_user.id,
        )

        equity_df = EquityBuilder.build_equity_series(
            db=db,
            run_id=run.id,
            user_id=current_user.id,
        )
        equity = {
            "equity": equity_df["equity"].tolist(),
            "drawdown": equity_df["drawdown"].tolist(),
        }

        walk_forward = WalkForwardEngine.run(
            db=db,
            run_id=run.id,
            user_id=current_user.id,
        )

        monte_carlo = MonteCarloEngine.bootstrap_run(
            db=db,
            run_id=run.id,
            user_id=current_user.id,
            simulations=3000,
        )

        risk_of_ruin = RiskOfRuinEngine.simulate(
            db=db,
            run_id=run.id,
            user_id=current_user.id,
            simulations=3000,
            position_fraction=0.01,
            ruin_threshold=0.7,
        )

        regime = RegimeDetectionEngine.detect(
            db=db,
            run_id=run.id,
            user_id=current_user.id,
        )

        kelly = KellySimulationEngine.generate_for_run(
            db=db,
            run_id=run.id,
            user_id=current_user.id,
        )

        existing = (
            db.query(RunAnalytics)
            .filter(
                RunAnalytics.user_id == current_user.id,
                RunAnalytics.run_id == run.id,
            )
            .first()
        )

        if existing:
            existing.metrics_json = metrics
            existing.equity_json = equity
            existing.walk_forward_json = walk_forward
            existing.monte_carlo_json = monte_carlo
            existing.risk_of_ruin_json = risk_of_ruin
            existing.regime_json = regime
            existing.kelly_json = kelly
            existing.is_dirty = False
            snapshot = existing
        else:
            snapshot = RunAnalytics(
                user_id=current_user.id,
                run_id=run.id,
                metrics_json=metrics,
                equity_json=equity,
                walk_forward_json=walk_forward,
                monte_carlo_json=monte_carlo,
                risk_of_ruin_json=risk_of_ruin,
                regime_json=regime,
                kelly_json=kelly,
                is_dirty=False,
            )
            db.add(snapshot)

        db.commit()

        DirtyPropagationService.from_run(
            db,
            current_user.id,
            run.variant_id,
        )

        db.commit()

        return snapshot

    @staticmethod
    def compute_variant(variant_id: str, db: Session, current_user: User) -> VariantAnalytics:
        variant = HierarchyComputeService._get_owned_variant(variant_id, db, current_user)

        snapshot = (
            db.query(VariantAnalytics)
            .filter(
                VariantAnalytics.user_id == current_user.id,
                VariantAnalytics.variant_id == variant.id,
            )
            .first()
        )
        if snapshot and snapshot.is_dirty is False:
            return snapshot

        runs = (
            db.query(Run)
            .filter(
                Run.variant_id == variant.id,
                Run.user_id == current_user.id,
            )
            .all()
        )

        for r in runs:
            r_snapshot = (
                db.query(RunAnalytics)
                .filter(
                    RunAnalytics.user_id == current_user.id,
                    RunAnalytics.run_id == r.id,
                )
                .first()
            )
            if r_snapshot is None or r_snapshot.is_dirty:
                HierarchyComputeService.compute_run(str(r.id), db, current_user)

        run_snapshots = (
            db.query(RunAnalytics)
            .join(Run, RunAnalytics.run_id == Run.id)
            .filter(
                Run.user_id == current_user.id,
                Run.variant_id == variant.id,
                RunAnalytics.is_dirty == False,
            )
            .all()
        )

        if not run_snapshots:
            raise HTTPException(
                status_code=400,
                detail="No valid run analytics snapshots available.",
            )

        expectancies = []
        log_growths = []
        sharpes = []
        max_drawdowns = []

        for s in run_snapshots:
            metrics = s.metrics_json or {}
            e = metrics.get("expectancy_R")
            g = metrics.get("log_growth")
            sh = metrics.get("sharpe")
            d = metrics.get("max_drawdown_R")
            if e is not None:
                expectancies.append(e)
            if g is not None:
                log_growths.append(g)
            if sh is not None:
                sharpes.append(sh)
            if d is not None:
                max_drawdowns.append(d)

        if not expectancies:
            raise HTTPException(
                status_code=400,
                detail="No valid expectancy values to aggregate.",
            )

        aggregated = {
            "mean_expectancy": statistics.mean(expectancies),
            "mean_log_growth": statistics.mean(log_growths) if log_growths else None,
            "mean_sharpe": statistics.mean(sharpes) if sharpes else None,
            "mean_max_drawdown": statistics.mean(max_drawdowns) if max_drawdowns else None,
            "std_expectancy": statistics.pstdev(expectancies) if len(expectancies) > 1 else 0.0,
            "best_run_expectancy": max(expectancies),
            "worst_run_expectancy": min(expectancies),
        }

        existing = (
            db.query(VariantAnalytics)
            .filter(
                VariantAnalytics.user_id == current_user.id,
                VariantAnalytics.variant_id == variant.id,
            )
            .first()
        )

        if existing:
            existing.aggregated_metrics_json = aggregated
            existing.run_count = len(run_snapshots)
            existing.is_dirty = False
            snapshot = existing
        else:
            snapshot = VariantAnalytics(
                user_id=current_user.id,
                variant_id=variant.id,
                aggregated_metrics_json=aggregated,
                run_count=len(run_snapshots),
                is_dirty=False,
            )
            db.add(snapshot)

        db.commit()

        DirtyPropagationService.from_variant(
            db,
            current_user.id,
            variant.id,
        )

        db.commit()

        return snapshot

    @staticmethod
    def compute_strategy(strategy_id: str, db: Session, current_user: User) -> StrategyAnalytics:
        strategy = HierarchyComputeService._get_owned_strategy(strategy_id, db, current_user)

        snapshot = (
            db.query(StrategyAnalytics)
            .filter(
                StrategyAnalytics.user_id == current_user.id,
                StrategyAnalytics.strategy_id == strategy.id,
            )
            .first()
        )
        if snapshot and snapshot.is_dirty is False:
            return snapshot

        variants = (
            db.query(Variant)
            .filter(
                Variant.user_id == current_user.id,
                Variant.strategy_id == strategy.id,
            )
            .all()
        )

        for v in variants:
            v_snapshot = (
                db.query(VariantAnalytics)
                .filter(
                    VariantAnalytics.user_id == current_user.id,
                    VariantAnalytics.variant_id == v.id,
                )
                .first()
            )
            if v_snapshot is None or v_snapshot.is_dirty:
                HierarchyComputeService.compute_variant(str(v.id), db, current_user)

        variant_snapshots = (
            db.query(VariantAnalytics)
            .join(Variant, VariantAnalytics.variant_id == Variant.id)
            .filter(
                Variant.user_id == current_user.id,
                Variant.strategy_id == strategy.id,
                VariantAnalytics.is_dirty == False,
            )
            .all()
        )

        if not variant_snapshots:
            raise HTTPException(status_code=400, detail="No valid variant analytics.")

        expectancies = []
        log_growths = []

        for s in variant_snapshots:
            metrics = s.aggregated_metrics_json or {}
            e = metrics.get("mean_expectancy")
            g = metrics.get("mean_log_growth")
            if e is not None:
                expectancies.append(e)
            if g is not None:
                log_growths.append(g)

        if not expectancies:
            raise HTTPException(status_code=400, detail="No valid values to aggregate.")

        aggregated = {
            "mean_expectancy": statistics.mean(expectancies),
            "mean_log_growth": statistics.mean(log_growths) if log_growths else None,
        }

        existing = (
            db.query(StrategyAnalytics)
            .filter(
                StrategyAnalytics.user_id == current_user.id,
                StrategyAnalytics.strategy_id == strategy.id,
            )
            .first()
        )

        if existing:
            existing.aggregated_metrics_json = aggregated
            existing.variant_count = len(variant_snapshots)
            existing.is_dirty = False
            snapshot = existing
        else:
            snapshot = StrategyAnalytics(
                user_id=current_user.id,
                strategy_id=strategy.id,
                aggregated_metrics_json=aggregated,
                variant_count=len(variant_snapshots),
                is_dirty=False,
            )
            db.add(snapshot)

        db.commit()

        DirtyPropagationService.from_strategy(
            db,
            current_user.id,
            strategy.id,
        )

        db.commit()

        return snapshot

    @staticmethod
    def compute_portfolio(portfolio_id: str, db: Session, current_user: User) -> PortfolioAnalytics:
        portfolio = HierarchyComputeService._get_owned_portfolio(portfolio_id, db, current_user)

        if portfolio.is_dirty is False:
            snapshot = (
                db.query(PortfolioAnalytics)
                .filter(
                    PortfolioAnalytics.user_id == current_user.id,
                    PortfolioAnalytics.id == portfolio.id,
                )
                .first()
            )
            if snapshot:
                return snapshot

        strategies = (
            db.query(Strategy)
            .filter(
                Strategy.user_id == current_user.id,
                Strategy.portfolio_id == portfolio.id,
            )
            .all()
        )

        for s in strategies:
            s_snapshot = (
                db.query(StrategyAnalytics)
                .filter(
                    StrategyAnalytics.user_id == current_user.id,
                    StrategyAnalytics.strategy_id == s.id,
                )
                .first()
            )
            if s_snapshot is None or s_snapshot.is_dirty:
                HierarchyComputeService.compute_strategy(str(s.id), db, current_user)

        strategy_snapshots = (
            db.query(StrategyAnalytics)
            .join(Strategy, Strategy.id == StrategyAnalytics.strategy_id)
            .filter(
                StrategyAnalytics.user_id == current_user.id,
                StrategyAnalytics.is_dirty == False,
                Strategy.portfolio_id == portfolio.id,
            )
            .all()
        )

        if not strategy_snapshots:
            raise HTTPException(status_code=400, detail="No strategy analytics available.")

        weights = [1 / len(strategy_snapshots)] * len(strategy_snapshots)

        horizon = 50
        capital = 1
        equity = []

        for _ in range(horizon):
            step = 0
            for w, s in zip(weights, strategy_snapshots):
                g = s.aggregated_metrics_json.get("mean_log_growth", 0) or 0
                step += w * g
            capital *= (1 + step)
            equity.append(capital)

        combined_metrics = {
            "combined_mean_log_growth": sum(
                w * (s.aggregated_metrics_json.get("mean_log_growth", 0) or 0)
                for w, s in zip(weights, strategy_snapshots)
            ),
            "combined_expectancy": sum(
                w * (s.aggregated_metrics_json.get("mean_expectancy", 0) or 0)
                for w, s in zip(weights, strategy_snapshots)
            ),
        }

        snapshot = (
            db.query(PortfolioAnalytics)
            .filter(
                PortfolioAnalytics.user_id == current_user.id,
                PortfolioAnalytics.id == portfolio.id,
            )
            .first()
        )

        if snapshot:
            snapshot.combined_metrics_json = combined_metrics
            snapshot.combined_equity_json = {"equity": equity}
            snapshot.strategy_count = len(strategy_snapshots)
            snapshot.is_dirty = False
        else:
            snapshot = PortfolioAnalytics(
                id=portfolio.id,
                user_id=current_user.id,
                name=portfolio.name,
                allocation_mode="equal_weight",
                allocation_config_json=None,
                combined_metrics_json=combined_metrics,
                combined_equity_json={"equity": equity},
                strategy_count=len(strategy_snapshots),
                is_dirty=False,
            )
            db.add(snapshot)

        portfolio.is_dirty = False

        db.commit()

        return snapshot
