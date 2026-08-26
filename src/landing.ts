const PARTICLE_COUNT = 70;
const CONNECT_DIST = 120;
const MOUSE_RADIUS = 140;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
}

export function initLanding(): Promise<void> {
  return new Promise((resolve) => {
    const landing = document.getElementById('landing');
    const canvasEl = document.getElementById('particle-canvas') as HTMLCanvasElement | null;
    const playBtn = document.getElementById('play-btn');
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

    function resize() {
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

    function init() {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawn());
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
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

      if (!dismissed) raf = requestAnimationFrame(draw);
    }

    function onMove(e: { clientX: number; clientY: number }) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function onMouseEvent(e: MouseEvent) {
      onMove(e);
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length > 0) onMove(e.touches[0]);
    }

    function dismiss() {
      dismissed = true;
      cancelAnimationFrame(raf);
      cvs.removeEventListener('mousemove', onMouseEvent);
      cvs.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', resize);
    }

    cvs.addEventListener('mousemove', onMouseEvent);
    cvs.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('resize', resize);

    playBtn.addEventListener('click', () => {
      landing.classList.add('landing--hidden');
      landing.addEventListener(
        'transitionend',
        () => {
          landing.style.display = 'none';
          dismiss();
          resolve();
        },
        { once: true }
      );
    });

    init();
    draw();
  });
}
