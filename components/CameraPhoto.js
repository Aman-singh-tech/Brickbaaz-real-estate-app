"use client";

import { useEffect, useRef, useState } from "react";
import Sheet from "@/components/Sheet";
import { Icon, btn } from "@/components/ui";

export default function CameraPhoto({ onPhoto, disabled }) {
  const nativeInput = useRef(null);
  const video = useRef(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!open) return;
    let disposed = false,
      stream;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error(
            "Camera access needs a supported browser and HTTPS. You can still use Add photos.",
          );
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();
        if (!disposed) setReady(true);
      } catch (e) {
        if (!disposed)
          setError(
            e.name === "NotAllowedError"
              ? "Camera permission was denied. Allow camera access in your browser, or use Add photos."
              : e.name === "NotFoundError"
                ? "No camera found. Connect a camera or use Add photos."
                : e.name === "NotReadableError"
                  ? "Camera is busy. Close other apps using it and try again."
                  : e.message ||
                    "Unable to open the camera. Use Add photos instead.",
          );
      }
    }
    start();
    return () => {
      disposed = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [open]);

  async function capture() {
    if (!ready || !video.current?.videoWidth || capturing) return;
    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.current.videoWidth;
      canvas.height = video.current.videoHeight;
      canvas.getContext("2d").drawImage(video.current, 0, 0);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      if (!blob)
        throw new Error("Could not capture a photo. Please try again.");
      setOpen(false);
      onPhoto(
        new File([blob], `property-camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <>
      <input
        ref={nativeInput}
        aria-label="Take property photo"
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPhoto(file);
        }}
      />
      <button
        type="button"
        disabled={disabled}
        className={btn("outline", "w-full")}
        onClick={() => {
          if (window.matchMedia("(pointer: coarse)").matches) {
            nativeInput.current?.click();
            return;
          }
          setError("");
          setReady(false);
          setOpen(true);
        }}
      >
        <Icon name="camera" className="h-4 w-4" />
        Take photo
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Take a property photo"
        footer={
          <button
            type="button"
            disabled={!ready || capturing || !!error}
            className={btn("brand", "w-full")}
            onClick={capture}
          >
            {capturing ? "Capturing…" : "Capture photo"}
          </button>
        }
      >
        <video
          ref={video}
          muted
          playsInline
          autoPlay
          aria-label="Camera preview"
          className="aspect-video w-full rounded-xl bg-black"
        />
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        ) : (
          <p role="status" className="mt-3 text-sm text-mute">
            {ready
              ? "Position the camera, then capture your photo."
              : "Opening camera…"}
          </p>
        )}
      </Sheet>
    </>
  );
}
