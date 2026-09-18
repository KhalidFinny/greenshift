/**
 * Global top progress bar shown during route transitions.
 * Indeterminate: slides across until the navigation settles.
 */
export function ProgressLoader() {
	return (
		<div
			role="progressbar"
			aria-label="Loading page"
			className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-primary/10"
		>
			<div className="h-full w-1/3 animate-[progress-indeterminate_1.2s_ease-in-out_infinite] bg-primary" />
		</div>
	);
}
