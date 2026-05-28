import { type PointerEvent, useRef } from "react";

export const useLongPress = (callback: () => void, ms = 500) => {
  const timer = useRef<number | null>(null);

  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return {
    onPointerDown: (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      clear();
      timer.current = window.setTimeout(callback, ms);
    },
    onPointerMove: clear,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
};
