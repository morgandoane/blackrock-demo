import { useState, useEffect, useRef } from "react";

const OVERLAY_STORAGE_KEY = "blackrockdemo.watchOverlay.v1";
const OVERLAY_SCALE_MIN = 0.35;
const OVERLAY_SCALE_MAX = 3.2;
const RESIZE_SENS = 0.004;

type OverlayPersist = { scale: number; offsetXPx: number; offsetYPx: number };

const DEFAULT_OVERLAY: OverlayPersist = {
  scale: 1,
  offsetXPx: 0,
  offsetYPx: 0,
};

function clampOverlay(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function loadOverlayState(): OverlayPersist {
  try {
    const raw = localStorage.getItem(OVERLAY_STORAGE_KEY);
    if (!raw) return DEFAULT_OVERLAY;
    const p = JSON.parse(raw) as Partial<OverlayPersist>;
    return {
      scale: clampOverlay(
        typeof p.scale === "number" ? p.scale : 1,
        OVERLAY_SCALE_MIN,
        OVERLAY_SCALE_MAX
      ),
      offsetXPx: typeof p.offsetXPx === "number" ? p.offsetXPx : 0,
      offsetYPx: typeof p.offsetYPx === "number" ? p.offsetYPx : 0,
    };
  } catch {
    return DEFAULT_OVERLAY;
  }
}

export default function WatchOverlayLayer({
  src,
  enabled,
}: {
  src: string;
  enabled: boolean;
}) {
  const [state, setState] = useState<OverlayPersist>(() => loadOverlayState());
  const [adjustMode, setAdjustMode] = useState(false);
  const stateRef = useRef(state);
  // eslint-disable-next-line react-hooks/refs -- intentional ref mirror for event callbacks
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }, [state]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isT = e.code === "KeyT" || e.key === "t" || e.key === "T";
      if (!isT) return;

      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setAdjustMode((a) => !a);
        return;
      }

      if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setAdjustMode((a) => !a);
        return;
      }

      if (e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setAdjustMode((a) => !a);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  const onImgPointerDown = (e: React.PointerEvent) => {
    if (!adjustMode) return;
    if ((e.target as HTMLElement).closest("[data-overlay-handle]")) return;
    e.preventDefault();
    e.stopPropagation();
    const ox = stateRef.current.offsetXPx;
    const oy = stateRef.current.offsetYPx;
    const sx = e.clientX;
    const sy = e.clientY;
    const onMove = (ev: PointerEvent) => {
      setState((s) => ({
        ...s,
        offsetXPx: ox + (ev.clientX - sx),
        offsetYPx: oy + (ev.clientY - sy),
      }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const onHandlePointerDown =
    (corner: 1 | 2 | 3 | 4) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startScale = stateRef.current.scale;
      const sx = e.clientX;
      const sy = e.clientY;
      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - sx;
        const dy = ev.clientY - sy;
        let delta = 0;
        if (corner === 4) delta = (dx + dy) * RESIZE_SENS;
        else if (corner === 1) delta = (-dx - dy) * RESIZE_SENS;
        else if (corner === 2) delta = (dx - dy) * RESIZE_SENS;
        else delta = (-dx + dy) * RESIZE_SENS;
        setState((s) => ({
          ...s,
          scale: clampOverlay(
            startScale + delta,
            OVERLAY_SCALE_MIN,
            OVERLAY_SCALE_MAX
          ),
        }));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

  if (!enabled) return null;

  const handleStyle: React.CSSProperties = {
    position: "absolute",
    width: 11,
    height: 11,
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.45)",
    borderRadius: 2,
    zIndex: 12,
    pointerEvents: "auto",
    touchAction: "none",
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "100%",
          height: "100%",
          transform: `translate(calc(-50% + ${state.offsetXPx}px), calc(-50% + ${state.offsetYPx}px)) scale(${state.scale})`,
          transformOrigin: "center center",
          zIndex: 10,
          pointerEvents: adjustMode ? "auto" : "none",
          outline: adjustMode ? "2px dashed rgba(255,255,255,0.55)" : "none",
          outlineOffset: 2,
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          onPointerDown={onImgPointerDown}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            cursor: adjustMode ? "move" : "default",
            pointerEvents: adjustMode ? "auto" : "none",
            userSelect: "none",
          }}
        />

        {adjustMode && (
          <>
            <div
              data-overlay-handle
              style={{ ...handleStyle, left: -6, top: -6, cursor: "nwse-resize" }}
              onPointerDown={onHandlePointerDown(1)}
            />
            <div
              data-overlay-handle
              style={{ ...handleStyle, right: -6, top: -6, cursor: "nesw-resize" }}
              onPointerDown={onHandlePointerDown(2)}
            />
            <div
              data-overlay-handle
              style={{ ...handleStyle, left: -6, bottom: -6, cursor: "nesw-resize" }}
              onPointerDown={onHandlePointerDown(3)}
            />
            <div
              data-overlay-handle
              style={{ ...handleStyle, right: -6, bottom: -6, cursor: "nwse-resize" }}
              onPointerDown={onHandlePointerDown(4)}
            />
          </>
        )}
      </div>

      {adjustMode && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            zIndex: 100,
            fontSize: 11,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: 0.5,
            pointerEvents: "none",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Overlay adjust · drag to move · corners resize · Alt+T or Ctrl+T to
          exit
        </div>
      )}
    </>
  );
}
