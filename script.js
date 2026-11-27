(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Starfield
  const cv = document.getElementById('stars');
  const cx = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0, stars = [];
  const initStars = () => {
    W = cv.width = innerWidth * dpr;
    H = cv.height = innerHeight * dpr;
    stars = Array.from({ length: Math.round((innerWidth * innerHeight) / 14000) }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: (Math.random() * 1.2 + 0.3) * dpr,
      v: Math.random() * 0.15 + 0.03,
      t: Math.random() * 6.28
    }));
  };
  const frame = (t) => {
    cx.clearRect(0, 0, W, H);
    cx.fillStyle = '#fff';
    for (const s of stars) {
      if (!reduce) { s.y -= s.v * dpr; if (s.y < -4) s.y = H + 4; }
      cx.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(t / 1400 + s.t));
      cx.beginPath();
      cx.arc(s.x, s.y, s.r, 0, 6.283);
      cx.fill();
    }
    if (!reduce) requestAnimationFrame(frame);
  };
  initStars();
  addEventListener('resize', () => { initStars(); if (reduce) frame(0); });
  frame(0);

  // Scroll: progress bar + screenshot tilt/sweep
  const stage = document.querySelector('.stage');
  const shot = document.querySelector('.shot');
  const game = document.querySelector('.game');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = root.scrollHeight - innerHeight;
      root.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
      if (!reduce) {
        const r = stage.getBoundingClientRect();
        const t = clamp(1 - (r.top - innerHeight * 0.15) / (innerHeight * 0.75), 0, 1);
        shot.style.setProperty('--rx', (18 * (1 - t)).toFixed(2) + 'deg');
        shot.style.setProperty('--sc', (0.88 + 0.12 * t).toFixed(3));
        shot.style.setProperty('--sw', (-100 + 200 * t).toFixed(1) + '%');
        const g = game.getBoundingClientRect();
        const u = clamp(1 - (g.top - innerHeight * 0.1) / (innerHeight * 0.8), 0, 1);
        game.style.setProperty('--c', (14 * (1 - u)).toFixed(2));
        game.style.setProperty('--z', (1.18 - 0.18 * u).toFixed(3));
      }
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Hero spotlight + logo parallax
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', (e) => {
    const b = hero.getBoundingClientRect();
    const x = e.clientX - b.left, y = e.clientY - b.top;
    hero.style.setProperty('--mx', x + 'px');
    hero.style.setProperty('--my', y + 'px');
    if (!reduce) {
      hero.style.setProperty('--px', (x / b.width - 0.5).toFixed(3));
      hero.style.setProperty('--py', (y / b.height - 0.5).toFixed(3));
    }
  });

  // Card spotlight
  document.querySelectorAll('.card').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const b = c.getBoundingClientRect();
      c.style.setProperty('--mx', e.clientX - b.left + 'px');
      c.style.setProperty('--my', e.clientY - b.top + 'px');
    });
  });

  // Magnetic buttons (mouse only)
  if (!reduce && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        b.style.transform = `translate(${x}px, ${y}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // Image fallback: if a file is missing next to index.html, try assets/
  document.querySelectorAll('img').forEach((i) => {
    const fb = () => { if (!i.dataset.fb) { i.dataset.fb = 1; i.src = 'assets/' + i.getAttribute('src'); } };
    i.addEventListener('error', fb);
    if (i.complete && !i.naturalWidth) fb();
  });

  // Price count-up
  const count = (el) => {
    const n = +el.dataset.n, t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / 1200, 1);
      el.textContent = Math.round(n * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Ticket modal
  const dlg = document.getElementById('ticket');
  document.querySelectorAll('.buy').forEach((b) => b.addEventListener('click', () => {
    document.getElementById('t-plan').textContent = b.dataset.plan;
    document.getElementById('t-price').textContent = b.dataset.price;
    dlg.showModal();
  }));
  dlg.addEventListener('click', (e) => {
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });

  // Staggered card reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        if (!reduce) en.target.querySelectorAll('[data-n]').forEach(count);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.card').forEach((c, i) => {
    c.style.setProperty('--d', [...c.parentElement.children].indexOf(c) * 0.1 + 's');
    io.observe(c);
  });
})();
