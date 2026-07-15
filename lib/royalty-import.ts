import ExcelJS from "exceljs"
import { Readable } from "node:stream"

export const EXPECTED_HEADERS = {
  catalogNumber: "Catalog Number",
  productTitle: "Product Title",
  productArtistName: "Product Artist Name",
  productAlbumName: "Product Album Name",
  upc: "UPC",
  isrc: "ISRC",
  labelName: "Label Name",
  vendorName: "Vendor name",
  transactionDate: "Transaction Date",
  country: "Country Name",
  countryCode: "Country Code",
  audioOrVideo: "Audio or Video",
  saleType: "Sale Type",
  saleUnits: "Sale Units",
  grossRevenue: "Gross Revenue",
  revDsp: "Rev DSP",
  period: "Period",
  postedPeriodCode: "Posted Period Code",
  dspBreak: "DSP Break",
  customerRevenueType: "Customer Revenue Type",
  transactionMonthForSummary: "Transaction Month For Summary",
} as const

type ColumnKey = keyof typeof EXPECTED_HEADERS
type HeaderMap = Record<ColumnKey, number>

export type ParsedRoyaltyRow = {
  catalogNumber: string | null
  productTitle: string | null
  productArtistName: string | null
  productAlbumName: string | null
  upc: string | null
  isrc: string | null
  labelName: string | null
  vendorName: string
  transactionDate: Date | null
  country: string | null
  countryCode: string | null
  audioOrVideo: string | null
  saleType: string | null
  saleUnits: number
  grossRevenue: number
  revDsp: string | null
  period: string | null
  postedPeriodCode: string | null
  dspBreak: "Youtube" | "Others" | null
  customerRevenueType: string | null
  transactionMonthForSummary: string | null
  summaryMonthKey: string | null
  summaryMonthLabel: string | null
}

/** Parses "202606 (MAR)" into a sortable "2026-06" key and a "MAR 2026" label. */
function parseSummaryMonth(raw: string | null): { key: string; label: string } | null {
  if (!raw) return null
  const match = raw.match(/^(\d{4})(\d{2})\s*(?:\(([^)]+)\))?/)
  if (!match) return { key: raw, label: raw }
  const [, year, month, monthAbbr] = match
  const key = `${year}-${month}`
  const label = monthAbbr ? `${monthAbbr} ${year}` : key
  return { key, label }
}

function buildHeaderMap(headerRowValues: ExcelJS.CellValue[]): HeaderMap {
  const indexByText = new Map<string, number>()
  headerRowValues.forEach((value, index) => {
    if (typeof value === "string") {
      indexByText.set(value.trim(), index)
    }
  })

  const map = {} as HeaderMap
  const missing: string[] = []
  for (const [key, headerText] of Object.entries(EXPECTED_HEADERS) as [
    ColumnKey,
    string,
  ][]) {
    const index = indexByText.get(headerText)
    if (index === undefined) {
      missing.push(headerText)
    } else {
      map[key] = index
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `The uploaded file is missing expected column(s): ${missing.join(", ")}`
    )
  }

  return map
}

function cellText(value: ExcelJS.CellValue): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "object") {
    if ("text" in value && value.text !== undefined) return String(value.text).trim()
    if ("result" in value && value.result !== undefined)
      return String(value.result).trim()
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("").trim()
    }
    return null
  }
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function cellNumber(value: ExcelJS.CellValue): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30)

