<template>
  <AppShell>
    <section class="content">
      <div class="card wide">
        <div class="section-head">
          <div>
            <h1>{{ isNew ? t('createParty') : t('partySettings') }}</h1>
          </div>
          <div v-if="!isNew" class="action-row">
            <RouterLink class="button secondary" :to="`/party/${form.slug}`">{{ t('navApp') }}</RouterLink>
            <RouterLink class="button secondary" :to="`/party/${form.slug}/profile/edit`">{{ t('navMyProfile') }}</RouterLink>
          </div>
        </div>

        <form class="form-grid" @submit.prevent="save">
          <h2 class="full">{{ t('partySettings') }}</h2>
          <label>
            {{ t('titleRequired') }}
            <input v-model="form.title_ru" required />
          </label>
          <label>
            {{ t('titleEn') }}
            <input v-model="form.title_en" />
          </label>
          <label>
            {{ t('slugRequired') }}
            <input v-model="form.slug" required placeholder="halloween-2026" />
          </label>
          <label>
            {{ t('themePreset') }}
            <select v-model="themePreset">
              <option value="default">{{ t('themeDefault') }}</option>
              <option value="red-room">{{ t('themeRedRoom') }}</option>
              <option value="minimal-black">{{ t('themeMinimalBlack') }}</option>
            </select>
          </label>

          <h2 class="full">{{ t('start') }}</h2>
          <label>
            {{ t('eventDate') }}
            <input v-model="form.starts_date" type="date" required />
          </label>
          <label>
            {{ t('eventTime') }}
            <input v-model="form.starts_time" type="time" required />
          </label>
          <label>
            {{ t('endDate') }}
            <input v-model="form.ends_date" type="date" required />
          </label>
          <label>
            {{ t('endTime') }}
            <input v-model="form.ends_time" type="time" required />
          </label>
          <label>
            {{ t('openAccessDate') }}
            <input v-model="form.access_opens_date" type="date" required />
          </label>
          <label>
            {{ t('openAccessTime') }}
            <input v-model="form.access_opens_time" type="time" required />
          </label>
          <label>
            {{ t('closeAccessDate') }}
            <input v-model="form.access_closes_date" type="date" required />
          </label>
          <label>
            {{ t('closeAccessTime') }}
            <input v-model="form.access_closes_time" type="time" required />
          </label>

          <h2 class="full">{{ t('partyTexts') }}</h2>
          <label class="full">
            {{ t('descriptionRu') }}
            <textarea v-model="form.description_ru" rows="4" />
          </label>
          <label class="full">
            {{ t('descriptionEn') }}
            <textarea v-model="form.description_en" rows="4" />
          </label>
          <label class="full">
            {{ t('locationRu') }}
            <input v-model="form.location_ru" />
          </label>
          <label class="full">
            {{ t('locationEn') }}
            <input v-model="form.location_en" />
          </label>
          <label class="full">
            {{ t('rulesRu') }}
            <textarea v-model="form.rules_text_ru" rows="6" />
          </label>
          <label class="full">
            {{ t('rulesEn') }}
            <textarea v-model="form.rules_text_en" rows="6" />
          </label>
          <label class="full">
            {{ t('dressCodeRu') }}
            <textarea v-model="form.dress_code_text_ru" rows="6" />
          </label>
          <label class="full">
            {{ t('dressCodeEn') }}
            <textarea v-model="form.dress_code_text_en" rows="6" />
          </label>
          <label class="full">
            {{ t('pinterestLinks') }}
            <textarea v-model="pinterestText" rows="4" />
          </label>

          <h2 class="full">{{ t('mediaAndDesign') }}</h2>
          <label class="full">
            {{ t('logoUpload') }}
            <input type="file" accept="image/png,image/webp" @change="onAssetFile($event, 'logo')" />
            <small>{{ t('logoHelp') }}</small>
          </label>
          <div v-if="form.logo_url" class="full current-media">
            <span>{{ t('currentFile') }}</span>
            <img :src="form.logo_url" alt="logo" />
          </div>
          <label class="full">
            {{ t('coverUpload') }}
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="onAssetFile($event, 'cover')" />
            <small>{{ t('coverHelp') }}</small>
          </label>
          <div v-if="form.cover_url" class="full current-media wide-preview">
            <span>{{ t('currentFile') }}</span>
            <img :src="form.cover_url" alt="cover" />
          </div>

          <button :disabled="loading">{{ t('save') }}</button>
        </form>

        <div v-if="!isNew" class="admin-key-box">
          <h2>{{ t('partyKey') }}</h2>
          <p>{{ t('partyKeyAdminText') }}</p>
          <button class="secondary" @click="generateKey">{{ t('generateNewKey') }}</button>
          <div v-if="newKey" class="copy-box">
            <input :value="newKey" readonly />
            <button type="button" @click="copyKey">{{ copied ? t('copied') : t('copyKey') }}</button>
            <small>{{ t('keyShownOnce') }}</small>
          </div>
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
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

