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
SELECT id, 'EcoTech Solutions', 'Industrial energy-efficiency solutions provider: energy audits, equipment retrofits, and renewable energy installation.', '["SNI ISO 50001","K3 Certificate","PJK3"]', '["Boiler retrofit PT Maju Bersama (2023)","Solar rooftop 300 kWp PT Sinar Abadi (2024)"]', 4.6, 12, ${nowTs(-30)}, ${nowTs(-30)}
FROM users WHERE email = 'vendor1@greenshift.dev';`,

	// projects (all in tendering)
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Textile Factory Retrofit', 'Energy efficiency for a 10 ton/hour steam boiler through burner retrofit and heat recovery.', 'tendering', 500000000, 'Malang', 'textile', 320, 410000, 28, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Solar Rooftop 500 kWp', 'Installation of a 500 kWp rooftop solar PV system with a self-consumption scheme for the factory.', 'tendering', 1000000000, 'Surabaya', 'manufacturing', 380, 720000, 35, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Compressed Air Optimization', 'Compressed air system optimization: leak repair and compressor replacement.', 'tendering', 100000000, 'Sidoarjo', 'food & beverage', 95, 140000, 22, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Factory LED Lighting', 'High-bay LED relamping complete with occupancy controls for the production area.', 'tendering', 1500000000, 'Gresik', 'chemical', 210, 480000, 18, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Biomass Boiler', 'Replacement of a 5 MWth coal boiler with a biomass boiler with ESP.', 'tendering', 2500000000, 'Pasuruan', 'paper', 1240, 1800000, 41, ${nowTs()}, ${nowTs()});`,

	// tenders
	`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
VALUES (${projectId("Textile Factory Retrofit")}, 'open', 'open', 300000000, 500000000, ${nowTs(14)}, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
VALUES (${projectId("Solar Rooftop 500 kWp")}, 'open', 'open', 700000000, 1000000000, ${nowTs(3)}, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
VALUES (${projectId("Compressed Air Optimization")}, 'open', 'open', 60000000, 100000000, ${nowTs(7)}, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
VALUES (${projectId("Factory LED Lighting")}, 'open', 'evaluation', 1000000000, 1500000000, ${nowTs(-2)}, ${nowTs()}, ${nowTs()});`,
	`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
VALUES (${projectId("Biomass Boiler")}, 'open', 'closed', 1800000000, 2500000000, ${nowTs(-10)}, ${nowTs()}, ${nowTs()});`,

	// proposals (vendor1)
	`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, created_at, updated_at)
VALUES (${tenderId("Solar Rooftop 500 kWp")}, ${VENDOR}, 850000000, 'Monocrystalline 550 Wp panels, string inverter, rooftop structure, IoT monitoring.', 42000000, 14.5, 36, 'submitted', 0, ${nowTs(-5)}, ${nowTs(-5)}, ${nowTs(-5)});`,
	`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, created_at, updated_at)
VALUES (${tenderId("Compressed Air Optimization")}, ${VENDOR}, 110000000, 'Leak audit, 75 kW VSD compressor, dryer + receiver, automatic pressure control.', 9000000, 18, 24, 'revision', 1, ${nowTs(-8)}, ${nowTs(-8)}, ${nowTs(-8)});`,
	`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, reviewed_at, created_at, updated_at)
VALUES (${tenderId("Factory LED Lighting")}, ${VENDOR}, 1200000000, '200 W high-bay LED retrofit, occupancy sensors, dimming, complete relamping.', 65000000, 12, 60, 'reviewed', 0, ${nowTs(-12)}, ${nowTs(-9)}, ${nowTs(-12)}, ${nowTs(-12)});`,
	`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, created_at, updated_at)
VALUES (${tenderId("Biomass Boiler")}, ${VENDOR}, 2100000000, '5 MWth biomass boiler, automatic feeding system, ESP + wet scrubber.', 180000000, 16.5, 48, 'accepted', 0, ${nowTs(-20)}, ${nowTs(-20)}, ${nowTs(-20)});`,

	// business revision request (P3)
	`INSERT INTO proposal_revisions (proposal_id, revision_number, note, amount, previous_amount, created_by, created_at)
VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId("Compressed Air Optimization")}), 1, 'The proposal price exceeds the tender maximum budget (IDR 100 million). Please submit a price revision.', 110000000, NULL, 'company', ${nowTs(-6)});`,

	// award the Biomass Boiler tender to vendor1
	`UPDATE tenders SET status = 'awarded', awarded_proposal_id = (SELECT id FROM proposals WHERE tender_id = tenders.id)
WHERE project_id = ${projectId("Biomass Boiler")};`,
);

