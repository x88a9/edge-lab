import { useEffect, useState } from "react";
import api from "../api/client";
import { Link } from "react-router-dom";

interface Run {
  id: string;
  status: string;
  run_type: string;
  initial_capital: number;
}

export default function Dashboard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/runs")
      .then(res => {
        setRuns(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Edge Lab Dashboard</h1>

      {runs.length === 0 && <p>No runs yet.</p>}

      {runs.map(run => (
        <div
          key={run.id}
          style={{
            border: "1px solid #333",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8
          }}
        >
          <p><strong>ID:</strong> {run.id}</p>
          <p>Status: {run.status}</p>
          <p>Type: {run.run_type}</p>
          <p>Capital: {run.initial_capital}</p>

          <Link to={`/runs/${run.id}`}>
            View Details
          </Link>
        </div>
      ))}
    </div>
  );
}
