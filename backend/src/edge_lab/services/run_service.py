import uuid
import math
import numpy as np
from sqlalchemy.orm import Session

from edge_lab.persistence.models import Run, Trade, RunMetrics
from edge_lab.analytics.equity import EquityBuilder
from edge_lab.analytics.metrics import MetricsEngine


class RunService:

    # -----------------------------
    # CREATE RUN
    # -----------------------------
    @staticmethod
    def create_run(
        db: Session,
        variant_id: uuid.UUID,
        run_type: str,
        initial_capital: float,
        trade_limit: int = 100,
    ) -> Run:

        run = Run(
            variant_id=variant_id,
            run_type=run_type,
            initial_capital=initial_capital,
            trade_limit=trade_limit,
        )

        db.add(run)
        db.commit()
        db.refresh(run)
        return run

    # -----------------------------
    # ADD TRADE
    # -----------------------------
    @staticmethod
    def add_trade(
        db: Session,
        run_id: uuid.UUID,
        entry_price: float,
        exit_price: float,
        size: float,
        direction: str,
    ) -> Trade:


        run = db.query(Run).filter(Run.id == run_id).first()

        if not run:
            raise ValueError("Run not found.")

        if run.status != "open":
            raise ValueError("Cannot add trade to closed run.")

        trade_count = db.query(Trade).filter(Trade.run_id == run_id).count()

        if trade_count >= run.trade_limit:
            raise ValueError("Trade limit reached for this run.")

        if direction not in ["long", "short"]:
            raise ValueError("direction must be 'long' or 'short'")

        raw_return = (
            (exit_price - entry_price) / entry_price
            if direction == "long"
            else (entry_price - exit_price) / entry_price
        )

        # Guard against invalid values
        if raw_return <= -1:
            raise ValueError("Return <= -100% is not valid.")

        log_return = math.log(1 + raw_return)

        trade = Trade(
            run_id=run_id,
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

        return trade

    # -----------------------------
    # CLOSE RUN
    # -----------------------------
    @staticmethod
    def close_run(db: Session, run_id: uuid.UUID) -> RunMetrics:

        run = db.query(Run).filter(Run.id == run_id).first()

        if not run:
            raise ValueError("Run not found.")

        existing_snapshot = (
            db.query(RunMetrics)
            .filter(RunMetrics.run_id == run_id)
            .first()
        )

        if existing_snapshot:
            return existing_snapshot

        df = EquityBuilder.build_equity_series(db, run_id)

        log_returns = df["log_return"].values
        raw_returns = np.exp(log_returns) - 1

        expectancy = float(MetricsEngine.expectancy(raw_returns))
        sharpe = float(MetricsEngine.sharpe(log_returns))
        volatility = float(MetricsEngine.volatility(log_returns))

        win_rate = float(np.mean(raw_returns > 0))
        max_drawdown = float(df["drawdown"].min())
        total_return = float(df["equity"].iloc[-1] - 1)

        snapshot = RunMetrics(
            run_id=run_id,
            expectancy=expectancy,
            win_rate=win_rate,
            sharpe=sharpe,
            volatility=volatility,
            max_drawdown=max_drawdown,
            total_return=total_return,
        )

        run.status = "closed"

        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

        return snapshot