const verifiedBy = "(SELECT id FROM users WHERE email = 'admin@greenshift.dev')";

// Public bond dashboard fixtures so the dashboard is exercisable without
// an account: two projects already past procurement (funding + published
// blueprint) plus MRV emission reports: one anomaly-flagged to demo the
// anomaly badge.
lines.push(
	// funded projects (published blueprint + funding status)
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Factory Chiller Retrofit', 'Replacement of the old chiller with a high-efficiency unit and automatic load control.', 'funding', 500000000, 'Sidoarjo', 'base metals', 320, 420000, 24, ${nowTs(-120)}, ${nowTs(-120)});`,
	`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
VALUES (${BUSINESS}, 'Electric Motor Efficiency', 'Retrofit of standard electric motors to premium IE3 motors with VSD.', 'funding', 300000000, 'Gresik', 'manufacturing', 180, 260000, 18, ${nowTs(-90)}, ${nowTs(-90)});`,

	// published blueprints (validated before publication, per lifecycle)
	`INSERT INTO blueprints (project_id, status, document, validated_at, published_at, created_at, updated_at)
VALUES (${projectId("Factory Chiller Retrofit")}, 'published', '{"financialProjections":{"npv":98000000,"irr":12,"paybackPeriod":4}}', ${nowTs(-115)}, ${nowTs(-112)}, ${nowTs(-120)}, ${nowTs(-112)});`,
	`INSERT INTO blueprints (project_id, status, document, validated_at, published_at, created_at, updated_at)
VALUES (${projectId("Electric Motor Efficiency")}, 'published', '{"financialProjections":{"npv":61000000,"irr":16,"paybackPeriod":3}}', ${nowTs(-85)}, ${nowTs(-82)}, ${nowTs(-90)}, ${nowTs(-82)});`,

	// MRV emission reports: Chiller project ends with an anomaly flag
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Factory Chiller Retrofit")}, ${nowTs(-125)}, ${nowTs(-95)}, 108000, 120000, 9.48, 0, '{}', ${verifiedBy}, ${nowTs(-92)}, ${nowTs(-95)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Factory Chiller Retrofit")}, ${nowTs(-95)}, ${nowTs(-65)}, 105000, 120000, 11.85, 0, '{}', ${verifiedBy}, ${nowTs(-62)}, ${nowTs(-65)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Factory Chiller Retrofit")}, ${nowTs(-65)}, ${nowTs(-35)}, 104500, 120000, 12.25, 0, '{}', ${verifiedBy}, ${nowTs(-32)}, ${nowTs(-35)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, anomaly_score, anomaly_note, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Factory Chiller Retrofit")}, ${nowTs(-35)}, ${nowTs(-5)}, 112000, 120000, 6.32, 1, 0.82, 'Actual consumption rose versus the previous quarter; savings are below the blueprint expectation.', '{}', ${verifiedBy}, ${nowTs(-2)}, ${nowTs(-5)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Electric Motor Efficiency")}, ${nowTs(-90)}, ${nowTs(-60)}, 74000, 85000, 8.69, 0, '{}', ${verifiedBy}, ${nowTs(-57)}, ${nowTs(-60)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Electric Motor Efficiency")}, ${nowTs(-60)}, ${nowTs(-30)}, 70500, 85000, 11.46, 0, '{}', ${verifiedBy}, ${nowTs(-27)}, ${nowTs(-30)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
VALUES (${projectId("Electric Motor Efficiency")}, ${nowTs(-30)}, ${nowTs(0)}, 72900, 85000, 9.56, 0, '{}', ${verifiedBy}, ${nowTs(3)}, ${nowTs(0)});`,
);

// Vendor app fixtures: the negotiation the company opened on the compressed-air
// proposal, the delivery milestones + MRV reports of the awarded biomass
// project, the vendor's own portfolio entries and its notification feed.
lines.push(
	`INSERT INTO negotiations (proposal_id, iteration_number, status, requested_price_reduction, requested_warranty_years, requested_timeline_months, requested_fields, company_note, created_at, updated_at)
VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId("Compressed Air Optimization")}), 1, 'PENDING_VENDOR_RESPONSE', 10000000, 36, 6, '["Total Project Price","Unit & Service Warranty Period","Implementation Timeline"]', 'The proposal price exceeds the tender maximum budget (IDR 100 million) and the warranty period is shorter than the board requires. Please revise the price and extend the warranty to 36 months.', ${nowTs(-6)}, ${nowTs(-6)});`,

	`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
