# Edge Lab

Edge Lab is a modular research and execution framework for systematic
trading.

It enforces research discipline through controlled experimentation,
versioned strategy evolution, and statistically robust performance
analytics.

Core objective:

Measure edge.\
Track edge.\
Validate edge.\
Scale edge.

------------------------------------------------------------------------

## Research Philosophy

Strict structural separation:

Strategy → Variant → Run → Trades

Each backtest is executed as a controlled 100-trade block.

Purpose:

-   Stability testing
-   Edge decay detection
-   Variant comparison
-   Overfitting mitigation
-   Structured development tracking

Backtests are treated as research samples --- not marketing material.

------------------------------------------------------------------------

## Architecture

Strategy\
└── Variant (parameter iteration)\
    ├── Run (Backtest -- 100 trades)\
    ├── Run (Backtest -- 100 trades)\
    └── Run (Live execution)\
        └── Trades

Variants form an evolutionary tree via parent-child relationships.

Runs are isolated and reproducible.

------------------------------------------------------------------------

## Core Capabilities

### Research Layer

-   Controlled 100-trade blocks
-   Versioned variants
-   Parameter hashing
-   Evolution tree tracking
-   Walk-forward testing
-   Monte Carlo simulation
-   Risk-of-ruin modeling

### Analytics Engine

Log-return based analytics:

-   Expectancy
-   Win rate
-   Payoff ratio
-   Kelly (full & fractional)
-   Sharpe
-   Sortino
-   Volatility
-   Volatility drag
-   Max drawdown
-   Calmar
-   Skew / Kurtosis
-   Rolling stability metrics
-   Monthly aggregation

All analytics are tenant-isolated.

------------------------------------------------------------------------

### Execution Layer

-   Backtest engine
-   Manual trade logging
-   Live trade logging
-   Broker adapters (planned)

------------------------------------------------------------------------

## Multi-User Architecture

Hard multi-tenant isolation:

-   user_id on all entities
-   FK enforcement
-   Tenant-aware unique constraints (user_id + name)
-   Indexed ownership
-   Route-level filtering
-   Service-level filtering
-   Analytics-level filtering
-   CLI ownership enforcement

Authentication:

-   JWT tokens
-   Argon2 hashing
-   OAuth2 flow
-   No global access paths

------------------------------------------------------------------------

## Deployment

Self-hosted via Docker:

``` bash
docker compose up -d --build
```

Required environment variables:

-   DATABASE_URL
-   JWT_SECRET

------------------------------------------------------------------------

# Development Status

## Phase 0 -- Research Engine

✔ Domain models\
✔ Metrics engine\
✔ Equity curve\
✔ Monte Carlo\
✔ Risk of ruin\
✔ Walk forward\
✔ Variant analytics

## Phase 1 -- Multi-User Core

✔ Hard tenant isolation\
✔ Ownership constraints\
✔ Indexed user_id\
✔ CLI isolation\
✔ Alembic reset

------------------------------------------------------------------------

# Upcoming Roadmap

## Phase 2 -- Persisted Analytics Layer

Goal: deterministic snapshot-based analytics.

-   RunAnalytics model
-   Snapshot storage (JSONB)
-   Explicit compute endpoint
-   Dirty-flag invalidation
-   No auto-recompute on read
-   Deterministic research state

------------------------------------------------------------------------

## Phase 3 -- Admin Layer

Goal: controlled multi-user hosting.

-   First-boot admin creation
-   Admin dashboard
-   User management
-   Read-only tenant inspection
-   No global bypass queries

------------------------------------------------------------------------

## Phase 4 -- Run Sharing

Goal: collaborative research without data leakage.

-   Read-only run sharing
-   Token-based access
-   Optional expiration
-   Isolated shared views

------------------------------------------------------------------------

## Phase 5 -- UI Overhaul

Goal: professional research interface.

-   Clean dashboard layout
-   Proper chart axis labeling
-   Improved chart ergonomics
-   Visual refinement
-   Research-focused UX

------------------------------------------------------------------------

## Phase 6 -- Plugin & Extension System

Goal: extensibility without core modification.

-   Analytics plugins
-   Strategy plugins
-   External data adapters
-   Modular engine hooks

------------------------------------------------------------------------

## Phase 7 -- Advanced Research Tooling

-   Regime clustering
-   Cross-asset correlation analysis
-   Portfolio-level analytics
-   Position sizing simulations
-   Scenario stress testing

------------------------------------------------------------------------

## License

MIT
