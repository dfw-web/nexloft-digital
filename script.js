/* =========================================================
   Nexloft Digital – script.js
   1. Mobile menu   2. Navbar shadow   3. Fade-in on scroll
   4. FAQ accordion 5. Contact form
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. Mobile menu ---------- */
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));

  // Close the menu after tapping a link, pressing Escape, or tapping outside
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });

  /* ---------- 2. Navbar shadow once the page scrolls ---------- */
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Gentle fade-in on scroll ---------- */
  const faders = document.querySelectorAll('.fade-in');

  // After the reveal finishes, drop the animation classes so card hover effects work normally
  function cleanUp(el) {
    el.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'opacity') return;
      el.classList.remove('fade-in', 'visible');
      el.removeEventListener('transitionend', done);
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // Small stagger for items that appear together in a grid
        const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains('fade-in')) : [];
        const index = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(index * 70, 350) + 'ms';
        cleanUp(el);
        el.classList.add('visible');
        observer.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    faders.forEach((el) => observer.observe(el));
  } else {
    faders.forEach((el) => el.classList.remove('fade-in'));
  }

  /* ---------- 4. FAQ accordion (one open at a time) ---------- */
  const questions = document.querySelectorAll('.faq-q');
  questions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      questions.forEach((other) => {
        other.setAttribute('aria-expanded', 'false');
        document.getElementById(other.getAttribute('aria-controls')).hidden = true;
        other.closest('.faq-item').classList.remove('open');
      });
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        document.getElementById(btn.getAttribute('aria-controls')).hidden = false;
        btn.closest('.faq-item').classList.add('open');
      }
    });
  });

  /* ---------- 5. Contact form (FormSubmit via AJAX, with validation) ---------- */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  function showError(field, message) {
    const wrapper = field.closest('.field');
    wrapper.classList.add('invalid');
    field.setAttribute('aria-invalid', 'true');
    let msg = wrapper.querySelector('.field-error');
    if (!msg) {
      msg = document.createElement('span');
      msg.className = 'field-error';
      msg.id = field.id + '-error';
      wrapper.appendChild(msg);
      field.setAttribute('aria-describedby', msg.id);
    }
    msg.textContent = message;
  }

  function clearError(field) {
    const wrapper = field.closest('.field');
    wrapper.classList.remove('invalid');
    field.removeAttribute('aria-invalid');
    const msg = wrapper.querySelector('.field-error');
    if (msg) msg.textContent = '';
  }

  function validate() {
    let firstInvalid = null;
    form.querySelectorAll('[required]').forEach((field) => {
      clearError(field);
      const value = field.value.trim();
      let message = '';
      if (!value) message = 'This field is required.';
      else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Please enter a valid email address.';
      if (message) {
        showError(field, message);
        if (!firstInvalid) firstInvalid = field;
      }
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  // Clear an error as soon as the user fixes the field
  form.querySelectorAll('[required]').forEach((field) => {
    field.addEventListener('input', () => clearError(field));
    field.addEventListener('change', () => clearError(field));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    if (!validate()) return;

    // Guard: remind the owner to set their email before going live
    if (form.action.includes('%5BYOUR%20EMAIL%5D') || form.action.includes('[YOUR EMAIL]')) {
      status.className = 'form-status error';
      status.textContent = 'Form not set up yet: replace [YOUR EMAIL] in index.html with a real email address.';
      return;
    }

    // FormSubmit's AJAX endpoint lets us stay on the page and show a friendly message
    const ajaxUrl = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
    const data = Object.fromEntries(new FormData(form).entries());

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === 'false' || result.success === false) throw new Error(result.message || 'Request failed');

      form.reset();
      status.className = 'form-status success';
      status.textContent = 'Thank you! Your message has been sent. I\'ll get back to you shortly.';
    } catch (err) {
      status.className = 'form-status error';
      status.textContent = 'Sorry, something went wrong. Please try again or message me on WhatsApp.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    }
  });
})();
