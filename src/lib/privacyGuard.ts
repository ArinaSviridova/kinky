import { t } from './i18n';

let installed = false;

function isEditableTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

function isTouchDevice() {
  return typeof window !== 'undefined' && (
    window.matchMedia?.('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

function clearPrivacyBlur() {
  document.body.classList.remove('privacy-blur');
}

function shouldUsePrivacyBlur() {
  // On phones/PWA the browser fires blur/pagehide during harmless UI transitions
  // like keyboard/date picker/navigation. Keeping the overlay there creates the
  // infamous empty black screen, which is not privacy, it's sabotage with CSS.
  return !isTouchDevice();
}

export function installPrivacyGuards() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const block = (event: Event) => {
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  document.addEventListener('contextmenu', block);
  document.addEventListener('dragstart', block);
  document.addEventListener('selectstart', block);
  document.addEventListener('copy', block);
  document.addEventListener('cut', block);

  document.addEventListener('keyup', async (event) => {
    clearPrivacyBlur();
    if (event.key === 'PrintScreen') {
      try {
        await navigator.clipboard?.writeText('');
      } catch {
        // Browser may block clipboard access. The void remains unimpressed.
      }
      showPrivacyToast();
    }
  });

  const hide = () => {
    if (!shouldUsePrivacyBlur()) {
      clearPrivacyBlur();
      return;
    }
    document.body.classList.add('privacy-blur');
  };

  const show = () => clearPrivacyBlur();

  window.addEventListener('blur', () => {
    // Do not black out the app for ordinary focus changes. Only hide when the
    // page is actually leaving the visible state.
    window.setTimeout(() => {
      if (document.visibilityState === 'hidden') hide();
      else show();
    }, 120);
  });

  window.addEventListener('focus', show);
  window.addEventListener('pageshow', show);
  window.addEventListener('pagehide', hide);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') hide();
    else show();
  });

  // Safety net: if mobile Safari/Chrome leaves the class after a picker/router
  // transition, the first tap removes it instead of trapping the user in darkness.
  ['pointerdown', 'touchstart', 'click', 'focusin', 'keydown'].forEach((eventName) => {
    document.addEventListener(eventName, show, { capture: true });
  });

  window.setInterval(() => {
    if (document.visibilityState === 'visible') show();
  }, 1500);
}

function showPrivacyToast() {
  const existing = document.querySelector('.privacy-toast');
  existing?.remove();

  const el = document.createElement('div');
  el.className = 'privacy-toast';
  el.textContent = t('screenshotNoticeText');
  document.body.appendChild(el);

  window.setTimeout(() => el.remove(), 4800);
}