const route = useRoute();
const router = useRouter();
const partyId = computed(() => route.params.partyId ? String(route.params.partyId) : '');
const isNew = computed(() => !partyId.value);
const loading = ref(false);
const error = ref('');
const success = ref(false);
const newKey = ref('');
const copied = ref(false);
const pinterestText = ref('');
const themePreset = ref('default');
const logoFile = ref<File | null>(null);
const coverFile = ref<File | null>(null);

const form = reactive<any>({
  title: '',
  title_ru: '',
  title_en: '',
  slug: '',
  description: '',
  description_ru: '',
  description_en: '',
  location_ru: '',
  location_en: '',
  starts_date: '',
  starts_time: '',
  ends_date: '',
  ends_time: '',
  access_opens_date: '',
  access_opens_time: '',
  access_closes_date: '',
  access_closes_time: '',
  logo_url: '/kinky-logo.png',
  cover_url: '',
  rules_text: '',
  rules_text_ru: '',
  rules_text_en: '',
  dress_code_text: '',
  dress_code_text_ru: '',
  dress_code_text_en: '',
  pinterest_links: [],
  theme: {},
});

const themes: Record<string, any> = {
  default: {
    preset: 'default',
    background: '#07070a',
    surface: '#12121a',
    surface2: '#191923',
    text: '#f8f5f2',
    mutedText: '#a9a3b4',
    accent: '#f5f2ec',
    button: '#f5f2ec',
    buttonText: '#09090c',
  },
  'red-room': {
    preset: 'red-room',
    background: '#090506',
    surface: '#17090d',
    surface2: '#251016',
    text: '#fff7f7',
    mutedText: '#c7a5ad',
    accent: '#ff355d',
    button: '#ff355d',
    buttonText: '#ffffff',
  },
  'minimal-black': {
    preset: 'minimal-black',
    background: '#000000',
    surface: '#0e0e0e',
    surface2: '#171717',
    text: '#ffffff',
    mutedText: '#b3b3b3',
    accent: '#ffffff',
    button: '#ffffff',
    buttonText: '#000000',
  },
};

