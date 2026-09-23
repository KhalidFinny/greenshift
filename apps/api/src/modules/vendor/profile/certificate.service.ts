/* The vendor's certificate: the file an administrator verifies the profile against.
 * The scan only reads it; the verdict stays with the administrator.
 */

import type { VendorProfile } from "../../../contracts";
import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import {
	isAcceptedDocument,
	MAX_DOCUMENT_BYTES,
} from "../../../lib/document-upload";
import { scanCompanyDocument } from "../../business/verification/document-scan.service";
import * as repository from "./profile.repository";
import { getVendorProfile } from "./profile.service";

export type AttachCertificateResult =
	| { status: "ok"; profile: VendorProfile }
	| { status: "not_found" }
	| { status: "too_large" }
	| { status: "unsupported" };

/**
 * Files the certificate, reads it, and stores the reading with it. The object
 * goes up before the row, so a failed write leaves the previous file in place.
 */
export async function attachVendorCertificate(
	db: GreenShiftDb,
	env: Env,
	userId: number,
	file: File,
): Promise<AttachCertificateResult> {
	const row = await repository.findVendorProfileRow(db, userId);
	if (!row) return { status: "not_found" };
	if (file.size > MAX_DOCUMENT_BYTES) return { status: "too_large" };
	if (!isAcceptedDocument(file)) return { status: "unsupported" };

	const fileKey = `vendor-certificates/${row.vendor.id}/${file.name}`;
	const bytes = await file.arrayBuffer();
	await env.R2.put(fileKey, bytes, {
		httpMetadata: { contentType: file.type || "application/octet-stream" },
	});

	const scan = await scanCompanyDocument(env, {
		subject: "vendor_certificate",
		fileName: file.name,
		contentType: file.type || null,
		companyName: row.vendor.companyName,
		identityNumbers: [
			{ label: "NIB", value: row.vendor.nib ?? "" },
			{ label: "NPWP", value: row.vendor.npwp ?? "" },
			{ label: "TDP", value: row.vendor.tdp ?? "" },
		],
		bytes,
	});

	const saved = await repository.saveVendorCertificate(db, row.vendor.id, {
		fileName: file.name,
		fileKey,
		contentType: file.type || null,
		scan,
	});
	if (!saved) {
		await env.R2.delete(fileKey);
		return { status: "not_found" };
	}

	// Replacing a certificate leaves the old object behind otherwise.
	if (row.vendor.certificateKey && row.vendor.certificateKey !== fileKey) {
		await env.R2.delete(row.vendor.certificateKey);
	}

	const profile = await getVendorProfile(db, userId);
	return profile ? { status: "ok", profile } : { status: "not_found" };
}

export type CertificateStream =
	| {
			outcome: "ok";
			body: ReadableStream;
			contentType: string;
			fileName: string;
	  }
	| { outcome: "not_found" };

async function streamCertificate(
	env: Env,
	vendor: { certificateKey: string | null; certificateName: string | null },
): Promise<CertificateStream> {
	if (!vendor.certificateKey) return { outcome: "not_found" };

	const object = await env.R2.get(vendor.certificateKey);
	if (!object) return { outcome: "not_found" };

	return {
		outcome: "ok",
		body: object.body,
		contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
		fileName: vendor.certificateName ?? "certificate",
	};
}

export async function readVendorCertificate(
	db: GreenShiftDb,
	env: Env,
	userId: number,
): Promise<CertificateStream> {
	const row = await repository.findVendorProfileRow(db, userId);
	if (!row) return { outcome: "not_found" };
	return streamCertificate(env, row.vendor);
}

/** The same certificate as an administrator reads it, when reviewing a profile. */
export async function readVendorCertificateForAdmin(
	db: GreenShiftDb,
	env: Env,
	vendorId: number,
): Promise<CertificateStream> {
	const row = await repository.findVendorProfileById(db, vendorId);
	if (!row) return { outcome: "not_found" };
	return streamCertificate(env, row.vendor);
}
