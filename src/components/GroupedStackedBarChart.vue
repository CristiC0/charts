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
  // Array of { label, series, labelEach? } — if provided, shows a select to switch
  modes: { type: Array, default: null },
  // Fallback single series (used when modes is not provided)
  series: { type: Array, default: () => [] },
  stacks: { type: Array, required: true },
  data: { type: Object, required: true },
  yAxisName: { type: String, default: 'Unități' },
  labelEach: { type: Boolean, default: false },
})

const selectedMode = ref(0)

const activeSeries = computed(() => {
  if (props.modes) return props.modes[selectedMode.value].series
  return props.series
})

const activeLabelEach = computed(() => {
  if (props.modes) return props.modes[selectedMode.value].labelEach ?? false
  return props.labelEach
})

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
  for (const s of activeSeries.value) {
    totals[s.key] = raions.value.reduce(
      (sum, r) => sum + (lookup[s.stack]?.[r]?.[s.dataKey] || 0),
      0,
    )
  }
  return totals
})

const option = computed(() => {
  const lookup = dataLookup.value
  const rList = raions.value
  const seriesList = activeSeries.value
  const isLabelEach = activeLabelEach.value

  // Per-stack totals per raion (for top labels)
  const raionStackTotals = {}
  for (const { key: sk } of props.stacks) {
    raionStackTotals[sk] = rList.map((r) =>
      seriesList
        .filter((s) => s.stack === sk)
        .reduce((sum, s) => sum + (lookup[sk]?.[r]?.[s.dataKey] || 0), 0),
    )
  }

  // Find last series per stack for top labels
  const lastInStack = {}
  for (const { key: sk } of props.stacks) {
    lastInStack[sk] = [...seriesList].reverse().find((s) => s.stack === sk)
  }

  const series = seriesList.map((s) => {
    const isTopLabel = props.stacks.some((st) => lastInStack[st.key] === s)

    const labelConfig = isLabelEach
      ? {
          label: {
            show: true,
            position: 'inside',
            fontSize: 9,
            fontWeight: 'bold',
            color: '#fff',
            formatter: (params) => params.value || '',
          },
        }
      : isTopLabel
        ? {
            label: {
              show: true,
              position: 'top',
              fontSize: 10,
              fontWeight: 'bold',
              color: '#333',
              formatter: (params) => {
                return raionStackTotals[s.stack]?.[params.dataIndex] || ''
              },
            },
          }
        : {}

    return {
      name: s.label,
      type: 'bar',
      stack: s.stack,
      itemStyle: { color: s.color },
      data: rList.map((r) => lookup[s.stack]?.[r]?.[s.dataKey] || 0),
      ...labelConfig,
    }
  })

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: seriesList.map((s) => s.label),
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

// Per-stack summary (each year separately, no grand total)
const stackSummaries = computed(() => {
  return props.stacks.map(({ key: sk, label }) => {
    const stackSeries = activeSeries.value.filter((s) => s.stack === sk)
    const total = stackSeries.reduce((sum, s) => sum + (seriesTotals.value[s.key] || 0), 0)
    const breakdown = stackSeries.map((s) => ({
      label: s.label.replace(/^(Ianuarie|Februarie|Martie)\s+\d{4}\s*/i, ''),
      value: seriesTotals.value[s.key] || 0,
      color: s.color,
    }))
    return { key: sk, label, total, breakdown }
  })
})
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <select v-if="modes && modes.length > 1" v-model="selectedMode" class="view-select">
        <option v-for="(m, i) in modes" :key="i" :value="i">{{ m.label }}</option>
      </select>
    </div>
    <!-- Summary panels -->
    <div class="summary-col">
      <div
        v-for="info in stackSummaries"
        :key="info.key"
        class="summary-panel"
      >
        <div class="stack-top">
          <span class="panel-label">{{ info.label }}</span>
          <span v-if="!activeLabelEach" class="panel-value">{{ info.total.toLocaleString('ro-RO') }}</span>
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
  border-radius: 10px;
  padding: 12px 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  max-width: 92%;
  width: 92%;
  margin-left: auto;
  margin-right: auto;
}
.chart-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}
.chart-title {
  margin: 0;
  font-size: 1.15rem;
  color: #1a1a2e;
  flex: 1;
}
.view-select {
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  background: #f7f8fa;
}
.summary-col {
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin: 0 0 18px;
}
.summary-col > .summary-panel {
  flex: 1;
}
.summary-panel {
  background: #f7f8fa;
  border: 1px solid #e2e6ea;
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stack-top {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-shrink: 0;
  border-bottom: 1px solid #e2e6ea;
  padding-bottom: 6px;
  margin-bottom: 2px;
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
  gap: 6px;
}
.chip {
  font-size: 0.78rem;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid;
  white-space: nowrap;
  line-height: 1.4;
  display: flex;
  gap: 6px;
}
.chip strong {
  font-weight: 700;
}
.chart {
  width: 100%;
  height: 650px;
}
</style>
