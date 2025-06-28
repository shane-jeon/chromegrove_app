import React from "react";

export default function StaffDashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7fafc",
        padding: "24px",
      }}>
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "48px",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          maxWidth: "500px",
          width: "100%",
        }}>
        <div
          style={{
            fontSize: "64px",
            marginBottom: "24px",
          }}>
          🚧
        </div>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#2d3748",
            marginBottom: "16px",
          }}>
          Staff Dashboard
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#718096",
            lineHeight: "1.6",
            marginBottom: "24px",
          }}>
          Under construction, come back later
        </p>
        <div
          style={{
            fontSize: "0.9rem",
            color: "#a0aec0",
            fontStyle: "italic",
          }}>
          This dashboard is currently being developed for staff members.
        </div>
      </div>
    </div>
  );
}
