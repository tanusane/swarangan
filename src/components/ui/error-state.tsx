"use client";

import { useEffect, type ReactNode } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

/** The body of every error.tsx: log the error, explain, offer retry and a way out. */
export function ErrorState({
  error,
  retry,
  title,
  back,
  children,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title: string;
  back: { href: "/" | "/admin"; label: string };
  children: ReactNode;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      eyebrow="Something went wrong"
      title={title}
      showLogo={false}
      actions={
        <>
          <Button onClick={() => retry()}>Try again</Button>
          <ButtonLink href={back.href} variant="secondary">
            {back.label}
          </ButtonLink>
        </>
      }
    >
      {children}
    </StatusPage>
  );
}