function splitDateTime(value: string) {
  if (!value) return { date: '', time: '' };
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  const text = d.toISOString().slice(0, 16);
  const [date, time] = text.split('T');
  return { date, time };
}

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time || '00:00'}`).toISOString();
}

function fillDates(party: any) {
  const starts = splitDateTime(party.starts_at);
  form.starts_date = starts.date;
  form.starts_time = starts.time;
  const ends = splitDateTime(party.ends_at);
  form.ends_date = ends.date;
  form.ends_time = ends.time;
  const opens = splitDateTime(party.access_opens_at);
  form.access_opens_date = opens.date;
  form.access_opens_time = opens.time;
  const closes = splitDateTime(party.access_closes_at);
  form.access_closes_date = closes.date;
  form.access_closes_time = closes.time;
}

onMounted(async () => {
  if (isNew.value) return;
  const data = await api<{ party: any }>(`admin-get-party?partyId=${partyId.value}`);
  const party = data.party;
  Object.assign(form, party);
  form.title_ru = party.title_ru || party.title || '';
  form.title_en = party.title_en || '';
  form.description_ru = party.description_ru || party.description || '';
  form.description_en = party.description_en || '';
  form.rules_text_ru = party.rules_text_ru || party.rules_text || '';
  form.rules_text_en = party.rules_text_en || '';
  form.dress_code_text_ru = party.dress_code_text_ru || party.dress_code_text || '';
  form.dress_code_text_en = party.dress_code_text_en || '';
  fillDates(party);
  pinterestText.value = (party.pinterest_links || []).join('\n');
  themePreset.value = party.theme?.preset || 'default';
});

function onAssetFile(e: Event, type: 'logo' | 'cover') {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0] || null;
  if (type === 'logo') logoFile.value = file;
  else coverFile.value = file;
}

async function uploadAsset(currentPartyId: string, file: File, type: 'logo' | 'cover') {
  const upload = await post<{ path: string; token: string; publicUrl: string }>('admin-create-asset-upload-url', {
    partyId: currentPartyId,
    fileName: file.name,
    type,
  });

  const { error: uploadError } = await supabase.storage
    .from('event-assets')
    .uploadToSignedUrl(upload.path, upload.token, file);

  if (uploadError) throw uploadError;
  return upload.publicUrl;
}

async function buildPayload(currentPartyId?: string) {
  const payload: any = {
    title: form.title_ru,
    title_ru: form.title_ru,
    title_en: form.title_en,
    slug: form.slug,
    description: form.description_ru,
    description_ru: form.description_ru,
    description_en: form.description_en,
    location_ru: form.location_ru,
    location_en: form.location_en,
    starts_at: combineDateTime(form.starts_date, form.starts_time),
    ends_at: combineDateTime(form.ends_date, form.ends_time),
    access_opens_at: combineDateTime(form.access_opens_date, form.access_opens_time),
    access_closes_at: combineDateTime(form.access_closes_date, form.access_closes_time),
    logo_url: form.logo_url || '/kinky-logo.png',
    cover_url: form.cover_url || null,
    rules_text: form.rules_text_ru,
    rules_text_ru: form.rules_text_ru,
    rules_text_en: form.rules_text_en,
    dress_code_text: form.dress_code_text_ru,
    dress_code_text_ru: form.dress_code_text_ru,
    dress_code_text_en: form.dress_code_text_en,
    pinterest_links: pinterestText.value.split('\n').map((x) => x.trim()).filter(Boolean),
    theme: themes[themePreset.value] || themes.default,
  };

  if (currentPartyId) {
    if (logoFile.value) payload.logo_url = await uploadAsset(currentPartyId, logoFile.value, 'logo');
    if (coverFile.value) payload.cover_url = await uploadAsset(currentPartyId, coverFile.value, 'cover');
  }

  return payload;
}

async function save() {
  loading.value = true;
  error.value = '';
  success.value = false;

  try {
    if (isNew.value) {
      const basePayload = await buildPayload();
      const data = await post<{ party: any; key: string }>('admin-create-party', basePayload);
      newKey.value = data.key;

      if (logoFile.value || coverFile.value) {
        const finalPayload = await buildPayload(data.party.id);
        await post('admin-update-party', { partyId: data.party.id, party: finalPayload });
      }

      success.value = true;
      router.push(`/admin/parties/${data.party.id}`);
      return;
    }

    const payload = await buildPayload(partyId.value);
    const data = await post<{ party: any }>('admin-update-party', { partyId: partyId.value, party: payload });
    Object.assign(form, data.party);
    form.title_ru = data.party.title_ru || data.party.title || '';
    form.description_ru = data.party.description_ru || data.party.description || '';
    success.value = true;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function generateKey() {
  const data = await post<{ key: string }>('admin-generate-key', { partyId: partyId.value });
  newKey.value = data.key;
  copied.value = false;
}

async function copyKey() {
  await navigator.clipboard.writeText(newKey.value);
  copied.value = true;
}

async function closeNow() {
  if (!confirm(t('closeConfirm'))) return;
  await post('admin-close-party', { partyId: partyId.value });
  alert(t('closeDone'));
}
</script>
