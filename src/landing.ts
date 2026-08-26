const PARTICLE_COUNT = 70;
const CONNECT_DIST = 120;
const MOUSE_RADIUS = 140;

const CASCADE_SEQUENCE = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

const NUM_COLORS: Record<number, string> = {
  2: '#8b91b5',
  4: '#8b91b5',
  8: '#f59e0b',
  16: '#fbbf24',
  32: '#f97316',
  64: '#ef4444',
  128: '#34d399',
  256: '#10b981',
  512: '#22d3ee',
  1024: '#a78bfa',
  2048: '#f59e0b'
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
}

function runCascade(): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'cascade-overlay';
    const num = document.createElement('span');
    num.className = 'cascade-num';
    overlay.appendChild(num);
    document.body.appendChild(overlay);

    void overlay.offsetHeight;
    overlay.classList.add('active');

    let i = 0;
    function next(): void {
      if (i >= CASCADE_SEQUENCE.length) {
        setTimeout(() => {
          overlay.classList.add('fading');
          setTimeout(() => {
            overlay.remove();
            resolve();
          }, 350);
        }, 350);
        return;
      }
      const val = CASCADE_SEQUENCE[i];
      num.textContent = String(val);
      const c = NUM_COLORS[val] ?? '#f59e0b';
      num.style.color = c;
      num.style.textShadow = `0 0 ${15 + i * 6}px ${c}60`;
      num.classList.remove('pop');
      void num.offsetHeight;
      num.classList.add('pop');
      i++;
      setTimeout(next, i <= 3 ? 90 : i <= 7 ? 70 : 55);
    }
    next();
  });
}

export function initLanding(): Promise<void> {
  return new Promise((resolve) => {
    const landing = document.getElementById('landing');
    const canvasEl = document.getElementById('particle-canvas') as HTMLCanvasElement | null;
    const playBtn = document.getElementById('play-btn') as HTMLButtonElement | null;
    if (!landing || !canvasEl || !playBtn) return resolve();

    const ctx2d = canvasEl.getContext('2d');
    if (!ctx2d) return resolve();

    const cvs = canvasEl;
    const ctx = ctx2d;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;
    let dismissed = false;
    let bursting = false;
    let burstStart = 0;

    function resize(): void {
      w = window.innerWidth;
      h = window.innerHeight;
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      cvs.style.width = w + 'px';
      cvs.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(): Particle {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.4 + 0.15
      };
    }

    function init(): void {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawn());
    }

    function draw(): void {
      ctx.clearRect(0, 0, w, h);

      if (bursting) {
        const elapsed = performance.now() - burstStart;
        const fade = Math.min(elapsed / 500, 1);
        const cx = w / 2;
        const cy = h / 2;

        for (const p of particles) {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          p.vx += (dx / dist) * 1.2;
          p.vy += (dy / dist) * 1.2;
          p.x += p.vx;
          p.y += p.vy;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha * (1 - fade)})`;
          ctx.fill();
        }

        if (fade < 0.6) {
          const la = (1 - fade / 0.6) * 0.2;
          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              const ddx = particles[i].x - particles[j].x;
              const ddy = particles[i].y - particles[j].y;
              const d = Math.sqrt(ddx * ddx + ddy * ddy);
              if (d < CONNECT_DIST) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(245, 158, 11, ${la * (1 - d / CONNECT_DIST)})`;
                ctx.lineWidth = 0.6;
                ctx.stroke();
              }
            }
          }
        }
      } else {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = w + 10;
          else if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          else if (p.y > h + 10) p.y = -10;

          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const glow = dist < MOUSE_RADIUS ? (1 - dist / MOUSE_RADIUS) * 0.5 : 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + glow * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha + glow})`;
          ctx.fill();
        }

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < CONNECT_DIST) {
              const a = 0.12 * (1 - d / CONNECT_DIST);
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(245, 158, 11, ${a})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }

      if (!dismissed) raf = requestAnimationFrame(draw);
    }

    function onMove(e: { clientX: number; clientY: number }): void {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function onMouseEvent(e: MouseEvent): void {
      onMove(e);
    }

    function onTouchMove(e: TouchEvent): void {
      if (e.touches.length > 0) onMove(e.touches[0]);
    }

    function cleanup(): void {
      cvs.removeEventListener('mousemove', onMouseEvent);
      cvs.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', resize);
    }

    cvs.addEventListener('mousemove', onMouseEvent);
    cvs.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('resize', resize);

    playBtn.addEventListener('click', () => {
      playBtn.disabled = true;
      landing.classList.add('landing--hiding');
      bursting = true;
      burstStart = performance.now();

      setTimeout(() => {
        dismissed = true;
        cancelAnimationFrame(raf);
        cleanup();
        cvs.remove();
        landing.remove();
        runCascade().then(resolve);
      }, 450);
    });

    init();
    draw();
  });
}
