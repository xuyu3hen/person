"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  alphaDir: number;
  // trail
  trail: { x: number; y: number; alpha: number }[];
}

const PARTICLE_COUNT = 80;
const MOUSE_TRAIL_LENGTH = 20;
const MOUSE_INFLUENCE_RADIUS = 120;
const CONNECT_DISTANCE = 140;

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const mouseTrailRef = useRef<{ x: number; y: number }[]>([]);
  const rafRef = useRef<number>(0);
  const dimsRef = useRef({ w: 0, h: 0 });

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;
    dimsRef.current = { w, h };
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }, []);

  const initParticles = useCallback(() => {
    const { w, h } = dimsRef.current;
    const arr: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.6 + 0.25,
        alphaDir: Math.random() > 0.5 ? 1 : -1,
        trail: [],
      });
    }
    particlesRef.current = arr;
  }, []);

  useEffect(() => {
    resize();
    initParticles();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    const onResize = () => {
      resize();
      initParticles();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!canvas.isConnected) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
      mouseTrailRef.current = [];
    };

    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const animate = () => {
      const { w, h } = dimsRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const mouse = mouseRef.current;
      // Update mouse trail
      if (mouse.x > 0 && mouse.y > 0) {
        const trail = mouseTrailRef.current;
        trail.push({ x: mouse.x, y: mouse.y });
        if (trail.length > MOUSE_TRAIL_LENGTH) trail.shift();
      } else if (mouseTrailRef.current.length > 0) {
        mouseTrailRef.current.shift();
      }

      // Draw mouse trail
      const trail = mouseTrailRef.current;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const progress = i / trail.length;
        const alpha = progress * 0.35;
        ctx.beginPath();
        ctx.arc(t.x, t.y, progress * 4 + 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      // Update & draw particles
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_INFLUENCE_RADIUS && mouse.x > 0) {
          const force = (1 - dist / MOUSE_INFLUENCE_RADIUS) * 0.5;
          p.vx -= (dx / dist) * force * 0.08;
          p.vy -= (dy / dist) * force * 0.08;
        }

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Damping
        p.vx *= 0.998;
        p.vy *= 0.998;

        // Wrap around
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Twinkle
        p.alpha += 0.006 * p.alphaDir;
        if (p.alpha >= 0.85) p.alphaDir = -1;
        if (p.alpha <= 0.2) p.alphaDir = 1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
      }

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            const alpha = (1 - dist / CONNECT_DISTANCE) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [resize, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 1 }}
    />
  );
}
