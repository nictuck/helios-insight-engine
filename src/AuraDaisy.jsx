import { useEffect, useRef } from "react";

const CATEGORIES = [
  { id: "career", label: "Career", color: [220, 155, 50] },
  { id: "relationships", label: "Relationships", color: [65, 135, 215] },
  { id: "health", label: "Health", color: [50, 185, 110] },
  { id: "finance", label: "Finance", color: [195, 165, 55] },
  { id: "growth", label: "Growth", color: [150, 85, 210] },
  { id: "joy", label: "Joy", color: [215, 65, 115] },
  { id: "family", label: "Family", color: [40, 190, 185] },
  { id: "environment", label: "Environment", color: [130, 190, 50] },
];

export default function AuraDaisy({ scores, animate }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!animate) return;

    // Animate the bloom-in over 1.2 seconds
    const startTime = performance.now();
    const growDuration = 1200;
    const grow = (ts) => {
      const t = Math.min((ts - startTime) / growDuration, 1);
      progressRef.current = 1 - Math.pow(1 - t, 3); // ease-out cubic
      if (t < 1) requestAnimationFrame(grow);
    };
    requestAnimationFrame(grow);
  }, [animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 520, H = 520, CX = W / 2, CY = H / 2;

    function sRng(s) {
      return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    }

    function oblongPoints(cx, cy, angle, length, width, seed, t) {
      const rng = sRng(seed + Math.floor(t * 0.25));
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const pc = Math.cos(angle + Math.PI / 2), ps = Math.sin(angle + Math.PI / 2);
      const pts = [];
      const N = 24;
      for (let i = 0; i < N; i++) {
        const theta = (Math.PI * 2 * i) / N;
        const cosT = Math.cos(theta), sinT = Math.sin(theta);
        const along = cosT * length * 0.5;
        const across = sinT * width * 0.5;
        const wobble = 1 + (rng() - 0.5) * 0.18;
        pts.push({
          x: cx + cos * along + pc * across * wobble,
          y: cy + sin * along + ps * across * wobble,
        });
      }
      return pts;
    }

    function drawSmooth(pts) {
      const n = pts.length;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < n; i++) {
        const curr = pts[i],
          next = pts[(i + 1) % n],
          prev = pts[(i - 1 + n) % n],
          nn = pts[(i + 2) % n];
        ctx.bezierCurveTo(
          curr.x + (next.x - prev.x) / 5,
          curr.y + (next.y - prev.y) / 5,
          next.x - (nn.x - curr.x) / 5,
          next.y - (nn.y - curr.y) / 5,
          next.x,
          next.y
        );
      }
      ctx.closePath();
    }

    function render() {
      ctx.clearRect(0, 0, W, H);
      timeRef.current += 0.005;
      const time = timeRef.current;
      const progress = progressRef.current;

      // Score balance calculation
      const scoreArr = CATEGORIES.map((cat) => (scores[cat.id] || 1) * progress);
      const avg = scoreArr.reduce((a, b) => a + b, 0) / CATEGORIES.length;
      const variance =
        scoreArr.reduce((a, s) => a + Math.pow(s - avg, 2), 0) / CATEGORIES.length;
      const balance = Math.max(0, 1 - variance / 20);

      const minL = 60, maxL = 220, minW = 42, maxW = 95;
      const total = CATEGORIES.length;

      // Draw petals (largest first so small ones render on top)
      const sorted = CATEGORIES.map((cat, i) => ({
        ...cat,
        i,
        score: (scores[cat.id] || 1) * progress,
      })).sort((a, b) => b.score - a.score);

      sorted.forEach((cat) => {
        const score = cat.score;
        const angle = (Math.PI * 2 * cat.i) / total - Math.PI / 2;
        const breathe =
          Math.sin(time * 1.0 + cat.i * 0.85) * 5 +
          Math.sin(time * 0.55 + cat.i * 1.4) * 3;
        const sway = Math.sin(time * 0.35 + cat.i * 1.1) * 0.03;

        const length = minL + (score / 10) * (maxL - minL) + breathe * progress;
        const width = minW + (score / 10) * (maxW - minW) + breathe * 0.4 * progress;
        const offset = length * 0.38;
        const ocx = CX + Math.cos(angle + sway) * offset;
        const ocy = CY + Math.sin(angle + sway) * offset;

        const pts = oblongPoints(
          ocx, ocy, angle + sway, length, width,
          700 + cat.i * 173, time
        );
        const [cr, cg, cb] = cat.color;

        // Outer gradient fill
        const gx = ocx + Math.cos(angle) * length * 0.15;
        const gy = ocy + Math.sin(angle) * length * 0.15;
        const grad = ctx.createRadialGradient(gx, gy, length * 0.05, gx, gy, length * 0.65);
        const alph = 0.28;
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alph * 1.8})`);
        grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},${alph * 1.1})`);
        grad.addColorStop(0.75, `rgba(${cr},${cg},${cb},${alph * 0.5})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},${alph * 0.08})`);

        ctx.save();
        drawSmooth(pts);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // Inner glow
        const innerPts = oblongPoints(
          ocx, ocy, angle + sway, length * 0.5, width * 0.5,
          1200 + cat.i * 211, time
        );
        const ig = ctx.createRadialGradient(gx, gy, 0, gx, gy, length * 0.3);
        ig.addColorStop(0, `rgba(${cr},${cg},${cb},${alph * 1.0})`);
        ig.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.save();
        drawSmooth(innerPts);
        ctx.fillStyle = ig;
        ctx.fill();
        ctx.restore();

        // Labels
        const labelDist = offset + length * 0.52 + 16;
        const lx = CX + Math.cos(angle) * labelDist;
        const ly = CY + Math.sin(angle) * labelDist;
        ctx.save();
        ctx.globalAlpha = 0.75 * progress;
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.font = "500 11px 'Jost', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cat.label, lx, ly - 7);
        ctx.font = "500 15px 'Jost', sans-serif";
        ctx.globalAlpha = 0.9 * progress;
        ctx.fillText(Math.round(scores[cat.id] || 0), lx, ly + 9);
        ctx.restore();
      });

      // Center core glow — brighter when balanced
      const coreR = 20 + balance * 20;
      const corePulse = Math.sin(time * 1.3) * 2.5;
      const cR = coreR + corePulse;

      for (let layer = 3; layer >= 0; layer--) {
        const lr = cR + layer * 14;
        const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, lr);
        const a = (0.03 + balance * 0.07) * (1 - layer * 0.2) * progress;
        grad.addColorStop(0, `rgba(255,240,210,${a * 2.8})`);
        grad.addColorStop(0.5, `rgba(255,220,170,${a * 1.3})`);
        grad.addColorStop(1, `rgba(255,200,140,0)`);
        ctx.beginPath();
        ctx.arc(CX, CY, lr, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Sparks when balanced
      if (balance > 0.4 && progress > 0.5) {
        const sparkAlpha = (balance - 0.4) * 1.6 * progress;
        for (let s = 0; s < 7; s++) {
          const sa = time * 0.7 + s * 0.9;
          const sr = cR * 0.55 + Math.sin(time * 1.8 + s * 1.5) * 5;
          const sx = CX + Math.cos(sa) * sr;
          const sy = CY + Math.sin(sa) * sr;
          const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 3.5);
          sg.addColorStop(0, `rgba(255,245,210,${sparkAlpha * 0.55})`);
          sg.addColorStop(1, `rgba(255,245,210,0)`);
          ctx.beginPath();
          ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = sg;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [scores, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={520}
      height={520}
      style={{ width: "min(100%, max(320px, 80vw))", maxWidth: 600 }}
    />
  );
}
