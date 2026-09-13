"use client";

import { ImageUp, Loader2, RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import {
  slotStoragePath,
  type ResolvedSlot,
  type SlotKey,
} from "@/lib/media/slots";
import {
  ACCEPTED_IMAGE_TYPES,
  prepareImage,
  rejectReason,
  uploadToMedia,
} from "@/lib/media/upload-client";

import { resetSlot, saveSlot } from "./actions";

interface SlotEditorProps {
  slotKey: SlotKey;
  label: string;
  where: string;
  aspect: number;
  current: ResolvedSlot;
  currentPath: string | null;
  currentFocal: { x: number; y: number };
}

export function SlotEditor({
  slotKey,
  label,
  where,
  aspect,
  current,
  currentPath,
  currentFocal,
}: SlotEditorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [alt, setAlt] = useState(current.replaced ? current.alt : "");
  const [focal, setFocal] = useState(currentFocal);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  // Release the object URL for a discarded preview.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const shownSrc = previewUrl ?? current.src;
  const dirty =
    file !== null ||
    (current.replaced &&
      (alt !== current.alt ||
        focal.x !== currentFocal.x ||
        focal.y !== currentFocal.y));

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setStatus(null);
    const chosen = event.target.files?.[0];
    if (!chosen) return;

    const reason = rejectReason(chosen);
    if (reason) {
      setError(reason);
      return;
    }

    setFile(chosen);
    setPreviewUrl(URL.createObjectURL(chosen));
    setFocal({ x: 0.5, y: 0.3 });
  }

  /** Click on the preview to choose the part of the photo kept in frame. */
  function pickFocal(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setFocal({
      x: Math.round(((event.clientX - rect.left) / rect.width) * 100) / 100,
      y: Math.round(((event.clientY - rect.top) / rect.height) * 100) / 100,
    });
  }

  function save() {
    setError(null);
    setStatus(null);

    startTransition(async () => {
      try {
        let storagePath = currentPath;

        if (file) {
          setStatus("Resizing…");
          const { blob } = await prepareImage(file);

          setStatus("Uploading…");
          storagePath = slotStoragePath(slotKey, new Date());
          await uploadToMedia(storagePath, blob);
        }

        if (!storagePath) {
          setError("Choose a photo first.");
          setStatus(null);
          return;
        }

        setStatus("Saving…");
        const result = await saveSlot({
          key: slotKey,
          storagePath,
          alt,
          focalX: focal.x,
          focalY: focal.y,
        });
        if (!result.ok) throw new Error(result.error);

        setFile(null);
        setPreviewUrl(null);
        if (inputRef.current) inputRef.current.value = "";
        setStatus("Saved. The website now shows this photo.");
        router.refresh();
      } catch (caught) {
        setStatus(null);
        setError(
          caught instanceof Error
            ? caught.message
            : "Something went wrong. Please try again.",
        );
      }
    });
  }

  function reset() {
    if (
      !window.confirm("Go back to the original photo that came with the site?")
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resetSlot(slotKey);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAlt("");
      setFocal({ x: 0.5, y: 0.3 });
      setStatus("Restored the original photo.");
      router.refresh();
    });
  }

  return (
    <section className="border-sand-300 rounded-(--radius-card) border bg-white p-6">
      <div className="grid gap-8 md:grid-cols-[minmax(0,18rem)_1fr]">
        <div>
          {/* The preview is cropped exactly as the website will crop it. */}
          <button
            type="button"
            onClick={pickFocal}
            aria-label="Click the part of the photo that should stay in frame"
            className="bg-sand-200 relative block w-full cursor-crosshair overflow-hidden rounded-lg"
            style={{ aspectRatio: aspect }}
          >
            {/* A plain img: the preview may be a local object URL that
                next/image cannot optimise. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shownSrc}
              alt=""
              className="absolute inset-0 size-full object-cover"
              style={{
                objectPosition: `${focal.x * 100}% ${focal.y * 100}%`,
              }}
            />
            <span
              aria-hidden="true"
              className="border-magenta-600 absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white/60 shadow"
              style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
            />
          </button>
          <p className="text-ink-muted mt-2 text-xs">
            {current.replaced || file
              ? "Click the photo to choose what stays in frame."
              : "Showing the original photo that came with the site."}
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <h2 className="text-xl">{label}</h2>
            <p className="text-ink-muted text-sm">{where}</p>
          </div>

          <div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              onChange={choose}
              className="sr-only"
              id={`upload-${slotKey}`}
            />
            <label
              htmlFor={`upload-${slotKey}`}
              className="border-sand-300 hover:border-magenta-600 inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm text-blue-800 transition-colors"
            >
              <ImageUp aria-hidden="true" className="size-4" />
              {file ? "Choose a different photo" : "Choose a new photo"}
            </label>
            {file && <p className="text-ink-muted mt-2 text-xs">{file.name}</p>}
          </div>

          {(current.replaced || file) && (
            <Field
              label="Describe the photo"
              required
              hint="Read aloud to visitors using screen readers, and used by search engines. E.g. “Tanuja Sane singing with her tanpura”."
            >
              {(props) => (
                <TextInput
                  {...props}
                  value={alt}
                  onChange={(event) => setAlt(event.target.value)}
                  maxLength={250}
                />
              )}
            </Field>
          )}

          {error && (
            <p
              role="alert"
              className="bg-magenta-50 text-magenta-800 rounded-lg px-3 py-2 text-sm"
            >
              {error}
            </p>
          )}
          {status && (
            <p role="status" className="text-ink-muted text-sm">
              {status}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={save} disabled={busy || !dirty}>
              {busy ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="size-4" />
              )}
              Save
            </Button>
            {current.replaced && (
              <Button variant="ghost" onClick={reset} disabled={busy}>
                <RotateCcw aria-hidden="true" className="size-4" />
                Restore original
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
