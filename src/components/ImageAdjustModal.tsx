import { useState, useRef, useEffect, useCallback } from "react";

export interface ImageAdjustModalProps {
  isOpen: boolean;
  imageSrc: string;
  fileName?: string;
  aspectRatio?: number; // e.g. 1 for avatar, 2.6 for cover, 0 or undefined for original
  cropShape?: "round" | "rect";
  title?: string;
  allowAspectChange?: boolean;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
  onSkipCrop?: () => void;
}

export function ImageAdjustModal({
  isOpen,
  imageSrc,
  fileName = "adjusted-image.jpg",
  aspectRatio: initialAspect,
  cropShape = "rect",
  title = "Adjust Image",
  allowAspectChange = false,
  onConfirm,
  onCancel,
  onSkipCrop,
}: ImageAdjustModalProps) {
  const [aspect, setAspect] = useState(initialAspect || 1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Sync aspect when prop changes
  useEffect(() => {
    if (initialAspect) {
      setAspect(initialAspect);
    }
  }, [initialAspect]);

  // Load natural dimensions of the image
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const naturalAspect = img.naturalWidth / img.naturalHeight;
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      if (!initialAspect) {
        setAspect(naturalAspect);
      }
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
  }, [isOpen, imageSrc, initialAspect]);

  // Determine crop box viewport dimensions inside container
  // Max container box: width 440px, height 360px
  const maxCropW = 440;
  const maxCropH = 340;
  let cropW = maxCropW;
  let cropH = cropW / aspect;
  if (cropH > maxCropH) {
    cropH = maxCropH;
    cropW = cropH * aspect;
  }

  // Base scale calculation so the image covers the crop window
  const getMinScale = useCallback(() => {
    if (!naturalSize) return 1;
    return Math.max(cropW / naturalSize.width, cropH / naturalSize.height);
  }, [naturalSize, cropW, cropH]);

  const minScale = getMinScale();
  const currentScale = minScale * zoom;

  // Max pan constraints so the image never exposes empty borders inside the crop window
  const renderedW = (naturalSize?.width ?? 0) * currentScale;
  const renderedH = (naturalSize?.height ?? 0) * currentScale;
  const maxPanX = Math.max(0, (renderedW - cropW) / 2);
  const maxPanY = Math.max(0, (renderedH - cropH) / 2);

  // Helper to clamp pan
  const clampPan = useCallback(
    (x: number, y: number) => {
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, y)),
      };
    },
    [maxPanX, maxPanY]
  );

  // Re-clamp pan if zoom or aspect changes
  useEffect(() => {
    setPan((prev) => clampPan(prev.x, prev.y));
  }, [clampPan]);

  // Mouse / Touch handlers for panning
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    setPan(clampPan(rawX, rawY));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Prevent background page scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Non-passive wheel listener on container to zoom without scrolling the browser page
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isOpen) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomDelta = -e.deltaY * 0.002;
      setZoom((prev) => Math.max(1, Math.min(3, prev + zoomDelta)));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [isOpen]);

  // Keyboard navigation for Escape and Arrow keys
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "ArrowLeft") {
        setPan((prev) => clampPan(prev.x - 10, prev.y));
      } else if (e.key === "ArrowRight") {
        setPan((prev) => clampPan(prev.x + 10, prev.y));
      } else if (e.key === "ArrowUp") {
        setPan((prev) => clampPan(prev.x, prev.y - 10));
      } else if (e.key === "ArrowDown") {
        setPan((prev) => clampPan(prev.x, prev.y + 10));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, clampPan]);

  // Export cropped image via HTML5 Canvas
  const handleApply = async () => {
    if (!naturalSize || !imageRef.current) return;
    setIsProcessing(true);

    try {
      const exportWidth = Math.min(1600, Math.round(cropW * 2.5));
      const exportHeight = Math.round(exportWidth / aspect);

      const canvas = document.createElement("canvas");
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not get canvas context");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Calculate source image crop coordinates
      const sourceCropW = cropW / currentScale;
      const sourceCropH = cropH / currentScale;
      const sourceX = naturalSize.width / 2 - pan.x / currentScale - sourceCropW / 2;
      const sourceY = naturalSize.height / 2 - pan.y / currentScale - sourceCropH / 2;

      ctx.drawImage(
        imageRef.current,
        sourceX,
        sourceY,
        sourceCropW,
        sourceCropH,
        0,
        0,
        exportWidth,
        exportHeight
      );

      // Determine output mime type
      const isPng = fileName.toLowerCase().endsWith(".png");
      const mimeType = isPng ? "image/png" : "image/jpeg";
      const quality = isPng ? undefined : 0.92;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          const croppedFile = new File([blob], fileName, { type: mimeType });
          onConfirm(croppedFile);
          setIsProcessing(false);
        },
        mimeType,
        quality
      );
    } catch {
      setIsProcessing(false);
      alert("Failed to process image. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(4px)",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        userSelect: "none",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: "#242526",
          borderRadius: 14,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          color: "#e4e6eb",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>✂️</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#e4e6eb",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: isProcessing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Aspect Ratio Selector (if enabled) */}
        {allowAspectChange && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 20px 4px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              ...(naturalSize
                ? [{ label: "Original", value: naturalSize.width / naturalSize.height }]
                : []),
              { label: "1:1 Square", value: 1 },
              { label: "4:3 Classic", value: 4 / 3 },
              { label: "16:9 Wide", value: 16 / 9 },
              { label: "4:5 Portrait", value: 4 / 5 },
            ].map((opt) => {
              const isSelected = Math.abs(aspect - opt.value) < 0.05;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setAspect(opt.value);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  style={{
                    backgroundColor: isSelected ? "#1877f2" : "rgba(255, 255, 255, 0.08)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Viewport / Canvas Container */}
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: "100%",
            height: 380,
            backgroundColor: "#18191a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            userSelect: "none",
            touchAction: "none",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Hidden reference image for natural dimensions & canvas export */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              width: naturalSize ? naturalSize.width * currentScale : "auto",
              height: naturalSize ? naturalSize.height * currentScale : "auto",
              maxWidth: "none",
              maxHeight: "none",
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              pointerEvents: "none",
              transition: isDragging ? "none" : "transform 0.05s ease-out",
            }}
          />

          {/* Crop Boundary Mask Box */}
          <div
            style={{
              position: "relative",
              width: cropW,
              height: cropH,
              borderRadius: cropShape === "round" ? "50%" : 8,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
              border: "2px solid rgba(255, 255, 255, 0.85)",
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            {/* Rule of Thirds Grid Guidelines */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridTemplateRows: "1fr 1fr 1fr",
                pointerEvents: "none",
                opacity: isDragging ? 0.45 : 0.2,
                transition: "opacity 0.2s ease",
              }}
            >
              <div style={{ borderRight: "1px dashed #fff", borderBottom: "1px dashed #fff" }} />
              <div style={{ borderRight: "1px dashed #fff", borderBottom: "1px dashed #fff" }} />
              <div style={{ borderBottom: "1px dashed #fff" }} />
              <div style={{ borderRight: "1px dashed #fff", borderBottom: "1px dashed #fff" }} />
              <div style={{ borderRight: "1px dashed #fff", borderBottom: "1px dashed #fff" }} />
              <div style={{ borderBottom: "1px dashed #fff" }} />
              <div style={{ borderRight: "1px dashed #fff" }} />
              <div style={{ borderRight: "1px dashed #fff" }} />
              <div />
            </div>
          </div>

          {/* Hint Overlay */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              padding: "4px 12px",
              borderRadius: 14,
              fontSize: 11,
              color: "rgba(255, 255, 255, 0.8)",
              pointerEvents: "none",
              backdropFilter: "blur(2px)",
            }}
          >
            Drag to reposition • Scroll to zoom
          </div>
        </div>

        {/* Controls Bar: Zoom Slider + Reset */}
        <div
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Zoom Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
              title="Zoom out"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "#fff",
                borderRadius: "50%",
                width: 28,
                height: 28,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              –
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
              style={{
                flex: 1,
                cursor: "pointer",
                accentColor: "#1877f2",
              }}
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
              title="Zoom in"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "#fff",
                borderRadius: "50%",
                width: 28,
                height: 28,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              +
            </button>

            <span style={{ fontSize: 12, color: "#b0b3b8", minWidth: 36, textAlign: "right" }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Reset position button */}
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            title="Reset position & zoom"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#e4e6eb",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10,
          }}
        >
          {onSkipCrop && (
            <button
              type="button"
              onClick={onSkipCrop}
              disabled={isProcessing}
              title="Attach without cropping or adjustments"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                color: "#e4e6eb",
                border: "none",
                borderRadius: 6,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: 14,
                cursor: isProcessing ? "not-allowed" : "pointer",
                marginRight: "auto",
                transition: "background-color 0.15s ease",
              }}
            >
              Use Original
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontWeight: 600,
              fontSize: 14,
              cursor: isProcessing ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            style={{
              backgroundColor: "#1877f2",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 22px",
              fontWeight: 600,
              fontSize: 14,
              cursor: isProcessing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isProcessing ? "Processing..." : "Apply & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
