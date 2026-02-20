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

