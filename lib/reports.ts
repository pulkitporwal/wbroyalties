import mongoose from "mongoose"
import ExcelJS from "exceljs"

import { RoyaltyRecord } from "@/models/RoyaltyRecord"
import { EXPECTED_HEADERS } from "@/lib/royalty-import"

export type ReportFilters = {
  vendorId?: string
  dateFrom?: string
  dateTo?: string
  dspBreak?: "Youtube" | "Others"
  revDsp?: string
  country?: string
  revenueType?: string
  label?: string
  isrc?: string
}

export function buildRoyaltyMatch(filters: ReportFilters) {
  const match: Record<string, unknown> = {}

  if (filters.vendorId && mongoose.isValidObjectId(filters.vendorId)) {
    match.vendorId = new mongoose.Types.ObjectId(filters.vendorId)
  }
  if (filters.dspBreak) match.dspBreak = filters.dspBreak
  if (filters.revDsp) match.revDsp = filters.revDsp
  if (filters.country) match.country = filters.country
  if (filters.revenueType) match.customerRevenueType = filters.revenueType
  if (filters.label) match.labelName = filters.label
  if (filters.isrc) match.isrc = filters.isrc
  if (filters.dateFrom || filters.dateTo) {
    const range: Record<string, Date> = {}
    if (filters.dateFrom) range.$gte = new Date(filters.dateFrom)
    if (filters.dateTo) range.$lte = new Date(filters.dateTo)
    match.transactionDate = range
  }

  return match
}

export type VendorCommission = { ytCommissionPercent: number; ottCommissionPercent: number }

/**
 * `vendorCommission` is only passed for the vendor-facing report: vendors must never see
 * raw gross revenue, only their own commission-adjusted payout, so the "Gross Revenue"
 * column is replaced with that computed amount when present.
 */
export async function buildDetailWorkbook(
  filters: ReportFilters,
  vendorCommission?: VendorCommission
) {
  const match = buildRoyaltyMatch(filters)
  const columns = Object.entries(EXPECTED_HEADERS) as [string, string][]

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Royalty Detail")
  sheet.columns = columns.map(([key, header]) => ({
    header: vendorCommission && key === "grossRevenue" ? "Revenue" : header,
    key,
  }))

  const cursor = RoyaltyRecord.find(match).lean().cursor()
  for await (const record of cursor) {
    if (vendorCommission) {
      const commissionPercent =
        record.dspBreak === "Youtube"
          ? vendorCommission.ytCommissionPercent
          : vendorCommission.ottCommissionPercent
      sheet.addRow({ ...record, grossRevenue: record.grossRevenue * (commissionPercent / 100) })
    } else {
      sheet.addRow(record)
    }
  }

  return workbook
}

type SummaryRow = {
  vendorName: string
  monthKey: string
  monthLabel: string
  grossRevenue: number
  payout: number
  units: number
}

/** Groups by vendor + month, computing payout from each vendor's commission rate (same logic as the analytics dashboard). */
export async function getSummaryRows(filters: ReportFilters): Promise<SummaryRow[]> {
  const match = buildRoyaltyMatch(filters)

  const rows = await RoyaltyRecord.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "admins",
        localField: "vendorId",
        foreignField: "_id",
        as: "vendor",
      },
    },
    { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        commissionPercent: {
          $ifNull: [
            {
              $cond: [
                { $eq: ["$dspBreak", "Youtube"] },
                "$vendor.ytCommissionPercent",
                "$vendor.ottCommissionPercent",
              ],
            },
            25,
          ],
        },
        summaryKey: {
          $ifNull: [
            "$summaryMonthKey",
            { $dateToString: { format: "%Y-%m", date: "$transactionDate" } },
          ],
        },
        summaryLabel: { $ifNull: ["$summaryMonthLabel", "$summaryMonthKey"] },
      },
    },
    {
      $addFields: {
        payout: { $multiply: ["$grossRevenue", { $divide: ["$commissionPercent", 100] }] },
      },
    },
    {
      $group: {
        _id: { vendorName: { $ifNull: ["$vendorName", "Unknown"] }, monthKey: "$summaryKey" },
        monthLabel: { $first: "$summaryLabel" },
        grossRevenue: { $sum: "$grossRevenue" },
        payout: { $sum: "$payout" },
        units: { $sum: "$saleUnits" },
      },
    },
    { $sort: { "_id.vendorName": 1, "_id.monthKey": 1 } },
  ])

  return rows.map((row) => ({
    vendorName: row._id.vendorName,
    monthKey: row._id.monthKey ?? "Unknown",
    monthLabel: row.monthLabel ?? row._id.monthKey ?? "Unknown",
    grossRevenue: row.grossRevenue,
    payout: row.payout,
    units: row.units,
  }))
}

/**
 * `hideGrossRevenue` drops the raw Gross Revenue column for the vendor-facing report —
 * vendors only see their commission-adjusted payout, not the underlying gross figure.
 */
export async function buildSummaryWorkbook(filters: ReportFilters, hideGrossRevenue = false) {
  const rows = await getSummaryRows(filters)

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Vendor Summary")
  sheet.columns = [
    { header: "Vendor", key: "vendorName", width: 28 },
    { header: "Month", key: "monthLabel", width: 14 },
    ...(hideGrossRevenue ? [] : [{ header: "Gross Revenue", key: "grossRevenue", width: 16 }]),
    { header: "Payout", key: "payout", width: 16 },
    { header: "Units", key: "units", width: 12 },
  ]
  for (const row of rows) {
    sheet.addRow(row)
  }

  return workbook
}
