document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('skore-form');
  const table = document.getElementById('skore-table');
  const status = document.getElementById('skore-status');
  const scoreText = document.getElementById('skore-value');
  const scoreInput = document.getElementById('skore-skore');
  const nameInput = document.getElementById('skore-jmeno');
  const NAME_KEY = 'kocici-hra-jmeno';
  const MAX_ROWS = 10;
  const FIXED_SCORES = [
    { jmeno: 'Jana', skore: 360 },
    { jmeno: 'Jarda', skore: 120 },
    { jmeno: 'Sazi', skore: 200 },
    { jmeno: 'Lumi', skore: 185 },
  ];
  const CROWNS = [
    { size: 22, fill: '#f2b705', stroke: '#b57f00', label: '1. místo' },
    { size: 21, fill: '#d3d8de', stroke: '#8a939e', label: '2. místo' },
    { size: 20, fill: '#d08a4c', stroke: '#8a531f', label: '3. místo' },
  ];

  if (!form || !table || !status || !scoreText || !scoreInput || !nameInput) {
    return;
  }

  const tbody = table.querySelector('tbody');

  const setStatus = (message, kind) => {
    status.textContent = message;
    status.className = 'form__status' + (kind ? ' form__status--' + kind : '');
  };

  const createCrown = (rank) => {
    const { size, fill, stroke, label } = CROWNS[rank];
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('class', 'crown');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);

    const body = document.createElementNS(svgNs, 'path');
    body.setAttribute('d', 'M2.5 8l4.8 4.2L12 4l4.7 8.2L21.5 8l-2 11h-15z');
    body.setAttribute('fill', fill);
    body.setAttribute('stroke', stroke);
    body.setAttribute('stroke-width', '1.2');
    body.setAttribute('stroke-linejoin', 'round');

    const band = document.createElementNS(svgNs, 'path');
    band.setAttribute('d', 'M4.9 16.2h14.2');
    band.setAttribute('stroke', stroke);
    band.setAttribute('stroke-width', '1.2');
    band.setAttribute('stroke-linecap', 'round');

    svg.append(body, band);
    return svg;
  };

  const renderScores = (entries) => {
    const sorted = entries.slice().sort((a, b) => b.skore - a.skore).slice(0, MAX_ROWS);
    const rows = sorted.map((entry, index) => {
      const row = document.createElement('tr');
      const name = document.createElement('td');
      const score = document.createElement('td');
      if (index < CROWNS.length) {
        name.appendChild(createCrown(index));
      }
      name.append(entry.jmeno);
      score.textContent = String(entry.skore);
      row.append(name, score);
      return row;
    });
    tbody.replaceChildren(...rows);
  };

  const loadScores = async () => {
    try {
      const response = await fetch(form.action, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        renderScores(FIXED_SCORES);
        return;
      }
      renderScores(FIXED_SCORES.concat(data.scores));
    } catch (error) {
      renderScores(FIXED_SCORES);
    }
  };

  document.addEventListener('hra:start', () => {
    form.hidden = true;
    setStatus('', '');
  });

  document.addEventListener('hra:konec', (event) => {
    const score = event.detail.score;
    if (score < 1) {
      return;
    }

    scoreText.textContent = String(score);
    scoreInput.value = String(score);
    setStatus('', '');
    form.querySelector('button[type="submit"]').disabled = false;
    try {
      nameInput.value = nameInput.value || localStorage.getItem(NAME_KEY) || '';
    } catch (e) {
      // storage unavailable, name is simply not prefilled
    }
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    nameInput.focus({ preventScroll: true });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Ukládám…', '');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        try {
          localStorage.setItem(NAME_KEY, nameInput.value.trim());
        } catch (e) {
          // storage unavailable, name just won't be remembered
        }
        setStatus('Skóre bylo uloženo. Díky za hru!', 'ok');
        loadScores();
      } else {
        setStatus(data.error || 'Uložení se nezdařilo. Zkuste to prosím znovu.', 'error');
        submit.disabled = false;
      }
    } catch (error) {
      setStatus('Uložení se nezdařilo. Zkontrolujte připojení a zkuste to znovu.', 'error');
      submit.disabled = false;
    }
  });

  loadScores();
});
