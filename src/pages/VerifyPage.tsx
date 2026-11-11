import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MarshmallowLogo } from "../components/MarshmallowLogo";
import { MarshmallowLoader } from "../components/MarshmallowLoader";
import { mediaApi } from "../api/media";
import { usersApi } from "../api/users";
import { getMediaUrl } from "../utils/media";

export default function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();
  const { verify, user, updateUser } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const hasCalledVerify = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage(
        "Missing verification token. Please check the link in your email or request a new one.",
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await mediaApi.upload(file, "avatars");
      setAvatarUrl(url);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await mediaApi.upload(file, "covers");
      setCoverUrl(url);
    } catch (err) {
      console.error("Cover upload failed:", err);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      navigate("/feed", { replace: true });
      return;
    }

    setSaving(true);
    try {
      await usersApi.updateMyProfile({
        name: user.name,
        username: user.username,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl || null,
        coverUrl: coverUrl || null,
        birthdate: user.birthdate,
      });

      updateUser({
        bio: bio.trim() || null,
        avatarUrl: avatarUrl || null,
        coverUrl: coverUrl || null,
      });
    } catch (err) {
      console.error("Profile update error:", err);
    } finally {
      setSaving(false);
      navigate("/feed", { replace: true });
    }
  };

  return (
    <div
      className="verify-page-container"
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--bg-page)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "calc(56px + clamp(16px, 4vh, 36px))",
        paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
        paddingLeft: "clamp(12px, 3.5vw, 24px)",
        paddingRight: "clamp(12px, 3.5vw, 24px)",
        boxSizing: "border-box",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Warm Ambient Glow */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(600px, 100vw)",
          height: "360px",
          background:
            "radial-gradient(ellipse at center, rgba(201, 107, 50, 0.16) 0%, rgba(245, 158, 11, 0.06) 45%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="verify-page-card"
        style={{
          maxWidth: status === "success" ? "520px" : "460px",
          width: "100%",
          backgroundColor: "var(--bg-card)",
          borderRadius: "clamp(18px, 4vw, 24px)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          margin: "auto 0",
          zIndex: 1,
          boxSizing: "border-box",
          transition: "max-width 0.2s ease",
        }}
      >
        {/* Loading State */}
        {status === "loading" && (
          <div style={{ padding: "48px clamp(16px, 5vw, 36px)" }}>
            <MarshmallowLoader
              size="md"
              label="Verifying your email..."
              sublabel="Pulling up your chair by the campfire..."
            />
          </div>
        )}

        {/* Success State: Friendly "Customize Your Look" Card */}
        {status === "success" && (
          <div>
            {/* Cover Banner Preview */}
            <div
              style={{
                height: "clamp(110px, 24vw, 135px)",
                width: "100%",
                backgroundColor: "var(--primary-light, #FAF4EB)",
                backgroundImage: coverUrl
                  ? `url(${getMediaUrl(coverUrl)})`
                  : "linear-gradient(135deg, rgba(201, 107, 50, 0.22) 0%, rgba(233, 185, 124, 0.32) 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                padding: "10px 12px",
                boxSizing: "border-box",
              }}
            >
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                aria-label="Add or change banner"
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(0, 0, 0, 0.65)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                  minHeight: 32,
                }}
              >
                <span>📷</span>
                <span>
                  {uploadingCover
                    ? "Uploading..."
                    : coverUrl
                    ? "Change Banner"
                    : "Add Cover"}
                </span>
              </button>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleCoverChange}
              />
            </div>

            {/* Avatar Centered Overlap */}
            <div
              style={{
                position: "relative",
                marginTop: "clamp(-44px, -11vw, -50px)",
                display: "inline-block",
              }}
            >
              <div
                style={{
                  width: "clamp(88px, 22vw, 102px)",
                  height: "clamp(88px, 22vw, 102px)",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-light, #FAF4EB)",
                  border: "4px solid var(--bg-card)",
                  boxShadow: "var(--shadow-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  margin: "0 auto",
                  position: "relative",
                }}
              >
                {uploadingAvatar ? (
                  <MarshmallowLoader size="sm" />
                ) : avatarUrl ? (
                  <img
                    src={getMediaUrl(avatarUrl)}
                    alt="Custom Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <MarshmallowLogo size={62} />
                )}
              </div>

              {/* Upload Avatar Badge Button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Change Avatar"
                title="Change Avatar"
                style={{
                  position: "absolute",
                  bottom: "1px",
                  right: "1px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  border: "3px solid var(--bg-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "15px",
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.25)",
                }}
              >
                📷
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>

            <div
              style={{
                padding: "0 clamp(16px, 4vw, 28px) 24px",
                boxSizing: "border-box",
              }}
            >
              {/* Verified Pill Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(34, 197, 94, 0.12)",
                  color: "#16a34a",
                  fontSize: "12px",
                  fontWeight: 700,
                  margin: "12px auto 4px",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Email Verified!</span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(20px, 4.5vw, 24px)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: "8px 0 6px",
                  lineHeight: 1.25,
                  wordBreak: "break-word",
                }}
              >
                Welcome, {user?.name || "Friend"}! 🎉
              </h1>

              <p
                style={{
                  fontSize: "clamp(13px, 3.2vw, 14px)",
                  color: "var(--text-secondary)",
                  margin: "0 auto 18px",
                  lineHeight: 1.5,
                  maxWidth: "420px",
                }}
              >
                Your account @{user?.username || "handle"} is verified. You can
                customize your avatar and bio now, or jump straight in!
              </p>

              {/* Bio Input */}
              <div style={{ textAlign: "left", marginBottom: "18px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <label
                    htmlFor="onboarding-bio"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    Bio{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        color: "var(--text-tertiary)",
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {bio.length}/160
                  </span>
                </div>
                <textarea
                  id="onboarding-bio"
                  placeholder="Share a thought, your favorite campfire snack, or what brings you here..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  maxLength={160}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "15px",
                    lineHeight: "1.4",
                    boxSizing: "border-box",
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s ease",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving || uploadingAvatar || uploadingCover}
                  style={{
                    width: "100%",
                    minHeight: 46,
                    padding: "12px 20px",
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
                    transition: "transform 0.15s ease, opacity 0.15s ease",
                    opacity: saving ? 0.8 : 1,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-1px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  {saving ? (
                    <MarshmallowLoader size="sm" label="Saving profile..." />
                  ) : (
                    <>
                      <span>Save &amp; Enter Feed</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/feed", { replace: true })}
                  disabled={saving}
                  style={{
                    width: "100%",
                    minHeight: 40,
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary)",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "8px",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--primary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-tertiary)")
                  }
                >
                  Skip for now →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div
            style={{
              padding: "36px clamp(16px, 5vw, 32px)",
              boxSizing: "border-box",
            }}
          >
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
                fontSize: "clamp(20px, 4.5vw, 22px)",
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
                margin: "0 auto 24px",
                maxWidth: "380px",
              }}
            >
              {message}
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  width: "100%",
                  minHeight: 44,
                  padding: "12px 20px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(201, 107, 50, 0.3)",
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
