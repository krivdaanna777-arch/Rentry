document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Language switch ---------- */
  var i18n = window.RENTRY_I18N || {};
  var supportedLangs = ['en', 'ru', 'ka'];
  var storedLang = null;
  try { storedLang = localStorage.getItem('rentry_lang'); } catch (e) {}
  var currentLang = supportedLangs.indexOf(storedLang) !== -1 ? storedLang : 'en';

  function applyLanguage(lang) {
    var dict = i18n[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
    });

    document.querySelectorAll('[data-i18n-content]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-content');
      if (dict[key] !== undefined) el.setAttribute('content', dict[key]);
    });

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-lang') === lang);
    });

    document.querySelectorAll('.accordion-trigger[aria-expanded="true"]').forEach(function (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.nextElementSibling.style.maxHeight = null;
    });

    document.documentElement.setAttribute('lang', lang);
    currentLang = lang;
    try { localStorage.setItem('rentry_lang', lang); } catch (e) {}

    syncStepTitleWidths();
  }

  /* Keeps the "How It Works" title column equal-width across rows,
     re-measured per language since translated titles differ in length. */
  function syncStepTitleWidths() {
    var titles = document.querySelectorAll('.step-title');
    if (!titles.length) return;

    if (window.innerWidth <= 1240) {
      titles.forEach(function (el) { el.style.flexBasis = ''; });
      return;
    }

    var MAX_BASIS = 520;

    titles.forEach(function (el) { el.style.flexBasis = 'auto'; });

    var max = 0;
    titles.forEach(function (el) {
      max = Math.max(max, el.getBoundingClientRect().width);
    });

    var basis = Math.min(Math.ceil(max) + 8, MAX_BASIS);
    titles.forEach(function (el) { el.style.flexBasis = basis + 'px'; });
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLanguage(btn.getAttribute('data-lang'));
    });
  });

  applyLanguage(currentLang);

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncStepTitleWidths, 150);
  });

  /* ---------- Mobile menu ---------- */
  var header = document.querySelector('.site-header');
  var burger = document.getElementById('burger');

  if (burger && header) {
    burger.addEventListener('click', function () {
      var isOpen = header.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.querySelectorAll('.mobile-nav a, .mobile-nav .js-open-lead-modal').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.accordion-trigger').forEach(function (trigger) {
    var panel = trigger.nextElementSibling;

    trigger.addEventListener('click', function () {
      var isOpen = trigger.getAttribute('aria-expanded') === 'true';

      document.querySelectorAll('.accordion-trigger').forEach(function (other) {
        if (other !== trigger) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.style.maxHeight = null;
        }
      });

      trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      panel.style.maxHeight = isOpen ? null : panel.scrollHeight + 'px';
    });
  });

  /* ---------- Phone mask: +995 5XX XXX XXX ---------- */
  function initPhoneMask(phoneInput) {
    if (!phoneInput) return;

    phoneInput.addEventListener('input', function () {
      var digits = phoneInput.value.replace(/\D/g, '');

      if (digits.indexOf('995') === 0) {
        digits = digits.slice(3);
      }

      digits = digits.slice(0, 9);

      var formatted = '+995';
      if (digits.length > 0) formatted += ' ' + digits.slice(0, 3);
      if (digits.length > 3) formatted += ' ' + digits.slice(3, 6);
      if (digits.length > 6) formatted += ' ' + digits.slice(6, 9);

      phoneInput.value = formatted;
    });

    phoneInput.addEventListener('focus', function () {
      if (!phoneInput.value) phoneInput.value = '+995 ';
    });
  }

  initPhoneMask(document.getElementById('phone'));
  initPhoneMask(document.getElementById('modal-phone'));

  /* ---------- Lead form submit ---------- */
  function initLeadForm(formId, successId, resetId) {
    var form = document.getElementById(formId);
    var success = document.getElementById(successId);
    var resetBtn = document.getElementById(resetId);

    if (!form) return;

    var requiredFields = form.querySelectorAll('[required]');

    function setFieldError(field, hasError) {
      var wrapper = field.closest('.field');
      if (!wrapper) return;

      wrapper.classList.toggle('has-error', hasError);
      if (hasError) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');

      var errorEl = wrapper.querySelector('.field-error');
      if (errorEl) errorEl.hidden = !hasError;
    }

    requiredFields.forEach(function (field) {
      field.addEventListener('input', function () { setFieldError(field, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      requiredFields.forEach(function (field) {
        var isEmpty = !field.value.trim();
        setFieldError(field, isEmpty);
        if (isEmpty && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var formData = new FormData(form);
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(formData).toString() })
        .then(function () {
          form.reset();
          if (success) {
            form.hidden = true;
            success.hidden = false;
            success.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })
        .catch(function () {
          var dict = i18n[currentLang] || {};
          alert(dict['form.error'] || 'Something went wrong, please try again or contact us via WhatsApp.');
        });
    });

    if (resetBtn && success) {
      resetBtn.addEventListener('click', function () {
        success.hidden = true;
        form.hidden = false;
      });
    }
  }

  initLeadForm('lead-form', 'lead-form-success', 'lead-form-reset');
  initLeadForm('modal-lead-form', 'modal-lead-form-success', 'modal-lead-form-reset');

  /* ---------- Lead modal ---------- */
  var leadModal = document.getElementById('lead-modal');
  var leadModalDialog = leadModal ? leadModal.querySelector('.modal-dialog') : null;
  var leadModalClose = document.getElementById('lead-modal-close');
  var leadModalLastFocused = null;

  function openLeadModal() {
    if (!leadModal) return;

    leadModalLastFocused = document.activeElement;
    leadModal.hidden = false;
    document.body.classList.add('modal-open');

    requestAnimationFrame(function () {
      leadModal.classList.add('is-open');
    });

    var firstField = document.getElementById('modal-name');
    if (firstField) firstField.focus();
  }

  function closeLeadModal() {
    if (!leadModal || leadModal.hidden) return;

    leadModal.classList.remove('is-open');
    document.body.classList.remove('modal-open');

    setTimeout(function () { leadModal.hidden = true; }, 250);

    if (leadModalLastFocused) leadModalLastFocused.focus();
  }

  document.querySelectorAll('.js-open-lead-modal').forEach(function (trigger) {
    trigger.addEventListener('click', openLeadModal);
  });

  if (leadModalClose) leadModalClose.addEventListener('click', closeLeadModal);

  if (leadModal) {
    leadModal.addEventListener('click', function (e) {
      if (e.target === leadModal) closeLeadModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !leadModal || leadModal.hidden) return;
    closeLeadModal();
  });

  if (leadModalDialog) {
    leadModalDialog.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;

      var focusable = leadModalDialog.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealSelector = [
    '.hero-title', '.hero-copy', '.photo',
    '.section-title', '.experts-text',
    '.reason', '.card', '.step',
    '.fees-copy .lead', '.split-row--top .lead-side', '.reasons-footer .lead-side',
    '.contact-left > .lead', '.trust-stats', '.form-panel', '.direct-block',
    '.accordion-item'
  ].join(', ');

  var revealEls = document.querySelectorAll(revealSelector);

  var staggerGroups = ['.reasons-col', '.cards-row', '.steps', '.accordion'];

  revealEls.forEach(function (el) {
    el.setAttribute('data-reveal', '');
  });

  staggerGroups.forEach(function (groupSelector) {
    document.querySelectorAll(groupSelector).forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        if (child.hasAttribute('data-reveal')) {
          child.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
        }
      });
    });
  });

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

});
