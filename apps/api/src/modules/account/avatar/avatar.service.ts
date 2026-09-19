import type { GreenShiftDb } from "../../../db";
import type { Env } from "../../../env";
import * as repository from "./avatar.repository";

/** Upload constraints. The client mirrors these so both sides agree. */
export const AVATAR_LIMITS = {
	maxBytes: 2 * 1024 * 1024,
	extByMime: {
		"image/png": "png",
		"image/jpeg": "jpg",
		"image/webp": "webp",
	} as Record<string, string>,
};

/** Keys are namespaced per account so one person's objects are easy to sweep. */
export function avatarKeyFor(userId: number, mimeType: string): string {
	return `avatars/${userId}/${crypto.randomUUID()}.${AVATAR_LIMITS.extByMime[mimeType]}`;
}

/**
 * Replaces the account's picture. The object is written first, then the row is
 * pointed at it, then the previous object is removed. A failed row write deletes
 * the object it just wrote, so a failure never leaves the account pointing at a
 * picture that is not there, and a retry never accumulates orphans.
 */
export async function replaceAvatar(
	env: Env,
	db: GreenShiftDb,
	userId: number,
	currentKey: string | null,
	file: File,
): Promise<string> {
	const key = avatarKeyFor(userId, file.type);

	await env.R2.put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type },
	});

	try {
		await repository.setAvatarKey(db, userId, key);
	} catch (err) {
		await env.R2.delete(key);
		throw err;
	}

	if (currentKey && currentKey !== key) {
		await env.R2.delete(currentKey);
	}

	return key;
}

/** Clears the picture: the row stops pointing at it, then the object goes. */
export async function clearAvatar(
	env: Env,
	db: GreenShiftDb,
	userId: number,
	currentKey: string | null,
): Promise<void> {
	await repository.setAvatarKey(db, userId, null);
	if (currentKey) {
		await env.R2.delete(currentKey);
	}
}
