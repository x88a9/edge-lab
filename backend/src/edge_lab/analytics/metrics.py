import numpy as np


class MetricsEngine:

    @staticmethod
    def expectancy(raw_returns):
        wins = raw_returns[raw_returns > 0]
        losses = raw_returns[raw_returns <= 0]

        win_rate = len(wins) / len(raw_returns)

        avg_win = wins.mean() if len(wins) > 0 else 0
        avg_loss = losses.mean() if len(losses) > 0 else 0

        return win_rate * avg_win + (1 - win_rate) * avg_loss

    @staticmethod
    def sharpe(log_returns):
        mean = np.mean(log_returns)
        std = np.std(log_returns)

        if std == 0:
            return 0

        return mean / std * np.sqrt(len(log_returns))

    @staticmethod
    def volatility(log_returns):
        return np.std(log_returns)

    @staticmethod
    def volatility_drag(raw_returns, log_returns):
        arithmetic_mean = np.mean(raw_returns)
        geometric_mean = np.mean(log_returns)
        return arithmetic_mean - geometric_mean
