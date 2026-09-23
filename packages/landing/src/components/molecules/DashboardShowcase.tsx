import Panel from "../atoms/Panel";

/** The hero screenshot: the submission wizard's first step, not a dashboard that only exists once a project runs. */
export default function DashboardShowcase() {
	return (
		<figure className="relative w-[80%] max-w-[1000px] m-0 lg:w-[calc(var(--u)*1000)] lg:max-w-none">
			<Panel>
				<div className="relative">
					<img
						src="/wizard-project-profile.webp"
						alt="Step one of the GreenShift project submission wizard, showing the project profile form, the current energy situation, and the emission reduction target summary"
						decoding="async"
						className="w-full"
					/>
				</div>
			</Panel>
			<figcaption className="sr-only">
				GreenShift project submission: the wizard a company starts a project in
			</figcaption>
		</figure>
	);
}
