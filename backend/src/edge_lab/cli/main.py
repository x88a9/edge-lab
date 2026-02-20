import typer
import uuid
from sqlalchemy.orm import Session

from edge_lab.persistence.database import SessionLocal
from edge_lab.persistence.models import User, Strategy, Variant, Run, RunMetrics
from edge_lab.security.password import hash_password
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
def create_user(
    email: str,
    password: str,
    admin: bool = False,
):
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
        users = db.query(User).all()
        for u in users:
            print(f"{u.id} | {u.email} | admin={u.is_admin}")
    finally:
        db.close()