VALUES (${projectId("Biomass Boiler")}, 1, 'Site Survey & Engineering Design', 'Load survey, boiler house layout, fuel supply study and stamped engineering drawings.', ${nowTs(-18)}, ${nowTs(-10)}, 100, 'APPROVED', 'Rev C drawings issued to the plant engineering team.', 'Reviewed and approved by the plant engineer.', ${nowTs(-18)}, ${nowTs(-11)});`,
	`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
VALUES (${projectId("Biomass Boiler")}, 2, 'Procurement & Factory Acceptance Test', 'Boiler, feeding system and ESP procurement with a factory acceptance test before shipment.', ${nowTs(-11)}, ${nowTs(-2)}, 100, 'APPROVED', 'FAT witnessed at the vendor works; report attached.', 'Accepted.', ${nowTs(-11)}, ${nowTs(-3)});`,
	`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
VALUES (${projectId("Biomass Boiler")}, 3, 'Installation & Commissioning', 'Erection, piping, electrical works and commissioning of the biomass boiler.', ${nowTs(-2)}, ${nowTs(12)}, 45, 'IN_PROGRESS', 'Erection complete, piping and electrical works in progress.', NULL, ${nowTs(-2)}, ${nowTs(-1)});`,
	`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
VALUES (${projectId("Biomass Boiler")}, 4, 'Performance Test & Handover', '72-hour performance test, emission measurement and handover of the operating manual.', ${nowTs(12)}, ${nowTs(30)}, 0, 'NOT_STARTED', NULL, NULL, ${nowTs(-2)}, ${nowTs(-2)});`,

	`INSERT INTO milestone_evidence (milestone_id, kind, file_name, file_url, notes, uploaded_at)
VALUES ((SELECT id FROM project_milestones WHERE project_id = ${projectId("Biomass Boiler")} AND step_number = 1), 'document', 'Boiler_House_Engineering_Drawings.pdf', '/documents/boiler-house-drawings.pdf', 'Rev C drawings, stamped by the plant engineer.', ${nowTs(-11)});`,
	`INSERT INTO milestone_evidence (milestone_id, kind, file_name, file_url, notes, uploaded_at)
VALUES ((SELECT id FROM project_milestones WHERE project_id = ${projectId("Biomass Boiler")} AND step_number = 1), 'inspection', 'Site_Survey_Report.pdf', '/documents/site-survey-report.pdf', 'Load and fuel supply survey results.', ${nowTs(-15)});`,
	`INSERT INTO milestone_evidence (milestone_id, kind, file_name, file_url, notes, uploaded_at)
