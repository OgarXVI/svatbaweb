document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-seating]');

  if (!container) {
    return;
  }

  // Seat order: top side (L-R), below bar left, below bar right, bar ends, stem left, stem right.
  // Edit names here; null means an empty chair.
  const GUESTS = [
    'Tereza H.', 'Dan Hejplík', 'Jaroslav D','Jana C', 'Eva Čechová', 'Tony',
    'Adrian', 'Jarda D',
    'Josef Čech', 'Iveta Čechová',
    null, null,
    'Iva D', 'Ivana D', 'Martin S', 'Šárka S',
    'přítel Denisky', 'Deniska', 'Martinek S', 'Přítelkyně Martínka' ,
  ];

  const SEATS = [
    [150, 60], [250, 60], [350, 60], [450, 60], [550, 60], [650, 60],
    [150, 220], [250, 220],
    [550, 220], [650, 220],
    [60, 140], [740, 140],
    [320, 240], [320, 320], [320, 400], [320, 480],
    [480, 240], [480, 320], [480, 400], [480, 480],
  ];

  const NS = 'http://www.w3.org/2000/svg';
  const RADIUS = 26;

  const el = (name, attrs = {}, text) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text !== undefined) {
      node.textContent = text;
    }
    return node;
  };

  const initials = (name) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');

  const svg = el('svg', {
    class: 'seating__svg',
    viewBox: '0 0 800 560',
    role: 'group',
    'aria-label': 'Zasedací pořádek',
  });

  svg.appendChild(
    el('path', {
      class: 'seating__table',
      d: 'M100 100H700V180H440V520H360V180H100Z',
    })
  );

  svg.appendChild(el('text', { class: 'seating__label', x: 400, y: 148 }, 'Svatební stůl'));

  const tooltip = document.createElement('div');
  tooltip.className = 'seating__tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;

  const showTooltip = (text, clientX, clientY) => {
    const box = container.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.hidden = false;
    tooltip.style.left = `${clientX - box.left + container.scrollLeft}px`;
    tooltip.style.top = `${clientY - box.top}px`;
  };

  const hideTooltip = () => {
    tooltip.hidden = true;
  };

  SEATS.forEach(([x, y], i) => {
    const name = GUESTS[i] || null;
    const label = name || 'Volné místo';

    const seat = el('g', {
      class: name ? 'seating__seat' : 'seating__seat seating__seat--empty',
      tabindex: 0,
      role: 'img',
      'aria-label': label,
    });

    seat.appendChild(el('circle', { cx: x, cy: y, r: RADIUS }));
    if (name) {
      seat.appendChild(el('text', { x, y }, initials(name)));
    }

    const showAtPointer = (event) => showTooltip(label, event.clientX, event.clientY - 18);

    seat.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') {
        showAtPointer(event);
      }
    });
    seat.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'mouse') {
        showAtPointer(event);
      }
    });
    seat.addEventListener('pointerleave', hideTooltip);
    seat.addEventListener('click', (event) => {
      event.stopPropagation();
      showAtPointer(event);
    });
    seat.addEventListener('focus', () => {
      const rect = seat.getBoundingClientRect();
      showTooltip(label, rect.left + rect.width / 2, rect.top - 6);
    });
    seat.addEventListener('blur', hideTooltip);

    svg.appendChild(seat);
  });

  document.addEventListener('click', hideTooltip);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideTooltip();
    }
  });

  container.replaceChildren(svg, tooltip);
});
