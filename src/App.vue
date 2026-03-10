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
}

// --- Chart 1 & 2: Evaluare + Reevaluare (totals only) ---
const evalReevalStacks = (year1Label, year2Label, key1, key2) => [
  { key: key1, label: year1Label },
  { key: key2, label: year2Label },
]

const evalReevalSeries = (key1, key2) => [
  // Year 1 (2025) — lighter colors
  { key: `${key1}_eval`, dataKey: 'eval_total', label: `${monthLabels[key1]} Evaluare`, stack: key1, color: '#efa579' },
  { key: `${key1}_reeval`, dataKey: 'reeval_total', label: `${monthLabels[key1]} Reevaluare`, stack: key1, color: '#a8c3e0' },
  // Year 2 (2026) — darker colors
  { key: `${key2}_eval`, dataKey: 'eval_total', label: `${monthLabels[key2]} Evaluare`, stack: key2, color: '#e25b29' },
  { key: `${key2}_reeval`, dataKey: 'reeval_total', label: `${monthLabels[key2]} Reevaluare`, stack: key2, color: '#2762ec' },
]

// --- Chart 3 & 4: Asistență ---
const asistentaStacks = (year1Label, year2Label, key1, key2) => [
  { key: key1, label: year1Label },
  { key: key2, label: year2Label },
]

const asistentaSeries = (key1, key2) => [
  // Year 1 (2025) — lighter colors
  { key: `${key1}_asist`, dataKey: 'asistati', label: `${monthLabels[key1]} Copii asistați`, stack: key1, color: '#efa579' },
  { key: `${key1}_sed`, dataKey: 'sedinte', label: `${monthLabels[key1]} Ședințe`, stack: key1, color: '#a8c3e0' },
  // Year 2 (2026) — darker colors
  { key: `${key2}_asist`, dataKey: 'asistati', label: `${monthLabels[key2]} Copii asistați`, stack: key2, color: '#e25b29' },
  { key: `${key2}_sed`, dataKey: 'sedinte', label: `${monthLabels[key2]} Ședințe`, stack: key2, color: '#2762ec' },
]
</script>

<template>
  <div class="dashboard">
    <div v-if="loading" class="status">Se încarcă datele...</div>
    <div v-else-if="error" class="status error">Eroare: {{ error }}</div>

    <template v-else>
      <!-- Chart 1: Ianuarie 25 vs 26 — Evaluare + Reevaluare -->
      <GroupedStackedBarChart
        title="Ianuarie 2025 vs Ianuarie 2026 — Evaluare + Reevaluare"
        :series="evalReevalSeries('ian25', 'ian26')"
        :stacks="evalReevalStacks('Ianuarie 2025', 'Ianuarie 2026', 'ian25', 'ian26')"
        :data="{ ian25: data.ian25, ian26: data.ian26 }"
        y-axis-name="Persoane"
      />

      <!-- Chart 2: Februarie 25 vs 26 — Evaluare + Reevaluare -->
      <GroupedStackedBarChart
        title="Februarie 2025 vs Februarie 2026 — Evaluare + Reevaluare"
        :series="evalReevalSeries('feb25', 'feb26')"
        :stacks="evalReevalStacks('Februarie 2025', 'Februarie 2026', 'feb25', 'feb26')"
        :data="{ feb25: data.feb25, feb26: data.feb26 }"
        y-axis-name="Persoane"
      />

      <!-- Chart 3: Asistență Ianuarie 25 vs 26 -->
      <GroupedStackedBarChart
        title="Asistență Ianuarie 2025 vs Ianuarie 2026"
        :series="asistentaSeries('ian25', 'ian26')"
        :stacks="asistentaStacks('Ianuarie 2025', 'Ianuarie 2026', 'ian25', 'ian26')"
        :data="{ ian25: data.ian25, ian26: data.ian26 }"
        y-axis-name="Unități"
        label-each
      />

      <!-- Chart 4: Asistență Februarie 25 vs 26 -->
      <GroupedStackedBarChart
        title="Asistență Februarie 2025 vs Februarie 2026"
        :series="asistentaSeries('feb25', 'feb26')"
        :stacks="asistentaStacks('Februarie 2025', 'Februarie 2026', 'feb25', 'feb26')"
        :data="{ feb25: data.feb25, feb26: data.feb26 }"
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
  padding: 20px 32px;
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
