import { describe, expect, test } from "bun:test";
import { buildDistrictLabels, titleCase } from "./districts";

const P = "11,ACEH\n32,JAWA BARAT\n";
const R = "1101,,ACEH SELATAN\n3201,,BOGOR\n3204,,KARAWANG\n";
const D =
	"110101,1101,KLUET UTARA\n320101,3201,CIKARANG, EXTRA\n320401,3204,CIBITUNG\n999999,9999,ORPHAN\n";

describe("titleCase", () => {
	test("uppercases each word", () => {
		expect(titleCase("CIKARANG")).toBe("Cikarang");
	});
});

describe("buildDistrictLabels", () => {
	test("joins kecamatan + kabupaten/kota + provinsi", () => {
		const labels = buildDistrictLabels(D, R, P);
		expect(labels).toContain("Kluet Utara, Aceh Selatan, Aceh");
		expect(labels).toContain("Cibitung, Karawang, Jawa Barat");
		expect(labels).toContain("Cikarang, Bogor, Jawa Barat");
	});
	test("drops rows whose regency or province is missing", () => {
		const labels = buildDistrictLabels(D, R, P);
		expect(labels.some((l) => l.includes("Orphan"))).toBe(false);
	});
});
