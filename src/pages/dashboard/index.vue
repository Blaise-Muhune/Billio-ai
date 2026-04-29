<route>
meta:
  title: Contacts dashboard - BilloAI
  requiresAuth: true
</route>

<template lang="pug">
main.billo-app-bg.font-sans
  .max-w-7xl.mx-auto.px-4.py-10(class="sm:px-6 lg:px-8")
    //- Top bar
    .flex.flex-col.gap-4.mb-10(class="sm:flex-row sm:items-center sm:justify-between")
      div
        p.text-xs.font-semibold.uppercase.tracking-widest.text-emerald-600.mb-1 Networking
        h1.font-display.text-3xl.font-bold.tracking-tight.text-slate-900(class="sm:text-4xl") Contacts dashboard
        p.text-slate-600.mt-2.max-w-2xl.text-base.leading-relaxed
          | Everyone you’ve scanned, who you’ve drafted follow-ups for, and quick exports—filter first, then export what you need.
      .flex.flex-wrap.items-center.gap-2
        router-link.inline-flex.items-center.gap-2.rounded-xl.border.border-slate-200.bg-white.px-4.text-sm.font-semibold.text-slate-800.shadow-sm.transition-colors(
          class="py-2.5 hover:bg-slate-50"
          to="/home#cards-section"
        )
          VaIcon(name="arrow_back" size="18px")
          span Cards &amp; scan
        button.inline-flex.items-center.gap-2.rounded-xl.border.border-emerald-200.bg-emerald-50.px-4.text-sm.font-semibold.text-emerald-900.transition-colors(
          class="py-2.5 hover:bg-emerald-100"
          type="button"
          :disabled="loading || !filteredRows.length"
          @click="exportFilteredCsv"
        )
          VaIcon(name="download" size="18px")
          span Export table (CSV)

    //- Loading / error
    .flex.justify-center.py-24(v-if="loading")
      .h-10.w-10.rounded-full.border-2.border-emerald-200.border-t-emerald-600.animate-spin(aria-hidden="true")
    .billo-card-elevated.border.border-red-100.bg-red-50.p-6.text-red-800(v-else-if="loadError" role="alert") {{ loadError }}

    template(v-else)
      //- Summary stats
      .grid.gap-4.mb-8(class="sm:grid-cols-2 lg:grid-cols-4")
        .billo-card-elevated.billo-motion.p-5
          p.text-xs.font-semibold.uppercase.tracking-wide.text-slate-500 Total people
          p.mt-1.text-3xl.font-bold.text-slate-900 {{ stats.total }}
        .billo-card-elevated.billo-motion.p-5
          p.text-xs.font-semibold.uppercase.tracking-wide.text-slate-500 With email
          p.mt-1.text-3xl.font-bold.text-slate-900 {{ stats.withEmail }}
        .billo-card-elevated.billo-motion.border-emerald-200.p-5(class="bg-emerald-50/80")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-emerald-800 Reached out (drafts)
          p.mt-1.text-3xl.font-bold.text-emerald-900 {{ stats.reached }}
          p.mt-1.text-xs.text-emerald-800 {{ stats.totalDrafts }} AI draft{{ stats.totalDrafts === 1 ? '' : 's' }} total
        .billo-card-elevated.billo-motion.p-5
          p.text-xs.font-semibold.uppercase.tracking-wide.text-slate-500 Showing
          p.mt-1.text-3xl.font-bold.text-slate-900 {{ filteredRows.length }}
          p.mt-1.text-xs.text-slate-500 of {{ rows.length }} after filters

      //- Filters
      .billo-card-elevated.billo-motion.mb-6.p-5(class="sm:p-6")
        .grid.gap-4(class="lg:grid-cols-4")
          div(class="lg:col-span-2")
            label.block.text-xs.font-semibold.text-slate-600.mb-1(for="dash-search") Search
            input#dash-search.billo-input.w-full(
              v-model="searchQuery"
              type="search"
              placeholder="Name, company, title, email…"
              autocomplete="off"
            )
          div
            label.block.text-xs.font-semibold.text-slate-600.mb-1(for="dash-outreach") Follow-up status
            select#dash-outreach.billo-input.w-full(v-model="outreachFilter")
              option(value="all") Everyone
              option(value="reached") Has at least one draft
              option(value="not") No drafts yet
          div
            label.block.text-xs.font-semibold.text-slate-600.mb-1(for="dash-event") Event
            select#dash-event.billo-input.w-full(v-model="eventFilter")
              option(value="all") All events
              option(value="none") No event
              option(v-for="ev in events" :key="ev.id" :value="ev.id") {{ ev.name }}

        .mt-4.flex.flex-wrap.items-center.gap-2
          button.inline-flex.items-center.gap-1.rounded-lg.border.border-slate-200.bg-white.px-3.py-2.text-xs.font-semibold.text-slate-700(
            type="button"
            class="hover:bg-slate-50"
            @click="selectAllFiltered"
            :disabled="!filteredRows.length"
          ) Select visible
          button.inline-flex.items-center.gap-1.rounded-lg.border.border-slate-200.bg-white.px-3.py-2.text-xs.font-semibold.text-slate-700(
            type="button"
            class="hover:bg-slate-50"
            @click="clearSelection"
            :disabled="!selectedCount"
          ) Clear ({{ selectedCount }})

        .mt-3.flex.flex-wrap.gap-2
          button.inline-flex.items-center.gap-2.rounded-xl.bg-slate-900.px-4.text-sm.font-semibold.text-white.shadow-sm.transition-opacity(
            type="button"
            class="py-2.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!selectedCount"
            @click="exportSelectedCsv"
          )
            VaIcon(name="file_download" size="18px")
            span Export selected ({{ selectedCount }})

      //- Table
      .billo-card-elevated.billo-motion.overflow-hidden
        .overflow-x-auto
          table.min-w-full.text-left.text-sm
            thead.bg-slate-50.text-xs.font-semibold.uppercase.tracking-wide.text-slate-600
              tr
                th.p-3.w-10(class="sm:p-4")
                  input.h-4.w-4.rounded.border-slate-300.text-emerald-600(
                    type="checkbox"
                    :checked="headerChecked"
                    @change="toggleHeader($event.target.checked)"
                  )
                th.p-3(class="sm:p-4") Person
                th.p-3.hidden(class="sm:table-cell sm:p-4") Company
                th.p-3.hidden(class="md:table-cell md:p-4") Email
                th.p-3.hidden(class="lg:table-cell lg:p-4") Event
                th.p-3.text-center(class="sm:p-4") Drafts
                th.p-3.hidden(class="xl:table-cell xl:p-4") Last outreach
                th.p-3.text-right(class="sm:p-4") Actions
            tbody.divide-y.divide-slate-100
              tr(
                v-for="row in filteredRows"
                :key="row.id"
                class="transition-colors hover:bg-slate-50"
                :class="{ 'bg-emerald-50': isSelected(row.id) }"
              )
                td.p-3(class="sm:p-4")
                  input.h-4.w-4.rounded.border-slate-300.text-emerald-600(
                    type="checkbox"
                    :checked="isSelected(row.id)"
                    @change="toggleRow(row.id, $event.target.checked)"
                  )
                td.p-3(class="sm:p-4")
                  .font-semibold.text-slate-900 {{ row.name || 'Unknown' }}
                  p.text-xs.text-slate-500(v-if="row.title" class="mt-0.5") {{ row.title }}
                  p.text-xs.text-slate-600(class="sm:hidden mt-1") {{ row.company || '—' }}
                td.p-3.hidden.text-slate-700(class="sm:table-cell sm:p-4") {{ row.company || '—' }}
                td.p-3.hidden(class="md:table-cell md:p-4")
                  a.text-emerald-700.font-medium.break-all(
                    v-if="row.primaryEmail"
                    class="hover:underline"
                    :href="'mailto:' + row.primaryEmail"
                  ) {{ row.primaryEmail }}
                  span.text-slate-400(v-else) —
                td.p-3.hidden.text-slate-600(class="lg:table-cell lg:p-4") {{ row.eventLabel }}
                td.p-3.text-center(class="sm:p-4")
                  span.inline-flex.items-center.justify-center.rounded-full.px-2.text-xs.font-bold(
                    class="min-w-[2rem] py-0.5"
                    :class="row.draftCount ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'"
                  ) {{ row.draftCount }}
                td.p-3.hidden.text-slate-600(class="xl:table-cell xl:p-4")
                  template(v-if="row.lastDraft")
                    .text-xs {{ formatDraftDate(row.lastDraft.createdAt) }}
                    p.text-xs.text-slate-500.truncate.max-w-xs(class="mt-0.5" :title="row.lastDraft.subject") {{ row.lastDraft.subject || 'Draft' }}
                  span.text-slate-400(v-else) —
                td.p-3.text-right(class="sm:p-4")
                  .flex.flex-wrap.items-center.justify-end.gap-1
                    button.rounded-lg.p-2.text-slate-500.transition-colors(
                      class="hover:bg-slate-100 hover:text-slate-800"
                      type="button"
                      title="Copy email"
                      v-if="row.primaryEmail"
                      @click="copyText(row.primaryEmail)"
                    )
                      VaIcon(name="content_copy" size="18px")
                    button.rounded-lg.p-2.text-slate-500.transition-colors(
                      class="hover:bg-slate-100 hover:text-slate-800"
                      type="button"
                      title="Export this row (CSV)"
                      @click="exportOneRow(row)"
                    )
                      VaIcon(name="download" size="18px")
                    router-link.rounded-lg.p-2.text-emerald-600.transition-colors(
                      class="hover:bg-emerald-50"
                      title="Back to cards"
                      to="/home#cards-section"
                    )
                      VaIcon(name="open_in_new" size="18px")

      p.text-center.text-xs.text-slate-500.mt-6
        | “Reached out” means you generated at least one AI email draft for that person. Sending happens from your own inbox.

    //- Toast
    Transition(name="sub-fade")
      .fixed.bottom-6.z-50.rounded-full.bg-slate-900.px-4.py-2.text-sm.text-white.shadow-lg(
        v-if="toast"
        class="left-1/2 -translate-x-1/2"
      ) {{ toast }}
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { businessCardService } from '../../services/businessCardService';
import { formatDate } from '../../utils/dateUtils';
const loading = ref(true);
const loadError = ref('');
const cards = ref([]);
const events = ref([]);
const allDrafts = ref([]);
const searchQuery = ref('');
const outreachFilter = ref('all');
const eventFilter = ref('all');
const selectedIds = ref(new Set());
const toast = ref('');

