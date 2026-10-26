(() => {
  const W = 800;
  const H = 500;
  const ROUND_SECONDS = 90;
  const BITE_WINDOW = 1.4;
  const START_PROGRESS = 0.3;
  const DRAIN_FACTOR = 3;
  const JUMP_DURATION = 0.55;
  const WARN_DURATION = 0.7;
  const BAIT_Y = 400;
  const STORAGE_KEY = 'kocici-hra-best';
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  const CATS = [
    { name: 'Koťátko', emoji: '🐱', clicks: 8, points: 10, weight: 35, size: 0.8 },
    { name: 'Domácí mourek', emoji: '🐈', clicks: 14, points: 25, weight: 28, size: 1 },
    { name: 'Černý kocour', emoji: '🐈‍⬛', clicks: 22, points: 50, weight: 18, size: 1.1 },
    { name: 'Tlustý kocour', emoji: '😾', clicks: 32, points: 90, weight: 10, size: 1.3 },
    { name: 'Divoký tygr', emoji: '🐯', clicks: 42, points: 160, weight: 5, size: 1.5 },
    { name: 'Zlatá kočka (vzácná)', emoji: '😻', clicks: 20, points: 300, weight: 2, size: 1.1 }
  ];
  const TOTAL_WEIGHT = CATS.reduce((sum, cat) => sum + cat.weight, 0);

  const canvas = document.getElementById('game-canvas');
  const actionButton = document.getElementById('game-action');
  const scoreEl = document.getElementById('game-score');
  const timeEl = document.getElementById('game-time');
  const bestEl = document.getElementById('game-best');
  const statusEl = document.getElementById('game-status');

  if (!canvas || !actionButton) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const root = document.documentElement;

  let state = 'idle';
  let stateTime = 0;
  let timeLeft = ROUND_SECONDS;
  let score = 0;
  let best = 0;
  let cat = null;
  let side = 1;
  let bait = null;
  let progress = 0;
  let catPos = { x: 0, y: 0 };
  let pulse = 0;
  let lastCaught = null;
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
    const width = canvas.clientWidth || W;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(width * (H / W) * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  };

  const setState = (next, time) => {
    state = next;
    stateTime = time || 0;
  };

  const startRound = () => {
    score = 0;
    timeLeft = ROUND_SECONDS;
    cat = null;
    bait = null;
    popups = [];
    lastCaught = null;
    setStatus('Hoď návnadu (tlačítko, klepnutí na scénu nebo mezerník).');
    setState('ready');
    updateHud();
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
    bait = null;
    cat = null;
    setState('ended');
    updateHud();
    document.dispatchEvent(new CustomEvent('hra:konec', { detail: { score } }));
  };

  const showResult = (message, seconds) => {
    setStatus(message);
    setState('result', seconds);
  };

  const escapeCat = (message) => {
    lastCaught = null;
    bait = null;
    showResult(message, 1.1);
  };

  const act = () => {
    switch (state) {
      case 'idle':
      case 'ended':
        startRound();
        break;
      case 'ready':
        bait = { x: 260 + Math.random() * 280, y: BAIT_Y };
        cat = pickCat();
        side = Math.random() < 0.5 ? -1 : 1;
        setState('waiting', 1.5 + Math.random() * 2.5);
        break;
      case 'waiting':
      case 'warn':
      case 'jump':
        bait = null;
        cat = null;
        showResult('Příliš brzy! Návnada zůstala prázdná.', 1);
        break;
      case 'bite':
        progress = START_PROGRESS;
        setState('reel');
        break;
      case 'reel':
        progress = clamp(progress + 1 / cat.clicks, 0, 1);
        pulse = 1;
        break;
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
        catPos = {
          x: lerp(side > 0 ? W + 80 : -80, bait.x, easeOut(u)),
          y: bait.y - Math.sin(Math.PI * u) * 150
        };
        if (u >= 1) {
          setState('bite', BITE_WINDOW);
        }
        break;
      }
      case 'bite':
        stateTime -= dt;
        catPos = { x: bait.x, y: bait.y };
        if (stateTime <= 0) {
          escapeCat('Kočka ti utekla. Byl jsi pomalý.');
        }
        break;
      case 'reel':
        progress -= (DRAIN_FACTOR / cat.clicks) * dt;
        catPos = {
          x: lerp(bait.x, W / 2, clamp(progress, 0, 1)),
          y: lerp(BAIT_Y, 430, clamp(progress, 0, 1))
        };
        if (progress >= 1) {
          score += cat.points;
          lastCaught = cat;
          popups.push({ text: `+${cat.points}`, x: W / 2, y: 330, life: 1.2 });
          showResult(`Chytil jsi: ${cat.name}!`, 1.4);
          catPos = { x: W / 2, y: 440 };
          bait = null;
        } else if (progress <= 0) {
          escapeCat(`${cat.name} ti utekla!`);
        }
        break;
      case 'result':
        stateTime -= dt;
        if (!lastCaught && cat) {
          catPos.x += side * 650 * dt;
        }
        if (stateTime <= 0) {
          cat = null;
          lastCaught = null;
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

  const emoji = (char, x, y, size, flip, angle) => {
    ctx.save();
    ctx.translate(x, y);
    if (angle) {
      ctx.rotate(angle);
    }
    if (flip) {
      ctx.scale(-1, 1);
    }
    ctx.font = `${size}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 0, 0);
    ctx.restore();
  };

  const roundRect = (x, y, w, h, r, fill) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };

  const drawRoom = () => {
    const wall = ctx.createLinearGradient(0, 0, 0, 335);
    wall.addColorStop(0, '#f1e3cf');
    wall.addColorStop(1, '#e6d2b6');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, 335);

    ctx.fillStyle = 'rgba(147,111,80,0.07)';
    for (let x = 0; x < W; x += 50) {
      ctx.fillRect(x, 0, 25, 335);
    }

    ctx.fillStyle = '#fdf7ee';
    ctx.fillRect(0, 318, W, 18);

    const floor = ctx.createLinearGradient(0, 336, 0, H);
    floor.addColorStop(0, '#b98a5e');
    floor.addColorStop(1, '#8f6540');
    ctx.fillStyle = floor;
    ctx.fillRect(0, 336, W, H - 336);
    ctx.strokeStyle = 'rgba(60,35,15,0.25)';
    ctx.lineWidth = 2;
    for (let y = 366; y < H; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    roundRect(80, 60, 170, 190, 8, '#fdf7ee');
    const sky = ctx.createLinearGradient(0, 70, 0, 240);
    sky.addColorStop(0, '#9fd3f5');
    sky.addColorStop(1, '#dff1fb');
    ctx.fillStyle = sky;
    ctx.fillRect(92, 72, 146, 166);
    ctx.fillStyle = '#fdf7ee';
    ctx.fillRect(160, 72, 10, 166);
    ctx.fillRect(92, 150, 146, 10);
    ctx.fillStyle = 'rgba(214,120,130,0.85)';
    ctx.fillRect(70, 55, 34, 210);
    ctx.fillRect(226, 55, 34, 210);

    roundRect(540, 70, 130, 90, 6, '#936f50');
    roundRect(550, 80, 110, 70, 3, '#fbeee0');
    ctx.fillStyle = '#d4607a';
    emoji('♥', 605, 116, 44, false, 0);

    roundRect(310, 235, 270, 100, 22, '#b5546a');
    roundRect(290, 275, 310, 60, 18, '#c8687e');
    roundRect(320, 255, 250, 40, 14, '#d77c90');

    emoji('🪴', 720, 330, 84, false, 0);

    ctx.fillStyle = 'rgba(176,82,102,0.55)';
    ctx.beginPath();
    ctx.ellipse(400, 440, 250, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253,247,238,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(400, 440, 220, 36, 0, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawCat = () => {
    if (!cat) {
      return;
    }
    const flip = side < 0;
    let size = 64 * cat.size;
    let x = catPos.x;
    let y = catPos.y;
    let angle = 0;
    let floorY = catPos.y;

    if (state === 'jump') {
      floorY = BAIT_Y;
      angle = (side < 0 ? 1 : -1) * 0.25 * Math.sin(Math.PI * (stateTime / JUMP_DURATION));
    } else if (state === 'bite') {
      y -= size * 0.45;
    } else if (state === 'reel') {
      const t = clamp(progress, 0, 1);
      x += (Math.random() - 0.5) * (1 - t) * 10;
      floorY = catPos.y;
      y = floorY - size * 0.45 + (Math.random() - 0.5) * (1 - t) * 8;
      size *= 1 + t * 0.35 + pulse * 0.08;
    } else if (state === 'result' && lastCaught) {
      size *= 1.35;
      y -= size * 0.45 + Math.abs(Math.sin(stateTime * 7)) * 18;
    } else if (state === 'result') {
      y -= size * 0.45;
    } else {
      return;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, floorY + 8, size * 0.45, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    emoji(cat.emoji, x, y, size, flip, angle);
  };

  const drawBait = () => {
    if (!bait) {
      return;
    }
    if (state === 'warn' || state === 'jump') {
      const t = state === 'warn' ? 1 - stateTime / WARN_DURATION : 1;
      ctx.fillStyle = `rgba(30,20,10,${0.18 + t * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(bait.x, bait.y + 14, 52 * cat.size * (0.35 + t * 0.65), 14 * cat.size * (0.35 + t * 0.65), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const wiggle = state === 'bite' || state === 'reel' ? Math.sin(performance.now() / 40) * 0.25 : 0;
    ctx.fillStyle = '#000';
    emoji('🐭', bait.x, bait.y, 42, false, wiggle);
    if (state === 'bite') {
      ctx.fillStyle = '#e03b3b';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', bait.x, bait.y - 120);
    }
  };

  const drawMeter = () => {
    if (state !== 'reel') {
      return;
    }
    const x = 220;
    const y = 22;
    const w = 360;
    const h = 22;
    roundRect(x - 4, y - 4, w + 8, h + 8, 14, 'rgba(0,0,0,0.5)');
    const t = clamp(progress, 0, 1);
    const color = t < 0.33 ? '#e0584b' : t < 0.66 ? '#e8a93b' : '#58b862';
    if (t > 0.02) {
      roundRect(x, y, w * t, h, 10, color);
    }
  };

  const drawOverlay = () => {
    if (state !== 'idle' && state !== 'ended') {
      return;
    }
    ctx.fillStyle = 'rgba(20,14,10,0.62)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (state === 'idle') {
      ctx.font = '700 44px Georgia, serif';
      ctx.fillText('Chytání kočiček', W / 2, 190);
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('Hoď návnadu, počkej na kočku a pak rychle klikej!', W / 2, 250);
      ctx.fillText('Kolo trvá 90 sekund.', W / 2, 290);
    } else {
      ctx.font = '700 44px Georgia, serif';
      ctx.fillText('Konec kola', W / 2, 170);
      ctx.font = '30px system-ui, sans-serif';
      ctx.fillText(`Skóre: ${score}`, W / 2, 235);
      ctx.fillText(`Nejlepší: ${best}`, W / 2, 280);
      if (score > 0 && score >= best) {
        ctx.fillStyle = '#ffd36b';
        ctx.fillText('Nový rekord!', W / 2, 330);
      }
    }
  };

  const drawPopups = () => {
    popups.forEach((p) => {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#6a3f1d';
      ctx.lineWidth = 6;
      ctx.font = '700 54px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.globalAlpha = 1;
  };

  const render = () => {
    drawRoom();
    drawBait();
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
        setButton('Hodit návnadu');
        if (!statusEl.textContent || statusEl.textContent.startsWith('Připraven')) {
          setStatus('Hoď návnadu (tlačítko, klepnutí na scénu nebo mezerník).');
        }
        break;
      case 'waiting':
      case 'warn':
      case 'jump':
        setButton('Počkej na kočku…');
        setStatus('Čekej na kočku. Stín pod návnadou prozradí její velikost.');
        break;
      case 'bite':
        setButton('Tahej!');
        setStatus('Kočka skočila na návnadu! Rychle tahej!');
        break;
      case 'reel':
        setButton('Klikej!');
        setStatus('Klikej co nejrychleji, ať ti neuteče!');
        break;
      default:
        setButton('Hodit návnadu');
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
    act();
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

  window.addEventListener('resize', resize);
  resize();
  updateHud();
  window.requestAnimationFrame(frame);
})();
