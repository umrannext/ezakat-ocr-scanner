"use client";

export default function Page() {
  return (
    <div style={{ padding: "50px" }}>
      <h1>Sentry Test Page</h1>
      <button
        onClick={() => {
          throw new Error("Sentry Test Error from Client!");
        }}
        style={{ padding: "10px", marginTop: "20px" }}
      >
        Throw error!
      </button>
    </div>
  );
}

