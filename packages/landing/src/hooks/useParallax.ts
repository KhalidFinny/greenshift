import { useScrollPosition } from "./useScrollPosition";

export function useParallax(factor: number, baseOffset: number = 0): number {
	const scrollY = useScrollPosition();
	return baseOffset + scrollY * factor;
}
