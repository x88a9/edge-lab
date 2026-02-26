# Analytics

[GO BACK](../README.md)

## R-multiple Based Compounding
- Capital modeling applies a fixed 1% base risk per trade where used
- Expectancy_R and volatility_R captured in metrics_json at run level
- EquityBuilder constructs equity and drawdown as a pure transformation of stored trades

## Log-Growth Modeling
- Two distinct notions:
  - metrics.log_growth = mean(log(1 + R_multiple)) at run level
  - capital modeling log-growth = mean(log(1 + 0.01 * R_multiple)) for equity/Kelly contexts
- Portfolio combined_mean_log_growth is computed via equal-weight composition of clean strategies (synthetic aggregation)

## Kelly Objective (mean_log_growth)
- Empirical grid search over fractions 0.0–5.0 (scaled on 1% base-risk returns)
- Objective: mean(log(1 + f * base_return)); growth_optimal is the best grid point
- Optional ruin constraint (<5%) used to select a safe_fraction
- Results persisted in RunAnalytics.kelly_json; not a closed-form or continuous optimization

## Monte Carlo
- IID bootstrap simulation on 1% base-risk trade returns
- Horizon equals the original number of trades; no serial dependence or correlation modeling
- Summary persisted in RunAnalytics.monte_carlo_json (mean/median/p5/p95 and drawdown stats)
- Stochastic without fixed seed (not reproducible by design)

## Risk of Ruin
- Threshold-based ruin detection under IID bootstrap paths
- Default horizon max_trades=500; ruin if capital ≤ 0.7 (configurable)
- Vectorized simulation; outputs include ruin_probability and drawdown statistics
- Summary persisted in RunAnalytics.risk_of_ruin_json

## Walk Forward
- Rolling split evaluation with 60% train / 40% test windows
- Steps forward by test_size; no parameter refit or re-optimization
- WalkForwardWindow array persisted in RunAnalytics.walk_forward_json

## Snapshot Persistence
- RunAnalytics stores metrics/equity/engines outputs with is_dirty=false after compute
- Higher layers (Variant/Strategy/Portfolio) store aggregated/composed snapshots
- GET endpoints return snapshots only; compute endpoints are explicit

## Dirty Flag Model
- Lower-layer recompute sets upper layers dirty via DirtyPropagationService
- VariantAnalytics/StrategyAnalytics marked dirty when dependent snapshots change
- Portfolio entity carries is_dirty to indicate recomputation requirement; recompute is manual

## Screenshots

![Run Analytics Panels](../screenshots/scr-ui-1_backtests_individual_view_analytics_1.png)
![Run Analytics Panels](../screenshots/scr-ui-1_backtests_individual_view_analytics_2.png)
![Run Analytics Panels](../screenshots/scr-ui-1_backtests_individual_view_analytics_3.png)
![Run Analytics Panels](../screenshots/scr-ui-1_backtests_individual_view_analytics_4.png)
