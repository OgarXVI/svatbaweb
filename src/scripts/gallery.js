document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-gallery]');

  if (galleries.length === 0) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Galerie');
  overlay.hidden = true;
  overlay.innerHTML = `
    <button type="button" class="lightbox__btn lightbox__close" aria-label="Zavřít">&times;</button>
    <button type="button" class="lightbox__btn lightbox__prev" aria-label="Předchozí">&#8249;</button>
    <figure class="lightbox__figure">
      <img class="lightbox__img" alt="">
      <figcaption class="lightbox__counter"></figcaption>
    </figure>
    <button type="button" class="lightbox__btn lightbox__next" aria-label="Další">&#8250;</button>
  `;
  document.body.appendChild(overlay);

  const img = overlay.querySelector('.lightbox__img');
  const counter = overlay.querySelector('.lightbox__counter');
  const closeBtn = overlay.querySelector('.lightbox__close');
  const prevBtn = overlay.querySelector('.lightbox__prev');
  const nextBtn = overlay.querySelector('.lightbox__next');

  let links = [];
  let index = 0;
  let lastFocused = null;

  const show = (i) => {
    index = (i + links.length) % links.length;
    const link = links[index];
    const thumb = link.querySelector('img');
    img.src = link.href;
    img.alt = thumb ? thumb.alt : '';
    counter.textContent = `${index + 1} / ${links.length}`;
    prevBtn.hidden = nextBtn.hidden = links.length < 2;
  };

  const open = (gallery, i) => {
    links = Array.from(gallery.querySelectorAll('a'));
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    show(i);
    closeBtn.focus();
  };

  const close = () => {
    overlay.hidden = true;
    img.removeAttribute('src');
    document.body.style.overflow = '';
    if (lastFocused instanceof HTMLElement) {
      lastFocused.focus();
    }
  };

  galleries.forEach((gallery) => {
    gallery.addEventListener('click', (event) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (!link || !gallery.contains(link)) {
        return;
      }
      event.preventDefault();
      open(gallery, Array.from(gallery.querySelectorAll('a')).indexOf(link));
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (overlay.hidden) {
      return;
    }
    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'ArrowLeft') {
      show(index - 1);
    } else if (event.key === 'ArrowRight') {
      show(index + 1);
    }
  });

  let touchStartX = null;

  overlay.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
  }, { passive: true });

  overlay.addEventListener('touchend', (event) => {
    if (touchStartX === null) {
      return;
    }
    const delta = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) > 50) {
      show(delta > 0 ? index - 1 : index + 1);
    }
  });
});