const eventById = computed(() => {
  const m = {};
  for (const e of events.value) m[e.id] = e;
  return m;
});

const draftsByCard = computed(() => {
  const m = {};
  for (const d of allDrafts.value) {
    const cid = d.cardId;
    if (!cid) continue;
    if (!m[cid]) m[cid] = [];
    m[cid].push(d);
  }
  return m;
});

const rows = computed(() => {
  return cards.value.map((card) => {
    const drafts = draftsByCard.value[card.id] || [];
    const primaryEmail = (card.emails && card.emails[0]) || '';
    const lastDraft = drafts[0] || null;
    const eventLabel = card.eventId
      ? eventById.value[card.eventId]?.name || 'Linked event'
      : '—';
    return {
      id: card.id,
      name: card.name,
      title: card.title,
      company: card.company,
      phones: card.phones,
      primaryEmail,
      eventId: card.eventId,
      eventLabel,
      draftCount: drafts.length,
      lastDraft,
      reachedOut: drafts.length > 0
    };
  });
});

const filteredRows = computed(() => {
  let list = rows.value;
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((r) => {
      const blob = [r.name, r.company, r.title, r.primaryEmail, r.eventLabel].filter(Boolean).join(' ').toLowerCase();
      return blob.includes(q);
    });
  }
  if (outreachFilter.value === 'reached') list = list.filter((r) => r.reachedOut);
  else if (outreachFilter.value === 'not') list = list.filter((r) => !r.reachedOut);

  if (eventFilter.value === 'none') list = list.filter((r) => !r.eventId);
  else if (eventFilter.value !== 'all') list = list.filter((r) => r.eventId === eventFilter.value);

  return list;
});

