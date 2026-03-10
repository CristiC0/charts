<script setup>
import { computed, ref } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps({
  title: { type: String, required: true },
  // Array of { key, label, stack, color }
  series: { type: Array, required: true },
  // Array of { key, label } — each key matches a stack value in series
  stacks: { type: Array, required: true },
  // Object keyed by stack key → array of row objects
  data: { type: Object, required: true },
  yAxisName: { type: String, default: 'Unități' },
})

const viewModes = computed(() => [
  {
    value: 'grouped',
    label: props.stacks.map((s) => s.label).join(' + ') + ' grupat',
  },
  { value: 'total', label: 'Total combinat' },
  ...props.stacks.map((s) => ({ value: s.key, label: `Doar ${s.label}` })),
])
const viewMode = ref('grouped')

// Get raion list from the first stack's data
const raions = computed(() => {
  const firstKey = props.stacks[0]?.key
  return (props.data[firstKey] || []).map((r) => r.raion)
})

// Build lookup: stackKey → raion → row
const dataLookup = computed(() => {
  const lookup = {}
  for (const { key } of props.stacks) {
    lookup[key] = {}
    for (const row of props.data[key] || []) {
      lookup[key][row.raion] = row
    }
  }
  return lookup
})

// Compute totals for each series across all raions
const seriesTotals = computed(() => {
  const totals = {}
  const lookup = dataLookup.value
  for (const s of props.series) {
    totals[s.key] = raions.value.reduce(
      (sum, r) => sum + (lookup[s.stack]?.[r]?.[s.dataKey] || 0),
      0,
    )
  }
  return totals
})

const option = computed(() => {
  const mode = viewMode.value
  const lookup = dataLookup.value
  const rList = raions.value

  let activeSeries = props.series
  if (mode !== 'grouped' && mode !== 'total') {
    activeSeries = props.series.filter((s) => s.stack === mode)
  }

  const getStack = (s) => (mode === 'total' ? 'total' : s.stack)

  // Per-stack totals per raion (for top labels)
  const raionStackTotals = {}
  for (const { key: sk } of props.stacks) {
    raionStackTotals[sk] = rList.map((r) =>
      activeSeries
        .filter((s) => s.stack === sk)
        .reduce((sum, s) => sum + (lookup[sk]?.[r]?.[s.dataKey] || 0), 0),
    )
  }
  const raionTotals = rList.map((r) =>
    activeSeries.reduce(
      (sum, s) => sum + (lookup[s.stack]?.[r]?.[s.dataKey] || 0),
      0,
    ),
  )

  // Find last series per stack for top labels
  const lastInStack = {}
  for (const { key: sk } of props.stacks) {
    lastInStack[sk] = [...activeSeries].reverse().find((s) => s.stack === sk)
  }

  const series = activeSeries.map((s) => {
    const isTopLabel =
      mode === 'total'
        ? s === activeSeries[activeSeries.length - 1]
        : mode === 'grouped'
          ? props.stacks.some((st) => lastInStack[st.key] === s)
          : s === activeSeries[activeSeries.length - 1]

    return {
      name: `${s.label} (${seriesTotals.value[s.key]})`,
      type: 'bar',
      stack: getStack(s),
      itemStyle: { color: s.color },
      data: rList.map((r) => lookup[s.stack]?.[r]?.[s.dataKey] || 0),
      ...(isTopLabel
        ? {
            label: {
              show: true,
              position: 'top',
              fontSize: 10,
              fontWeight: 'bold',
              color: '#333',
              formatter: (params) => {
                const val =
                  mode === 'total'
                    ? raionTotals[params.dataIndex]
                    : raionStackTotals[
                        mode === 'grouped' ? s.stack : mode
                      ]?.[params.dataIndex]
                return val || ''
              },
            },
          }
        : {}),
    }
  })

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: activeSeries.map(
        (s) => `${s.label} (${seriesTotals.value[s.key]})`,
      ),
      bottom: 0,
      type: 'scroll',
    },
    grid: { left: 60, right: 20, top: 40, bottom: 160 },
    xAxis: {
      type: 'category',
      data: rList,
      axisLabel: { rotate: 45, fontSize: 10, interval: 0 },
    },
    yAxis: { type: 'value', name: props.yAxisName },
    series,
  }
})

// Dynamic totals based on active view mode
const activeSummary = computed(() => {
  const mode = viewMode.value
  let active = props.series
  if (mode !== 'grouped' && mode !== 'total') {
    active = props.series.filter((s) => s.stack === mode)
  }

  const grandTotal = active.reduce((sum, s) => sum + (seriesTotals.value[s.key] || 0), 0)

  const perStack = {}
  for (const { key: sk, label } of props.stacks) {
    const stackSeries = active.filter((s) => s.stack === sk)
    if (stackSeries.length === 0) continue
    const total = stackSeries.reduce((sum, s) => sum + (seriesTotals.value[s.key] || 0), 0)
    // Break down by individual series within the stack
    const breakdown = stackSeries.map((s) => ({
      label: s.label.replace(/^(IAN25|IAN26|FEB25|FEB26)\s*/i, ''),
      value: seriesTotals.value[s.key] || 0,
      color: s.color,
    }))
    perStack[sk] = { label, total, breakdown }
  }

  return { grandTotal, perStack }
})
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3>{{ title }}</h3>
      <select v-model="viewMode" class="view-select">
        <option v-for="m in viewModes" :key="m.value" :value="m.value">
          {{ m.label }}
        </option>
      </select>
    </div>
    <!-- Summary panels -->
    <div class="summary-row">
      <div class="summary-panel grand">
        <span class="panel-label">Total</span>
        <span class="panel-value">{{ activeSummary.grandTotal.toLocaleString('ro-RO') }}</span>
      </div>
      <div
        v-for="(info, sk) in activeSummary.perStack"
        :key="sk"
        class="summary-panel stack-panel"
      >
        <div class="stack-top">
          <span class="panel-label">{{ info.label }}</span>
          <span class="panel-value">{{ info.total.toLocaleString('ro-RO') }}</span>
        </div>
        <div class="breakdown">
          <span
            v-for="(b, i) in info.breakdown"
            :key="i"
            class="chip"
            :style="{ backgroundColor: b.color + '22', color: b.color, borderColor: b.color + '55' }"
          >
            {{ b.label }}: <strong>{{ b.value.toLocaleString('ro-RO') }}</strong>
          </span>
        </div>
      </div>
    </div>
    <v-chart class="chart" :option="option" autoresize />
  </div>
</template>

<style scoped>
.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.chart-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 4px;
}
.chart-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1a1a2e;
}
.view-select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
}
.summary-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
  margin: 12px 0 16px;
  flex-wrap: wrap;
}
.summary-panel {
  background: #f7f8fa;
  border: 1px solid #e2e6ea;
  border-radius: 10px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.summary-panel.grand {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: #fff;
  border: none;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 20px;
}
.summary-panel.grand .panel-label {
  color: rgba(255, 255, 255, 0.7);
}
.summary-panel.grand .panel-value {
  color: #fff;
}
.stack-top {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
}
.panel-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #718096;
  font-weight: 600;
}
.panel-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.2;
}
.breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}
.chip {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid;
  white-space: nowrap;
  line-height: 1.4;
}
.chart {
  width: 100%;
  height: 650px;
}
</style>
