import { randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"

import { Admin } from "@/models/Admin"

const VENDOR_EMAIL_DOMAIN = "vendor.wbroyalties.local"
const DEFAULT_COMMISSION_PERCENT = 25

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "vendor"
  )
}

function generateTempPassword(): string {
  return randomBytes(9).toString("base64url")
}

export type NewVendorCredential = {
  vendorName: string
  email: string
  tempPassword: string
}

/**
 * Ensures an Admin(role: "vendor") document exists for every vendor name.
 * Returns a vendorName -> Admin _id map plus the credentials for any
 * newly-created vendors (returned once — the plaintext password is never stored).
 */
export async function ensureVendorAccounts(
  vendorNames: Set<string>
): Promise<{
  vendorIdByName: Map<string, string>
  newVendors: NewVendorCredential[]
}> {
  const vendorIdByName = new Map<string, string>()
  const newVendors: NewVendorCredential[] = []

  const existing = await Admin.find({
    role: "vendor",
    vendorName: { $in: Array.from(vendorNames) },
  })
    .select({ _id: 1, vendorName: 1 })
    .lean()

  for (const doc of existing) {
    if (doc.vendorName) vendorIdByName.set(doc.vendorName, doc._id.toString())
  }

  const missing = Array.from(vendorNames).filter((name) => !vendorIdByName.has(name))

  for (const vendorName of missing) {
    const baseSlug = slugify(vendorName)
    let email = `${baseSlug}@${VENDOR_EMAIL_DOMAIN}`
    let suffix = 1
    while (await Admin.findOne({ email }).select({ _id: 1 }).lean()) {
      suffix += 1
      email = `${baseSlug}-${suffix}@${VENDOR_EMAIL_DOMAIN}`
    }

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    const created = await Admin.create({
      name: vendorName,
      email,
      passwordHash,
      role: "vendor",
      vendorName,
      ottCommissionPercent: DEFAULT_COMMISSION_PERCENT,
      ytCommissionPercent: DEFAULT_COMMISSION_PERCENT,
      mustChangePassword: true,
      status: "active",
    })

    vendorIdByName.set(vendorName, created._id.toString())
    newVendors.push({ vendorName, email, tempPassword })
  }

  return { vendorIdByName, newVendors }
}
