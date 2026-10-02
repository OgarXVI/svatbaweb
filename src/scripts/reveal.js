document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduceMotion) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px' }
  );

  document.querySelectorAll('.page__title, .page__section').forEach((element) => {
    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) {
      return;
    }
    element.classList.add('reveal');
    observer.observe(element);
  });
});
