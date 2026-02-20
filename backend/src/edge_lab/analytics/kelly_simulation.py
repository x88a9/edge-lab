import numpy as np
from sqlalchemy.orm import Session
from edge_lab.analytics.risk_of_ruin import RiskOfRuinEngine


class KellySimulationEngine:

    @staticmethod
    def evaluate_fractions(
        db: Session,
        run_id,
        user_id,
        fractions=None,
        simulations: int = 5000,
        ruin_threshold: float = 0.7,
    ):
        if fractions is None:
            fractions = np.linspace(0.005, 0.2, 20)

        results = []

        for f in fractions:

            result = RiskOfRuinEngine.simulate(
                db=db,
                run_id=run_id,
                user_id=user_id,
                simulations=simulations,
                position_fraction=float(f),
                ruin_threshold=ruin_threshold,
            )

            results.append({
                "fraction": float(f),
                "mean_final_capital": result["mean_final_capital"],
                "ruin_probability": result["ruin_probability"],
                "mean_max_drawdown": result["mean_max_drawdown"],
            })

        best_growth = max(results, key=lambda x: x["mean_final_capital"])

        safe_candidates = [
            r for r in results if r["ruin_probability"] < 0.05
        ]

        safe_fraction = max(
            safe_candidates,
            key=lambda x: x["mean_final_capital"],
            default=None
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
                "mean_final_capital": float(r["mean_final_capital"]),
                "ruin_probability": float(r["ruin_probability"]),
                "mean_max_drawdown": float(r["mean_max_drawdown"]),
            })

        best_growth = raw_results["growth_optimal"]
        safe_fraction = raw_results["safe_fraction"]

        return {
            "all_results": clean_results,
            "growth_optimal": best_growth,
            "safe_fraction": safe_fraction,
        }