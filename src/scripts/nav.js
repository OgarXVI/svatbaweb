document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.navbar__toggle');
  const menu = document.querySelector('.navbar__list');

  if (!toggle || !menu) {
    return;
  }

  const mobileQuery = window.matchMedia('(max-width: 768px)');
  const dropdownItems = menu.querySelectorAll('.navbar__item--dropdown');

  const collapseSubmenus = () => {
    dropdownItems.forEach((item) => item.classList.remove('is-expanded'));
  };

  const closeMenu = () => {
    menu.classList.remove('is-open');
    toggle.classList.remove('is-active');
    toggle.setAttribute('aria-expanded', 'false');
    collapseSubmenus();
  };

  dropdownItems.forEach((item) => {
    const parentLink = item.querySelector(':scope > .navbar__link');
    if (!parentLink) {
      return;
    }

    parentLink.addEventListener('click', (event) => {
      if (!mobileQuery.matches) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const wasExpanded = item.classList.contains('is-expanded');
      collapseSubmenus();
      item.classList.toggle('is-expanded', !wasExpanded);
    });
  });

  mobileQuery.addEventListener('change', closeMenu);

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggle.classList.toggle('is-active', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.tagName === 'A') {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
});
