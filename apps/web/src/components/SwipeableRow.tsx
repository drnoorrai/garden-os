import { cn } from "@garden/ui";
import { Check, RotateCcw } from "lucide-react";
import { type PointerEvent, type PropsWithChildren, useRef, useState } from "react";

const THRESHOLD = 72;

export const SwipeableRow = ({
  onComplete,
  onDefer,
  completed,
  children,
}: PropsWithChildren<{ onComplete: () => void; onDefer: () => void; completed: boolean }>) => {
  const [dx, setDx] = useState(0);
  const offset = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"h" | "v" | null>(null);
  const dragging = !!start.current && axis.current === "h";

  const reset = () => {
    start.current = null;
    axis.current = null;
    offset.current = 0;
    setDx(0);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-5">
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium text-forest transition-opacity",
            dx > 12 ? "opacity-100" : "opacity-0",
          )}
        >
          <Check size={16} />
          {completed ? "Reopen" : "Done"}
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium text-clay transition-opacity",
            dx < -12 ? "opacity-100" : "opacity-0",
          )}
        >
          Tomorrow
          <RotateCcw size={16} />
        </span>
      </div>
      <div
        className="relative touch-pan-y"
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? "none" : "transform 0.18s ease" }}
        onPointerDown={(event: PointerEvent) => {
          if (event.pointerType !== "touch") return;
          start.current = { x: event.clientX, y: event.clientY };
          axis.current = null;
        }}
        onPointerMove={(event: PointerEvent) => {
          if (!start.current) return;
          const deltaX = event.clientX - start.current.x;
          const deltaY = event.clientY - start.current.y;
          if (axis.current === null && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
            axis.current = Math.abs(deltaX) > Math.abs(deltaY) ? "h" : "v";
            if (axis.current === "h") event.currentTarget.setPointerCapture(event.pointerId);
          }
          if (axis.current === "h") {
            offset.current = deltaX;
            setDx(deltaX);
          }
        }}
        onPointerUp={() => {
          if (offset.current > THRESHOLD) onComplete();
          else if (offset.current < -THRESHOLD) onDefer();
          reset();
        }}
        onPointerCancel={reset}
      >
        {children}
      </div>
    </div>
  );
};
