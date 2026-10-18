import { useState, useEffect, useRef } from "react";
import type { UserProfile, UserProfileUpdateDto } from "../types/user";
import { usersApi } from "../api/users";
import { useAuth } from "../context/AuthContext";

interface EditProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onProfileUpdated: (updated: UserProfile) => void;
}

const MAX_NAME_LENGTH = 50;
const MAX_USERNAME_LENGTH = 30;
const MAX_BIO_LENGTH = 250;

export function EditProfileModal({
  isOpen,
  profile,
  onClose,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { updateUser } = useAuth();

  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [birthdate, setBirthdate] = useState(profile.birthdate ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement | null>(null);

  // Sync state if initial profile changes
  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
      setBirthdate(profile.birthdate ?? "");
      setError(null);
    }
  }, [isOpen, profile]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const trimmedName = name.trim();
  const trimmedUsername = username.trim();
  const trimmedBio = bio.trim();

  // Validate form
  const isNameValid = trimmedName.length > 0 && trimmedName.length <= MAX_NAME_LENGTH;
  const isUsernameValid =
    trimmedUsername.length === 0 ||
    (/^[a-zA-Z0-9_]+$/.test(trimmedUsername) &&
      trimmedUsername.length <= MAX_USERNAME_LENGTH);
  const isBioValid = bio.length <= MAX_BIO_LENGTH;
  const isBirthdateValid = Boolean(birthdate);

  const hasChanges =
    trimmedName !== profile.name ||
    trimmedUsername !== (profile.username ?? "") ||
    trimmedBio !== (profile.bio ?? "") ||
    birthdate !== (profile.birthdate ?? "");

  const canSubmit =
    isNameValid &&
    isUsernameValid &&
    isBioValid &&
    isBirthdateValid &&
    hasChanges &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    const payload: UserProfileUpdateDto = {
      name: trimmedName,
      username: trimmedUsername.length > 0 ? trimmedUsername : null,
      bio: trimmedBio.length > 0 ? trimmedBio : null,
      birthdate,
    };

    try {
      const updatedProfile = await usersApi.updateMyProfile(payload);
      // Synchronize in auth context
      updateUser({
        name: updatedProfile.name,
        username: updatedProfile.username,
        bio: updatedProfile.bio,
        birthdate: updatedProfile.birthdate,
      });
      // Synchronize in profile page
      onProfileUpdated(updatedProfile);
      onClose();
    } catch (err: any) {
      const respData = err.response?.data;
      const message =
        typeof respData === "string"
          ? respData
          : respData?.message ||
            respData?.title ||
            "Failed to update profile. Please check your inputs.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "#fff",
          borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "scaleIn 0.18s ease-out",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #e4e6eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "#1c1e21",
            }}
          >
            Edit Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              color: "#65676b",
              padding: "4px 8px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f2f5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          {error && (
            <div
              style={{
                backgroundColor: "#ffebe8",
                color: "#e02424",
                border: "1px solid #f97583",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* Full Name */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <label
                htmlFor="edit-name-input"
                style={{ fontSize: 13, fontWeight: 600, color: "#1c1e21" }}
              >
                Full Name <span style={{ color: "#e02424" }}>*</span>
              </label>
              <span style={{ fontSize: 11, color: "#65676b" }}>
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
            <input
              id="edit-name-input"
              type="text"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 12px",
                fontSize: 14,
                borderRadius: 8,
                border: !isNameValid && name.length > 0 ? "1px solid #e02424" : "1px solid #ccd0d5",
                outline: "none",
              }}
            />
          </div>

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <label
                htmlFor="edit-username-input"
                style={{ fontSize: 13, fontWeight: 600, color: "#1c1e21" }}
              >
                Username
              </label>
              <span style={{ fontSize: 11, color: "#65676b" }}>
                {username.length}/{MAX_USERNAME_LENGTH}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 8,
                border: !isUsernameValid && username.length > 0 ? "1px solid #e02424" : "1px solid #ccd0d5",
                overflow: "hidden",
                backgroundColor: "#fff",
              }}
            >
              <span
                style={{
                  padding: "8px 10px",
                  backgroundColor: "#f0f2f5",
                  color: "#65676b",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRight: "1px solid #ccd0d5",
                }}
              >
                @
              </span>
              <input
                id="edit-username-input"
                type="text"
                value={username}
                maxLength={MAX_USERNAME_LENGTH}
                placeholder="your_handle"
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: 14,
                  border: "none",
                  outline: "none",
                }}
              />
            </div>
            <small style={{ color: "#65676b", fontSize: 11, marginTop: 4, display: "block" }}>
              Letters, numbers, and underscores only.
            </small>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <label
                htmlFor="edit-bio-input"
                style={{ fontSize: 13, fontWeight: 600, color: "#1c1e21" }}
              >
                Bio
              </label>
              <span style={{ fontSize: 11, color: bio.length > MAX_BIO_LENGTH ? "#e02424" : "#65676b" }}>
                {bio.length}/{MAX_BIO_LENGTH}
              </span>
            </div>
            <textarea
              id="edit-bio-input"
              value={bio}
              maxLength={MAX_BIO_LENGTH}
              rows={3}
              placeholder="Tell others about yourself..."
              onChange={(e) => setBio(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 12px",
                fontSize: 14,
                lineHeight: 1.4,
                borderRadius: 8,
                border: "1px solid #ccd0d5",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Birthday */}
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="edit-birthdate-input"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#1c1e21",
                marginBottom: 6,
              }}
            >
              Birthday <span style={{ color: "#e02424" }}>*</span>
            </label>
            <input
              id="edit-birthdate-input"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 12px",
                fontSize: 14,
                borderRadius: 8,
                border: "1px solid #ccd0d5",
                outline: "none",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              paddingTop: 12,
              borderTop: "1px solid #e4e6eb",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "8px 16px",
                backgroundColor: "#e4e6eb",
                color: "#050505",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: "8px 20px",
                backgroundColor: canSubmit ? "#1877f2" : "#94b8ea",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                cursor: canSubmit ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
