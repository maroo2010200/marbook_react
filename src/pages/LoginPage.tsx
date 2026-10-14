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
      // Login succeeded -> authenticated, redirect to feed.
      navigate("/feed");
    } catch (err) {
      // The backend returns 401 "Please verify your email." for unverified users.
      // Keep the user on the login page and show the specific message.
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (err.response?.status === 401 && typeof data === "string") {
          setError(data);
        } else {
          setError(
            err.response?.data?.message ?? err.message ?? "Invalid email or password",
          );
        }
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
    <div>
      <h1>Login</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>
      </form>

      {email && (
        <button type="button" onClick={handleResend} style={{ marginTop: "12px" }}>
          Didn't receive the email? Resend
        </button>
      )}
      {resendError && <p style={{ color: "green" }}>{resendError}</p>}
    </div>
  );
}

export default LoginPage;
