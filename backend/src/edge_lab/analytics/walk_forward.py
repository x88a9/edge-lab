import numpy as np
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade
from edge_lab.analytics.metrics import MetricsEngine


class WalkForwardEngine:

    BASE_RISK_FRACTION = 0.01

    @staticmethod
    def run(
        db: Session,
        run_id,
        user_id,
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

        r_values = np.array([t.r_multiple for t in trades])
        returns = WalkForwardEngine.BASE_RISK_FRACTION * r_values

        train_size = int(len(returns) * 0.6)
        test_size = int(len(returns) * 0.4)

        if len(returns) < train_size + test_size:
            return []

        results = []
        start = 0

        while start + train_size + test_size <= len(returns):

            train_slice = returns[start:start + train_size]
            test_slice = returns[start + train_size:start + train_size + test_size]

            train_expectancy = float(np.mean(train_slice))
            test_expectancy = float(np.mean(test_slice))

            train_sharpe = float(
                MetricsEngine.sharpe(train_slice)
            ) if np.std(train_slice) > 0 else 0.0

            test_sharpe = float(
                MetricsEngine.sharpe(test_slice)
            ) if np.std(test_slice) > 0 else 0.0

            results.append({
                "train_expectancy": train_expectancy,
                "test_expectancy": test_expectancy,
                "train_sharpe": train_sharpe,
                "test_sharpe": test_sharpe,
            })

            start += test_size

        return results