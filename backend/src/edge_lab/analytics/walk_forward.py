import numpy as np
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade
from edge_lab.analytics.metrics import MetricsEngine


class WalkForwardEngine:

    @staticmethod
    def run(
        db: Session,
        run_id,
        user_id,
        train_size: int = 10,
        test_size: int = 10,
    ):

        trades = (
            db.query(Trade)
            .filter(
                Trade.run_id == run_id,
                Trade.user_id == user_id,
            )
            .order_by(Trade.created_at)
            .all()
        )

        if not trades:
            return []

        train_size = int(len(trades) * 0.6)
        test_size = int(len(trades) * 0.4)

        if len(trades) < train_size + test_size:
            return []

        log_returns = np.array([t.log_return for t in trades])
        raw_returns = np.exp(log_returns) - 1

        results = []
        start = 0

        while start + train_size + test_size <= len(trades):

            train_slice = raw_returns[start:start + train_size]
            test_slice = raw_returns[start + train_size:start + train_size + test_size]

            train_expectancy = float(np.mean(train_slice))
            test_expectancy = float(np.mean(test_slice))

            train_sharpe = float(
                MetricsEngine.sharpe(np.log(1 + train_slice))
            )
            test_sharpe = float(
                MetricsEngine.sharpe(np.log(1 + test_slice))
            )

            results.append({
                "train_expectancy": train_expectancy,
                "test_expectancy": test_expectancy,
                "train_sharpe": train_sharpe,
                "test_sharpe": test_sharpe,
            })

            start += test_size

        return results