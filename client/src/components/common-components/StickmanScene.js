import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const wrapperStyle = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: 160,
  pointerEvents: 'auto', // allow interaction
  zIndex: 3
};

function StickmanScene() {
  const ref = useRef(null);
  const unitsRef = useRef([]);
  const grabbedRef = useRef({ idx: -1, lastX: 0, lastY: 0 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const rand = (min, max) => Math.random() * (max - min) + min;
    const pick = (arr) => arr[(Math.random() * arr.length) | 0];

    const groundY = () => canvas.height - 8 * dpr;

    const seedUnits = () => {
      const count = Math.max(4, Math.floor(canvas.width / (180 * dpr)));
      const baseY = groundY() - 36 * dpr;
      unitsRef.current = Array.from({ length: count }, () => ({
        x: rand(-60 * dpr, canvas.width + 60 * dpr),
        y: baseY,
        dir: Math.random() < 0.5 ? -1 : 1,
        speed: rand(0.7, 1.6),
        size: rand(0.9, 1.4),
        phase: rand(0, Math.PI * 2),
        type: pick(['run', 'jog', 'hop', 'punch']),
        mode: 'run', // 'run' | 'ragdoll' | 'sinking'
        vx: 0,
        vy: 0,
        rot: 0,
        vrot: 0,
        alpha: 1
      }));
    };

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      seedUnits();
    };

    const drawStickman = (u, t) => {
      const s = 1.05 * u.size * (canvas.height / 140);
      const step = t * 1.6 * (u.speed || 1) + (u.phase || 0);
      const bob = (u.mode === 'run' && u.type === 'hop') ? Math.abs(Math.sin(step * 1.4)) * 6 * dpr : (u.mode === 'run' ? Math.sin(step) * 2 * dpr : 0);
      const armSwing = (u.mode === 'run' && u.type === 'punch') ? Math.max(0, Math.sin(step * 3)) * 18 : (u.mode === 'run' ? Math.sin(step) * 12 : 8 * Math.sin(step * 0.7));
      const legSwing = (u.mode === 'run' && u.type === 'jog') ? Math.sin(step) * 8 : (u.mode === 'run' ? Math.cos(step) * 12 : 10 * Math.cos(step * 0.9));

      ctx.save();
      ctx.globalAlpha = u.alpha ?? 1;
      ctx.translate(u.x, u.y - bob);
      if (u.mode !== 'run') ctx.rotate(u.rot || 0);
      ctx.scale(s, s);
      ctx.lineWidth = 3 * dpr;

      // head (green)
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(0, -26, 9, 0, Math.PI * 2); ctx.fill();

      // body (light)
      ctx.strokeStyle = '#e5e7eb';
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, 18); ctx.stroke();

      // arms
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-16 * (u.dir || 1), 6 + armSwing); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(16 * (u.dir || 1), 6 - armSwing); ctx.stroke();

      // legs
      ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(-14 * (u.dir || 1), 36 + legSwing); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(14 * (u.dir || 1), 36 - legSwing); ctx.stroke();

      ctx.restore();
    };

    // Ground line across bottom
    const drawGround = () => {
      const gy = groundY();
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(canvas.width, gy);
      ctx.stroke();
    };

    let rafId;
    let t = 0;

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      t += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGround();

      const speedPx = 1.6 * dpr;
      const margin = 36 * dpr;
      const gy = groundY();

      for (const u of unitsRef.current) {
        if (u.mode === 'run') {
          u.x += (u.dir || 1) * speedPx * u.speed;
          if (u.x < -margin || u.x > canvas.width + margin) {
            u.dir = Math.random() < 0.5 ? -1 : 1;
            u.x = u.dir > 0 ? -margin : canvas.width + margin;
            u.phase = Math.random() * Math.PI * 2;
            u.type = pick(['run', 'jog', 'hop', 'punch']);
            u.size = Math.max(0.8, Math.min(1.5, u.size + (Math.random() - 0.5) * 0.3));
            u.speed = Math.max(0.6, Math.min(1.8, u.speed + (Math.random() - 0.5) * 0.4));
          }
        } else if (u.mode === 'ragdoll') {
          // basic physics
          u.vy += 0.35 * dpr; // gravity
          u.vx *= 0.999; // air drag
          u.vrot *= 0.995;
          u.x += u.vx;
          u.y += u.vy;
          u.rot += u.vrot;
          // ground collision
          if (u.y > gy - 18 * dpr) {
            if (Math.abs(u.vy) < 2 * dpr) {
              u.mode = 'sinking';
              u.vx = 0; u.vy = 0; u.vrot = 0;
            } else {
              u.y = gy - 18 * dpr;
              u.vy *= -0.35; // bounce
              u.vx *= 0.85;
              u.vrot += (Math.random() - 0.5) * 0.1;
            }
          }
        } else if (u.mode === 'sinking') {
          u.y += 0.7 * dpr;
          u.alpha = (u.alpha ?? 1) * 0.985;
          if (u.alpha < 0.05 || u.y > canvas.height + 24 * dpr) {
            // respawn
            const baseY = gy - 36 * dpr;
            Object.assign(u, {
              x: Math.random() < 0.5 ? -margin : canvas.width + margin,
              y: baseY,
              dir: Math.random() < 0.5 ? -1 : 1,
              speed: rand(0.7, 1.6),
              size: rand(0.9, 1.4),
              phase: rand(0, Math.PI * 2),
              type: pick(['run', 'jog', 'hop', 'punch']),
              mode: 'run', vx: 0, vy: 0, rot: 0, vrot: 0, alpha: 1
            });
          }
        }
        drawStickman(u, t);
      }
    };

    // Interaction
    const toCanvas = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      return { x, y };
    };

    const pointerDown = (e) => {
      const p = toCanvas(e);
      // find closest unit head/body
      let best = -1, bestDist = 1e9;
      for (let i = 0; i < unitsRef.current.length; i++) {
        const u = unitsRef.current[i];
        if (u.mode === 'sinking') continue;
        const dx = p.x - u.x;
        const dy = p.y - (u.y - 26 * (canvas.height / 140));
        const d = Math.hypot(dx, dy);
        if (d < bestDist) { best = i; bestDist = d; }
      }
      const threshold = 28 * dpr;
      if (best >= 0 && bestDist < threshold) {
        const u = unitsRef.current[best];
        u.mode = 'ragdoll';
        grabbedRef.current = { idx: best, lastX: p.x, lastY: p.y };
        u.vx = 0; u.vy = 0; u.vrot = 0;
        e.preventDefault();
      }
    };
    const pointerMove = (e) => {
      const g = grabbedRef.current;
      if (g.idx < 0) return;
      const p = toCanvas(e);
      const u = unitsRef.current[g.idx];
      const k = 0.25; // smoothing
      u.x += (p.x - u.x) * k;
      u.y += (p.y - u.y) * k;
      u.vx = (p.x - g.lastX) * 0.45;
      u.vy = (p.y - g.lastY) * 0.45;
      u.vrot += ((p.x - g.lastX) - (p.y - g.lastY)) * 0.0005;
      g.lastX = p.x; g.lastY = p.y;
      e.preventDefault();
    };
    const pointerUp = () => {
      grabbedRef.current.idx = -1;
    };

    // init
    resize();
    rafId = requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
    };
  }, []);

  const canvasEl = <div style={wrapperStyle}><canvas ref={ref} style={{ width: '100%', height: '100%' }} /></div>;
  return createPortal(canvasEl, document.body);
}

export default StickmanScene;