const stats = computed(() => {
  const total = rows.value.length;
  const withEmail = rows.value.filter((r) => !!r.primaryEmail).length;
  const reached = rows.value.filter((r) => r.reachedOut).length;
  const totalDrafts = allDrafts.value.length;
  return { total, withEmail, reached, totalDrafts };
});

const selectedCount = computed(() => selectedIds.value.size);

const headerChecked = computed(() => {
  if (!filteredRows.value.length) return false;
  return filteredRows.value.every((r) => selectedIds.value.has(r.id));
});

function isSelected(id) {
  return selectedIds.value.has(id);
}

function toggleRow(id, checked) {
  const next = new Set(selectedIds.value);
  if (checked) next.add(id);
  else next.delete(id);
  selectedIds.value = next;
}

function toggleHeader(checked) {
  const next = new Set(selectedIds.value);
  if (checked) {
    for (const r of filteredRows.value) next.add(r.id);
  } else {
    for (const r of filteredRows.value) next.delete(r.id);
  }
  selectedIds.value = next;
}

function selectAllFiltered() {
  const next = new Set(selectedIds.value);
  for (const r of filteredRows.value) next.add(r.id);
  selectedIds.value = next;
}

function clearSelection() {
  selectedIds.value = new Set();
}

function formatDraftDate(createdAt) {
  if (!createdAt) return '—';
  const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '—';
  return formatDate(d);
}

