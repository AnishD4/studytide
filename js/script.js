// Basic tab navigation and mobile menu for StudyTide template
document.addEventListener('DOMContentLoaded', function () {
  const nav = document.getElementById('main-nav');
  const toggle = document.getElementById('nav-toggle');
  const links = nav ? nav.querySelectorAll('a[data-tab]') : [];
  const tabs = document.querySelectorAll('[data-tab-content]');

  function showTab(id, pushState = true) {
    tabs.forEach(t => {
      if (t.id === id) {
        t.removeAttribute('hidden');
      } else {
        t.setAttribute('hidden', '');
      }
    });
    links.forEach(a => a.classList.toggle('active', a.dataset.tab === id));
    if (pushState && history && history.pushState) {
      history.pushState({ tab: id }, '', '#' + id);
    }
  }

  // Initialize from hash or default to home
  const initial = location.hash ? location.hash.replace('#', '') : 'home';
  if (document.getElementById(initial)) showTab(initial, false);

  // Link clicks
  links.forEach(a => {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      const t = this.dataset.tab;
      showTab(t);
      if (nav && nav.classList.contains('open')) nav.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Back/forward navigation
  window.addEventListener('popstate', function (e) {
    const tab = (e.state && e.state.tab) || (location.hash ? location.hash.replace('#', '') : 'home');
    if (document.getElementById(tab)) showTab(tab, false);
  });

  // Mobile toggle
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      this.setAttribute('aria-expanded', String(open));
    });
  }
});
