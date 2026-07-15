import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const RoyaltyRecordSchema = new Schema(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "UploadBatch", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Admin" },
    vendorName: { type: String, trim: true },
    labelName: { type: String, trim: true },
    productTitle: { type: String, trim: true },
    productArtistName: { type: String, trim: true },
    productAlbumName: { type: String, trim: true },
    catalogNumber: { type: String, trim: true },
    upc: { type: String, trim: true },
    isrc: { type: String, trim: true },
    transactionDate: { type: Date },
    country: { type: String, trim: true },
    countryCode: { type: String, trim: true },
    audioOrVideo: { type: String, trim: true },
    saleType: { type: String, trim: true },
    saleUnits: { type: Number, default: 0 },
    grossRevenue: { type: Number, default: 0 },
    revDsp: { type: String, trim: true },
    dspBreak: { type: String, enum: ["Youtube", "Others"], index: true },
    period: { type: String, trim: true },
    postedPeriodCode: { type: String, trim: true },
    customerRevenueType: { type: String, trim: true },
    transactionMonthForSummary: { type: String, trim: true },
    summaryMonthKey: { type: String, trim: true },
    summaryMonthLabel: { type: String, trim: true },
  },
  { timestamps: true }
)

RoyaltyRecordSchema.index({ vendorId: 1, transactionDate: 1 })
RoyaltyRecordSchema.index({ batchId: 1 })
RoyaltyRecordSchema.index({ vendorName: 1 })
RoyaltyRecordSchema.index({ summaryMonthKey: 1 })
RoyaltyRecordSchema.index({ revDsp: 1 })
RoyaltyRecordSchema.index({ customerRevenueType: 1 })
RoyaltyRecordSchema.index({ isrc: 1 })
RoyaltyRecordSchema.index({
  productTitle: "text",
  productArtistName: "text",
  isrc: "text",
  catalogNumber: "text",
})

export type RoyaltyRecordDocument = InferSchemaType<typeof RoyaltyRecordSchema>

export const RoyaltyRecord: Model<RoyaltyRecordDocument> =
  mongoose.models.RoyaltyRecord ??
  mongoose.model<RoyaltyRecordDocument>("RoyaltyRecord", RoyaltyRecordSchema)
