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
      style={{
        minHeight: "calc(100vh - 60px)",
        backgroundColor: "var(--bg-page)",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          maxWidth: status === "success" ? "540px" : "480px",
          width: "100%",
          padding: status === "success" ? "0 0 28px 0" : "36px 30px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          transition: "max-width 0.2s ease",
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

        {/* Success State: Friendly "Customize Your Look" Card */}
        {status === "success" && (
          <div>
            {/* Cover Banner Preview */}
            <div
              style={{
                height: "120px",
                width: "100%",
                backgroundColor: "var(--primary-light, #FAF4EB)",
                backgroundImage: coverUrl
                  ? `url(${getMediaUrl(coverUrl)})`
                  : "linear-gradient(135deg, rgba(201, 107, 50, 0.2) 0%, rgba(233, 185, 124, 0.3) 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                padding: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(0, 0, 0, 0.65)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backdropFilter: "blur(4px)",
                }}
              >
                <span>📷</span>
                <span>{uploadingCover ? "Uploading..." : coverUrl ? "Change Banner" : "Add Cover"}</span>
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
                marginTop: "-50px",
                display: "inline-block",
              }}
            >
              <div
                style={{
                  width: "100px",
                  height: "100px",
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
                  <MarshmallowLogo size={70} />
                )}
              </div>

              {/* Upload Avatar Badge Button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Change Avatar"
                style={{
                  position: "absolute",
                  bottom: "2px",
                  right: "2px",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  border: "2px solid var(--bg-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "14px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
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

            <div style={{ padding: "0 28px" }}>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: "12px 0 4px",
                }}
              >
                Welcome, {user?.name || "Friend"}! 🎉
              </h1>

              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  margin: "0 0 20px",
                }}
              >
                Your account @{user?.username || "handle"} is verified. Customize your look or jump straight in with the classic marshmallow!
              </p>

              {/* Bio Input */}
              <div style={{ textAlign: "left", marginBottom: "20px" }}>
                <label
                  htmlFor="onboarding-bio"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "6px",
                  }}
                >
                  Bio (optional)
                </label>
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
                    fontSize: "13px",
                    boxSizing: "border-box",
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving || uploadingAvatar || uploadingCover}
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
                  {saving ? (
                    <MarshmallowLoader size="sm" label="Saving profile..." />
                  ) : (
                    <>
                      <span>Save & Enter Feed</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/feed", { replace: true })}
                  disabled={saving}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "8px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                >
                  Skip for now →
                </button>
              </div>
            </div>
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
