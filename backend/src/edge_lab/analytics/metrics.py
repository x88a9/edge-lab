import numpy as np
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade
import uuid

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
    def generate_for_run(db: Session, run_id: uuid.UUID):

        trades = (
            db.query(Trade)
            .filter(Trade.run_id == run_id)
            .order_by(Trade.timestamp.asc())
            .all()
        )

        if not trades:
            raise ValueError("No trades found.")

        r_values = np.array([t.r_multiple for t in trades if t.r_multiple is not None])

        total_trades = len(r_values)
        wins = np.sum(r_values > 0)
        losses = np.sum(r_values <= 0)

        win_rate = wins / total_trades

        total_R = np.sum(r_values)
        avg_R = np.mean(r_values)

        win_r = r_values[r_values > 0]
        loss_r = r_values[r_values <= 0]

        avg_win_R = np.mean(win_r) if len(win_r) > 0 else 0
        avg_loss_R = np.mean(loss_r) if len(loss_r) > 0 else 0

        expectancy = win_rate * avg_win_R + (1 - win_rate) * avg_loss_R

        # R-volatility
        volatility_R = np.std(r_values)

        # Kelly
        if avg_loss_R != 0:
            b = avg_win_R / abs(avg_loss_R)
            kelly_f = (win_rate * b - (1 - win_rate)) / b
        else:
            kelly_f = 0

        # Log growth (f=1)
       # Safe log growth (exclude r <= -1)
        safe_r = r_values[r_values > -1]

        if len(safe_r) > 0:
            log_growth = float(np.mean(np.log1p(safe_r)))
        else:
            log_growth = 0.0


        # Max drawdown (R cumulative)
        cumulative = np.cumsum(r_values)
        peak = np.maximum.accumulate(cumulative)
        drawdown = cumulative - peak
        max_dd = np.min(drawdown)
        def safe(x):
            if np.isnan(x) or np.isinf(x):
                return 0.0
            return float(x)

        return {
            "total_trades": int(total_trades),
            "wins": int(wins),
            "losses": int(losses),
            "win_rate": round(safe(win_rate), 4),
            "total_R": round(safe(total_R), 4),
            "avg_R": round(safe(avg_R), 4),
            "avg_win_R": round(safe(avg_win_R), 4),
            "avg_loss_R": round(safe(avg_loss_R), 4),
            "expectancy_R": round(safe(expectancy), 4),
            "volatility_R": round(safe(volatility_R), 4),
            "kelly_f": round(safe(kelly_f), 4),
            "log_growth": round(safe(log_growth), 6),
            "max_drawdown_R": round(safe(max_dd), 4),
        }