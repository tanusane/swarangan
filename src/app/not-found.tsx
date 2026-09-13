import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="This note isn't in our raga"
      actions={
        <>
          <ButtonLink href="/">Go to the home page</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact us
          </ButtonLink>
        </>
      }
    >
      The page you were looking for has moved or no longer exists.
    </StatusPage>
  );
}
