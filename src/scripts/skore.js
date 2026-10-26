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
  ];

  if (!form || !table || !status || !scoreText || !scoreInput || !nameInput) {
    return;
  }

  const tbody = table.querySelector('tbody');

  const setStatus = (message, kind) => {
    status.textContent = message;
    status.className = 'form__status' + (kind ? ' form__status--' + kind : '');
  };

  const renderScores = (entries) => {
    const sorted = entries.slice().sort((a, b) => b.skore - a.skore).slice(0, MAX_ROWS);
    const rows = sorted.map((entry) => {
      const row = document.createElement('tr');
      const name = document.createElement('td');
      const score = document.createElement('td');
      name.textContent = entry.jmeno;
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
