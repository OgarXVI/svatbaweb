document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('prihlaska-form');
  const status = document.getElementById('prihlaska-status');

  if (!form || !status) {
    return;
  }

  const setStatus = (message, kind) => {
    status.textContent = message;
    status.className = 'form__status' + (kind ? ' form__status--' + kind : '');
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Odesílám…', '');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        form.reset();
        setStatus('Děkujeme, formulář byl odeslán.', 'ok');
      } else {
        setStatus(data.error || 'Odeslání se nezdařilo. Zkuste to prosím znovu.', 'error');
      }
    } catch (error) {
      setStatus('Odeslání se nezdařilo. Zkontrolujte připojení a zkuste to znovu.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
});
