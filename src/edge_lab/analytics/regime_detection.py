import numpy as np
from sklearn.cluster import KMeans
from sqlalchemy.orm import Session
from edge_lab.persistence.models import Trade


class RegimeDetectionEngine:

    @staticmethod
    def detect(
        db: Session,
        run_id,
        window: int = 20,
        clusters: int = 2,
    ):

        trades = (
            db.query(Trade)
            .filter(Trade.run_id == run_id)
            .order_by(Trade.created_at)
            .all()
        )

        log_returns = np.array([t.log_return for t in trades])

        rolling_vol = []
        rolling_mean = []

        for i in range(window, len(log_returns)):
            slice_ = log_returns[i-window:i]
            rolling_vol.append(np.std(slice_))
            rolling_mean.append(np.mean(slice_))

        X = np.column_stack((rolling_vol, rolling_mean))

        kmeans = KMeans(n_clusters=clusters, random_state=42)
        labels = kmeans.fit_predict(X)

        return {
            "labels": labels.tolist(),
            "centroids": kmeans.cluster_centers_.tolist(),
        }
