import { useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { MarshmallowLogo } from "../components/MarshmallowLogo";
import { MarshmallowLoader } from "../components/MarshmallowLoader";

function extractErrorMessage(
  err: unknown,
  defaultMsg = "Registration failed. Please try again."
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    if (data && typeof data === "object") {
      if (
        "message" in data &&
        typeof (data as { message?: unknown }).message === "string" &&
        ((data as { message: string }).message).trim()
      ) {
        return (data as { message: string }).message;
      }
      if (
        "Message" in data &&
        typeof (data as { Message?: unknown }).Message === "string" &&
        ((data as { Message: string }).Message).trim()
      ) {
        return (data as { Message: string }).Message;
      }
      if (
        "errors" in data &&
        (data as { errors?: unknown }).errors &&
        typeof (data as { errors: unknown }).errors === "object"
      ) {
        const groups = Object.values(
          (data as { errors: Record<string, string[]> }).errors
        );
        const firstMsg = groups
          .flat()
          .find((m) => typeof m === "string" && m.trim());
        if (firstMsg) return firstMsg;
      }
      if (
        "detail" in data &&
        typeof (data as { detail?: unknown }).detail === "string" &&
        ((data as { detail: string }).detail).trim()
      ) {
        return (data as { detail: string }).detail;
      }
      if (
        "title" in data &&
        typeof (data as { title?: unknown }).title === "string" &&
        ((data as { title: string }).title).trim()
      ) {
        return (data as { title: string }).title;
      }
    }
    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
      return "Network error: Unable to connect to the server. Please check your connection and try again.";
    }
    if (err.message) {
      return err.message;
    }
  } else if (err instanceof Error && err.message) {
    return err.message;
  }
  return defaultMsg;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [birthdate, setBirthdate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [isResendError, setIsResendError] = useState(false);
  const isSubmittingRef = useRef(false);
  const navigate = useNavigate();

  const { register, resendVerificationEmail, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;

    setError("");
    setSuccess(false);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError("Username is required.");
      return;
    }
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!birthdate) {
      setError("Birthdate is required.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      await register({
        email: email.trim(),
        name: name.trim(),
        username: cleanUsername,
        password,
        birthdate,
      });
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    setIsResendError(false);
    try {
      const result = await resendVerificationEmail(email.trim());
      setResendMessage(result);
    } catch (err) {
      setIsResendError(true);
      setResendMessage(
        extractErrorMessage(err, "Resend failed. Please try again.")
      );
    } finally {
      setResendLoading(false);
    }
  };

  // Registration Success / Check Email View
  if (success) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 60px)",
          backgroundColor: "var(--bg-page)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            padding: "36px 30px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-lg)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              margin: "0 auto 18px",
              borderRadius: "50%",
              backgroundColor: "rgba(43, 138, 62, 0.12)",
              color: "#2b8a3e",
              fontSize: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(43, 138, 62, 0.25)",
            }}
          >
            ✉️
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            Check your Inbox!
          </h1>

          {!resendMessage && (
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                lineHeight: 1.6,
                margin: "0 0 20px",
              }}
            >
              We've sent a verification link to{" "}
              <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
              Click the link in the email to activate your account and pull up your
              chair by the campfire.
            </p>
          )}

          {resendMessage && (
            <p
              style={{
                color: isResendError ? "#e02424" : "#2b8a3e",
                fontSize: "14px",
                lineHeight: 1.5,
                margin: "0 0 20px",
              }}
            >
              {resendMessage}
            </p>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              style={{
                padding: "11px 18px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                border: "1px solid rgba(201, 107, 50, 0.2)",
                fontWeight: 600,
                fontSize: "14px",
                cursor: resendLoading ? "not-allowed" : "pointer",
                opacity: resendLoading ? 0.6 : 1,
              }}
            >
              {resendLoading ? "Resending email..." : "Resend Verification Email"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setError("");
                navigate("/login");
              }}
              style={{
                padding: "11px 18px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        backgroundColor: "var(--bg-page)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Warm Ambient Glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "350px",
          background:
            "radial-gradient(circle, rgba(201, 107, 50, 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: "36px 32px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header with Logo */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 14px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--primary)",
              boxShadow: "0 4px 16px rgba(201, 107, 50, 0.2)",
            }}
          >
            <MarshmallowLogo size={32} />
          </div>

          <h1
            style={{
              margin: "0 0 6px",
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
            }}
          >
            Join the Campfire
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "var(--text-secondary)",
            }}
          >
            Create your account and start sharing cozy moments
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              marginBottom: "18px",
              lineHeight: 1.4,
            }}
          >
            <div>{error}</div>
            {(error.toLowerCase().includes("already") ||
              error.toLowerCase().includes("log in") ||
              error.toLowerCase().includes("inbox")) && (
              <div style={{ marginTop: "8px" }}>
                <Link
                  to="/login"
                  style={{
                    color: "var(--primary)",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  Go to Login →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label
              htmlFor="reg-name"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "5px",
              }}
            >
              Full Name *
            </label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Maya Lin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
            />
          </div>

          <div>
            <label
              htmlFor="reg-username"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "5px",
              }}
            >
              Username *
            </label>
            <input
              id="reg-username"
              type="text"
              placeholder="e.g. mayalin99"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
            />
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-tertiary)",
                marginTop: "4px",
                display: "block",
              }}
            >
              Your unique campfire handle: @{username || "handle"} (3–30 letters, numbers, or _)
            </span>
          </div>

          <div>
            <label
              htmlFor="reg-email"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "5px",
              }}
            >
              Email Address *
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "5px",
              }}
            >
              Password *
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "11px 42px 11px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: 16,
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-birthdate"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "5px",
              }}
            >
              Birthdate *
            </label>
            <input
              id="reg-birthdate"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
            />
          </div>

          {/* Terms & Privacy Agreement Notice */}
          <div
            style={{
              marginTop: "6px",
              marginBottom: "2px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            <span>By joining, you agree to our </span>
            <Link
              to="/terms"
              target="_blank"
              rel="noreferrer"
              style={{
                color: "var(--primary)",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Terms of Service
            </Link>
            <span> and </span>
            <Link
              to="/privacy"
              target="_blank"
              rel="noreferrer"
              style={{
                color: "var(--primary)",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Privacy Policy
            </Link>
            <span>. Your personal data is encrypted &amp; never sold.</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "10px",
              padding: "13px",
              borderRadius: "var(--radius-full)",
              backgroundColor: loading ? "var(--bg-hover)" : "var(--primary)",
              color: loading ? "var(--text-secondary)" : "#ffffff",
              border: "none",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 14px rgba(201, 107, 50, 0.35)",
              transition: "transform 0.15s ease, background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Preparing campfire..." : "Join Marshmallow"}
          </button>

          {/* Mini Marshmallow Loader when loading */}
          {loading && (
            <div style={{ textAlign: "center", marginTop: "2px" }}>
              <MarshmallowLoader
                size="sm"
                label="Setting up your marshmallow..."
              />
            </div>
          )}
        </form>

        {/* Switch to Login */}
        <div
          style={{
            marginTop: "22px",
            paddingTop: "18px",
            borderTop: "1px solid var(--divider)",
            textAlign: "center",
            fontSize: "14px",
            color: "var(--text-secondary)",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Log In →
          </Link>
        </div>
      </div>
    </div>
  );
}
