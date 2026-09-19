import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createDb } from "../../../db";
import type { ApiEnv } from "../../../env";
import { mutationRateLimit } from "../../../lib/mutation-limit";
import { apiError, apiNotFound, apiSuccess } from "../../../lib/response";
import { findAccount } from "./avatar.repository";
import { AVATAR_LIMITS, clearAvatar, replaceAvatar } from "./avatar.service";

const factory = createFactory<ApiEnv>();

export const avatarRoutes = new Hono<ApiEnv>();

// ── read the picture ──────────────────────────────────────
avatarRoutes.get(
	"/avatar",
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const account = await findAccount(db, c.get("user").id);
		if (!account?.avatar) {
			return apiNotFound(c, "Profile picture");
		}

		const object = await c.env.R2.get(account.avatar);
		if (!object) {
			return apiNotFound(c, "Profile picture");
		}

		return new Response(object.body, {
			headers: {
				"Content-Type": object.httpMetadata?.contentType ?? "image/png",
				// Private: the picture belongs to the signed-in account.
				"Cache-Control": "private, max-age=300",
			},
		});
	}),
);

// ── upload or replace ─────────────────────────────────────
avatarRoutes.put(
	"/avatar",
	mutationRateLimit("account", "avatar"),
	...factory.createHandlers(async (c) => {
		const body = await c.req.parseBody().catch(() => null);
		const file = body?.avatar;

		if (!(file instanceof File)) {
			return apiError(
				c,
				"VALIDATION",
				"Attach the image as a file field named 'avatar'",
			);
		}
		if (!(file.type in AVATAR_LIMITS.extByMime)) {
			return apiError(
				c,
				"UNSUPPORTED_MEDIA_TYPE",
				"Picture must be a PNG, JPEG, or WebP image",
			);
		}
		if (file.size === 0) {
			return apiError(c, "VALIDATION", "The uploaded image is empty");
		}
		if (file.size > AVATAR_LIMITS.maxBytes) {
			return apiError(
				c,
				"PAYLOAD_TOO_LARGE",
				"Picture must be 2 MB or smaller",
			);
		}

		const db = createDb(c.env.DB);
		const userId = c.get("user").id;
		const account = await findAccount(db, userId);
		if (!account) {
			return apiError(c, "NOT_FOUND", "Account not found");
		}

		const key = await replaceAvatar(c.env, db, userId, account.avatar, file);
		return apiSuccess(c, { avatarKey: key }, "Profile picture updated");
	}),
);

// ── remove ────────────────────────────────────────────────
avatarRoutes.delete(
	"/avatar",
	mutationRateLimit("account", "avatar"),
	...factory.createHandlers(async (c) => {
		const db = createDb(c.env.DB);
		const userId = c.get("user").id;
		const account = await findAccount(db, userId);
		if (!account) {
			return apiError(c, "NOT_FOUND", "Account not found");
		}

		await clearAvatar(c.env, db, userId, account.avatar);
		return apiSuccess(c, { avatarKey: null }, "Profile picture removed");
	}),
);
