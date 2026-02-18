import typer
import uuid
from sqlalchemy.orm import Session

from edge_lab.persistence.database import SessionLocal
from edge_lab.persistence.models import User, Strategy, Variant, Run, RunMetrics
from edge_lab.services.run_service import RunService

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
    user = User(email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"Created user: {user.id}")


@user_app.command("list")
def list_users():
    db: Session = SessionLocal()
    users = db.query(User).all()
    for u in users:
        print(f"{u.id} | {u.email}")


# ==================================================
# STRATEGY COMMANDS
# ==================================================

@strategy_app.command("create")
def create_strategy(user_id: str, name: str, asset: str):
    db: Session = SessionLocal()

    strategy = Strategy(
        user_id=uuid.UUID(user_id),
        name=name,
        asset=asset,
    )

    db.add(strategy)
    db.commit()
    db.refresh(strategy)

    print(f"Created strategy: {strategy.id}")


@strategy_app.command("list")
def list_strategies():
    db: Session = SessionLocal()
    strategies = db.query(Strategy).all()

    for s in strategies:
        print(f"{s.id} | {s.name} | {s.asset}")


# ==================================================
# VARIANT COMMANDS
# ==================================================

@variant_app.command("create")
def create_variant(strategy_id: str, name: str, version: int):
    db: Session = SessionLocal()

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


@variant_app.command("list")
def list_variants():
    db: Session = SessionLocal()
    variants = db.query(Variant).all()

    for v in variants:
        print(f"{v.id} | {v.name} | v{v.version_number}")


# ==================================================
# RUN COMMANDS
# ==================================================

@run_app.command("create")
def create_run(variant_id: str, initial_capital: float):
    db: Session = SessionLocal()

    run = RunService.create_run(
        db=db,
        variant_id=uuid.UUID(variant_id),
        run_type="backtest",
        initial_capital=initial_capital,
    )

    print(f"Created run: {run.id}")


@run_app.command("list")
def list_runs():
    db: Session = SessionLocal()
    runs = db.query(Run).all()

    for r in runs:
        print(
            f"{r.id} | Variant: {r.variant_id} | "
            f"Status: {r.status} | Type: {r.run_type}"
        )


@run_app.command("add-trade")
def add_trade(
    run_id: str,
    entry: float,
    exit: float,
    size: float,
    direction: str,
):
    db: Session = SessionLocal()

    trade = RunService.add_trade(
        db=db,
        run_id=uuid.UUID(run_id),
        entry_price=entry,
        exit_price=exit,
        size=size,
        direction=direction,
    )

    print(f"Added trade: {trade.id}")


@run_app.command("close")
def close_run(run_id: str):
    db: Session = SessionLocal()

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


@run_app.command("show")
def show_run(run_id: str):
    db: Session = SessionLocal()

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
