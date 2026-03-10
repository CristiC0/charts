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

function parseSheet(wb, sheetName) {
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
      raion: String(raion).trim(),
      eval_gradinita: Number(r[2]) || 0,
      eval_scoala: Number(r[3]) || 0,
      eval_ipt: Number(r[4]) || 0,
      eval_total: Number(r[5]) || 0,
      reeval_gradinita: Number(r[6]) || 0,
      reeval_scoala: Number(r[7]) || 0,
      reeval_ipt: Number(r[8]) || 0,
      reeval_total: Number(r[9]) || 0,
      asistati: Number(r[10]) || 0,
      sedinte: Number(r[11]) || 0,
    })
  }
  return rows
}

export async function loadXlsxData() {
  const response = await fetch('/diagrame_DMSTAO.xlsx')
  const buffer = await response.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  return {
    ian25: parseSheet(wb, 'Ian25'),
    ian26: parseSheet(wb, 'Ian26'),
    feb25: parseSheet(wb, 'Feb25'),
    feb26: parseSheet(wb, 'Feb26'),
  }
}
