"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

/**
 * Confirms the password, then saves the ZIP the server returns. Done with fetch
 * rather than a plain form post, so a refusal shows as a message on this page
 * instead of navigating to a bare error response.
 */
export function BackupForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function download(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDone(null);

    try {
      const body = new FormData();
      body.set("password", password);
      const response = await fetch("/admin/backup/download", {
        method: "POST",
        body,
        credentials: "same-origin",
      });

      if (
        !response.ok ||
        response.headers.get("Content-Type") !== "application/zip"
      ) {
        const message = await response
          .json()
          .then((data: { error?: string }) => data.error)
          .catch(() => null);
        setError(
          message ?? "The backup could not be downloaded. Please try again.",
        );
        return;
      }

      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ?? "swarangan-backup.zip";
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      setPassword("");
      setDone(`Downloaded ${filename}.`);
    } catch {
      setError("Could not reach the server. Please check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={download}
      className="border-sand-200 space-y-4 border-t pt-5"
    >
      {/* Lets password managers match the account being confirmed. */}
      <input
        type="hidden"
        name="username"
        autoComplete="username"
        value={email}
      />
      <Field
        label="Confirm your password"
        hint="Asked every time, so only you can download students' details."
        error={error ?? undefined}
        required
      >
        {(control) => (
          <TextInput
            {...control}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy || password.length === 0}>
          {busy ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="size-4" />
          )}
          {busy ? "Preparing backup…" : "Download backup"}
        </Button>
        {done && (
          <p role="status" className="text-sm text-green-800">
            {done}
          </p>
        )}
      </div>
    </form>
  );
}
