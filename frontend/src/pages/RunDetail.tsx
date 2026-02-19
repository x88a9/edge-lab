import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/client";

export default function RunDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    api.get(`/runs/${id}/monte-carlo`)
        .then(res => setData(res.data))
        .catch(err => {
        setData({ error: err.response?.data?.detail || "Error" });
        });
    }, [id]);

    if (data?.error) {
        return <div style={{ padding: 40 }}>{data.error}</div>;
    }

  if (!data) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{ padding: 40 }}>
      <h2>Monte Carlo Results</h2>
      <p>Mean Final Return: {data.mean_final_return}</p>
      <p>5% Worst Return: {data.p5_final_return}</p>
      <p>95% Best Return: {data.p95_final_return}</p>
    </div>
  );
}
