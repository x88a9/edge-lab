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
    Index,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,  # global unique bleibt korrekt
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    strategies = relationship(
        "Strategy",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    variants = relationship(
        "Variant",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    runs = relationship(
        "Run",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    trades = relationship(
        "Trade",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    run_metrics = relationship(
        "RunMetrics",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    variant_metrics = relationship(
        "VariantMetrics",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Strategy(Base):
    __tablename__ = "strategies"

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_strategies_user_name"),
        Index("ix_strategies_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    asset: Mapped[str] = mapped_column(String(100), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    user = relationship("User", back_populates="strategies")

    variants = relationship(
        "Variant",
        back_populates="strategy",
        cascade="all, delete-orphan",
    )


class Variant(Base):
    __tablename__ = "variants"

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_variants_user_name"),
        Index("ix_variants_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    strategy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("strategies.id"),
        nullable=False,
    )

    parent_variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("variants.id"),
        nullable=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    parameter_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    parameter_json: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    user = relationship("User", back_populates="variants")
    strategy = relationship("Strategy", back_populates="variants")

    runs = relationship(
        "Run",
        back_populates="variant",
        cascade="all, delete-orphan",
    )

    metrics = relationship(
        "VariantMetrics",
        back_populates="variant",
        cascade="all, delete-orphan",
        uselist=False,
    )


class Run(Base):
    __tablename__ = "runs"

    __table_args__ = (
        Index("ix_runs_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("variants.id"),
        nullable=False,
    )

    run_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=True)
    trade_limit: Mapped[int] = mapped_column(Integer, default=100)
    initial_capital: Mapped[float] = mapped_column(Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    user = relationship("User", back_populates="runs")
    variant = relationship("Variant", back_populates="runs")

    trades = relationship(
        "Trade",
        back_populates="run",
        cascade="all, delete-orphan",
    )

    metrics = relationship(
        "RunMetrics",
        back_populates="run",
        cascade="all, delete-orphan",
        uselist=False,
    )


class Trade(Base):
    __tablename__ = "trades"

    __table_args__ = (
        Index("ix_trades_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("runs.id"),
        nullable=False,
    )

    entry_price: Mapped[float] = mapped_column(Float, nullable=False)
    exit_price: Mapped[float] = mapped_column(Float, nullable=False)
    stop_loss: Mapped[float] = mapped_column(Float, nullable=False)

    size: Mapped[float] = mapped_column(Float, nullable=False)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)

    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    timeframe: Mapped[str] = mapped_column(String(10), nullable=True)

    raw_return: Mapped[float] = mapped_column(Float, nullable=False)
    log_return: Mapped[float] = mapped_column(Float, nullable=False)
    r_multiple: Mapped[float] = mapped_column(Float, nullable=False)
    is_win: Mapped[bool] = mapped_column(Boolean, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    user = relationship("User", back_populates="trades")
    run = relationship("Run", back_populates="trades")


class RunMetrics(Base):
    __tablename__ = "run_metrics"

    __table_args__ = (
        Index("ix_run_metrics_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("runs.id"),
        unique=True,
        nullable=False,
    )

    expectancy: Mapped[float] = mapped_column(Float)
    win_rate: Mapped[float] = mapped_column(Float)
    sharpe: Mapped[float] = mapped_column(Float)
    volatility: Mapped[float] = mapped_column(Float)
    max_drawdown: Mapped[float] = mapped_column(Float)
    total_return: Mapped[float] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    user = relationship("User", back_populates="run_metrics")
    run = relationship("Run", back_populates="metrics")


class VariantMetrics(Base):
    __tablename__ = "variant_metrics"

    __table_args__ = (
        Index("ix_variant_metrics_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("variants.id"),
        unique=True,
        nullable=False,
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
        default=datetime.utcnow,
    )

    user = relationship("User", back_populates="variant_metrics")
    variant = relationship("Variant", back_populates="metrics")