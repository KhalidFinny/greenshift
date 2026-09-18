import { cn } from "@greenshift/ui";

interface GlassCardProps {
	children: React.ReactNode;
	className?: string;
}

export default function GlassCard({ children, className }: GlassCardProps) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-[12px] border border-[#03442C]/20 bg-white",
				className,
			)}
		>
			{children}
		</div>
	);
}
