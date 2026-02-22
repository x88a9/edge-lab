import numpy as np
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade
from edge_lab.analytics.risk_of_ruin import RiskOfRuinEngine


class KellySimulationEngine:

    BASE_RISK_FRACTION = 0.01  # must match equity model

    @staticmethod
    def evaluate_fractions(
        db: Session,
        run_id,
        user_id,
        fractions=None,
        ruin_threshold: float = 0.7,
        use_ror_constraint: bool = True,
    ):
        if fractions is None:
            fractions = np.linspace(0.0, 5.0, 50)
            # 5x of base risk (0–5% effective risk)

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

        r_values = np.array([t.r_multiple for t in trades])

        # Effective system returns
        base_returns = KellySimulationEngine.BASE_RISK_FRACTION * r_values

        results = []

        for f in fractions:

            effective_returns = f * base_returns

            if np.any(1 + effective_returns <= 0):
                continue

            mean_log_growth = float(
                np.mean(np.log(1 + effective_returns))
            )

            entry = {
                "fraction": float(f),
                "mean_log_growth": mean_log_growth,
            }

            if use_ror_constraint and f > 0:
                ror = RiskOfRuinEngine.simulate_from_returns(
                    raw_returns=base_returns,
                    simulations=1000,
                    position_fraction=float(f),
                    ruin_threshold=ruin_threshold,
                )

                entry["ruin_probability"] = ror["ruin_probability"]
                entry["mean_max_drawdown"] = ror["mean_max_drawdown"]
            else:
                entry["ruin_probability"] = None
                entry["mean_max_drawdown"] = None

            results.append(entry)

        if not results:
            raise ValueError("No valid Kelly fractions found.")

        best_growth = max(results, key=lambda x: x["mean_log_growth"])

        safe_candidates = [
            r for r in results
            if r["ruin_probability"] is not None
            and r["ruin_probability"] < 0.05
        ]

        safe_fraction = (
            max(safe_candidates, key=lambda x: x["mean_log_growth"])
            if safe_candidates
            else None
        )

        return {
            "all_results": results,
            "growth_optimal": best_growth,
            "safe_fraction": safe_fraction,
        }

    @staticmethod
    def generate_for_run(
        db: Session,
        run_id,
        user_id,
    ):
        raw_results = KellySimulationEngine.evaluate_fractions(
            db=db,
            run_id=run_id,
            user_id=user_id,
        )

        clean_results = []

        for r in raw_results["all_results"]:
            clean_results.append({
                "fraction": float(r["fraction"]),
                "mean_log_growth": float(r["mean_log_growth"]),
                "ruin_probability": (
                    float(r["ruin_probability"])
                    if r["ruin_probability"] is not None
                    else None
                ),
                "mean_max_drawdown": (
                    float(r["mean_max_drawdown"])
                    if r["mean_max_drawdown"] is not None
                    else None
                ),
            })

        return {
            "all_results": clean_results,
            "growth_optimal": raw_results["growth_optimal"],
            "safe_fraction": raw_results["safe_fraction"],
        }