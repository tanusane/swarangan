"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Maximum tilt in degrees. Small on purpose — this should read as depth, not a toy. */
const MAX_TILT = 5;

interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

/**
 * A card that tilts very slightly towards the pointer.
 *
 * Always renders a div. Callers that need a semantic list item or article wrap
 * this in one (usually via <Reveal as="li">), which keeps the ref typing sound.
 *
 * Written with direct style writes rather than state so the move handler never
 * re-renders on mousemove. Touch devices get no tilt at all (there is no hover
 * to respond to), and the transform is reverted on leave.
 */
export function TiltCard({ children, className, ...rest }: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = node.getBoundingClientRect();
    // -0.5..0.5 from the centre of the card on each axis.
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    node.style.transform =
      `perspective(900px) rotateY(${px * MAX_TILT * 2}deg) ` +
      `rotateX(${-py * MAX_TILT * 2}deg) translateZ(0)`;
  }

  function reset() {
    const node = ref.current;
    if (node) node.style.transform = "";
  }

  return (
    <div
      {...rest}
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      className={cn(
        "transition-[transform,box-shadow] duration-300 ease-(--ease-swar) will-change-transform",
        className,
      )}
    >
      {children}
    </div>
  );
}
