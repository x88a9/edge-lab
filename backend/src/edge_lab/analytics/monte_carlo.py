import numpy as np
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade


class MonteCarloEngine:

    @staticmethod
    def bootstrap_run(
        db: Session,
        run_id,
        user_id,
        simulations: int = 10000,
    ):
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

        log_returns = np.array([t.log_return for t in trades])
        n = len(log_returns)

        final_returns = []
        max_drawdowns = []

        for _ in range(simulations):

            sample = np.random.choice(log_returns, size=n, replace=True)

            cumulative_log = np.cumsum(sample)
            equity = np.exp(cumulative_log)

            final_return = equity[-1] - 1

            peak = np.maximum.accumulate(equity)
            drawdown = equity / peak - 1
            max_dd = np.min(drawdown)

            final_returns.append(final_return)
            max_drawdowns.append(max_dd)

        final_returns = np.array(final_returns)
        max_drawdowns = np.array(max_drawdowns)

        return {
            "mean_final_return": float(np.mean(final_returns)),
            "median_final_return": float(np.median(final_returns)),
            "p5_final_return": float(np.percentile(final_returns, 5)),
            "p95_final_return": float(np.percentile(final_returns, 95)),
            "mean_max_dd": float(np.mean(max_drawdowns)),
            "worst_case_dd": float(np.min(max_drawdowns)),
            "p95_dd": float(np.percentile(max_drawdowns, 95)),
        }