function cellDate(value: ExcelJS.CellValue): Date | null {
  if (value instanceof Date) return value
  if (typeof value === "number" && Number.isFinite(value)) {
    // Fallback for date-formatted cells read without style info (raw Excel serial number).
    return new Date(EXCEL_EPOCH_UTC + value * 86400000)
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function createReader(buffer: Buffer) {
  // styles must be "cache" (not "ignore") so ExcelJS can resolve date-formatted
  // numeric cells (like Transaction Date) into JS Date objects instead of raw
  // serial numbers.
  return new ExcelJS.stream.xlsx.WorkbookReader(Readable.from(buffer), {
    sharedStrings: "cache",
    styles: "cache",
    hyperlinks: "ignore",
    worksheets: "emit",
  })
}

function toRow(headerMap: HeaderMap, values: ExcelJS.CellValue[]): ParsedRoyaltyRow | null {
  const vendorName = cellText(values[headerMap.vendorName])
  if (!vendorName) return null

  const dspBreakRaw = cellText(values[headerMap.dspBreak])
  const dspBreak =
    dspBreakRaw === "Youtube" ? "Youtube" : dspBreakRaw === "Others" ? "Others" : null

  const transactionMonthForSummary = cellText(values[headerMap.transactionMonthForSummary])
  const summaryMonth = parseSummaryMonth(transactionMonthForSummary)

  return {
    catalogNumber: cellText(values[headerMap.catalogNumber]),
    productTitle: cellText(values[headerMap.productTitle]),
    productArtistName: cellText(values[headerMap.productArtistName]),
    productAlbumName: cellText(values[headerMap.productAlbumName]),
    upc: cellText(values[headerMap.upc]),
    isrc: cellText(values[headerMap.isrc]),
    labelName: cellText(values[headerMap.labelName]),
    vendorName,
    transactionDate: cellDate(values[headerMap.transactionDate]),
    country: cellText(values[headerMap.country]),
    countryCode: cellText(values[headerMap.countryCode]),
    audioOrVideo: cellText(values[headerMap.audioOrVideo]),
    saleType: cellText(values[headerMap.saleType]),
    saleUnits: cellNumber(values[headerMap.saleUnits]),
    grossRevenue: cellNumber(values[headerMap.grossRevenue]),
    revDsp: cellText(values[headerMap.revDsp]),
    period: cellText(values[headerMap.period]),
    postedPeriodCode: cellText(values[headerMap.postedPeriodCode]),
    dspBreak,
    customerRevenueType: cellText(values[headerMap.customerRevenueType]),
    transactionMonthForSummary,
    summaryMonthKey: summaryMonth?.key ?? null,
    summaryMonthLabel: summaryMonth?.label ?? null,
  }
}

/** Pass 1: cheap scan collecting the distinct set of vendor names in the file. */
export async function collectVendorNames(buffer: Buffer): Promise<Set<string>> {
  const reader = createReader(buffer)
  let headerMap: HeaderMap | null = null
  const vendors = new Set<string>()

  for await (const worksheetReader of reader) {
    for await (const row of worksheetReader) {
      const values = row.values as ExcelJS.CellValue[]
      if (row.number === 1) {
        headerMap = buildHeaderMap(values)
        continue
      }
      if (!headerMap) continue
      const vendorName = cellText(values[headerMap.vendorName])
      if (vendorName) vendors.add(vendorName)
    }
  }

  if (!headerMap) {
    throw new Error("The uploaded file has no header row.")
  }

  return vendors
}

export type StreamResult = { rowCount: number; skippedRowCount: number }

/** Pass 2: re-streams every row, invoking onBatch with chunks of parsed rows. */
export async function streamRoyaltyRows(
  buffer: Buffer,
  onBatch: (rows: ParsedRoyaltyRow[]) => Promise<void>,
  batchSize = 1000
): Promise<StreamResult> {
  const reader = createReader(buffer)
  let headerMap: HeaderMap | null = null
  let batch: ParsedRoyaltyRow[] = []
  let total = 0
  let skipped = 0

  for await (const worksheetReader of reader) {
    for await (const row of worksheetReader) {
      const values = row.values as ExcelJS.CellValue[]
      if (row.number === 1) {
        headerMap = buildHeaderMap(values)
        continue
      }
      if (!headerMap) continue

      const parsed = toRow(headerMap, values)
      if (!parsed) {
        skipped += 1
        continue
      }

      batch.push(parsed)
      total += 1

      if (batch.length >= batchSize) {
        await onBatch(batch)
        batch = []
      }
    }
  }

  if (!headerMap) {
    throw new Error("The uploaded file has no header row.")
  }

  if (batch.length > 0) {
    await onBatch(batch)
  }

  return { rowCount: total, skippedRowCount: skipped }
}
