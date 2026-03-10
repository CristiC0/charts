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

// --- Chart 1 & 2: Evaluare + Reevaluare ---
const evalReevalStacks = (year1Label, year2Label, key1, key2) => [
  { key: key1, label: year1Label },
  { key: key2, label: year2Label },
]

const evalReevalSeries = (key1, key2) => [
  // Year 1 stack — evaluare
  { key: `${key1}_eval_g`, dataKey: 'eval_gradinita', label: `${key1.toUpperCase()} Eval. grădiniță`, stack: key1, color: '#1565c0' },
  { key: `${key1}_eval_s`, dataKey: 'eval_scoala', label: `${key1.toUpperCase()} Eval. școală`, stack: key1, color: '#2e7d32' },
  { key: `${key1}_eval_i`, dataKey: 'eval_ipt', label: `${key1.toUpperCase()} Eval. ÎPT`, stack: key1, color: '#e65100' },
  // Year 1 stack — reevaluare
  { key: `${key1}_reeval_g`, dataKey: 'reeval_gradinita', label: `${key1.toUpperCase()} Reeval. grădiniță`, stack: key1, color: '#1976d2' },
  { key: `${key1}_reeval_s`, dataKey: 'reeval_scoala', label: `${key1.toUpperCase()} Reeval. școală`, stack: key1, color: '#388e3c' },
  { key: `${key1}_reeval_i`, dataKey: 'reeval_ipt', label: `${key1.toUpperCase()} Reeval. ÎPT`, stack: key1, color: '#f57c00' },
  // Year 2 stack — evaluare
  { key: `${key2}_eval_g`, dataKey: 'eval_gradinita', label: `${key2.toUpperCase()} Eval. grădiniță`, stack: key2, color: '#64b5f6' },
  { key: `${key2}_eval_s`, dataKey: 'eval_scoala', label: `${key2.toUpperCase()} Eval. școală`, stack: key2, color: '#81c784' },
  { key: `${key2}_eval_i`, dataKey: 'eval_ipt', label: `${key2.toUpperCase()} Eval. ÎPT`, stack: key2, color: '#ffb74d' },
  // Year 2 stack — reevaluare
  { key: `${key2}_reeval_g`, dataKey: 'reeval_gradinita', label: `${key2.toUpperCase()} Reeval. grădiniță`, stack: key2, color: '#90caf9' },
  { key: `${key2}_reeval_s`, dataKey: 'reeval_scoala', label: `${key2.toUpperCase()} Reeval. școală`, stack: key2, color: '#a5d6a7' },
  { key: `${key2}_reeval_i`, dataKey: 'reeval_ipt', label: `${key2.toUpperCase()} Reeval. ÎPT`, stack: key2, color: '#ffcc80' },
]

// --- Chart 3 & 4: Asistență ---
const asistentaStacks = (year1Label, year2Label, key1, key2) => [
  { key: key1, label: year1Label },
  { key: key2, label: year2Label },
]

const asistentaSeries = (key1, key2) => [
  { key: `${key1}_asist`, dataKey: 'asistati', label: `${key1.toUpperCase()} Copii asistați`, stack: key1, color: '#7b1fa2' },
  { key: `${key1}_sed`, dataKey: 'sedinte', label: `${key1.toUpperCase()} Ședințe`, stack: key1, color: '#c62828' },
  { key: `${key2}_asist`, dataKey: 'asistati', label: `${key2.toUpperCase()} Copii asistați`, stack: key2, color: '#ba68c8' },
  { key: `${key2}_sed`, dataKey: 'sedinte', label: `${key2.toUpperCase()} Ședințe`, stack: key2, color: '#ef5350' },
]
</script>

<template>
  <div class="dashboard">
    <h1>Diagrame DMSTAO</h1>

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
      />

      <!-- Chart 4: Asistență Februarie 25 vs 26 -->
      <GroupedStackedBarChart
        title="Asistență Februarie 2025 vs Februarie 2026"
        :series="asistentaSeries('feb25', 'feb26')"
        :stacks="asistentaStacks('Februarie 2025', 'Februarie 2026', 'feb25', 'feb26')"
        :data="{ feb25: data.feb25, feb26: data.feb26 }"
        y-axis-name="Unități"
      />
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  text-align: left;
}
.dashboard h1 {
  text-align: center;
  color: #1a1a2e;
  margin-bottom: 32px;
  font-size: 1.8rem;
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
