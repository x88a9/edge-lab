import uuid
from datetime import datetime
from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Integer,
    Float,
    Boolean,
    Text,
    Enum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    strategies = relationship("Strategy", back_populates="user")


class Strategy(Base):
    __tablename__ = "strategies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    asset: Mapped[str] = mapped_column(String(100), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship("User", back_populates="strategies")
    variants = relationship("Variant", back_populates="strategy")


class Variant(Base):
    __tablename__ = "variants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    strategy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("strategies.id"),
        nullable=False
    )

    parent_variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("variants.id"),
        nullable=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)

    parameter_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    parameter_json: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    strategy = relationship("Strategy", back_populates="variants")
    runs = relationship("Run", back_populates="variant")


from sqlalchemy import Enum

class Run(Base):
    __tablename__ = "runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("variants.id"),
        nullable=False
    )

    run_type: Mapped[str] = mapped_column(String(50), nullable=False)

    status: Mapped[str] = mapped_column(
        String(20),
        default="open",
        nullable=False
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=True)
    trade_limit: Mapped[int] = mapped_column(Integer, default=100)
    initial_capital: Mapped[float] = mapped_column(Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    variant = relationship("Variant", back_populates="runs")
    trades = relationship("Trade", back_populates="run")



class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("runs.id"),
        nullable=False
    )

    # Core Prices
    entry_price: Mapped[float] = mapped_column(Float, nullable=False)
    exit_price: Mapped[float] = mapped_column(Float, nullable=False)
    stop_loss: Mapped[float] = mapped_column(Float, nullable=False)

    size: Mapped[float] = mapped_column(Float, nullable=False)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)

    # Meta
    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    timeframe: Mapped[str] = mapped_column(
        String(10),
        nullable=True
    )

    # Calculated
    raw_return: Mapped[float] = mapped_column(Float, nullable=False)
    log_return: Mapped[float] = mapped_column(Float, nullable=False)

    r_multiple: Mapped[float] = mapped_column(Float, nullable=False)
    is_win: Mapped[bool] = mapped_column(Boolean, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


    run = relationship("Run", back_populates="trades")

class RunMetrics(Base):
    __tablename__ = "run_metrics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("runs.id"),
        unique=True,
        nullable=False
    )

    expectancy: Mapped[float] = mapped_column(Float)
    win_rate: Mapped[float] = mapped_column(Float)
    sharpe: Mapped[float] = mapped_column(Float)
    volatility: Mapped[float] = mapped_column(Float)
    max_drawdown: Mapped[float] = mapped_column(Float)
    total_return: Mapped[float] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    
class VariantMetrics(Base):
    __tablename__ = "variant_metrics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("variants.id"),
        unique=True,
        nullable=False
    )

    total_runs: Mapped[int] = mapped_column(Integer)

    mean_expectancy: Mapped[float] = mapped_column(Float)
    std_expectancy: Mapped[float] = mapped_column(Float)

    mean_sharpe: Mapped[float] = mapped_column(Float)
    std_sharpe: Mapped[float] = mapped_column(Float)

    mean_win_rate: Mapped[float] = mapped_column(Float)
    mean_volatility: Mapped[float] = mapped_column(Float)

    worst_max_dd: Mapped[float] = mapped_column(Float)

    stability_score: Mapped[float] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