VALUES ((SELECT id FROM project_milestones WHERE project_id = ${projectId("Biomass Boiler")} AND step_number = 2), 'document', 'Factory_Acceptance_Test_Report.pdf', '/documents/fat-report.pdf', 'FAT witnessed at the vendor works.', ${nowTs(-3)});`,

	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, created_at)
VALUES (${projectId("Biomass Boiler")}, ${nowTs(-60)}, ${nowTs(-30)}, 1180000, 1420000, 168.4, 0, '{"evidenceDocs":["MRV_Biomass_2026-07.pdf","Fuel_Log_2026-07.xlsx"]}', ${nowTs(-29)});`,
	`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, created_at)
VALUES (${projectId("Biomass Boiler")}, ${nowTs(-30)}, ${nowTs(0)}, 1145000, 1420000, 192.6, 0, '{"evidenceDocs":["MRV_Biomass_2026-08.pdf"]}', ${nowTs(1)});`,

	`INSERT INTO vendor_portfolio_items (vendor_id, project_name, client_name, project_type, location, description, project_value, duration_months, services_provided, energy_saving_percent, carbon_reduction_tons, completion_year, status, document_name, created_at, updated_at)
VALUES (${VENDOR}, 'Steam Boiler Retrofit', 'PT Maju Bersama', 'Steam & Thermal', 'Sidoarjo', 'Burner retrofit and flue-gas heat recovery on a 10 ton/hour steam boiler.', 1450000000, 7, 'Energy audit, burner retrofit, heat recovery installation, operator training', 18.5, 240, 2023, 'VERIFIED', 'Completion_Report_MajuBersama.pdf', ${nowTs(-300)}, ${nowTs(-300)});`,
	`INSERT INTO vendor_portfolio_items (vendor_id, project_name, client_name, project_type, location, description, project_value, duration_months, services_provided, energy_saving_percent, carbon_reduction_tons, completion_year, status, document_name, created_at, updated_at)
VALUES (${VENDOR}, 'Rooftop Solar PV 300 kWp', 'PT Sinar Abadi', 'Solar PV', 'Gresik', 'Turnkey rooftop solar PV installation with net-metering permit handling.', 3200000000, 5, 'Design, procurement, installation, commissioning, net-metering permit', 24.0, 310, 2024, 'VERIFIED', 'Completion_Report_SinarAbadi.pdf', ${nowTs(-180)}, ${nowTs(-180)});`,
	`INSERT INTO vendor_portfolio_items (vendor_id, project_name, client_name, project_type, location, description, project_value, duration_months, services_provided, energy_saving_percent, carbon_reduction_tons, completion_year, status, document_name, created_at, updated_at)
VALUES (${VENDOR}, 'Compressed Air Leak Program', 'PT Pangan Utama', 'Compressed Air', 'Pasuruan', 'Plant-wide leak survey, repair programme and VSD compressor upgrade.', 860000000, 3, 'Leak survey, repair programme, VSD compressor upgrade', 15.2, 96, 2025, 'COMPLETED', NULL, ${nowTs(-90)}, ${nowTs(-90)});`,

	`INSERT INTO notifications (user_id, type, title, body, read, link, created_at)
VALUES ((SELECT id FROM users WHERE email = 'vendor1@greenshift.dev'), 'negotiation', 'Revision requested on Compressed Air Optimization', 'The company asked for a lower price and a longer warranty on your proposal.', 0, '/vendor/deals', ${nowTs(-6)});`,
	`INSERT INTO notifications (user_id, type, title, body, read, link, created_at)
VALUES ((SELECT id FROM users WHERE email = 'vendor1@greenshift.dev'), 'deadline', 'Tender deadline approaching: Solar Rooftop 500 kWp', 'Your bid can still be revised until the tender closes.', 0, '/vendor/deals', ${nowTs(-2)});`,
	`INSERT INTO notifications (user_id, type, title, body, read, link, created_at)
VALUES ((SELECT id FROM users WHERE email = 'vendor1@greenshift.dev'), 'status_change', 'Proposal accepted: Biomass Boiler', 'PT Green Nusantara accepted your proposal. The project is now in delivery.', 1, '/vendor/projects', ${nowTs(-20)});`,
);

console.log(lines.join("\n"));
