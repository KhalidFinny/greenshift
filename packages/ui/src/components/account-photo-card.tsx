import { type AuthUser, api, avatarLimits } from "@greenshift/core";
import { useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AccountAvatar } from "./account-avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const ACCEPT = avatarLimits.mimeTypes.join(",");

/**
 * The account picture, editable. Files are checked against the same limits the
 * API enforces before anything is sent, and the router is invalidated after a
 * change so the shell avatar picks the new picture up.
 */
export function AccountPhotoCard({ user }: { user: AuthUser }) {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleFile(file: File) {
		setError(null);

		if (!(avatarLimits.mimeTypes as readonly string[]).includes(file.type)) {
			setError("Choose a PNG, JPEG, or WebP image.");
			return;
		}
		if (file.size > avatarLimits.maxBytes) {
			const mb = (file.size / (1024 * 1024)).toFixed(1);
			setError(`That image is ${mb} MB. The limit is 2 MB.`);
			return;
		}

		setBusy(true);
		try {
			await api.account.uploadAvatar(file);
			await router.invalidate();
		} finally {
			setBusy(false);
			// Clear the input so picking the same file again still fires a change.
			if (inputRef.current) inputRef.current.value = "";
		}
	}

	async function handleRemove() {
		setError(null);
		setBusy(true);
		try {
			await api.account.removeAvatar();
			await router.invalidate();
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="rounded-xl border border-border bg-card p-5">
			<h2 className="text-base font-semibold text-foreground">Account photo</h2>
			<p className="mt-1 text-sm text-muted-foreground">
				Shown on your account menu. PNG, JPEG, or WebP, up to 2 MB.
			</p>

			<div className="mt-4 flex items-center gap-4">
				<AccountAvatar
					name={user.name}
					avatarKey={user.avatarKey}
					className="size-16"
					fallbackClassName="bg-[#00712D]/10 text-lg font-semibold text-[#00712D]"
				/>
				<div className="min-w-0 flex-1">
					<p className="truncate text-base font-semibold text-foreground">
						{user.name}
					</p>
					<p className="truncate text-sm text-muted-foreground">{user.email}</p>
				</div>
			</div>

			<div className="mt-4 flex flex-wrap items-center gap-3">
				<Input
					ref={inputRef}
					type="file"
					accept={ACCEPT}
					disabled={busy}
					aria-label="Choose an account photo"
					className="h-10 max-w-full cursor-pointer py-1 text-sm file:mr-3 file:h-7 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:text-sm file:font-medium file:text-foreground"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (file) void handleFile(file);
					}}
				/>
				{user.avatarKey ? (
					<Button
						type="button"
						variant="outline"
						disabled={busy}
						onClick={handleRemove}
						className="cursor-pointer"
					>
						Remove picture
					</Button>
				) : null}
			</div>

			{error ? (
				<p role="alert" className="mt-3 text-sm text-destructive">
					{error}
				</p>
			) : null}
			{busy ? (
				<p className="mt-3 text-sm text-muted-foreground">Working…</p>
			) : null}
		</section>
	);
}
