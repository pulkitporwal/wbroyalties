import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const UploadBatchSchema = new Schema(
  {
    fileName: { type: String, required: true },
    uploadedById: { type: String, required: true },
    uploadedByName: { type: String, required: true },
    rowCount: { type: Number, default: 0 },
    skippedRowCount: { type: Number, default: 0 },
    vendorsCreated: { type: Number, default: 0 },
    totalRowCount: { type: Number, default: 0 },
    processedRowCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
)

export type UploadBatchDocument = InferSchemaType<typeof UploadBatchSchema>

export const UploadBatch: Model<UploadBatchDocument> =
  mongoose.models.UploadBatch ??
  mongoose.model<UploadBatchDocument>("UploadBatch", UploadBatchSchema)
