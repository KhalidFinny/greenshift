import { describe, expect, test } from "bun:test";
import { formatId, parseIdNumber } from "./number-format";

describe("parseIdNumber", () => {
	test("ID decimals: 12.500,5 -> 12500.5", () => {
		expect(parseIdNumber("12.500,5")).toBe(12500.5);
	});
	test("thousands: 4.200.000.000 -> 4200000000", () => {
		expect(parseIdNumber("4.200.000.000")).toBe(4_200_000_000);
	});
	test("plain JS decimal 0.85 stays 0.85 (dot-only pair is not strict thousands)", () => {
		expect(parseIdNumber("0.85")).toBe(0.85);
	});
	test("strict thousands 1.234 -> 1234 but 12.34 stays decimal", () => {
		expect(parseIdNumber("1.234")).toBe(1234);
		expect(parseIdNumber("12.34")).toBe(12.34);
	});
	test("negatives return null", () => {
		expect(parseIdNumber("-5")).toBeNull();
		expect(parseIdNumber("-1.234")).toBeNull();
	});
	test("empty or unparseable returns null", () => {
		expect(parseIdNumber("")).toBeNull();
		expect(parseIdNumber("   ")).toBeNull();
		expect(parseIdNumber("abc")).toBeNull();
		expect(parseIdNumber(".")).toBeNull();
		expect(parseIdNumber(",")).toBeNull();
		expect(parseIdNumber("Rp")).toBeNull();
	});
	test("strips Rp and unit text", () => {
		expect(parseIdNumber("Rp 4.200.000.000")).toBe(4_200_000_000);
		expect(parseIdNumber("12.500 MWh")).toBe(12500);
	});
	test("non-finite returns null", () => {
		expect(parseIdNumber("Infinity")).toBeNull();
	});
});

describe("formatId", () => {
	test("groups thousands with dots", () => {
		expect(formatId(4_200_000_000)).toBe("4.200.000.000");
	});
	test("renders ID decimals with comma", () => {
		expect(formatId(12500.5, 1)).toBe("12.500,5");
	});
});
