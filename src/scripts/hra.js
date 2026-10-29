(() => {
  const D = window.HraDraw;
  const H = 500;
  const ROUND_SECONDS = 90;
  const BITE_WINDOW = 1.4;
  const START_PROGRESS = 0.3;
  const DRAIN_FACTOR = 3;
  const JUMP_DURATION = 0.55;
  const WARN_DURATION = 0.7;
  const THROW_DURATION = 0.22;
  const PLAY_TOP = 385;
  const PLAY_BOTTOM = 470;
  const SIDE_MARGIN = 45;
  const BODY_UNIT = 64;
  const STORAGE_KEY = 'kocici-hra-best';
  const READY_HINT = 'Hoď myšku (tlačítko, klepnutí do pokoje nebo mezerník).';

  const CATS = [
    {
      name: 'Nori', clicks: 8, points: 10, weight: 25, size: 0.8,
      look: { fur: '#dcbd90', stripes: '#a47c4f', eyes: '#5aa9e6', head: 1.15 }
    },
    {
      name: 'Zrzavé kotě', clicks: 14, points: 25, weight: 10, size: 0.85,
      look: { fur: '#ee8a3c', stripes: '#c4621c', eyes: '#7bc96f', head: 1.15 }
    },
    {
      name: 'Lumi', clicks: 22, points: 50, weight: 25, size: 1,
      look: { fur: '#fbfaf6', eyes: '#5db4e0' }
    },
    {
      name: 'Sazi', clicks: 32, points: 90, weight: 15, size: 1.3,
      look: { fur: '#2a2a30', eyes: '#ffd23a', ear: '#7a5565' }
    },
    {
      name: 'Laskonka', clicks: 42, points: 160, weight: 15, size: 1.4,
      look: { fur: '#8e939c', eyes: '#e9b73c' }
    },
    {
      name: 'Zlaté kotě (vzácné)', clicks: 20, points: 300, weight: 10, size: 0.85,
      look: { fur: '#f6c431', stripes: '#d9a21b', eyes: '#3fbfc9', head: 1.15, sparkle: true }
    }
  ];
  const PORTRAITS = ['Lumi', 'Nori', 'Sazi', 'Laskonka'].map((name) => CATS.find((c) => c.name === name).look);
  const TOTAL_WEIGHT = CATS.reduce((sum, c) => sum + c.weight, 0);

  const canvas = document.getElementById('game-canvas');
  const actionButton = document.getElementById('game-action');
  const scoreEl = document.getElementById('game-score');
  const timeEl = document.getElementById('game-time');
  const bestEl = document.getElementById('game-best');
  const statusEl = document.getElementById('game-status');

  if (!D || !canvas || !actionButton) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const root = document.documentElement;

  let W = 800;
  let state = 'idle';
  let stateTime = 0;
  let timeLeft = ROUND_SECONDS;
  let score = 0;
  let best = 0;
  let cat = null;
  let side = 1;
  let mouse = null;
  let progress = 0;
  let catPos = { x: 0, y: 0 };
  let flip = false;
  let pulse = 0;
  let happy = false;
  let popups = [];
  let lastFrame = 0;

  try {
    best = Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch (e) {
    best = 0;
  }

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - (1 - t) * (1 - t);

  const pickCat = () => {
    let roll = Math.random() * TOTAL_WEIGHT;
    for (const candidate of CATS) {
      roll -= candidate.weight;
      if (roll < 0) {
        return candidate;
      }
    }
    return CATS[0];
  };

  const setStatus = (text) => {
    if (statusEl.textContent !== text) {
      statusEl.textContent = text;
    }
  };

  const setButton = (text) => {
    if (actionButton.textContent !== text) {
      actionButton.textContent = text;
    }
  };

  const updateHud = () => {
    scoreEl.textContent = String(score);
    timeEl.textContent = String(Math.ceil(Math.max(0, timeLeft)));
    bestEl.textContent = String(best);
  };

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth || 800;
    const ch = canvas.clientHeight || H;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    const scale = canvas.height / H;
    W = canvas.width / scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (mouse) {
      mouse.x = clamp(mouse.x, SIDE_MARGIN, W - SIDE_MARGIN);
      mouse.tx = clamp(mouse.tx, SIDE_MARGIN, W - SIDE_MARGIN);
    }
  };

  const setState = (next, time) => {
    state = next;
    stateTime = time || 0;
  };

  const randomSpot = (avoid) => {
    let spot;
    for (let i = 0; i < 8; i += 1) {
      spot = {
        x: SIDE_MARGIN + Math.random() * (W - 2 * SIDE_MARGIN),
        y: PLAY_TOP + Math.random() * (PLAY_BOTTOM - PLAY_TOP)
      };
      if (!avoid || Math.hypot(spot.x - avoid.x, spot.y - avoid.y) > Math.min(140, W * 0.3)) {
        break;
      }
    }
    return spot;
  };

  const throwMouse = (point) => {
    const target = point
      ? { x: clamp(point.x, SIDE_MARGIN, W - SIDE_MARGIN), y: clamp(point.y, PLAY_TOP, PLAY_BOTTOM) }
      : randomSpot(mouse && { x: mouse.tx, y: mouse.ty });
    if (!mouse) {
      mouse = { x: W / 2, y: H + 30 };
    }
    mouse.fx = mouse.x;
    mouse.fy = mouse.y;
    mouse.tx = target.x;
    mouse.ty = target.y;
    mouse.t = 0;
  };

  const startRound = () => {
    score = 0;
    timeLeft = ROUND_SECONDS;
    cat = null;
    mouse = null;
    popups = [];
    setStatus(READY_HINT);
    setState('ready');
    updateHud();
    if (window.matchMedia('(max-width: 768px)').matches) {
      canvas.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    document.dispatchEvent(new CustomEvent('hra:start'));
  };

  const endRound = () => {
    if (score > best) {
      best = score;
      try {
        localStorage.setItem(STORAGE_KEY, String(best));
      } catch (e) {
        // storage unavailable, best score lasts for this page view only
      }
    }
    mouse = null;
    cat = null;
    setState('ended');
    updateHud();
    document.dispatchEvent(new CustomEvent('hra:konec', { detail: { score } }));
  };

  const leave = (isHappy, message) => {
    happy = isHappy;
    if (isHappy) {
      score += cat.points;
      popups.push({ text: `+${cat.points}`, x: clamp(catPos.x, 60, W - 60), y: catPos.y - 110, life: 1.4 });
    }
    setStatus(message);
    setState('result', isHappy ? 1.8 : 1.2);
  };

  const contentCat = () => {
    leave(true, `Kočička (${cat.name}) je spokojená a odchází. +${cat.points} bodů!`);
  };

  const act = (point) => {
    switch (state) {
      case 'idle':
      case 'ended':
        startRound();
        break;
      case 'ready':
        cat = pickCat();
        side = Math.random() < 0.5 ? -1 : 1;
        throwMouse(point);
        setState('waiting', 1.5 + Math.random() * 2.5);
        break;
      case 'waiting':
      case 'warn':
      case 'jump':
        throwMouse(point);
        break;
      case 'bite':
        progress = START_PROGRESS;
        throwMouse(point);
        setState('play');
        break;
      case 'play': {
        const prev = { x: mouse.tx, y: mouse.ty };
        throwMouse(point);
        const ratio = Math.hypot(mouse.tx - prev.x, mouse.ty - prev.y) / (BODY_UNIT * cat.size);
        const multiplier = ratio > 1 ? 1 + ratio : 1;
        progress += multiplier / cat.clicks;
        pulse = 1;
        if (multiplier > 1) {
          popups.push({ text: `×${multiplier.toFixed(1)}`, x: clamp(mouse.tx, 50, W - 50), y: mouse.ty - 50, life: 0.8, size: 30 });
        }
        if (progress >= 1) {
          contentCat();
        }
        break;
      }
      default:
        break;
    }
  };

  const update = (dt) => {
    if (state === 'idle' || state === 'ended') {
      return;
    }

    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      endRound();
      return;
    }

    pulse = Math.max(0, pulse - dt * 6);

    if (mouse && mouse.t < 1) {
      mouse.t = Math.min(1, mouse.t + dt / THROW_DURATION);
      mouse.x = lerp(mouse.fx, mouse.tx, easeOut(mouse.t));
      mouse.y = lerp(mouse.fy, mouse.ty, easeOut(mouse.t)) - Math.sin(Math.PI * mouse.t) * 70;
    }

    switch (state) {
      case 'waiting':
        stateTime -= dt;
        if (stateTime <= 0) {
          setState('warn', WARN_DURATION);
        }
        break;
      case 'warn':
        stateTime -= dt;
        if (stateTime <= 0) {
          setState('jump', 0);
        }
        break;
      case 'jump': {
        stateTime += dt;
        const u = clamp(stateTime / JUMP_DURATION, 0, 1);
        flip = side < 0;
        catPos = {
          x: lerp(side > 0 ? W + 80 : -80, mouse.tx, easeOut(u)),
          y: mouse.ty - Math.sin(Math.PI * u) * 150
        };
        if (u >= 1) {
          setState('bite', BITE_WINDOW);
        }
        break;
      }
      case 'bite':
        stateTime -= dt;
        catPos = { x: mouse.tx, y: mouse.ty };
        if (stateTime <= 0) {
          leave(false, 'Kočička ztratila zájem a odešla. Byl jsi pomalý.');
        }
        break;
      case 'play': {
        progress -= (DRAIN_FACTOR / cat.clicks) * dt;
        const dx = mouse.tx - catPos.x;
        if (Math.abs(dx) > 8) {
          flip = dx > 0;
        }
        const follow = Math.min(1, dt * 5);
        catPos.x += dx * follow;
        catPos.y += (mouse.ty - catPos.y) * follow;
        if (progress >= 1) {
          contentCat();
        } else if (progress <= 0) {
          leave(false, 'Kočička ztratila zájem a odešla. Zkus to rychleji!');
        }
        break;
      }
      case 'result':
        stateTime -= dt;
        flip = side > 0;
        catPos.x += side * (happy ? 380 : 560) * dt;
        if (stateTime <= 0) {
          cat = null;
          mouse = null;
          setState('ready');
        }
        break;
      default:
        break;
    }

    popups.forEach((p) => {
      p.life -= dt;
      p.y -= 40 * dt;
    });
    popups = popups.filter((p) => p.life > 0);
  };

  const drawCat = () => {
    if (!cat || !['jump', 'bite', 'play', 'result'].includes(state)) {
      return;
    }
    let size = BODY_UNIT * cat.size;
    const x = catPos.x;
    let floorY = catPos.y;
    let y = catPos.y - size * 0.45;
    let angle = 0;

    if (state === 'jump') {
      floorY = mouse.ty;
      angle = (side < 0 ? 1 : -1) * 0.25 * Math.sin(Math.PI * (stateTime / JUMP_DURATION));
    } else if (state === 'play') {
      size *= 1 + pulse * 0.1;
    } else if (state === 'result' && happy) {
      y -= Math.abs(Math.sin(stateTime * 8)) * 14;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, floorY + 8, size * 0.45, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    D.cat(ctx, x, y, size, cat.look, { flip, angle, happy: state === 'result' && happy });

    if (state !== 'jump') {
      ctx.font = '700 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(60,35,15,0.85)';
      ctx.fillStyle = '#fff';
      const labelX = clamp(x, 70, W - 70);
      ctx.strokeText(cat.name, labelX, y - size * 0.82);
      ctx.fillText(cat.name, labelX, y - size * 0.82);
    }

    if (state === 'result' && happy) {
      ctx.fillStyle = '#000';
      for (let i = 0; i < 3; i += 1) {
        const rise = (stateTime * 45 + i * 22) % 66;
        D.emoji(ctx, '❤️', x + (i - 1) * 34, y - size * 0.25 - rise, 24, false, 0);
      }
    }
  };

  const drawMouse = () => {
    if (!mouse) {
      return;
    }
    if (cat && (state === 'warn' || state === 'jump')) {
      const t = state === 'warn' ? 1 - stateTime / WARN_DURATION : 1;
      const grow = 0.35 + t * 0.65;
      ctx.fillStyle = `rgba(30,20,10,${0.18 + t * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(mouse.tx, mouse.ty + 14, 52 * cat.size * grow, 14 * cat.size * grow, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const wiggle = state === 'bite' || state === 'play' ? Math.sin(performance.now() / 40) * 0.25 : 0;
    ctx.fillStyle = '#000';
    D.emoji(ctx, '🐭', mouse.x, mouse.y, 42, false, wiggle);
    if (state === 'bite') {
      ctx.fillStyle = '#e03b3b';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', mouse.tx, mouse.ty - 120);
    }
  };

  const drawMeter = () => {
    if (state !== 'play') {
      return;
    }
    const w = Math.min(360, W - 100);
    const x = (W - w) / 2;
    const y = 22;
    const h = 22;
    D.roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 14, 'rgba(0,0,0,0.5)');
    const t = clamp(progress, 0, 1);
    const color = t < 0.33 ? '#e0584b' : t < 0.66 ? '#e8a93b' : '#58b862';
    if (t > 0.02) {
      D.roundRect(ctx, x, y, w * t, h, 10, color);
    }
  };

  const drawPopups = () => {
    popups.forEach((p) => {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#6a3f1d';
      ctx.lineWidth = p.size ? 4 : 6;
      ctx.font = `700 ${p.size || 54}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.globalAlpha = 1;
  };

  const drawOverlay = () => {
    if (state !== 'idle' && state !== 'ended') {
      return;
    }
    const cx = W / 2;
    const maxWidth = W - 48;
    const serif = 'Georgia, serif';
    const sans = 'system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20,14,10,0.62)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (state === 'idle') {
      const title = 'Hraní s kočičkami';
      D.fitFont(ctx, title, maxWidth, 44, '700', serif);
      ctx.fillText(title, cx, 150);
      ctx.font = `22px ${sans}`;
      let y = D.wrapText(ctx, 'Hoď myšku, počkej, až ji kočička začne honit, a pak rychle klikej. Čím víc klikáš, tím víc se kočička baví.', cx, 215, maxWidth, 32);
      y = D.wrapText(ctx, 'Kolo trvá 90 sekund.', cx, y + 10, maxWidth, 32);
      D.wrapText(ctx, 'Klepnutím začni.', cx, y + 10, maxWidth, 32);
    } else {
      D.fitFont(ctx, 'Konec kola', maxWidth, 44, '700', serif);
      ctx.fillText('Konec kola', cx, 170);
      ctx.font = `30px ${sans}`;
      ctx.fillText(`Skóre: ${score}`, cx, 235);
      ctx.fillText(`Nejlepší: ${best}`, cx, 280);
      if (score > 0 && score >= best) {
        ctx.fillStyle = '#ffd36b';
        ctx.fillText('Nový rekord!', cx, 330);
      }
      ctx.fillStyle = '#fff';
      ctx.font = `20px ${sans}`;
      ctx.fillText('Klepnutím hraj znovu.', cx, 385);
    }
  };

  const render = () => {
    D.room(ctx, W, PORTRAITS);
    drawMouse();
    drawCat();
    drawMeter();
    drawPopups();
    if (root.getAttribute('data-theme') === 'dark') {
      ctx.fillStyle = 'rgba(12,10,28,0.42)';
      ctx.fillRect(0, 0, W, H);
    }
    drawOverlay();
  };

  const syncUi = () => {
    switch (state) {
      case 'idle':
        setButton('Začít hru');
        setStatus('Připraven? Začni kolo.');
        break;
      case 'ended':
        setButton('Hrát znovu');
        setStatus(`Konec kola. Skóre: ${score}.`);
        break;
      case 'ready':
        setButton('Hodit myšku');
        break;
      case 'waiting':
      case 'warn':
      case 'jump':
        setButton('Počkej na kočičku…');
        setStatus('Čekej na kočičku. Stín pod myškou prozradí, jak je velká.');
        break;
      case 'bite':
        setButton('Hraj!');
        setStatus('Kočičku zaujala myška! Rychle začni klikat!');
        break;
      case 'play':
        setButton('Klikej!');
        setStatus('Klikej a házej myškou po pokoji, čím dál od minulého místa, tím líp. Plný zelený ukazatel = spokojená kočička.');
        break;
      default:
        setButton('Hodit myšku');
        break;
    }
    updateHud();
  };

  const frame = (now) => {
    const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0);
    lastFrame = now;
    update(dt);
    render();
    syncUi();
    window.requestAnimationFrame(frame);
  };

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    act({
      x: (event.clientX - rect.left) * (W / rect.width),
      y: (event.clientY - rect.top) * (H / rect.height)
    });
  });

  actionButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    act();
  });

  document.addEventListener('keydown', (event) => {
    if (event.repeat) {
      return;
    }
    const onButton = event.target === actionButton;
    if (event.code === 'Space' || (event.key === 'Enter' && onButton)) {
      const tag = event.target instanceof HTMLElement ? event.target.tagName : '';
      if (event.code === 'Space' && (tag === 'INPUT' || tag === 'TEXTAREA')) {
        return;
      }
      event.preventDefault();
      act();
    }
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(resize).observe(canvas);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();
  setStatus('Připraven? Začni kolo.');
  updateHud();
  window.requestAnimationFrame(frame);
})();
