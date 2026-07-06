<template>
  <AppShell>
    <section class="content">
      <div class="card wide">
        <h1>{{ isNew ? t('createParty') : t('partySettings') }}</h1>
        <form class="form-grid" @submit.prevent="save">
          <label>
            {{ t('titleRequired') }}
            <input v-model="form.title" required />
          </label>
          <label>
            {{ t('slugRequired') }}
            <input v-model="form.slug" required placeholder="halloween-2026" />
          </label>
          <label>
            {{ t('startRequired') }}
            <input v-model="form.starts_at" type="datetime-local" required />
          </label>
          <label>
            {{ t('endRequired') }}
            <input v-model="form.ends_at" type="datetime-local" required />
          </label>
          <label>
            {{ t('openAccess') }}
            <input v-model="form.access_opens_at" type="datetime-local" required />
          </label>
          <label>
            {{ t('closeAccess') }}
            <input v-model="form.access_closes_at" type="datetime-local" required />
          </label>
          <label class="full">
            {{ t('description') }}
            <textarea v-model="form.description" rows="4" />
          </label>
          <label>
            {{ t('logoUrl') }}
            <input v-model="form.logo_url" placeholder="/kinky-logo.png" />
          </label>
          <label>
            {{ t('coverUrl') }}
            <input v-model="form.cover_url" />
          </label>
          <label class="full">
            {{ t('rules') }}
            <textarea v-model="form.rules_text" rows="6" />
          </label>
          <label class="full">
            {{ t('dressCode') }}
            <textarea v-model="form.dress_code_text" rows="6" />
          </label>
          <label class="full">
            {{ t('pinterestLinks') }}
            <textarea v-model="pinterestText" rows="4" />
          </label>
          <label class="full">
            {{ t('themeJson') }}
            <textarea v-model="themeText" rows="8" />
          </label>
          <button :disabled="loading">{{ t('save') }}</button>
        </form>

        <div v-if="!isNew" class="admin-key-box">
          <h2>{{ t('partyKey') }}</h2>
          <p>{{ t('partyKeyAdminText') }}</p>
          <button class="secondary" @click="generateKey">{{ t('generateNewKey') }}</button>
          <p v-if="newKey" class="key-output">{{ newKey }}</p>
          <button class="danger" @click="closeNow">{{ t('closeAndDeleteNow') }}</button>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ t('saved') }}</p>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppShell from '@/components/AppShell.vue';
import { api, post } from '@/lib/api';
import { t } from '@/lib/i18n';

const route = useRoute();
const router = useRouter();
const partyId = computed(() => route.params.partyId ? String(route.params.partyId) : '');
const isNew = computed(() => !partyId.value);
const loading = ref(false);
const error = ref('');
const success = ref(false);
const newKey = ref('');
const pinterestText = ref('');
const themeText = ref(JSON.stringify({
  background: '#07070a',
  surface: '#12121a',
  surface2: '#191923',
  text: '#f8f5f2',
  mutedText: '#a9a3b4',
  accent: '#f5f2ec',
  button: '#f5f2ec',
  buttonText: '#09090c',
  fontFamily: "'Futura PT', 'Future PT', 'Avenir Next', Montserrat, Arial, sans-serif",
}, null, 2));

const form = reactive<any>({
  title: '',
  slug: '',
  description: '',
  starts_at: '',
  ends_at: '',
  access_opens_at: '',
  access_closes_at: '',
  logo_url: '/kinky-logo.png',
  cover_url: '',
  rules_text: '',
  dress_code_text: '',
  pinterest_links: [],
  theme: {},
});

function toLocalInput(value: string) {
  if (!value) return '';
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

onMounted(async () => {
  if (isNew.value) return;
  const data = await api<{ party: any }>(`admin-get-party?partyId=${partyId.value}`);
  Object.assign(form, data.party);
  form.starts_at = toLocalInput(data.party.starts_at);
  form.ends_at = toLocalInput(data.party.ends_at);
  form.access_opens_at = toLocalInput(data.party.access_opens_at);
  form.access_closes_at = toLocalInput(data.party.access_closes_at);
  pinterestText.value = (data.party.pinterest_links || []).join('\n');
  themeText.value = JSON.stringify(data.party.theme || {}, null, 2);
});

async function save() {
  loading.value = true;
  error.value = '';
  success.value = false;

  try {
    const payload = {
      ...form,
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
      access_opens_at: fromLocalInput(form.access_opens_at),
      access_closes_at: fromLocalInput(form.access_closes_at),
      pinterest_links: pinterestText.value.split('\n').map((x) => x.trim()).filter(Boolean),
      theme: JSON.parse(themeText.value || '{}'),
    };

    const data = isNew.value
      ? await post<{ party: any }>('admin-create-party', payload)
      : await post<{ party: any }>('admin-update-party', { partyId: partyId.value, party: payload });

    success.value = true;
    if (isNew.value) router.push(`/admin/parties/${data.party.id}`);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function generateKey() {
  const data = await post<{ key: string }>('admin-generate-key', { partyId: partyId.value });
  newKey.value = data.key;
}

async function closeNow() {
  if (!confirm(t('closeConfirm'))) return;
  await post('admin-close-party', { partyId: partyId.value });
  alert(t('closeDone'));
}
</script>
