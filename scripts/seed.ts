import { hashPassword } from "../apps/api/src/lib/password";

const users = [
	{
		username: "business1",
		name: "PT Green Nusantara",
		role: "business",
		companyName: "PT Green Nusantara",
	},
	{
		username: "vendor1",
		name: "EcoTech Solutions",
		role: "vendor",
		companyName: "EcoTech Solutions",
	},
	{ username: "admin", name: "Administrator", role: "admin", companyName: null },
] as const;

const PASSWORD = "12345678";

const nowTs = (offsetDays = 0) =>
	offsetDays === 0
		? "(strftime('%s','now')*1000)"
		: `((strftime('%s','now') ${offsetDays > 0 ? "+" : "-"} ${Math.abs(offsetDays) * 86400})*1000)`;

const BUSINESS =
	"(SELECT id FROM users WHERE email = 'business1@greenshift.dev')";
const VENDOR =
	"(SELECT id FROM vendor_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'vendor1@greenshift.dev'))";
const projectId = (title: string) =>
	`(SELECT id FROM projects WHERE title = '${title}')`;
const tenderId = (title: string) =>
	`(SELECT id FROM tenders WHERE project_id = ${projectId(title)})`;

const lines = await Promise.all(
	users.map(async (user) => {
		const hash = await hashPassword(PASSWORD);
		const values = [
			`'${user.username}@greenshift.dev'`,
			`'${user.role}'`,
			`'${user.name}'`,
			`'${hash}'`,
			user.companyName ? `'${user.companyName}'` : "NULL",
			"(strftime('%s','now')*1000)",
			"(strftime('%s','now')*1000)",
		].join(", ");
		return `INSERT INTO users (email, role, name, hashed_password, company_name, created_at, updated_at) VALUES (${values});`;
	}),
);

// Vendor-domain fixtures so the vendor API is exercisable end-to-end:
// P1 has an open tender without a bid (demo POST /proposals + duplicate 409);
// P2–P5 carry one vendor1 proposal each covering submitted / revision /
// reviewed / accepted. P3 has a business revision request with a note.
lines.push(
	// vendor profile
	`INSERT INTO vendor_profiles (user_id, company_name, description, certifications, portfolio, rating, total_projects, verified_at, created_at)
SELECT id, 'EcoTech Solutions', 'Penyedia solusi efisiensi energi industri: audit energi, retrofit peralatan, dan pemasangan energi terbarukan.', '["SNI ISO 50001","Sertifikat K3","PJK3"]', '["Retrofit boiler PT Maju Bersama (2023)","Solar rooftop 300 kWp PT Sinar Abadi (2024)"]', 4.6, 12, ${nowTs(-30)}, ${nowTs(-30)}
FROM users WHERE email = 'vendor1@greenshift.dev';`,

	// projects (all in tendering)
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Retrofit Pabrik Tekstil', 'Efisiensi energi boiler uap 10 ton/jam melalui retrofit burner dan heat recovery.', 'tendering', 500000000, 'Malang', 'tekstil', 320, 410000, 28, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Solar Rooftop 500 kWp', 'Pemasangan PLTS atap 500 kWp dengan skema self-consumption untuk pabrik.', 'tendering', 1000000000, 'Surabaya', 'manufaktur', 380, 720000, 35, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Optimasi Compressed Air', 'Optimasi sistem udara tekan: perbaikan kebocoran dan penggantian kompresor.', 'tendering', 100000000, 'Sidoarjo', 'makanan & minuman', 95, 140000, 22, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Penerangan LED Pabrik', 'Relamping LED high-bay lengkap dengan kontrol okupansi untuk area produksi.', 'tendering', 1500000000, 'Gresik', 'kimia', 210, 480000, 18, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Boiler Biomassa', 'Penggantian boiler batu bara 5 MWth menjadi boiler biomassa dengan ESP.', 'tendering', 2500000000, 'Pasuruan', 'kertas', 1240, 1800000, 41, ${nowTs()}, ${nowTs()});`,

	// tenders
	`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
VALUES (${projectId("Retrofit Pabrik Tekstil")}, 'open', 'open', 300000000, 500000000, ${nowTs(14)}, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
VALUES (${projectId("Solar Rooftop 500 kWp")}, 'open', 'open', 700000000, 1000000000, ${nowTs(3)}, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
VALUES (${projectId("Optimasi Compressed Air")}, 'open', 'open', 60000000, 100000000, ${nowTs(7)}, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
VALUES (${projectId("Penerangan LED Pabrik")}, 'open', 'evaluation', 1000000000, 1500000000, ${nowTs(-2)}, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
VALUES (${projectId("Boiler Biomassa")}, 'open', 'closed', 1800000000, 2500000000, ${nowTs(-10)}, ${nowTs()}, ${nowTs()});`,

	// proposals (vendor1)
	`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, created_at, updated_at)
VALUES (${tenderId("Solar Rooftop 500 kWp")}, ${VENDOR}, 850000000, 'Panel monocrystalline 550 Wp, inverter string, struktur rooftop, monitoring IoT.', 42000000, 14.5, 36, 'submitted', 0, ${nowTs(-5)}, ${nowTs(-5)}, ${nowTs(-5)});`,
	`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, created_at, updated_at)
VALUES (${tenderId("Optimasi Compressed Air")}, ${VENDOR}, 110000000, 'Audit kebocoran, kompresor VSD 75 kW, dryer + receiver, kontrol tekanan otomatis.', 9000000, 18, 24, 'revision', 1, ${nowTs(-8)}, ${nowTs(-8)}, ${nowTs(-8)});`,
	`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, reviewed_at, created_at, updated_at)
VALUES (${tenderId("Penerangan LED Pabrik")}, ${VENDOR}, 1200000000, 'LED high-bay 200 W retrofit, sensor okupansi, dimming, relamping lengkap.', 65000000, 12, 60, 'reviewed', 0, ${nowTs(-12)}, ${nowTs(-9)}, ${nowTs(-12)}, ${nowTs(-12)});`,
	`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, created_at, updated_at)
VALUES (${tenderId("Boiler Biomassa")}, ${VENDOR}, 2100000000, 'Boiler biomassa 5 MWth, sistem feeding otomatis, ESP + wet scrubber.', 180000000, 16.5, 48, 'accepted', 0, ${nowTs(-20)}, ${nowTs(-20)}, ${nowTs(-20)});`,

	// business revision request (P3)
	`INSERT INTO proposal_revisions (proposal_id, revision_number, note, amount, previous_amount, created_by, created_at)
VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId("Optimasi Compressed Air")}), 1, 'Harga penawaran melebihi budget maksimum tender (Rp 100 juta). Mohon ajukan revisi harga.', 110000000, NULL, 'company', ${nowTs(-6)});`,

	// award the Boiler Biomassa tender to vendor1
	`UPDATE tenders SET status = 'awarded', awarded_proposal_id = (SELECT id FROM proposals WHERE tender_id = tenders.id)
WHERE project_id = ${projectId("Boiler Biomassa")};`,
);

