window.HraDraw = (() => {
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const FLOOR_TOP = 336;

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  const emoji = (ctx, char, x, y, size, flip, angle) => {
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

  const roundRect = (ctx, x, y, w, h, r, fill) => {
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

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    let line = '';
    let cursor = y;
    text.split(' ').forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        ctx.fillText(line, x, cursor);
        line = word;
        cursor += lineHeight;
      } else {
        line = test;
      }
    });
    ctx.fillText(line, x, cursor);
    return cursor + lineHeight;
  };

  const fitFont = (ctx, text, maxWidth, size, style, family) => {
    let px = size;
    ctx.font = `${style} ${px}px ${family}`;
    while (px > 14 && ctx.measureText(text).width > maxWidth) {
      px -= 2;
      ctx.font = `${style} ${px}px ${family}`;
    }
  };

  const room = (ctx, W) => {
    const ds = clamp(W / 800, 0.6, 1);

    const wall = ctx.createLinearGradient(0, 0, 0, FLOOR_TOP);
    wall.addColorStop(0, '#f1e3cf');
    wall.addColorStop(1, '#e6d2b6');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, FLOOR_TOP);

    ctx.fillStyle = 'rgba(147,111,80,0.07)';
    for (let x = 0; x < W; x += 50) {
      ctx.fillRect(x, 0, 25, FLOOR_TOP);
    }

    ctx.fillStyle = '#fdf7ee';
    ctx.fillRect(0, 318, W, 18);

    const floor = ctx.createLinearGradient(0, FLOOR_TOP, 0, 500);
    floor.addColorStop(0, '#b98a5e');
    floor.addColorStop(1, '#8f6540');
    ctx.fillStyle = floor;
    ctx.fillRect(0, FLOOR_TOP, W, 500 - FLOOR_TOP);
    ctx.strokeStyle = 'rgba(60,35,15,0.25)';
    ctx.lineWidth = 2;
    for (let y = 366; y < 500; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const wx = W * 0.08;
    const ww = 170 * ds;
    const wh = 190 * ds;
    roundRect(ctx, wx, 60, ww, wh, 8, '#fdf7ee');
    const sky = ctx.createLinearGradient(0, 70, 0, 60 + wh);
    sky.addColorStop(0, '#9fd3f5');
    sky.addColorStop(1, '#dff1fb');
    ctx.fillStyle = sky;
    ctx.fillRect(wx + 12, 72, ww - 24, wh - 24);
    ctx.fillStyle = '#fdf7ee';
    ctx.fillRect(wx + ww / 2 - 5, 72, 10, wh - 24);
    ctx.fillRect(wx + 12, 60 + wh / 2 - 5, ww - 24, 10);
    ctx.fillStyle = 'rgba(214,120,130,0.85)';
    ctx.fillRect(wx - 10, 55, 34 * ds, wh + 20);
    ctx.fillRect(wx + ww - 24 * ds, 55, 34 * ds, wh + 20);

    const px = W * 0.66;
    const pw = 130 * ds;
    const ph = 90 * ds;
    roundRect(ctx, px, 70, pw, ph, 6, '#936f50');
    roundRect(ctx, px + 10, 80, pw - 20, ph - 20, 3, '#fbeee0');
    ctx.fillStyle = '#d4607a';
    emoji(ctx, '♥', px + pw / 2, 70 + ph / 2, 44 * ds, false, 0);

    const sw = Math.min(310, W * 0.86);
    const sx = (W - sw) / 2;
    roundRect(ctx, sx + 20, 235, sw - 40, 100, 22, '#b5546a');
    roundRect(ctx, sx, 275, sw, 60, 18, '#c8687e');
    roundRect(ctx, sx + 30, 255, sw - 60, 40, 14, '#d77c90');

    ctx.fillStyle = '#000';
    emoji(ctx, '🪴', W * 0.9, 330, 84 * ds, false, 0);

    const rx = Math.min(250, W * 0.42);
    ctx.fillStyle = 'rgba(176,82,102,0.55)';
    ctx.beginPath();
    ctx.ellipse(W / 2, 440, rx, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253,247,238,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(W / 2, 440, rx - 30, 36, 0, 0, Math.PI * 2);
    ctx.stroke();
  };

  return { emoji, roundRect, wrapText, fitFont, room };
})();
