import { Link } from "react-router-dom";

export default function AppLayout({ children }: any) {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div
        style={{
          width: 220,
          background: "#111",
          color: "white",
          padding: 20
        }}
      >
        <h2>Edge Lab</h2>

        <nav style={{ marginTop: 30 }}>
          <div>
            <Link to="/" style={{ color: "white" }}>
              Dashboard
            </Link>
          </div>
        </nav>
      </div>

      <div style={{ flex: 1, background: "#1e1e1e", color: "white" }}>
        {children}
      </div>
    </div>
  );
}
