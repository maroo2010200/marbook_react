import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();
  const { verify } = useAuth();

  useEffect(() => {
    // The verification link looks like: https://your-app.com/verify?token=***
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage(
        "Missing verification token. Please request a new verification email.",
      );
      return;
    }

    const attempt = async () => {
      try {
        await verify(token);
        setStatus("success");
        setMessage(
          "Your email has been verified. You can now log in to Marbook.",
        );
      } catch (error) {
        const axiosError = error as {
          response?: { status?: number; data?: unknown };
        };
        if (axiosError.response?.status === 400) {
          const data = axiosError.response.data;
          setStatus("error");
          setMessage(
            typeof data === "string"
              ? data
              : "Invalid or expired verification token.",
          );
        } else {
          setStatus("error");
          setMessage(
            "Verification failed. Please try again, or request a new email.",
          );
        }
      }
    };

    attempt();
  }, [verify]);

  if (status === "loading") {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Verifying your email...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1 style={{ color: "green" }}>Email verified!</h1>
        <p style={{ color: "green" }}>{message}</p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{ marginTop: "16px" }}
        >
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1 style={{ color: "red" }}>Verification failed</h1>
      <p style={{ color: "red" }}>{message}</p>
      <button
        type="button"
        onClick={() => navigate("/login")}
        style={{ marginTop: "16px" }}
      >
        Back to login
      </button>
    </div>
  );
}

export default VerifyPage;
