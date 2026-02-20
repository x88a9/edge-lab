import numpy as np
from scipy import stats
from sqlalchemy.orm import Session

from edge_lab.persistence.models import Run, RunMetrics, VariantMetrics


class VariantAnalyzer:

    @staticmethod
    def analyze_variant(
        db: Session,
        variant_id,
        user_id,
    ):

        runs = (
            db.query(Run)
            .filter(
                Run.variant_id == variant_id,
                Run.user_id == user_id,
            )
            .all()
        )

        if not runs:
            raise ValueError("No runs found for variant.")

        run_ids = [r.id for r in runs]

        metrics = (
            db.query(RunMetrics)
            .filter(
                RunMetrics.run_id.in_(run_ids),
                RunMetrics.user_id == user_id,
            )
            .all()
        )

        if not metrics:
            raise ValueError("No closed runs with metrics found.")

        expectancies = np.array([m.expectancy for m in metrics])
        sharpes = np.array([m.sharpe for m in metrics])
        win_rates = np.array([m.win_rate for m in metrics])
        volatilities = np.array([m.volatility for m in metrics])
        max_dds = np.array([m.max_drawdown for m in metrics])

        n = len(expectancies)

        mean_expectancy = float(np.mean(expectancies))
        std_expectancy = float(np.std(expectancies, ddof=1)) if n > 1 else 0.0

        mean_sharpe = float(np.mean(sharpes))
        std_sharpe = float(np.std(sharpes, ddof=1)) if n > 1 else 0.0

        mean_win_rate = float(np.mean(win_rates))
        mean_volatility = float(np.mean(volatilities))
        worst_max_dd = float(np.min(max_dds))

        if n > 1 and std_expectancy > 0:
            standard_error = std_expectancy / np.sqrt(n)

            t_stat = float(mean_expectancy / standard_error)

            df = n - 1
            t_critical = stats.t.ppf(0.975, df)
            ci_lower = float(mean_expectancy - t_critical * standard_error)
            ci_upper = float(mean_expectancy + t_critical * standard_error)

            prob_edge_positive = float(
                1 - stats.t.cdf((0 - mean_expectancy) / standard_error, df)
            )
        else:
            t_stat = None
            ci_lower = None
            ci_upper = None
            prob_edge_positive = None

        snapshot = VariantMetrics(
            user_id=user_id,
            variant_id=variant_id,
            total_runs=n,
            mean_expectancy=mean_expectancy,
            std_expectancy=std_expectancy,
            mean_sharpe=mean_sharpe,
            std_sharpe=std_sharpe,
            mean_win_rate=mean_win_rate,
            mean_volatility=mean_volatility,
            worst_max_dd=worst_max_dd,
            stability_score=None,
        )

        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

        return {
            "snapshot": snapshot,
            "t_stat": t_stat,
            "ci_lower": ci_lower,
            "ci_upper": ci_upper,
            "prob_edge_positive": prob_edge_positive,
        }