const verifiedBy = "(SELECT id FROM users WHERE email = 'admin@greenshift.dev')";

// Public obligasi dashboard fixtures so the dashboard is exercisable without
// an account: two projects already past procurement (funding + published
// blueprint) plus MRV emission reports — one anomaly-flagged to demo the
// anomaly badge.
lines.push(
	// funded projects (published blueprint + funding status)
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Retrofit Chiller Pabrik', 'Penggantian chiller lama dengan unit efisiensi tinggi dan kontrol beban otomatis.', 'funding', 500000000, 'Sidoarjo', 'logam dasar', 320, 420000, 24, ${nowTs(-120)}, ${nowTs(-120)});`,
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Efisiensi Motor Listrik', 'Retrofit motor listrik standar menjadi motor premium IE3 dengan VSD.', 'funding', 300000000, 'Gresik', 'manufaktur', 180, 260000, 18, ${nowTs(-90)}, ${nowTs(-90)});`,

	// published blueprints (validated before publication, per lifecycle)
	`INSERT INTO blueprints (project_id, status, document, validated_at, published_at, created_at, updated_at)
VALUES (${projectId("Retrofit Chiller Pabrik")}, 'published', '{"financialProjections":{"npv":98000000,"irr":12,"paybackPeriod":4}}', ${nowTs(-115)}, ${nowTs(-112)}, ${nowTs(-120)}, ${nowTs(-112)});`,
	`INSERT INTO blueprints (project_id, status, document, validated_at, published_at, created_at, updated_at)
VALUES (${projectId("Efisiensi Motor Listrik")}, 'published', '{"financialProjections":{"npv":61000000,"irr":16,"paybackPeriod":3}}', ${nowTs(-85)}, ${nowTs(-82)}, ${nowTs(-90)}, ${nowTs(-82)});`,

	// MRV emission reports — Chiller project ends with an anomaly flag
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Retrofit Chiller Pabrik")}, ${nowTs(-125)}, ${nowTs(-95)}, 108000, 120000, 9.48, 0, '{}', ${verifiedBy}, ${nowTs(-92)}, ${nowTs(-95)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Retrofit Chiller Pabrik")}, ${nowTs(-95)}, ${nowTs(-65)}, 105000, 120000, 11.85, 0, '{}', ${verifiedBy}, ${nowTs(-62)}, ${nowTs(-65)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Retrofit Chiller Pabrik")}, ${nowTs(-65)}, ${nowTs(-35)}, 104500, 120000, 12.25, 0, '{}', ${verifiedBy}, ${nowTs(-32)}, ${nowTs(-35)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, anomaly_score, anomaly_note, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Retrofit Chiller Pabrik")}, ${nowTs(-35)}, ${nowTs(-5)}, 112000, 120000, 6.32, 1, 0.82, 'Konsumsi aktual naik vs kuartal sebelumnya; penghematan di bawah ekspektasi blueprint.', '{}', ${verifiedBy}, ${nowTs(-2)}, ${nowTs(-5)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Efisiensi Motor Listrik")}, ${nowTs(-90)}, ${nowTs(-60)}, 74000, 85000, 8.69, 0, '{}', ${verifiedBy}, ${nowTs(-57)}, ${nowTs(-60)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Efisiensi Motor Listrik")}, ${nowTs(-60)}, ${nowTs(-30)}, 70500, 85000, 11.46, 0, '{}', ${verifiedBy}, ${nowTs(-27)}, ${nowTs(-30)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Efisiensi Motor Listrik")}, ${nowTs(-30)}, ${nowTs(0)}, 72900, 85000, 9.56, 0, '{}', ${verifiedBy}, ${nowTs(3)}, ${nowTs(0)});`,
);

console.log(lines.join("\n"));
