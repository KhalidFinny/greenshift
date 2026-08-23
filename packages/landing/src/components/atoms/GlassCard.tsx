import { cn } from "@greenshift/ui";

interface GlassCardProps {
	children: React.ReactNode;
	className?: string;
}

export default function GlassCard({ children, className }: GlassCardProps) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-[12px] border-2 border-white/40 bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-xl",
				className,
			)}
		>
			{children}
		</div>
	);
}
