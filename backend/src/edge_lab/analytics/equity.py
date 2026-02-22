import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade


class EquityBuilder:

    BASE_RISK_FRACTION = 0.01  # must match Kelly + RuR

    @staticmethod
    def build_equity_series(
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
            raise ValueError("No trades found for run.")

        r_values = np.array([t.r_multiple for t in trades])

        returns = EquityBuilder.BASE_RISK_FRACTION * r_values

        cumulative_log = np.cumsum(np.log(1 + returns))
        equity = np.exp(cumulative_log)

        df = pd.DataFrame({
            "strategy_return": returns,
            "equity": equity,
        })

        df["peak"] = df["equity"].cummax()
        df["drawdown"] = df["equity"] / df["peak"] - 1

        return df