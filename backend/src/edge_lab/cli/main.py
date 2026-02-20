import typer
import uuid
from sqlalchemy.orm import Session

from edge_lab.persistence.database import SessionLocal
from edge_lab.persistence.models import (
    User,
    Strategy,
    Variant,
    Run,
    RunMetrics,
)
from edge_lab.security.password import hash_password
from edge_lab.services.run_service import RunService
from edge_lab.analytics.variant_analyzer import VariantAnalyzer
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
def create_user(email: str, password: str, admin: bool = False):
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print("User already exists.")
            return

        user = User(
            email=email,
            password_hash=hash_password(password),
            is_admin=admin,
        )

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
        for u in db.query(User).all():
            print(f"{u.id} | {u.email} | admin={u.is_admin}")
    finally:
        db.close()


# ==================================================
# STRATEGY COMMANDS
# ==================================================

@strategy_app.command("create")
def create_strategy(user_id: str, name: str, asset: str):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user:
            print("User not found.")
            return

        strategy = Strategy(
            user_id=user.id,
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
def list_strategies(user_id: str):
    db: Session = SessionLocal()
    try:
        strategies = (
            db.query(Strategy)
            .filter(Strategy.user_id == uuid.UUID(user_id))
            .all()
        )

        for s in strategies:
            print(f"{s.id} | {s.name} | {s.asset}")
    finally:
        db.close()


# ==================================================
# VARIANT COMMANDS
# ==================================================

@variant_app.command("create")
def create_variant(
    user_id: str,
    strategy_id: str,
    name: str,
    version: int,
):
    db: Session = SessionLocal()
    try:
        strategy = (
            db.query(Strategy)
            .filter(
                Strategy.id == uuid.UUID(strategy_id),
                Strategy.user_id == uuid.UUID(user_id),
            )
            .first()
        )

        if not strategy:
            print("Strategy not found or not owned by user.")
            return

        variant = Variant(
            user_id=strategy.user_id,
            strategy_id=strategy.id,
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
def list_variants(user_id: str):
    db: Session = SessionLocal()
    try:
        variants = (
            db.query(Variant)
            .filter(Variant.user_id == uuid.UUID(user_id))
            .all()
        )

        for v in variants:
            print(f"{v.id} | {v.name} | v{v.version_number}")
    finally:
        db.close()


# ==================================================
# RUN COMMANDS
# ==================================================

@run_app.command("create")
def create_run(
    user_id: str,
    variant_id: str,
    initial_capital: float,
):
    db: Session = SessionLocal()
    try:
        run = RunService.create_run(
            db=db,
            user_id=uuid.UUID(user_id),
            variant_id=uuid.UUID(variant_id),
            run_type="backtest",
            initial_capital=initial_capital,
        )

        print(f"Created run: {run.id}")
    finally:
        db.close()


@run_app.command("list")
def list_runs(user_id: str):
    db: Session = SessionLocal()
    try:
        runs = (
            db.query(Run)
            .filter(Run.user_id == uuid.UUID(user_id))
            .all()
        )

        for r in runs:
            print(f"{r.id} | Variant: {r.variant_id} | Status: {r.status}")
    finally:
        db.close()


@run_app.command("close")
def close_run(user_id: str, run_id: str):
    db: Session = SessionLocal()
    try:
        snapshot = RunService.close_run(
            db=db,
            user_id=uuid.UUID(user_id),
            run_id=uuid.UUID(run_id),
        )

        print("Run closed.")
        print("Expectancy:", snapshot.expectancy)
        print("Sharpe:", snapshot.sharpe)
    finally:
        db.close()