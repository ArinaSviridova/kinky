import { locale } from './i18n';

export function localized(entity: any, base: string) {
  if (!entity) return '';
  const current = entity[`${base}_${locale.value}`];
  const fallback = locale.value === 'ru' ? entity[`${base}_en`] : entity[`${base}_ru`];
  return current || fallback || entity[base] || '';
}

export function localizedFromFields(entity: any, ruField: string, enField: string, legacyField?: string) {
  if (!entity) return '';
  const current = locale.value === 'ru' ? entity[ruField] : entity[enField];
  const fallback = locale.value === 'ru' ? entity[enField] : entity[ruField];
  return current || fallback || (legacyField ? entity[legacyField] : '') || '';
}
