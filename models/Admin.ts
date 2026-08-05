import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose"

const AdminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    role: {
      type: String,
      enum: ["admin", "vendor"],
      default: "admin",
    },
    vendorName: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    ottCommissionPercent: { type: Number, default: 75, min: 0, max: 100 },
    ytCommissionPercent: { type: Number, default: 75, min: 0, max: 100 },
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export type AdminDocument = InferSchemaType<typeof AdminSchema>

export const Admin: Model<AdminDocument> =
  mongoose.models.Admin ?? mongoose.model<AdminDocument>("Admin", AdminSchema)
