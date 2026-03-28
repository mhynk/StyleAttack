export default function Loading() {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "#0b0b0b",
          color: "white",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(255,255,255,0.2)",
            borderTop: "4px solid white",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p>Processing style variations...</p>
  
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }