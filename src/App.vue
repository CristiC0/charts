<script setup>
import { ref, onMounted } from 'vue'
import { loadXlsxData } from './utils/xlsxLoader.js'
import GroupedStackedBarChart from './components/GroupedStackedBarChart.vue'

const data = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    data.value = await loadXlsxData()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const monthLabels = {
  ian25: 'Ianuarie 2025',
  ian26: 'Ianuarie 2026',
  feb25: 'Februarie 2025',
  feb26: 'Februarie 2026',
  mar25: 'Martie 2025',
  mar26: 'Martie 2026',
}

// --- Chart 1 & 2: Evaluare + Reevaluare ---
const evalReevalStacks = (year1Label, year2Label, key1, key2) => [
  { key: key1, label: year1Label },
  { key: key2, label: year2Label },
]

// Total view
const evalReevalSeriesTotals = (key1, key2) => [
  { key: `${key1}_eval`, dataKey: 'eval_total', label: `${monthLabels[key1]} Evaluare`, stack: key1, color: '#efa579' },
  { key: `${key1}_reeval`, dataKey: 'reeval_total', label: `${monthLabels[key1]} Reevaluare`, stack: key1, color: '#a8c3e0' },
  { key: `${key2}_eval`, dataKey: 'eval_total', label: `${monthLabels[key2]} Evaluare`, stack: key2, color: '#e25b29' },
  { key: `${key2}_reeval`, dataKey: 'reeval_total', label: `${monthLabels[key2]} Reevaluare`, stack: key2, color: '#2762ec' },
]

// Pe trepte view
const evalReevalSeriesTrepte = (key1, key2) => [
  // Year 1 — evaluare pe trepte
  { key: `${key1}_eval_g`, dataKey: 'eval_gradinita', label: `${monthLabels[key1]} Eval. grădiniță`, stack: key1, color: '#f5c6a0' },
  { key: `${key1}_eval_s`, dataKey: 'eval_scoala', label: `${monthLabels[key1]} Eval. școală`, stack: key1, color: '#efa579' },
  { key: `${key1}_eval_i`, dataKey: 'eval_ipt', label: `${monthLabels[key1]} Eval. ÎPT`, stack: key1, color: '#e88a4a' },
  // Year 1 — reevaluare pe trepte
  { key: `${key1}_reeval_g`, dataKey: 'reeval_gradinita', label: `${monthLabels[key1]} Reeval. grădiniță`, stack: key1, color: '#c8ddf0' },
  { key: `${key1}_reeval_s`, dataKey: 'reeval_scoala', label: `${monthLabels[key1]} Reeval. școală`, stack: key1, color: '#a8c3e0' },
  { key: `${key1}_reeval_i`, dataKey: 'reeval_ipt', label: `${monthLabels[key1]} Reeval. ÎPT`, stack: key1, color: '#7fadd4' },
  // Year 2 — evaluare pe trepte
  { key: `${key2}_eval_g`, dataKey: 'eval_gradinita', label: `${monthLabels[key2]} Eval. grădiniță`, stack: key2, color: '#f0845a' },
  { key: `${key2}_eval_s`, dataKey: 'eval_scoala', label: `${monthLabels[key2]} Eval. școală`, stack: key2, color: '#e25b29' },
  { key: `${key2}_eval_i`, dataKey: 'eval_ipt', label: `${monthLabels[key2]} Eval. ÎPT`, stack: key2, color: '#c44a1e' },
  // Year 2 — reevaluare pe trepte
  { key: `${key2}_reeval_g`, dataKey: 'reeval_gradinita', label: `${monthLabels[key2]} Reeval. grădiniță`, stack: key2, color: '#5a9ae0' },
  { key: `${key2}_reeval_s`, dataKey: 'reeval_scoala', label: `${monthLabels[key2]} Reeval. școală`, stack: key2, color: '#2762ec' },
  { key: `${key2}_reeval_i`, dataKey: 'reeval_ipt', label: `${monthLabels[key2]} Reeval. ÎPT`, stack: key2, color: '#1a4abf' },
]

const evalReevalModes = (key1, key2) => [
  { label: 'Total', series: evalReevalSeriesTotals(key1, key2), labelEach: true },
  { label: 'Pe trepte de învățământ', series: evalReevalSeriesTrepte(key1, key2), labelEach: true },
]

