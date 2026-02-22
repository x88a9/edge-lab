import numpy as np
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade


class RiskOfRuinEngine:

    @staticmethod
    def simulate_from_returns(
        raw_returns: np.ndarray,
        simulations: int = 10000,
        position_fraction: float = 0.01,
        ruin_threshold: float = 0.7,
        max_trades: int = 500,
    ):
        """
        Fully vectorized simulation.
        """

        if raw_returns.size == 0:
            raise ValueError("No returns provided.")

        # Draw random trade sequences
        choices = np.random.choice(
            raw_returns,
            size=(simulations, max_trades),
            replace=True,
        )

        # Apply position sizing
        trade_returns = position_fraction * choices

        # Compute capital paths
        capital_paths = np.cumprod(1 + trade_returns, axis=1)

        # Detect ruin
        ruin_events = capital_paths <= ruin_threshold
        ruined = np.any(ruin_events, axis=1)
        ruin_probability = np.mean(ruined)

        # Final capital
        final_capitals = capital_paths[:, -1]

        # Drawdown calculation
        peaks = np.maximum.accumulate(capital_paths, axis=1)
        drawdowns = capital_paths / peaks - 1
        max_drawdowns = np.min(drawdowns, axis=1)

        return {
            "ruin_probability": float(ruin_probability),
            "mean_final_capital": float(np.mean(final_capitals)),
            "median_final_capital": float(np.median(final_capitals)),
            "mean_max_drawdown": float(np.mean(max_drawdowns)),
            "worst_case_drawdown": float(np.min(max_drawdowns)),
        }

    @staticmethod
    def simulate(
        db: Session,
        run_id,
        user_id,
        simulations: int = 10000,
        position_fraction: float = 0.01,
        ruin_threshold: float = 0.7,
        max_trades: int = 500,
    ):
        """
        Wrapper that loads trades once.
        """

        trades = (
            db.query(Trade)
            .filter(
                Trade.run_id == run_id,
                Trade.user_id == user_id,
            )
            .all()
        )

        if not trades:
            raise ValueError("No trades found for run.")

        raw_returns = np.array([t.raw_return for t in trades])

        return RiskOfRuinEngine.simulate_from_returns(
            raw_returns=raw_returns,
            simulations=simulations,
            position_fraction=position_fraction,
            ruin_threshold=ruin_threshold,
            max_trades=max_trades,
        )