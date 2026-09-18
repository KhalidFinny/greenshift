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
			className={`animate-${animation} inline-block rounded-[12px] border border-white/30 bg-white/10 px-5 py-2.5 text-base font-semibold text-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-md motion-reduce:animate-none lg:rounded-[calc(var(--u)*12)] lg:px-[calc(var(--u)*20)] lg:py-[calc(var(--u)*10)] lg:text-[length:calc(var(--u)*16)]`}
		>
			{children}
		</span>
	);
}
