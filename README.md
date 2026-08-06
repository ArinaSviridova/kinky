# Pre-Party Match

Vue 3 + Vite + Supabase + Netlify Functions.

Закрытое pre-party пространство для участников вечеринок:

- отдельная анкета под каждую вечеринку;
- доступ по коду от организаторов;
- сохранение доступа в `party_access`, чтобы пользователь не вводил код повторно после logout/login;
- анкеты RU/EN;
- тексты вечеринки RU/EN;
- до 5 фото в анкете;
- Telegram скрыт до взаимного мэтча;
- админка для вечеринок, кодов доступа, анкет, жалоб и администраторов;
- логотип и обложка загружаются в Supabase Storage;
- PWA-иконки лежат в `public/icons`.

---

## Что внутри

```text
public/kinky-logo.png                логотип
public/icons/                        PWA-иконки
src/                                 Vue frontend
netlify/functions/                   backend на Netlify Functions
scripts/schema.sql                   полная SQL-схема
scripts/migration-ux-updates.sql     миграция для уже существующей базы
netlify.toml                         настройки деплоя
.env.example                         пример переменных окружения
```

---

## Установка локально

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Для локальной проверки Netlify Functions:

```bash
pnpm add -g netlify-cli
netlify dev
```

---

## Supabase

### Новый проект

Открой Supabase Dashboard -> SQL Editor -> вставь `scripts/schema.sql` -> Run.

### Уже существующий проект

Перед деплоем этой версии выполни:

```text
scripts/migration-ux-updates.sql
```

Миграция добавляет bilingual-поля, bucket `event-assets` и индексы для ускорения списков.

### Storage

Нужны bucket'ы:

```text
party-photos   private
event-assets   public
```

`party-photos` используется для фото анкет через signed URLs.  
`event-assets` используется для логотипов и обложек вечеринок.

Рекомендуемые размеры:

```text
Фото анкеты: JPG/PNG/WebP, до 5 фото, до 2 MB каждое, лучше 1200 x 1600 px.
Логотип: PNG/WebP, 1024 x 1024 px, до 500 KB, safe padding 20-25%.
Обложка: JPG/WebP, 1600 x 900 px, до 1 MB.
```

---

## Netlify Environment variables

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=legacy-anon-public-key
VITE_TELEGRAM_BOT_USERNAME=your_bot_username

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=legacy-service-role-key
TELEGRAM_BOT_TOKEN=123456:bot-token
TELEGRAM_BOT_USERNAME=your_bot_username
APP_SESSION_SECRET=generate-a-long-random-secret
ACCESS_KEY_PEPPER=generate-another-long-random-secret
SITE_URL=https://your-site.netlify.app
AWS_LAMBDA_JS_RUNTIME=nodejs22.x
PNPM_VERSION=9.15.9
```

Секреты можно сгенерировать так:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

После изменения переменных в Netlify нужен deploy:

```text
Deploys -> Trigger deploy -> Clear cache and deploy site
```

---

## Telegram Login

В `@BotFather`:

```text
/newbot
/setdomain
```

Домен указывать без `https://`, например:

```text
your-site.netlify.app
```

Переменные:

```env
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_BOT_TOKEN=your_bot_token
```

---

## Google Login

1. В Google Cloud создай OAuth Client.
2. В Supabase Dashboard открой Authentication -> Providers -> Google.
3. Вставь Client ID и Client Secret.
4. В Google Cloud добавь redirect URL из Supabase:

```text
https://PROJECT_REF.supabase.co/auth/v1/callback
```

5. В Supabase Authentication -> URL Configuration добавь:

```text
Site URL: https://your-site.netlify.app
Redirect URLs:
https://your-site.netlify.app/auth/callback
https://your-site.netlify.app/*
```

---

## Первый owner

1. Войди в приложение через Google или Telegram.
2. В Supabase открой `app_users` и найди свой аккаунт.
3. Скопируй `id`.
4. Выполни:

```sql
insert into admin_users (app_user_id, role, is_active)
values ('PASTE_APP_USER_ID_HERE', 'owner', true)
on conflict (app_user_id) do update set role = 'owner', is_active = true;
```

После этого остальных админов можно добавлять в интерфейсе `/admin/admins` по email или Telegram username.

---

## Основные сценарии проверки

1. Войти через Google.
2. Открыть `/admin`.
3. Создать вечеринку.
4. Скопировать код доступа.
5. Зайти как участник и ввести код.
6. Создать анкету с 1-5 фото.
7. Проверить, что после сохранения открылась публичная preview-страница анкеты.
8. Проверить список анкет, кнопку Open и кнопку Match.
9. Создать второго участника, поставить взаимный match и проверить вкладку Matches.
10. В `/admin/admins` добавить и удалить админа.

## UX/performance patch

This patch hides the admin navigation link for non-admin users, adds an admin route guard, caches duplicate GET requests on the client, and reduces profile list payloads by signing only the first photo in list views. Full photo galleries are still loaded on the profile detail page.
