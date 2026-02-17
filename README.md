# Edge Lab

Edge Lab is a modular research and execution framework for systematic trading.

It is designed to enforce research discipline through controlled experimentation,
versioned strategy evolution, and statistically robust performance analytics.

The core objective is simple:

Measure edge.
Track edge.
Validate edge.
Scale edge.

---

## Research Philosophy

Edge Lab enforces strict structural separation:

Strategy → Variant → Run → Trades

Each backtest is executed as a controlled block of exactly 100 trades.

This allows:

- Stability testing
- Edge decay detection
- Variant comparison
- Overfitting mitigation
- Development tracking over time

Backtests are not treated as marketing material — they are treated as research samples.

---

## Architecture

Strategy
└── Variant (parameter iteration)
├── Run (Backtest – 100 trades)
├── Run (Backtest – 100 trades)
└── Run (Live execution)
└── Trades


Each run is fully isolated and reproducible.

Variants form an evolutionary tree via parent-child relationships,
allowing structured development tracking.

---

## Core Capabilities

### Research Layer
- Controlled 100-trade backtest blocks
- Version-controlled strategy variants
- Parameter hashing for reproducibility
- Variant evolution tree
- Walk-forward testing (planned)

### Analytics Engine
All performance metrics are derived from log-return series.

Includes:

- Expectancy
- Win rate
- Payoff ratio
- Kelly fraction (full & fractional)
- Sharpe ratio
- Sortino ratio
- Volatility
- Volatility drag
- Max drawdown
- Calmar ratio
- Risk of ruin
- Skew & kurtosis
- Rolling stability metrics
- Monthly PnL aggregation

### Execution Layer
- Backtest engine
- Live trade logging
- Manual trade entry
- Broker adapters (planned)

### Extensibility
- Modular architecture
- Plugin system (planned)
- API layer (planned)
- GUI layer (planned)

---

## Project Structure

edge-lab/
│
├── src/
│ ├── core/
│ ├── analytics/
│ ├── research/
│ ├── execution/
│ ├── persistence/
│ ├── plugins/
│ └── api/
│
├── tests/
├── notebooks/
├── docs/
└── examples/


---

## Development Roadmap

### v0.1
- Core domain models
- 100-trade run structure
- Metrics engine
- SQLite persistence

### v0.2
- Variant evolution tracking
- Aggregated performance analytics
- Rolling statistics

### v0.3
- Monte Carlo simulation
- Bootstrap confidence intervals
- Risk-of-ruin modeling

### v1.0
- Live execution integration
- Plugin system
- REST API
- Optional GUI

---

## Status

Early architecture phase.

Edge Lab is being built as a long-term systematic trading research infrastructure.

---

## License

MIT
