import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const IsrcClaimSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    vendorName: { type: String, trim: true, required: true },
    isrc: { type: String, trim: true, required: true, uppercase: true },
    productTitle: { type: String, trim: true, required: true },
    productArtistName: { type: String, trim: true, required: true },
    productAlbumName: { type: String, trim: true },
    labelName: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedById: { type: String },
    reviewedByName: { type: String },
    reviewNote: { type: String, trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
)

IsrcClaimSchema.index({ vendorId: 1, status: 1 })
// Only one vendor may hold an approved claim on a given ISRC at a time.
IsrcClaimSchema.index(
  { isrc: 1 },
  { unique: true, partialFilterExpression: { status: "approved" } }
)

export type IsrcClaimDocument = InferSchemaType<typeof IsrcClaimSchema>

export const IsrcClaim: Model<IsrcClaimDocument> =
  mongoose.models.IsrcClaim ??
  mongoose.model<IsrcClaimDocument>("IsrcClaim", IsrcClaimSchema)