// --- Chart 3 & 4: Asistență ---
const asistentaStacks = (year1Label, year2Label, key1, key2) => [
  { key: key1, label: year1Label },
  { key: key2, label: year2Label },
]

const asistentaSeries = (key1, key2) => [
  { key: `${key1}_asist`, dataKey: 'asistati', label: `${monthLabels[key1]} Copii asistați`, stack: key1, color: '#efa579' },
  { key: `${key1}_sed`, dataKey: 'sedinte', label: `${monthLabels[key1]} Ședințe`, stack: key1, color: '#a8c3e0' },
  { key: `${key2}_asist`, dataKey: 'asistati', label: `${monthLabels[key2]} Copii asistați`, stack: key2, color: '#e25b29' },
  { key: `${key2}_sed`, dataKey: 'sedinte', label: `${monthLabels[key2]} Ședințe`, stack: key2, color: '#2762ec' },
]
</script>

<template>
  <div class="dashboard">
    <div v-if="loading" class="status">Se încarcă datele...</div>
    <div v-else-if="error" class="status error">Eroare: {{ error }}</div>

    <template v-else>
      <!-- Martie 25 vs 26 — Evaluare + Reevaluare -->
      <GroupedStackedBarChart
        title="Martie 2025 vs Martie 2026 — Evaluare + Reevaluare"
        :modes="evalReevalModes('mar25', 'mar26')"
        :stacks="evalReevalStacks('Martie 2025', 'Martie 2026', 'mar25', 'mar26')"
        :data="{ mar25: data.mar25, mar26: data.mar26 }"
        y-axis-name="Persoane"
      />

      <!-- Februarie 25 vs 26 — Evaluare + Reevaluare -->
      <GroupedStackedBarChart
        title="Februarie 2025 vs Februarie 2026 — Evaluare + Reevaluare"
        :modes="evalReevalModes('feb25', 'feb26')"
        :stacks="evalReevalStacks('Februarie 2025', 'Februarie 2026', 'feb25', 'feb26')"
        :data="{ feb25: data.feb25, feb26: data.feb26 }"
        y-axis-name="Persoane"
      />

      <!-- Ianuarie 25 vs 26 — Evaluare + Reevaluare -->
      <GroupedStackedBarChart
        title="Ianuarie 2025 vs Ianuarie 2026 — Evaluare + Reevaluare"
        :modes="evalReevalModes('ian25', 'ian26')"
        :stacks="evalReevalStacks('Ianuarie 2025', 'Ianuarie 2026', 'ian25', 'ian26')"
        :data="{ ian25: data.ian25, ian26: data.ian26 }"
        y-axis-name="Persoane"
      />

      <!-- Asistență Martie 25 vs 26 -->
      <GroupedStackedBarChart
        title="Asistență Martie 2025 vs Martie 2026"
        :series="asistentaSeries('mar25', 'mar26')"
        :stacks="asistentaStacks('Martie 2025', 'Martie 2026', 'mar25', 'mar26')"
        :data="{ mar25: data.mar25, mar26: data.mar26 }"
        y-axis-name="Unități"
        label-each
      />

      <!-- Asistență Februarie 25 vs 26 -->
      <GroupedStackedBarChart
        title="Asistență Februarie 2025 vs Februarie 2026"
        :series="asistentaSeries('feb25', 'feb26')"
        :stacks="asistentaStacks('Februarie 2025', 'Februarie 2026', 'feb25', 'feb26')"
        :data="{ feb25: data.feb25, feb26: data.feb26 }"
        y-axis-name="Unități"
        label-each
      />

      <!-- Asistență Ianuarie 25 vs 26 -->
      <GroupedStackedBarChart
        title="Asistență Ianuarie 2025 vs Ianuarie 2026"
        :series="asistentaSeries('ian25', 'ian26')"
        :stacks="asistentaStacks('Ianuarie 2025', 'Ianuarie 2026', 'ian25', 'ian26')"
        :data="{ ian25: data.ian25, ian26: data.ian26 }"
        y-axis-name="Unități"
        label-each
      />
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  text-align: left;
  max-width: 100%;
  margin: 0 auto;
  padding: 12px;
}
.status {
  text-align: center;
  font-size: 1.1rem;
  padding: 40px;
  color: #666;
}
.status.error {
  color: #c62828;
}
</style>
