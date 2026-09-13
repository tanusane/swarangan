"use client";

import { ImageUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  ACCEPTED_IMAGE_TYPES,
  galleryPhotoPath,
  prepareImage,
  rejectReason,
  uploadToMedia,
} from "@/lib/media/upload-client";

import { addPhoto } from "./actions";

/**
 * Add photos to one album. Several can be chosen at once; each is resized in
 * the browser, uploaded straight to Storage, then recorded by `addPhoto`.
 * Captions and descriptions are edited on each photo afterwards.
 */
export function PhotoUploader({
  albumKey,
  albumTitle,
}: {
  albumKey: string;
  albumTitle: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function upload(files: FileList) {
    const problems: string[] = [];
    const list = Array.from(files);

    for (const [index, file] of list.entries()) {
      setProgress(`Uploading ${index + 1} of ${list.length}…`);
      const reason = rejectReason(file);
      if (reason) {
        problems.push(reason);
        continue;
      }
      try {
        const { blob, width, height } = await prepareImage(file);
        const storagePath = galleryPhotoPath(albumKey);
        await uploadToMedia(storagePath, blob);
        const result = await addPhoto({
          albumKey,
          storagePath,
          width,
          height,
          alt: `${albumTitle} — photo`,
        });
        if (!result.ok) problems.push(`${file.name}: ${result.error}`);
      } catch (error) {
        problems.push(
          `${file.name}: ${error instanceof Error ? error.message : "upload failed"}`,
        );
      }
    }

    setErrors(problems);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <label
        className={
          "border-magenta-300 hover:bg-magenta-50 inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed px-4 py-2 text-sm text-blue-800 transition-colors" +
          (progress ? " pointer-events-none opacity-60" : "")
        }
      >
        {progress ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <ImageUp aria-hidden="true" className="size-4" />
        )}
        {progress ?? "Add photos"}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          disabled={progress !== null}
          onChange={(event) => {
            if (event.target.files?.length) void upload(event.target.files);
          }}
        />
      </label>
      {errors.length > 0 && (
        <ul role="alert" className="text-magenta-800 space-y-1 text-sm">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
