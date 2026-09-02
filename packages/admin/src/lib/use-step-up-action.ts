import { useCallback, useRef, useState } from "react";
import { ApiError } from "@greenshift/core";

/**
 * Wraps an admin action that the API gates with step-up (428 STEP_UP_REQUIRED).
 * On 428 the step-up dialog opens; the caller's promise stays pending and only
 * resolves after the action succeeds on retry. Other errors are re-thrown.
 */
export function useStepUpAction<Args extends unknown[]>(
	action: (...args: Args) => Promise<unknown>,
	onSuccess?: () => void,
) {
	const [isPending, setIsPending] = useState(false);
	const [stepUpOpen, setStepUpOpen] = useState(false);
	const pendingRef = useRef<{
		args: Args;
		resolve: () => void;
		reject: (err: unknown) => void;
	} | null>(null);

	const attempt = useCallback(
		async (args: Args) => {
			setIsPending(true);
			try {
				await action(...args);
				onSuccess?.();
				setIsPending(false);
			} catch (err) {
				if (err instanceof ApiError && err.status === 428) {
					setStepUpOpen(true);
					try {
						await new Promise<void>((resolve, reject) => {
							pendingRef.current = { args, resolve, reject };
						});
					} finally {
						setIsPending(false);
					}
					return;
				}
				setIsPending(false);
				throw err;
			}
		},
		[action, onSuccess],
	);

	const run = useCallback((...args: Args) => attempt(args), [attempt]);

	const retryAfterStepUp = useCallback(() => {
		const pending = pendingRef.current;
		pendingRef.current = null;
		if (!pending) return;
		void attempt(pending.args)
			.then(pending.resolve)
			.catch(pending.reject);
	}, [attempt]);

	const closeStepUp = useCallback(() => {
		pendingRef.current = null;
		setStepUpOpen(false);
	}, []);

	return { run, isPending, stepUpOpen, closeStepUp, retryAfterStepUp };
}
