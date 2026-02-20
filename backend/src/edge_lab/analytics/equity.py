import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade


class EquityBuilder:

    @staticmethod
    def build_equity_series(db: Session, run_id):
        trades = (
            db.query(Trade)
            .filter(Trade.run_id == run_id)
            .order_by(Trade.created_at)
            .all()
        )

        if not trades:
            raise ValueError("No trades found for run.")

        log_returns = np.array([t.log_return for t in trades])

        cumulative_log = np.cumsum(log_returns)

        equity = np.exp(cumulative_log)

        df = pd.DataFrame({
            "log_return": log_returns,
            "cumulative_log": cumulative_log,
            "equity": equity,
        })

        df["peak"] = df["equity"].cummax()
        df["drawdown"] = df["equity"] / df["peak"] - 1

        return df

    @router.get("/{run_id}/equity")
    def equity_curve(run_id: str):
        db = SessionLocal()
        try:
            trades = db.query(Trade).filter_by(
                run_id=uuid.UUID(run_id)
            ).all()

            if not trades:
                return {"equity": [], "drawdown": []}

            r_values = np.array([t.r_multiple for t in trades if t.r_multiple is not None])

            risk_fraction = 0.01
            equity = 1.0
            equity_curve = []

            for r in r_values:
                equity *= (1 + r * risk_fraction)
                equity_curve.append(float(equity))

            equity_series = np.array(equity_curve)
            peak = np.maximum.accumulate(equity_series)
            drawdown = ((equity_series - peak) / peak).tolist()

            return {
                "equity": equity_curve,
                "drawdown": drawdown
            }

        finally:
            db.close()