function csvEscape(val) {
  const s = String(val ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

function rowsToCsv(rowList) {
  const headers = [
    'Name',
    'Title',
    'Company',
    'Email',
    'Phone',
    'Event',
    'Draft count',
    'Last outreach date',
    'Last draft subject'
  ];
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rowList) {
    const phone = (r.phones && r.phones[0]) || '';
    const lastDate = r.lastDraft ? formatDraftDate(r.lastDraft.createdAt) : '';
    const subj = r.lastDraft?.subject || '';
    lines.push(
      [
        r.name,
        r.title,
        r.company,
        r.primaryEmail,
        phone,
        r.eventLabel === '—' ? '' : r.eventLabel,
        r.draftCount,
        lastDate,
        subj
      ]
        .map(csvEscape)
        .join(',')
    );
  }
  return '\uFEFF' + lines.join('\n');
}

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportFilteredCsv() {
  const csv = rowsToCsv(filteredRows.value);
  downloadCsv(`billo-contacts-filtered-${todayStamp()}.csv`, csv);
  showToast('Exported everyone visible in the table.');
}

function exportSelectedCsv() {
  const set = selectedIds.value;
  const picked = filteredRows.value.filter((r) => set.has(r.id));
  if (!picked.length) {
    showToast('Select at least one row.');
    return;
  }
  const csv = rowsToCsv(picked);
  downloadCsv(`billo-contacts-selected-${todayStamp()}.csv`, csv);
  showToast(`Exported ${picked.length} contact(s).`);
}

function exportOneRow(row) {
  const csv = rowsToCsv([row]);
  const safe = (row.name || 'contact').replace(/[^\w\-]+/g, '-').slice(0, 40);
  downloadCsv(`billo-contact-${safe}-${todayStamp()}.csv`, csv);
  showToast('Exported one row.');
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard.');
  } catch {
    showToast('Could not copy.');
  }
}

let toastTimer;
function showToast(msg) {
  toast.value = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = '';
  }, 2400);
}

onMounted(async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const [ev, crd, dr] = await Promise.all([
      businessCardService.getEvents(),
      businessCardService.getCards(null),
      businessCardService.getEmailDraftsForUser()
    ]);
    events.value = ev;
    cards.value = crd;
    allDrafts.value = dr;
  } catch (e) {
    console.error(e);
    loadError.value =
      e?.message ||
      'Could not load your contacts. If this is the first time using drafts, deploy the Firestore index for email-drafts (userId + createdAt) from firestore.indexes.json.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.sub-fade-enter-active,
.sub-fade-leave-active {
  transition: opacity 0.2s ease;
}
.sub-fade-enter-from,
.sub-fade-leave-to {
  opacity: 0;
}
</style>
