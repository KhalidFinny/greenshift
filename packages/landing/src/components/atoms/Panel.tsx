import { cn } from "@greenshift/ui";

interface PanelProps {
	children: React.ReactNode;
	className?: string;
}

export default function Panel({ children, className }: PanelProps) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-[12px] border border-[#CDDAD5] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.4)]",
				className,
			)}
		>
			{children}
		</div>
	);
}
