import { t } from './i18n';

let installed = false;

export function installPrivacyGuards() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const block = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  document.addEventListener('contextmenu', block);
  document.addEventListener('dragstart', block);
  document.addEventListener('selectstart', block);
  document.addEventListener('copy', block);
  document.addEventListener('cut', block);

  document.addEventListener('keyup', async (event) => {
    if (event.key === 'PrintScreen') {
      try {
        await navigator.clipboard?.writeText('');
      } catch {
        // Browser may block clipboard access. The void remains unimpressed.
      }
      showPrivacyToast();
    }
  });

  const hide = () => document.body.classList.add('privacy-blur');
  const show = () => document.body.classList.remove('privacy-blur');

  window.addEventListener('blur', hide);
  window.addEventListener('focus', show);
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', show);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') hide();
    else show();
  });
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
