(() => {
  const STORAGE_KEY = 'theme';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const readStored = () => {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (e) {
      return null;
    }
  };

  const store = (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // storage unavailable, choice lasts for this page view only
    }
  };

  const apply = (theme) => {
    root.setAttribute('data-theme', theme);
    const button = document.querySelector('.theme-toggle');
    if (button) {
      const isDark = theme === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim');
    }
  };

  apply(readStored() || (media.matches ? 'dark' : 'light'));

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.theme-toggle');
    if (!button) {
      return;
    }

    apply(root.getAttribute('data-theme') || 'light');

    button.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      store(next);
    });
  });

  media.addEventListener('change', (event) => {
    if (!readStored()) {
      apply(event.matches ? 'dark' : 'light');
    }
  });
})();
