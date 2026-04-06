import * as XLSX from 'xlsx'

/**
 * Column indices (0-based) in each sheet's data rows:
 * 0: Nr. crt.
 * 1: Raionul/municipiul
 * 2: Eval grădiniță
 * 3: Eval școală
 * 4: Eval ÎPT
 * 5: Total eval
 * 6: Reeval grădiniță
 * 7: Reeval școală
 * 8: Reeval ÎPT
 * 9: Total reeval
 * 10: Copii asistați
 * 11: Ședințe
 */

// Normalize diacritics so raion names match across sheets
// (e.g., "Balti" → "Bălți", "Calarași" → "Călărași")
const raionNameMap = {
  'Balti': 'Bălți',
  'Calarași': 'Călărași',
  'Cimislia': 'Cimișlia',
  'Stefan-Vodă': 'Ștefan-Vodă',
  'Şoldănești': 'Șoldănești',
}

function normalizeRaion(name) {
  const trimmed = String(name).trim()
  return raionNameMap[trimmed] || trimmed
}

function parseSheet(wb, sheetName, colOffset = 0) {
  const ws = wb.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1 })

  // Find the first data row (starts with "1." or 1)
  let startIdx = raw.findIndex(
    (r) => r[0] && String(r[0]).trim().replace('.', '') === '1',
  )
  if (startIdx === -1) return []

  const rows = []
  for (let i = startIdx; i < raw.length; i++) {
    const r = raw[i]
    const raion = r[1]
    // Stop at Total/TOTAL row or if no raion name
    if (!raion || /^total/i.test(String(r[0]).trim())) break

    rows.push({
      raion: normalizeRaion(raion),
      eval_gradinita: Number(r[2 + colOffset]) || 0,
      eval_scoala: Number(r[3 + colOffset]) || 0,
      eval_ipt: Number(r[4 + colOffset]) || 0,
      eval_total: Number(r[5 + colOffset]) || 0,
      reeval_gradinita: Number(r[6 + colOffset]) || 0,
      reeval_scoala: Number(r[7 + colOffset]) || 0,
      reeval_ipt: Number(r[8 + colOffset]) || 0,
      reeval_total: Number(r[9 + colOffset]) || 0,
      asistati: Number(r[10 + colOffset]) || 0,
      sedinte: Number(r[11 + colOffset]) || 0,
    })
  }
  return rows
}

export async function loadXlsxData() {
  const [resp1, resp2] = await Promise.all([
    fetch('/diagrame_DMSTAO.xlsx'),
    fetch('/Martie25vs26.xlsx'),
  ])
  const [buf1, buf2] = await Promise.all([
    resp1.arrayBuffer(),
    resp2.arrayBuffer(),
  ])
  const wb1 = XLSX.read(buf1, { type: 'array' })
  const wb2 = XLSX.read(buf2, { type: 'array' })

  return {
    ian25: parseSheet(wb1, 'Ian25'),
    ian26: parseSheet(wb1, 'Ian26'),
    feb25: parseSheet(wb1, 'Feb25'),
    feb26: parseSheet(wb1, 'Feb26'),
    mar25: parseSheet(wb2, 'martie2025v2'),
    mar26: parseSheet(wb2, 'martie2026', 1),
  }
}
