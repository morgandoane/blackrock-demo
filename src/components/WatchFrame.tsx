import type React from "react";

function ScreenContent({
  children,
  contentScale,
}: {
  children: React.ReactNode;
  contentScale: number;
}) {
  if (contentScale >= 0.999) {
    return <>{children}</>;
  }
  const inv = 1 / contentScale;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        borderRadius: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: `${inv * 100}%`,
          height: `${inv * 100}%`,
          transform: `scale(${contentScale})`,
          transformOrigin: "center center",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function WatchFrame({
  children,
  hideBezel,
  contentScale = 1,
}: {
  children: React.ReactNode;
  hideBezel?: boolean;
  /** Scale down in-screen UI only (typography, commitment bar) */
  contentScale?: number;
}) {
  const screen = (
    <div
      style={{
        position: "absolute",
        inset: 4,
        borderRadius: 50,
        background: "#000",
        overflow: "hidden",
      }}
    >
      <ScreenContent contentScale={contentScale}>{children}</ScreenContent>
    </div>
  );
  if (hideBezel) {
    return (
      <div
        style={{
          width: 198,
          height: 242,
          position: "relative",
          flexShrink: 0,
          overflow: "visible",
        }}
      >
        {screen}
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: 50,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        width: 198,
        height: 242,
        borderRadius: 54,
        background: "linear-gradient(145deg, #1C1C1E 0%, #111111 100%)",
        boxShadow: "none",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {screen}
      <div
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: 50,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
