import { locale } from './i18n';

const backendErrorTranslations: Record<string, string> = {
  'Введите ключ': 'Enter the key',
  'Неверный ключ': 'Invalid key',
  'Доступ к вечеринке сейчас закрыт': 'Party access is closed right now',
  'Нужно войти': 'Please sign in',
  'Событие закрыто или не найдено': 'The event is closed or not found',
  'Нет доступа к этой вечеринке. Введите ключ.': 'No access to this party. Enter the key.',
  'Заполните ник, Telegram и описание на русском или английском': 'Fill in nickname, Telegram, and description in Russian or English',
  'Нужно минимум одно фото': 'At least one photo is required',
  'Можно загрузить не больше 5 фото': 'You can upload up to 5 photos',
  'Пользователь не найден. Он должен сначала войти в приложение через Google или Telegram.': 'User not found. They need to sign in with Google or Telegram first.',
  'Нельзя удалить последнего owner.': 'You cannot remove the last owner',
  'Нужно подтвердить возраст, правила и приватность': 'Please confirm age, rules, and privacy terms',
  'Сначала создайте свою анкету': 'Create your own profile first',
  'Нельзя поставить match своей анкете': 'You cannot match your own profile',
  'Анкета не найдена': 'Profile not found',
  'Нет доступа к админке': 'No admin access',
  'Нет доступа': 'No access',
  'Ошибка запроса': 'Request error',
};

function translateError(message: string) {
  if (locale.value === 'en') return backendErrorTranslations[message] || message;
  return message;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = payload?.error || payload?.message || text || 'Ошибка запроса';
    throw new Error(translateError(message));
  }

  return payload as T;
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function del<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });
}
