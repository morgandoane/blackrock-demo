import { useEffect, useRef } from "react";
import { motion, AnimatePresence, type MotionValue } from "framer-motion";

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform float u_time;
uniform float u_saturation;
uniform vec2  u_resolution;
uniform float u_dpr;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  // Work in logical (CSS) pixels for consistent cell sizing
  vec2 px = gl_FragCoord.xy / u_dpr;

  float cellSize = 4.0;
  float dotSize = 2.0;

  // Pixel-snap to physical pixels so every dot is identical
  float pCell = floor(cellSize * u_dpr + 0.5);
  float pDot  = floor(dotSize  * u_dpr + 0.5);
  vec2 local = mod(gl_FragCoord.xy, pCell);
  float inDot = step(local.x, pDot) * step(local.y, pDot);

  if (inDot < 0.5) {
    discard;
  }

  vec2 cell = floor(px / cellSize);

  // Organic water surface: noise-warped coordinates break up regularity
  float t = u_time;
  vec2 p = cell * 0.04;

  // Warp the sample position with slow hash-based displacement
  // so wave fronts are irregular, not geometric
  vec2 warp = vec2(
    sin(p.y * 3.1 + t * 0.3) * 0.8 + cos(p.x * 2.7 + t * 0.2) * 0.6,
    cos(p.x * 2.9 - t * 0.25) * 0.7 + sin(p.y * 3.3 - t * 0.35) * 0.5
  );
  vec2 wp = p + warp * 0.35;

  // Layer several waves at different scales and directions through warped space
  float wave1 = sin(wp.x * 4.2 + wp.y * 1.8 + t * 0.9);
  float wave2 = sin(wp.x * -2.1 + wp.y * 3.6 - t * 0.7 + 1.5);
  float wave3 = sin(wp.x * 1.5 + wp.y * -2.8 + t * 1.1 + 3.0);
  float wave4 = sin(length(wp * 2.5 + vec2(sin(t * 0.2), cos(t * 0.15))) * 3.0 - t * 0.8);

  float ambient = wave1 * 0.32 + wave2 * 0.28 + wave3 * 0.22 + wave4 * 0.18;
  ambient = smoothstep(-0.45, 0.45, ambient);

  // Flicker: smoothly interpolate between two hash values over time
  float speed = 0.6;
  float ft = t * speed;
  float epoch = floor(ft);
  float blend = fract(ft);
  blend = blend * blend * (3.0 - 2.0 * blend);
  float h1 = hash(cell + epoch * 0.17);
  float h2 = hash(cell + (epoch + 1.0) * 0.17);
  float flicker = mix(h1, h2, blend);

  float baseOpacity = ambient * 0.55 + flicker * 0.06;

  // Saturation curve driven by focus MotionValue
  float sat = clamp(u_saturation, 0.0, 1.0);
  float satCurve = sat * sat * (3.0 - 2.0 * sat);

  // Concentric activation: pixels light up from center outward as focus builds
  vec2 center = u_resolution / u_dpr * 0.5;
  float dist = length(px - center);
  float maxDist = length(center);
  float normDist = dist / maxDist;

  // Frontier grows linearly with focus, scaled to cover full radius
  float frontier = sat * 1.3;
  float activation = 1.0 - smoothstep(frontier - 0.15, frontier + 0.05, normDist);

  // Activated dots are brighter; unactivated stay at dim ambient
  baseOpacity = mix(baseOpacity * 0.4, baseOpacity + 0.3, activation);
  baseOpacity = clamp(baseOpacity, 0.0, 0.85);

  // Color: white when inactive, vibrant green when activated
  vec3 green = vec3(0.14, 0.90, 0.38);
  float colorMix = activation * satCurve;
  vec3 color = mix(vec3(1.0), green, colorMix);

  gl_FragColor = vec4(color, baseOpacity);
}
`;

function initWebGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
  });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return null;
  }

  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return {
    gl,
    uTime: gl.getUniformLocation(prog, "u_time"),
    uSaturation: gl.getUniformLocation(prog, "u_saturation"),
    uResolution: gl.getUniformLocation(prog, "u_resolution"),
    uDpr: gl.getUniformLocation(prog, "u_dpr"),
  };
}

export interface NeuralSignatureProps {
  saturation: MotionValue<number>;
  visible: boolean;
}

export default function NeuralSignature({
  saturation,
  visible,
}: NeuralSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<ReturnType<typeof initWebGL>>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    resize();
    const ctx = initWebGL(canvas);
    ctxRef.current = ctx;
    if (!ctx) return;

    const { gl, uTime, uSaturation, uResolution, uDpr } = ctx;
    startRef.current = performance.now();

    const frame = () => {
      resize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const elapsed = (performance.now() - startRef.current) / 1000;
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uSaturation, saturation.get());
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
      ctxRef.current = null;
    };
  }, [visible, saturation]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="neural-sig"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 50,
            overflow: "hidden",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.0 }}
          >
            <motion.div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.9)",
                letterSpacing: 1.8,
                textTransform: "uppercase",
                fontWeight: 600,
                textShadow:
                  "0 0 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,1)",
              }}
              animate={{
                opacity: [0.7, 1.0, 0.7],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              neural signature
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
