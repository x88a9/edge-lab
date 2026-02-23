# Edge Lab

Edge Lab is a deterministic, hierarchical research engine for systematic
trading.

It enforces strict research structure, snapshot-based analytics, and
capital-layer modeling across multiple abstraction levels.

Core objective:

Measure edge.\
Track edge.\
Validate edge.\
Scale edge.

------------------------------------------------------------------------

## Research Philosophy

Strict structural separation:

Strategy → Variant → Run → Trades

Each layer builds on deterministic lower-layer snapshots.

Research hierarchy:

Trades\
→ RunAnalytics\
→ VariantAnalytics\
→ StrategyAnalytics\
→ PortfolioAnalytics

No implicit recomputation.\
No hidden state mutations.\
All analytics are explicitly computed and persisted.

Backtests are treated as research samples --- not marketing material.

------------------------------------------------------------------------

## Architecture

Strategy\
└── Variant\
  └── Run\
    └── Trades

Analytics Hierarchy:

RunAnalytics (based on Trades)\
VariantAnalytics (based on RunAnalytics)\
StrategyAnalytics (based on VariantAnalytics)\
PortfolioAnalytics (based on StrategyAnalytics)

All layers support:

-   Snapshot persistence
-   Dirty-flag invalidation
-   Explicit compute endpoints
-   Deterministic state

------------------------------------------------------------------------

## Core Capabilities

### Research Engine

-   Controlled 100-trade blocks
-   Versioned variant evolution
-   Parameter hashing
-   Walk-forward analysis
-   Monte Carlo simulation
-   Risk-of-ruin modeling
-   Kelly optimization (log-growth based)
-   R-multiple unified capital model

All capital compounding is R-based and internally consistent.

------------------------------------------------------------------------

### Hierarchical Analytics

**Run Level** - Expectancy - Mean log growth - Sharpe - Max drawdown -
Equity curve - RuR simulation - Monte Carlo simulation

**Variant Level** - Aggregated run expectancy - Mean log growth across
runs - Stability dispersion - Best/worst run analysis

**Strategy Level** - Aggregated variant performance - Stability
scoring - Cross-variant dispersion

**Portfolio Level** - Allocation modes: - Equal weight -
Kelly-weighted - Fixed weight - Combined equity simulation - Combined
growth metrics - Deterministic portfolio snapshots

------------------------------------------------------------------------

## Deterministic Snapshot System

All analytics layers follow the same rules:

-   Explicit compute endpoint
-   Stored JSON snapshot
-   Dirty-flag invalidation
-   No compute-on-read
-   Upward propagation of invalidation

Hierarchy:

Run change\
→ Variant marked dirty\
→ Strategy marked dirty\
→ Portfolio marked dirty

Centralized propagation via DirtyPropagationService.

System status: Production-ready (manual trigger mode).

------------------------------------------------------------------------

## Multi-User Architecture

Hard tenant isolation:

-   user_id on all entities
-   FK enforcement
-   Tenant-aware unique constraints (user_id + name)
-   Indexed ownership
-   Route-level filtering
-   Service-level filtering
-   Analytics-level filtering
-   CLI isolation

Authentication:

-   JWT-based auth
-   Argon2 password hashing
-   OAuth2 flow
-   No global bypass paths

------------------------------------------------------------------------

## Deployment

Self-hosted via Docker:

docker compose up -d --build

Environment variables:

-   DATABASE_URL
-   JWT_SECRET

Production frontend is served via Docker (static build).

------------------------------------------------------------------------

# Development Status

## Phase 0 -- Research Engine

✔ Domain models\
✔ R-based capital compounding\
✔ Equity builder\
✔ Monte Carlo\
✔ Risk of ruin\
✔ Walk forward\
✔ Kelly log-growth optimization

## Phase 1 -- Multi-User Core

✔ Hard tenant isolation\
✔ Indexed ownership\
✔ Tenant-aware constraints\
✔ CLI isolation\
✔ Auth layer

## Phase 2 -- Persisted Analytics Layer

✔ RunAnalytics snapshot\
✔ VariantAnalytics snapshot\
✔ StrategyAnalytics snapshot\
✔ PortfolioAnalytics snapshot\
✔ Dirty-flag propagation\
✔ No auto-recompute on read\
✔ Deterministic research state

System now operates as a fully hierarchical analytics engine.

------------------------------------------------------------------------

# Roadmap

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
-   Institutional research UX
-   Hierarchical navigation clarity

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
-   Advanced portfolio analytics
-   Position sizing simulations
-   Scenario stress testing

------------------------------------------------------------------------

## License

MIT
