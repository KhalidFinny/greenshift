import Panel from "../atoms/Panel";

export default function DashboardShowcase() {
	return (
		<figure className="relative w-[80%] max-w-[1000px] m-0 lg:w-[calc(var(--u)*1000)] lg:max-w-none">
			<Panel>
				<div className="relative">
					<img
						src="/dashboard.webp"
						alt="GreenShift dashboard view showing energy project metrics"
						decoding="async"
						className="w-full"
					/>
				</div>
			</Panel>
			<figcaption className="sr-only">
				GreenShift project monitoring dashboard with real-time data
				visualization
			</figcaption>
		</figure>
	);
}
