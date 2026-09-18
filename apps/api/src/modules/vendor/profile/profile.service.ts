import type { VendorProfile } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { users, vendors } from "../../../db/schema";
import { iso } from "../../../lib/format";
import type { VendorProfileValues } from "./profile.repository";
import * as repository from "./profile.repository";

function toVendorProfile(
	vendor: typeof vendors.$inferSelect,
	user: typeof users.$inferSelect,
): VendorProfile {
	return {
		id: vendor.id,
		userId: vendor.userId,
		companyName: vendor.companyName,
		description: vendor.description,
		certifications: (vendor.certifications as string[]) ?? [],
		portfolio: (vendor.portfolio as string[]) ?? [],
		rating: vendor.rating ?? 0,
		totalProjects: vendor.totalProjects ?? 0,
		verified: vendor.verifiedAt !== null,
		verifiedAt: iso(vendor.verifiedAt),
		userEmail: user.email,
		userName: user.name,
		createdAt: iso(vendor.createdAt),
	};
}

export async function getVendorProfile(
	db: GreenShiftDb,
	userId: number,
): Promise<VendorProfile | null> {
	const row = await repository.findVendorProfileRow(db, userId);
	if (!row) return null;

	return toVendorProfile(row.vendor, row.user);
}

export type SaveProfileResult =
	| { status: "ok"; profile: VendorProfile }
	| { status: "upsert_failed" }
	| { status: "load_failed" };

// Upsert: creates the profile on first save, updates afterwards, and keeps
// users.companyName in sync. No DELETE: vendor_profiles cascades to proposals.
export async function saveVendorProfile(
	db: GreenShiftDb,
	userId: number,
	values: VendorProfileValues,
): Promise<SaveProfileResult> {
	const existing = await repository.findVendorIdByUser(db, userId);
	const saved = await repository.upsertVendorProfile(db, userId, values);
	if (!saved) return { status: "upsert_failed" };

	const created = !existing;
	await repository.syncCompanyNameAndRecordAudit(db, {
		userId,
		companyName: values.companyName,
		action: created ? "vendor.profile_created" : "vendor.profile_updated",
		vendorId: saved.id,
	});

	const row = await repository.findVendorProfileById(db, saved.id);
	if (!row) return { status: "load_failed" };

	return { status: "ok", profile: toVendorProfile(row.vendor, row.user) };
}
