"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type StatusButtonStatus = "idle" | "pending" | "success" | "error";

const ICONS: Record<StatusButtonStatus, ReactNode> = {
  idle: <Send className="size-[1em] shrink-0" />,
  pending: <Loader2 className="size-[1em] shrink-0 animate-spin" />,
  success: (
    <CheckCircle2 className="size-[1em] shrink-0 text-emerald-400 dark:text-emerald-600" />
  ),
  error: (
    <AlertCircle className="size-[1em] shrink-0 text-red-400 dark:text-red-600" />
  ),
};

interface StatusButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  status: StatusButtonStatus;
  label: string;
}

type Frame = { id: number; status: StatusButtonStatus; label: string };
type FrameState = { key: string; frames: Frame[] };

const frameKey = (status: StatusButtonStatus, label: string) =>
  `${status}:${label}`;

const EXIT_MS = 300;

export function StatusButton({
  status,
  label,
  className,
  disabled,
  ...props
}: StatusButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const liveFrameRef = useRef<HTMLSpanElement>(null);
  const hasMeasured = useRef(false);

  const key = frameKey(status, label);
  const [state, setState] = useState<FrameState>(() => ({
    key,
    frames: [{ id: 0, status, label }],
  }));
  if (state.key !== key) {
    setState((prev) =>
      prev.key === key
        ? prev
        : {
            key,
            frames: [
              ...prev.frames,
              {
                id: prev.frames[prev.frames.length - 1].id + 1,
                status,
                label,
              },
            ],
          }
    );
  }

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const frame = liveFrameRef.current;
    if (!button || !frame) return;
    button.style.setProperty("--status-button-width", `${frame.offsetWidth}px`);
    if (!hasMeasured.current) {
      hasMeasured.current = true;
      button.dataset.measured = "true";
    }
  }, [state.frames]);
  useEffect(() => {
    if (state.frames.length < 2) return;
    const timer = window.setTimeout(
      () => setState((prev) => ({ ...prev, frames: prev.frames.slice(-1) })),
      EXIT_MS
    );
    return () => window.clearTimeout(timer);
  }, [state.frames]);

  const { frames } = state;

  return (
    <button
      ref={buttonRef}
      data-measured="false"
      disabled={disabled ?? status === "pending"}
      className={cn(
        "bg-foreground text-background focus-visible:ring-ring relative inline-flex h-9 items-center justify-center overflow-hidden rounded-sm text-sm leading-none font-medium whitespace-nowrap shadow focus-visible:ring-1 focus-visible:outline-none",
        "enabled:hover:bg-foreground/90",
        "w-(--status-button-width,auto) transition-[width,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "data-[measured=false]:transition-none",
        className
      )}
      {...props}
    >
      {frames.map((frame, index) => {
        const isLive = index === frames.length - 1;
        return (
          <span
            key={frame.id}
            ref={isLive ? liveFrameRef : undefined}
            aria-hidden="true"
            className={cn(
              "flex items-center gap-2 px-4 leading-none",
              isLive
                ? "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 relative shrink-0 duration-300"
                : "animate-out fade-out-0 zoom-out-95 slide-out-to-top-1 fill-mode-forwards pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 duration-300"
            )}
          >
            {ICONS[frame.status]}
            {frame.label}
          </span>
        );
      })}
    </button>
  );
}
