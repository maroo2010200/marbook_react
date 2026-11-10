import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MarshmallowLogo } from "../components/MarshmallowLogo";
import { MarshmallowLoader } from "../components/MarshmallowLoader";

export default function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(5);
  const navigate = useNavigate();
  const { verify, user } = useAuth();

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

  // Automatic countdown redirect on success
  useEffect(() => {
    if (status !== "success") return;

    if (countdown <= 0) {
      navigate("/feed", { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, navigate]);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        backgroundColor: "var(--bg-page)",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "36px 30px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Loading State */}
        {status === "loading" && (
          <div style={{ padding: "20px 0" }}>
            <MarshmallowLoader
              size="md"
              label="Verifying your email..."
              sublabel="Pulling up your chair by the campfire..."
            />
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div>
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 20px",
                borderRadius: "50%",
                backgroundColor: "var(--primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--primary)",
                boxShadow: "0 0 24px rgba(201, 107, 50, 0.25)",
              }}
            >
              <MarshmallowLogo size={36} />
            </div>

            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: "0 0 10px",
              }}
            >
              Email Verified! 🎉
            </h1>

            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                margin: "0 0 24px",
              }}
            >
              Welcome to the campfire{user?.name ? `, ${user.name}` : ""}! Your
              account is now fully active, and you are already signed in.
            </p>

            <button
              type="button"
              onClick={() => navigate("/feed", { replace: true })}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                border: "none",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(201, 107, 50, 0.35)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <span>Go to your Feed</span>
              <span>→</span>
            </button>

            <p
              style={{
                fontSize: "13px",
                color: "var(--text-tertiary)",
                marginTop: "16px",
                marginBottom: 0,
              }}
            >
              Redirecting automatically in {countdown}s...
            </p>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div>
            <div
              style={{
                width: "56px",
                height: "56px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                fontSize: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(239, 68, 68, 0.25)",
              }}
            >
              ✕
            </div>

            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 10px",
              }}
            >
              Verification Failed
            </h1>

            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.5,
                color: "#ef4444",
                margin: "0 0 24px",
              }}
            >
              {message}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
