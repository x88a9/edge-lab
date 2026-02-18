import numpy as np
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade


class RiskOfRuinEngine:

    @staticmethod
    def simulate(
        db: Session,
        run_id,
        simulations: int = 10000,
        position_fraction: float = 0.01,
        ruin_threshold: float = 0.7,
        max_trades: int = 500,
    ):
        """
        position_fraction: fraction of capital risked per trade (e.g. 0.01 = 1%)
        ruin_threshold: capital level considered ruin (e.g. 0.7 = -30%)
        """

        trades = (
            db.query(Trade)
            .filter(Trade.run_id == run_id)
            .all()
        )

        if not trades:
            raise ValueError("No trades found for run.")

        raw_returns = np.array([t.raw_return for t in trades])

        ruin_count = 0
        final_capitals = []
        max_drawdowns = []

        for _ in range(simulations):

            capital = 1.0
            peak = 1.0
            max_dd = 0.0

            for _ in range(max_trades):

                r = np.random.choice(raw_returns)

                trade_return = position_fraction * r
                capital *= (1 + trade_return)

                peak = max(peak, capital)
                dd = capital / peak - 1
                max_dd = min(max_dd, dd)

                if capital <= ruin_threshold:
                    ruin_count += 1
                    break

            final_capitals.append(capital)
            max_drawdowns.append(max_dd)

        ruin_probability = ruin_count / simulations

        return {
            "ruin_probability": float(ruin_probability),
            "mean_final_capital": float(np.mean(final_capitals)),
            "median_final_capital": float(np.median(final_capitals)),
            "mean_max_drawdown": float(np.mean(max_drawdowns)),
            "worst_case_drawdown": float(np.min(max_drawdowns)),
        }
