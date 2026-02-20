import typer
import uuid
from sqlalchemy.orm import Session

from edge_lab.persistence.database import SessionLocal
from edge_lab.persistence.models import User, Strategy, Variant, Run, RunMetrics
from edge_lab.services.run_service import RunService
from edge_lab.analytics.variant_analyzer import VariantAnalyzer
from edge_lab.persistence.models import VariantMetrics
from edge_lab.analytics.monte_carlo import MonteCarloEngine
from edge_lab.analytics.risk_of_ruin import RiskOfRuinEngine
from edge_lab.analytics.kelly_simulation import KellySimulationEngine
from edge_lab.analytics.walk_forward import WalkForwardEngine
from edge_lab.analytics.regime_detection import RegimeDetectionEngine


app = typer.Typer(help="Edge Lab CLI")

# --------------------------------------------------
# Subcommand Groups
# --------------------------------------------------

user_app = typer.Typer(help="User management")
strategy_app = typer.Typer(help="Strategy management")
variant_app = typer.Typer(help="Variant management")
run_app = typer.Typer(help="Run management")

app.add_typer(user_app, name="user")
app.add_typer(strategy_app, name="strategy")
app.add_typer(variant_app, name="variant")
app.add_typer(run_app, name="run")


# ==================================================
# USER COMMANDS
# ==================================================

@user_app.command("create")
def create_user(email: str):
    db: Session = SessionLocal()
    try:
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created user: {user.id}")
    finally:
        db.close()


@user_app.command("list")
def list_users():
    db: Session = SessionLocal()
    try:
        users = db.query(User).all()
        for u in users:
            print(f"{u.id} | {u.email}")
    finally:
        db.close()


# ==================================================
# STRATEGY COMMANDS
# ==================================================

@strategy_app.command("create")
def create_strategy(user_id: str, name: str, asset: str):
    db: Session = SessionLocal()
    try:
        strategy = Strategy(
            user_id=uuid.UUID(user_id),
            name=name,
            asset=asset,
        )

        db.add(strategy)
        db.commit()
        db.refresh(strategy)

        print(f"Created strategy: {strategy.id}")
    finally:
        db.close()


@strategy_app.command("list")
def list_strategies():
    db: Session = SessionLocal()
    try:
        strategies = db.query(Strategy).all()

        for s in strategies:
            print(f"{s.id} | {s.name} | {s.asset}")
    finally:
        db.close()


# ==================================================
# VARIANT COMMANDS
# ==================================================

@variant_app.command("create")
def create_variant(strategy_id: str, name: str, version: int):
    db: Session = SessionLocal()
    try:
        variant = Variant(
            strategy_id=uuid.UUID(strategy_id),
            name=name,
            version_number=version,
            parameter_hash="placeholder",
            parameter_json="{}",
        )

        db.add(variant)
        db.commit()
        db.refresh(variant)

        print(f"Created variant: {variant.id}")
    finally:
        db.close()


@variant_app.command("list")
def list_variants():
    db: Session = SessionLocal()
    try:
        variants = db.query(Variant).all()

        for v in variants:
            print(f"{v.id} | {v.name} | v{v.version_number}")
    finally:
        db.close()


@variant_app.command("analyze")
def analyze_variant(variant_id: str):
    db = SessionLocal()
    try:
        result = VariantAnalyzer.analyze_variant(
            db=db,
            variant_id=uuid.UUID(variant_id),
        )

        snapshot = result["snapshot"]

        print("Variant Analysis")
        print("-----------------------------")
        print("Total Runs:", snapshot.total_runs)
        print("Mean Expectancy:", snapshot.mean_expectancy)
        print("Std Expectancy:", snapshot.std_expectancy)
        print("Mean Sharpe:", snapshot.mean_sharpe)
        print("Worst Max DD:", snapshot.worst_max_dd)

        print("\nAdvanced Statistics:")
        print("t-Statistic:", result["t_stat"])
        print("95% CI:", result["ci_lower"], "to", result["ci_upper"])
        print("P(Edge > 0):", result["prob_edge_positive"])
    finally:
        db.close()


# ==================================================
# RUN COMMANDS
# ==================================================

@run_app.command("create")
def create_run(variant_id: str, initial_capital: float):
    db: Session = SessionLocal()
    try:
        run = RunService.create_run(
            db=db,
            variant_id=uuid.UUID(variant_id),
            run_type="backtest",
            initial_capital=initial_capital,
        )

        print(f"Created run: {run.id}")
    finally:
        db.close()


@run_app.command("list")
def list_runs():
    db: Session = SessionLocal()
    try:
        runs = db.query(Run).all()

        for r in runs:
            print(
                f"{r.id} | Variant: {r.variant_id} | "
                f"Status: {r.status} | Type: {r.run_type}"
            )
    finally:
        db.close()


@run_app.command("add-trade")
def add_trade(
    run_id: str,
    entry: float,
    exit: float,
    size: float,
    direction: str,
):
    db: Session = SessionLocal()
    try:
        trade = RunService.add_trade(
            db=db,
            run_id=uuid.UUID(run_id),
            entry_price=entry,
            exit_price=exit,
            size=size,
            direction=direction,
        )

        print(f"Added trade: {trade.id}")
    finally:
        db.close()


