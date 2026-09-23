interface FloatingPillProps {
	children: React.ReactNode;
	animation?: "float" | "float-delayed" | "float-slow" | "float-slow-delayed";
}

export default function FloatingPill({
	children,
	animation = "float",
}: FloatingPillProps) {
	return (
		<span
			className={`animate-${animation} inline-block rounded-[12px] border border-white/30 bg-white/15 px-5 py-2.5 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-50 motion-reduce:animate-none lg:rounded-[calc(var(--u)*12)] lg:px-[calc(var(--u)*20)] lg:py-[calc(var(--u)*10)] lg:text-[length:max(0.875rem,calc(var(--u)*16))]`}
		>
			{children}
		</span>
	);
}
