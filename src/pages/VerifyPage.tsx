import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();
  const { verify } = useAuth();

  const hasCalledVerify = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage(
        "Missing verification token. Please request a new verification email.",
      );
      return;
    }

    if (hasCalledVerify.current) return;
    hasCalledVerify.current = true;

    const attempt = async () => {
      try {
        await verify(token);
        setStatus("success");
        setMessage(
          "Your email has been verified. You can now log in to Marbook.",
        );
      } catch (error: any) {
        if (error instanceof Error && !(error as any).isAxiosError) {
          setStatus("error");
          setMessage(error.message);
          return;
        }

        const axiosError = error as {
          response?: { status?: number; data?: unknown };
          message?: string;
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
            axiosError.message ?? "Verification failed. Please try again.",
          );
        }
      }
    };

    attempt();
  }, [verify]);

  if (status === "loading") {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "white" }}>
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