@run_app.command("close")
def close_run(run_id: str):
    db: Session = SessionLocal()
    try:
        snapshot = RunService.close_run(
            db=db,
            run_id=uuid.UUID(run_id),
        )

        print("Run closed.")
        print(f"Expectancy: {snapshot.expectancy}")
        print(f"Win Rate: {snapshot.win_rate}")
        print(f"Sharpe: {snapshot.sharpe}")
        print(f"Volatility: {snapshot.volatility}")
        print(f"Max DD: {snapshot.max_drawdown}")
        print(f"Total Return: {snapshot.total_return}")
    finally:
        db.close()


@run_app.command("show")
def show_run(run_id: str):
    db: Session = SessionLocal()
    try:
        run = db.query(Run).filter(Run.id == uuid.UUID(run_id)).first()
        metrics = db.query(RunMetrics).filter(RunMetrics.run_id == uuid.UUID(run_id)).first()

        if not run:
            print("Run not found.")
            return

        print("--------------------------------------------------")
        print(f"Run ID: {run.id}")
        print(f"Variant: {run.variant_id}")
        print(f"Status: {run.status}")
        print(f"Type: {run.run_type}")
        print("--------------------------------------------------")

        if metrics:
            print("Metrics:")
            print(f"  Expectancy: {metrics.expectancy}")
            print(f"  Win Rate: {metrics.win_rate}")
            print(f"  Sharpe: {metrics.sharpe}")
            print(f"  Volatility: {metrics.volatility}")
            print(f"  Max DD: {metrics.max_drawdown}")
            print(f"  Total Return: {metrics.total_return}")
        else:
            print("Run not closed yet — no metrics available.")
    finally:
        db.close()


@run_app.command("monte-carlo")
def monte_carlo(run_id: str, simulations: int = 5000):
    db = SessionLocal()
    try:
        result = MonteCarloEngine.bootstrap_run(
            db=db,
            run_id=uuid.UUID(run_id),
            simulations=simulations,
        )

        print("Monte Carlo Results")
        print("-----------------------------")
        print("Mean Final Return:", result["mean_final_return"])
        print("Median Final Return:", result["median_final_return"])
        print("5% Worst Return:", result["p5_final_return"])
        print("95% Best Return:", result["p95_final_return"])
        print("")
        print("Mean Max Drawdown:", result["mean_max_dd"])
        print("Worst Case Drawdown:", result["worst_case_dd"])
        print("95% Drawdown Percentile:", result["p95_dd"])
    finally:
        db.close()


@run_app.command("risk-of-ruin")
def risk_of_ruin(
    run_id: str,
    simulations: int = 5000,
    position_fraction: float = 0.01,
    ruin_threshold: float = 0.7,
):
    db = SessionLocal()
    try:
        result = RiskOfRuinEngine.simulate(
            db=db,
            run_id=uuid.UUID(run_id),
            simulations=simulations,
            position_fraction=position_fraction,
            ruin_threshold=ruin_threshold,
        )

        print("Risk of Ruin Simulation")
        print("-----------------------------")
        print("Ruin Probability:", result["ruin_probability"])
        print("Mean Final Capital:", result["mean_final_capital"])
        print("Median Final Capital:", result["median_final_capital"])
        print("Mean Max Drawdown:", result["mean_max_drawdown"])
        print("Worst Case Drawdown:", result["worst_case_drawdown"])
    finally:
        db.close()


@run_app.command("kelly-sim")
def kelly_simulation(
    run_id: str,
    simulations: int = 3000,
    ruin_threshold: float = 0.7,
):
    db = SessionLocal()
    try:
        result = KellySimulationEngine.evaluate_fractions(
            db=db,
            run_id=uuid.UUID(run_id),
            simulations=simulations,
            ruin_threshold=ruin_threshold,
        )

        print("Kelly Simulation Results")
        print("-----------------------------")

        print("Growth Optimal Fraction:")
        print(result["growth_optimal"])

        print("\nSafe Fraction (ruin < 5%):")
        print(result["safe_fraction"])
    finally:
        db.close()


@run_app.command("walk-forward")
def walk_forward(
    run_id: str,
    train_size: int = 50,
    test_size: int = 50,
):
    db = SessionLocal()
    try:
        results = WalkForwardEngine.run(
            db=db,
            run_id=uuid.UUID(run_id),
            train_size=train_size,
            test_size=test_size,
        )

        print("Walk-Forward Results")
        print("-----------------------------")

        for i, r in enumerate(results):
            print(f"Segment {i+1}")
            print("Train Exp:", r["train_expectancy"])
            print("Test Exp:", r["test_expectancy"])
            print("Train Sharpe:", r["train_sharpe"])
            print("Test Sharpe:", r["test_sharpe"])
            print("")
    finally:
        db.close()


@run_app.command("regime-detect")
def regime_detect(
    run_id: str,
    window: int = 20,
    clusters: int = 2,
):
    db = SessionLocal()
    try:
        result = RegimeDetectionEngine.detect(
            db=db,
            run_id=uuid.UUID(run_id),
            window=window,
            clusters=clusters,
        )

        print("Regime Detection")
        print("-----------------------------")
        print("Centroids:", result["centroids"])
    finally:
        db.close()