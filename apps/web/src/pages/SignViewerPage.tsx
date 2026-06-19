import {
  Download,
  ExternalLink,
  Grid3X3,
  Maximize2,
  Minus,
  Move,
  Plus,
  RotateCcw,
  Ruler,
} from "lucide-react";
import { type PointerEvent, type WheelEvent, useMemo, useRef, useState } from "react";

const signSrc = "/assets/rai_orchards_4ft_by_5ft_sign.svg";

type BackdropMode = "matte" | "grid" | "dark";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatZoom = (zoom: number) => `${Math.round(zoom * 100)}%`;

export const SignViewerPage = () => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [backdrop, setBackdrop] = useState<BackdropMode>("matte");
  const [showGuides, setShowGuides] = useState(true);
  const dragStart = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);

  const backdropClass = useMemo(() => {
    if (backdrop === "grid") {
      return "bg-[linear-gradient(rgba(24,32,29,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(24,32,29,.08)_1px,transparent_1px)] bg-[size:32px_32px] bg-[#f5f4ef]";
    }
    if (backdrop === "dark") return "bg-[#101611]";
    return "bg-[#efeee8]";
  }, [backdrop]);

  const updateZoom = (nextZoom: number) => setZoom(clamp(nextZoom, 0.25, 4));

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    updateZoom(zoom + (event.deltaY > 0 ? -0.08 : 0.08));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStart.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan({
      x: drag.panX + event.clientX - drag.x,
      y: drag.panY + event.clientY - drag.y,
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current?.pointerId === event.pointerId) dragStart.current = null;
  };

  return (
    <main className="min-h-screen bg-[#d9d7cf] text-[#17201b]">
      <header className="border-b border-black/10 bg-[#f8f7f2]/96 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,.75)] backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl leading-tight tracking-tight sm:text-3xl">RAI Orchards Sign Viewer</h1>
            <p className="mt-1 text-sm text-[#68736d]">60 in x 48 in SVG print proof, viewBox 6000 x 4800</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              className="inline-flex h-10 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-semibold text-[#17201b] shadow-sm transition hover:bg-[#f1f0ea]"
              href={signSrc}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} strokeWidth={1.8} />
              Open SVG
            </a>
            <a
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#173626] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d2519]"
              href={signSrc}
              download="rai_orchards_4ft_by_5ft_sign.svg"
            >
              <Download size={16} strokeWidth={1.8} />
              Download
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-h-[70vh] overflow-hidden rounded-lg border border-black/10 bg-[#f8f7f2] shadow-[0_18px_70px_rgba(23,32,27,.14)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-white px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                aria-label="Zoom out"
                className="inline-flex size-9 items-center justify-center rounded-md text-[#17201b] transition hover:bg-[#ecebe6]"
                type="button"
                onClick={() => updateZoom(zoom - 0.15)}
              >
                <Minus size={17} />
              </button>
              <output className="min-w-16 rounded-md border border-black/10 bg-[#f8f7f2] px-3 py-2 text-center text-sm font-semibold">
                {formatZoom(zoom)}
              </output>
              <button
                aria-label="Zoom in"
                className="inline-flex size-9 items-center justify-center rounded-md text-[#17201b] transition hover:bg-[#ecebe6]"
                type="button"
                onClick={() => updateZoom(zoom + 0.15)}
              >
                <Plus size={17} />
              </button>
              <button
                className="ml-1 inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[#17201b] transition hover:bg-[#ecebe6]"
                type="button"
                onClick={resetView}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-md bg-[#ecebe6] p-1">
              {(["matte", "grid", "dark"] as const).map((mode) => (
                <button
                  className={`h-8 rounded px-3 text-xs font-semibold capitalize transition ${
                    backdrop === mode ? "bg-white text-[#17201b] shadow-sm" : "text-[#68736d] hover:text-[#17201b]"
                  }`}
                  key={mode}
                  type="button"
                  onClick={() => setBackdrop(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`relative flex h-[calc(100vh-190px)] min-h-[520px] touch-none select-none items-center justify-center overflow-hidden ${backdropClass}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {showGuides ? (
              <>
                <div className="pointer-events-none absolute left-6 right-6 top-6 border-t border-dashed border-[#d4a64a]/70">
                  <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded bg-[#17201b] px-2 py-1 text-xs font-semibold text-[#f2d37a]">
                    5 ft wide
                  </span>
                </div>
                <div className="pointer-events-none absolute bottom-6 left-6 top-6 border-l border-dashed border-[#d4a64a]/70">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-[#17201b] px-2 py-1 text-xs font-semibold text-[#f2d37a] [writing-mode:vertical-rl]">
                    4 ft tall
                  </span>
                </div>
              </>
            ) : null}

            <div
              className="will-change-transform"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              <img
                alt="RAI Orchards 5 foot by 4 foot sign SVG proof"
                className="block h-auto max-h-[76vh] w-[min(78vw,1100px)] max-w-none rounded-sm shadow-[0_18px_44px_rgba(0,0,0,.28)]"
                draggable={false}
                src={signSrc}
              />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-black/10 bg-[#f8f7f2] p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Ruler className="text-[#9b6652]" size={18} strokeWidth={1.8} />
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#68736d]">Print Specs</h2>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-white p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68736d]">Width</dt>
                <dd className="mt-1 text-lg font-bold">60 in</dd>
              </div>
              <div className="rounded-md bg-white p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68736d]">Height</dt>
                <dd className="mt-1 text-lg font-bold">48 in</dd>
              </div>
              <div className="rounded-md bg-white p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68736d]">Ratio</dt>
                <dd className="mt-1 text-lg font-bold">5:4</dd>
              </div>
              <div className="rounded-md bg-white p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68736d]">Canvas</dt>
                <dd className="mt-1 text-lg font-bold">6000 x 4800</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-black/10 bg-[#f8f7f2] p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Move className="text-[#9b6652]" size={18} strokeWidth={1.8} />
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#68736d]">Controls</h2>
            </div>
            <div className="space-y-2 text-sm leading-6 text-[#4f5b55]">
              <p>Drag the proof to pan. Use the zoom buttons, or hold Command/Ctrl while scrolling.</p>
              <p>The artwork is loaded from the original SVG asset so strokes, text and gradients stay vector-sharp.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-black/10 bg-white text-sm font-semibold transition hover:bg-[#ecebe6]"
                type="button"
                onClick={() => updateZoom(1.75)}
              >
                <Maximize2 size={16} />
                Detail
              </button>
              <button
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border border-black/10 text-sm font-semibold transition ${
                  showGuides ? "bg-[#173626] text-white" : "bg-white hover:bg-[#ecebe6]"
                }`}
                type="button"
                onClick={() => setShowGuides((value) => !value)}
              >
                <Grid3X3 size={16} />
                Guides
              </button>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
};
