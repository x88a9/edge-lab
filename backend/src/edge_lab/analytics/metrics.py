import numpy as np
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade

class MetricsEngine:

    @staticmethod
    def expectancy(raw_returns):
        wins = raw_returns[raw_returns > 0]
        losses = raw_returns[raw_returns <= 0]

        win_rate = len(wins) / len(raw_returns)

        avg_win = wins.mean() if len(wins) > 0 else 0
        avg_loss = losses.mean() if len(losses) > 0 else 0

        return win_rate * avg_win + (1 - win_rate) * avg_loss

    @staticmethod
    def sharpe(log_returns):
        mean = np.mean(log_returns)
        std = np.std(log_returns)

        if std == 0:
            return 0

        return mean / std * np.sqrt(len(log_returns))

    @staticmethod
    def volatility(log_returns):
        return np.std(log_returns)

    @staticmethod
    def volatility_drag(raw_returns, log_returns):
        arithmetic_mean = np.mean(raw_returns)
        geometric_mean = np.mean(log_returns)
        return arithmetic_mean - geometric_mean

    @staticmethod
    def generate_for_run(db: Session, run_id):
        trades = (
            db.query(Trade)
            .filter(Trade.run_id == run_id)
            .all()
        )

        if not trades:
            raise ValueError("No trades found for run.")

        raw_returns = np.array([t.raw_return for t in trades])
        log_returns = np.array([t.log_return for t in trades])

        expectancy = MetricsEngine.expectancy(raw_returns)
        sharpe = MetricsEngine.sharpe(log_returns)
        volatility = MetricsEngine.volatility(log_returns)
        vol_drag = MetricsEngine.volatility_drag(raw_returns, log_returns)

        total_return = np.sum(raw_returns)

        return {
            "expectancy": float(expectancy),
            "sharpe": float(sharpe),
            "volatility": float(volatility),
            "volatility_drag": float(vol_drag),
            "total_return": float(total_return),
        }
