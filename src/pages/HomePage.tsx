import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MarshmallowLogo } from "../components/MarshmallowLogo";

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  // If the user is already logged in, send them straight to their feed
  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        backgroundColor: "var(--bg-page)",
        color: "var(--text-primary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient Campfire Glow Background */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "500px",
          background:
            "radial-gradient(ellipse at center, rgba(201, 107, 50, 0.18) 0%, rgba(245, 158, 11, 0.08) 40%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "1140px",
          margin: "0 auto",
          padding: "60px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Hero Section */}
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--primary-light)",
              border: "1px solid rgba(201, 107, 50, 0.25)",
              color: "var(--primary)",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "24px",
            }}
          >
            <span>🔥</span>
            <span>Welcome to Marshmallow • The cozy social space</span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 54px)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-1px",
              margin: "0 0 20px",
              color: "var(--text-primary)",
            }}
          >
            Social media that feels like{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, #e07a5f 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              gathering around a campfire.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              margin: "0 auto 36px",
              maxWidth: "620px",
            }}
          >
            Share moments, upload photos, roast thoughts, and chat live with friends
            in real-time. No chaotic algorithms, just warm connections.
          </p>

          {/* Call to Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 28px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "16px",
                boxShadow: "0 6px 20px rgba(201, 107, 50, 0.35)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(201, 107, 50, 0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(201, 107, 50, 0.35)";
              }}
            >
              <span>Join the Campfire</span>
              <span style={{ fontSize: "18px" }}>→</span>
            </Link>

            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "14px 26px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "15px",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-sm)",
                transition: "background-color 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-card)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Live App Showcase Card */}
        <div
          style={{
            maxWidth: "680px",
            margin: "56px auto 0",
            padding: "24px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-lg)",
            position: "relative",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--primary)",
                }}
              >
                <MarshmallowLogo size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>
                  Campfire Host <span style={{ color: "var(--primary)", fontSize: "13px" }}>🔥</span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  @marshmallow • Just now
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
              }}
            >
              Public
            </span>
          </div>

          {/* Card Body */}
          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.6,
              color: "var(--text-primary)",
              margin: "0 0 16px",
            }}
          >
            Welcome to the campfire! ☕ Grab a skewer, toast some thoughts, and say hello!
            What are you working on today?
          </p>

          {/* Card Reactions Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              paddingTop: "14px",
              borderTop: "1px solid var(--divider)",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)", fontWeight: 600 }}>
              <span>🔥</span> 28 Roasts
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>💬</span> 12 Comments
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⚡</span> Live
            </span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginTop: "60px",
          }}
        >
          {/* Feature 1 */}
          <div
            style={{
              padding: "26px",
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "14px" }}>🪵</div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>
              The Daily Campfire
            </h3>
            <p style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--text-secondary)", margin: 0 }}>
              Post updates, upload photos, and explore trending thoughts in a clean, distraction-free feed.
            </p>
          </div>

          {/* Feature 2 */}
          <div
            style={{
              padding: "26px",
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "14px" }}>💬</div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>
              Live Fireplace Chat
            </h3>
            <p style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--text-secondary)", margin: 0 }}>
              Direct messaging powered by real-time WebSockets. See typing status and read receipts instantly.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            style={{
              padding: "26px",
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "14px" }}>🔔</div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px", color: "var(--text-primary)" }}>
              Warm Notifications
            </h3>
            <p style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--text-secondary)", margin: 0 }}>
              Live toast alerts whenever someone roasts your post, replies to your comment, or follows you.
            </p>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div
          style={{
            marginTop: "60px",
            textAlign: "center",
            padding: "36px 24px",
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 10px", color: "var(--text-primary)" }}>
            Ready to pull up a chair?
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 auto 20px", maxWidth: "460px" }}>
            Join thousands of cozy conversations today. It takes less than 30 seconds to get started.
          </p>
          <Link
            to="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
              boxShadow: "0 4px 14px rgba(201, 107, 50, 0.3)",
            }}
          >
            <span>Create Your Account</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
