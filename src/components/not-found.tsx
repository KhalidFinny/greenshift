import { Button } from "@greenshift/ui";
import { useRouter } from "@tanstack/react-router";

// Full-viewport 404 cover. Rendered by the root route for unmatched paths
// and by the auth layouts for unmatched subpaths (e.g. /investor/404-test);
// the fixed overlay hides the shell (sidebar included) in both cases.
export function NotFoundComponent() {
	const router = useRouter();

	function handleBack() {
		if (window.history.length > 1) {
			router.history.back();
		} else {
			router.navigate({ to: "/" });
		}
	}

	return (
		<div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background px-6 text-center">
			<p
				aria-hidden="true"
				className="text-[clamp(6rem,22vw,16rem)] leading-none font-bold text-transparent select-none [-webkit-text-stroke:3px_#00712D]"
			>
				404
			</p>
			<h1 className="mt-6 text-3xl font-bold text-[#1C1C1C] md:text-4xl">
				Page not found
			</h1>
			<p className="mt-4 max-w-md text-lg leading-relaxed text-[#555555]">
				The page you are looking for may have been moved, deleted, or never
				existed.
			</p>
			<Button
				onClick={handleBack}
				className="mt-10 h-[42px] cursor-pointer rounded-[10px] px-8 text-base normal-case tracking-normal"
			>
				Go back
			</Button>
		</div>
	);
}
