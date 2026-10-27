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

  const ellipse = (ctx, x, y, rx, ry) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  const cat = (ctx, x, y, size, look, opts) => {
    const u = size / 64;
    const line = 'rgba(58,38,28,0.7)';
    ctx.save();
    ctx.translate(x, y);
    if (opts.angle) {
      ctx.rotate(opts.angle);
    }
    if (opts.flip) {
      ctx.scale(-1, 1);
    }
    ctx.scale(u, u);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = line;
    ctx.fillStyle = look.fur;

    ctx.beginPath();
    ctx.moveTo(16, 20);
    ctx.bezierCurveTo(38, 22, 40, 2, 30, -6);
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = look.fur;
    ctx.lineWidth = 5.4;
    ctx.stroke();

    ctx.strokeStyle = line;
    ctx.lineWidth = 1.8;
    ellipse(ctx, 0, 8, 21, 17);
    ellipse(ctx, -9, 22, 7, 4);
    ellipse(ctx, 9, 22, 7, 4);

    if (look.stripes) {
      ctx.strokeStyle = look.stripes;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      [-1, 1].forEach((s) => {
        ctx.moveTo(s * 20, 2);
        ctx.lineTo(s * 13, 4);
        ctx.moveTo(s * 21, 10);
        ctx.lineTo(s * 14, 11);
      });
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(0, -14);
    ctx.scale(look.head || 1, look.head || 1);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.8;
    [-1, 1].forEach((s) => {
      ctx.fillStyle = look.fur;
      ctx.beginPath();
      ctx.moveTo(s * 17, -8);
      ctx.lineTo(s * 15, -27);
      ctx.lineTo(s * 3, -17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = look.ear || '#f4a6b5';
      ctx.beginPath();
      ctx.moveTo(s * 14.5, -11);
      ctx.lineTo(s * 14, -23);
      ctx.lineTo(s * 7, -17.5);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = look.fur;
    ellipse(ctx, 0, 0, 19, 18);

    if (look.stripes) {
      ctx.strokeStyle = look.stripes;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, -11);
      ctx.moveTo(-5.5, -17);
      ctx.lineTo(-4, -11);
      ctx.moveTo(5.5, -17);
      ctx.lineTo(4, -11);
      ctx.stroke();
    }

    [-1, 1].forEach((s) => {
      if (opts.happy) {
        ctx.strokeStyle = '#2b1b12';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s * 7, 0, 3.5, Math.PI, 0);
        ctx.stroke();
      } else {
        ctx.fillStyle = look.eyes;
        ctx.strokeStyle = line;
        ctx.lineWidth = 1;
        ellipse(ctx, s * 7, -1, 3.8, 4.2);
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(s * 7, -1, 1.2, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.fillStyle = '#e98aa0';
    ctx.beginPath();
    ctx.moveTo(-2.4, 4.5);
    ctx.lineTo(2.4, 4.5);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = line;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 9);
    ctx.moveTo(0, 9);
    ctx.quadraticCurveTo(-3, 11.5, -5.5, 9);
    ctx.moveTo(0, 9);
    ctx.quadraticCurveTo(3, 11.5, 5.5, 9);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(58,38,28,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    [-1, 1].forEach((s) => {
      ctx.moveTo(s * 10, 6.5);
      ctx.lineTo(s * 25, 3.5);
      ctx.moveTo(s * 10, 8.5);
      ctx.lineTo(s * 26, 9);
      ctx.moveTo(s * 10, 10.5);
      ctx.lineTo(s * 24, 14.5);
    });
    ctx.stroke();

    ctx.restore();
    ctx.restore();

    if (look.sparkle) {
      ctx.fillStyle = '#000';
      emoji(ctx, '✨', x - size * 0.42, y - size * 0.5, size * 0.32, false, 0);
      emoji(ctx, '✨', x + size * 0.45, y - size * 0.1, size * 0.24, false, 0);
    }
  };

  return { emoji, roundRect, wrapText, fitFont, room, cat };
})();
