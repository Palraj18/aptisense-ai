import React, { useEffect, useRef } from "react";

export const BackgroundFX = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null, radius: 150 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    let streaks = [];
    const maxParticles = 65;
    const connectionDist = 110;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Track mouse movement
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Particle Class
    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * canvas.width;
        this.y = init ? Math.random() * canvas.height : canvas.height + 10;
        this.radius = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = -(Math.random() * 0.4 + 0.15); // float upwards gently
        this.colorIndex = Math.floor(Math.random() * 3);
        const colors = [
          "rgba(0, 217, 255, ",  // Cyan
          "rgba(139, 92, 246, ", // Violet
          "rgba(99, 102, 241, "  // Indigo
        ];
        this.colorBase = colors[this.colorIndex];
        this.alpha = Math.random() * 0.4 + 0.2;
        this.pulseDir = Math.random() > 0.5 ? 0.005 : -0.005;
      }

      update() {
        // Interactivity: mouse repulsion
        if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
          const dx = this.x - mouseRef.current.x;
          const dy = this.y - mouseRef.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouseRef.current.radius) {
            const force = (mouseRef.current.radius - dist) / mouseRef.current.radius;
            // Push away from mouse gently
            this.x += (dx / dist) * force * 1.5;
            this.y += (dy / dist) * force * 1.5;
          }
        }

        this.x += this.vx;
        this.y += this.vy;

        // Pulse alpha
        this.alpha += this.pulseDir;
        if (this.alpha > 0.75 || this.alpha < 0.15) {
          this.pulseDir = -this.pulseDir;
        }

        // Boundary checks
        if (this.x < 0 || this.x > canvas.width || this.y < -10) {
          this.reset(false);
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${this.colorBase}${this.alpha})`;
        ctx.shadowColor = this.colorIndex === 0 ? "#00D9FF" : "#8B5CF6";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }
    }

    // Light/Cyber Streak Class
    class CyberStreak {
      constructor() {
        this.reset();
      }

      reset() {
        this.active = Math.random() > 0.4;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.length = Math.random() * 80 + 40;
        this.speed = Math.random() * 2 + 1.5;
        this.angle = Math.random() * Math.PI * 2;
        this.opacity = Math.random() * 0.35 + 0.15;
        this.color = Math.random() > 0.5 ? "rgba(0, 217, 255, " : "rgba(139, 92, 246, ";
      }

      update() {
        if (!this.active) {
          if (Math.random() < 0.005) this.active = true;
          return;
        }
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Fade out as it nears bounds or age
        if (this.x < -100 || this.x > canvas.width + 100 || this.y < -100 || this.y > canvas.height + 100) {
          this.reset();
        }
      }

      draw() {
        if (!this.active) return;
        ctx.beginPath();
        const grad = ctx.createLinearGradient(
          this.x,
          this.y,
          this.x - Math.cos(this.angle) * this.length,
          this.y - Math.sin(this.angle) * this.length
        );
        grad.addColorStop(0, `${this.color}${this.opacity})`);
        grad.addColorStop(1, `${this.color}0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
          this.x - Math.cos(this.angle) * this.length,
          this.y - Math.sin(this.angle) * this.length
        );
        ctx.stroke();
      }
    }

    // Initialize pools
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }
    for (let i = 0; i < 6; i++) {
      streaks.push(new CyberStreak());
    }

    // Connect particles with network grid lines
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.14;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);

            // Create gradient line between different colors
            const grad = ctx.createLinearGradient(
              particles[i].x,
              particles[i].y,
              particles[j].x,
              particles[j].y
            );
            grad.addColorStop(0, `${particles[i].colorBase}${alpha})`);
            grad.addColorStop(1, `${particles[j].colorBase}${alpha})`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    };

    // Main animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update streaks first (background layer of canvas)
      streaks.forEach((streak) => {
        streak.update();
        streak.draw();
      });

      // Connections second
      drawConnections();

      // Particles third (foreground of canvas)
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Heavy textured background noise */}
      <div className="noise" />
      
      {/* 3D ambient floating blurred neon blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[130px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[150px] animate-pulse" style={{ animationDuration: "16s" }} />
        <div className="absolute top-[35%] right-[25%] w-[35%] h-[35%] rounded-full bg-violet-600/5 blur-[120px] animate-pulse" style={{ animationDuration: "9s" }} />
      </div>

      {/* Futuristic Grid Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(18,16,35,0)_0%,rgba(11,10,25,0.7)_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-neuro-grid bg-[length:60px_60px] opacity-[0.12]" />

      {/* Main High Performance Animation Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 block h-full w-full"
        style={{ mixBlendMode: "screen" }}
      />
    </>
  );
};
