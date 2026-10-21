import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resendError, setResendError] = useState("");
  const navigate = useNavigate();
  const { login, resendVerificationEmail } = useAuth();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setResendError("");

    try {
      await login(email, password);
      navigate("/feed");
    } catch (error: any) {
      // If the AuthContext already extracted the message string and threw a standard error, use it!
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Invalid email or password");
      }
    }
  };

  const handleResend = async () => {
    setResendError("");
    try {
      const result = await resendVerificationEmail(email);
      setResendError(result);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setResendError(
          err.response?.data?.message ?? err.message ?? "Resend failed",
        );
      } else {
        setResendError("Resend failed");
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: 440,
        margin: "40px auto",
        padding: "32px 28px",
        backgroundColor: "var(--bg-card)",
        borderRadius: 12,
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <h1
        style={{
          margin: "0 0 20px",
          fontSize: 26,
          fontWeight: 700,
          color: "var(--text-primary)",
          textAlign: "center",
        }}
      >
        Log In to Marbook
      </h1>

      {error && (
        <div
          style={{
            backgroundColor: "#ffebe8",
            color: "#e02424",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          style={{
            marginTop: 6,
            padding: "12px",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          Log In
        </button>
      </form>

      {email && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            type="button"
            onClick={handleResend}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Didn't receive verification email? Resend
          </button>
        </div>
      )}
      {resendError && (
        <p
          style={{
            color: "#2b8a3e",
            fontSize: 13,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          {resendError}
        </p>
      )}
    </div>
  );
}

export default LoginPage;
