import { buildAccountStatements } from "./accounts";

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
const vendorProfileId = (companyName: string) =>
	`(SELECT id FROM vendor_profiles WHERE company_name = '${companyName}')`;
const BROKER =
	"(SELECT id FROM users WHERE email = 'broker1@greenshift.dev')";
const brokerAssignmentId = (title: string) =>
	`(SELECT id FROM broker_assignments WHERE project_id = ${projectId(title)} AND broker_id = ${BROKER})`;

export interface SeedGroups {
	/** Every statement: accounts, vendor fixtures, bond catalog, broker fixtures. */
	full: string[];
	/** Only the broker-stage fixtures (accounts, assignments, requests, reports). */
	broker: string[];
}

/**
 * Reset preamble for the full set. The fixtures below insert fixed accounts and
 * unique keys, so without this the file only applies to a clean database. The
 * order is children before parents, matching the foreign keys, so it satisfies
 * them at every step.
 *
 * The `broker` group deliberately carries no reset: it is applied on top of an
 * existing database by scripts/setup-broker.ts.
 */
const RESET_TABLES = [
	"audit_logs",
	"blueprints",
	"emission_reports",
	"energy_forecasts",
	"notifications",
	"project_documents",
	"proposal_revisions",
	"risk_assessments",
	"roi_payments",
	"vendor_match_scores",
	"milestone_evidence",
	"negotiations",
	"project_milestones",
	"vendor_portfolio_items",
	"broker_profiles",
	"document_requests",
	"investments",
	"proposals",
	"tenders",
	"vendor_profiles",
	"broker_assignments",
	"projects",
	"users",
];

/** Builds the seed statements. `bun scripts/seed.ts` prints the full set. */
export async function buildSeed(): Promise<SeedGroups> {
	const brokerLines: string[] = [];
	const lines = [
		// The reset below is destructive by design: everything the fixtures own is
		// deleted before it is re-inserted. That is what makes the file re-runnable
		// locally, and it is also why it must never be pointed at a database that
		// holds real accounts or projects.
		"-- GreenShift demo fixtures. Resets the tables it owns, then re-inserts",
		"-- them, so the file is safe to re-run against a local database. It",
		"-- destroys the rows it manages: never load it onto a live database.",
		...RESET_TABLES.map((table) => `DELETE FROM ${table};`),
		...(await buildAccountStatements()),
	];

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

	const verifiedBy = "(SELECT id FROM users WHERE email = 'admin1@greenshift.dev')";

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


	// Broker fixtures. The broker stage starts only after LVV GRK validation and a
	// Company decision, so every assignment below sits on a validated blueprint.
	// broker1 carries one assignment per broker lifecycle stage, the document
	// requests it raised, the risk assessments it reads and the monthly reports it
	// forwards to investors.
	brokerLines.push(
		// vendor profiles for the two vendors that won the broker-stage projects
		`INSERT INTO vendor_profiles (user_id, company_name, description, certifications, portfolio, rating, total_projects, verified_at, created_at)
	SELECT id, 'PT Eco Power Indonesia', 'HVAC and refrigeration efficiency contractor: chiller retrofits, controls, and measurement-based performance contracting.', '["SNI ISO 9001","K3 Certificate","Refrigerant Handling License"]', '["Central chiller retrofit PT Sentra Graha Medika (2024)","Cold storage controls PT Pangan Utama (2025)"]', 4.4, 9, ${nowTs(-120)}, ${nowTs(-120)} FROM users WHERE email = 'vendor2@greenshift.dev';`,
		`INSERT INTO vendor_profiles (user_id, company_name, description, certifications, portfolio, rating, total_projects, verified_at, created_at)
	SELECT id, 'PT Bio Thermal Energy', 'Biomass and waste-heat thermal systems: boiler conversion, feed systems, and emission control equipment.', '["SNI ISO 45001","K3 Certificate","Boiler Operator License"]', '["Biomass boiler 5 MWth PT Agro Industri Nusantara (2026)","Waste heat recovery PT Semen Nusantara (2025)"]', 4.7, 14, ${nowTs(-200)}, ${nowTs(-200)} FROM users WHERE email = 'vendor3@greenshift.dev';`,

		// verified broker profile (self-registered, licence verified by the platform)
		`INSERT INTO broker_profiles (user_id, company_name, description, representative, contact_email, contact_phone, website, address, nib, financial_license_number, license_authority, submitted_at, verified_at, created_at, updated_at)
	SELECT id, 'Capital Green Securities', 'Green bond underwriter and financial intermediary for verified industrial decarbonisation projects.', 'Budi Santoso, CSA', 'budi.santoso@capitalgreen.co.id', '+62 21 5000 1234', 'https://capitalgreen.co.id', 'Financial Club Tower 18th Floor, SCBD, South Jakarta 12190', '9120803410291', 'KEP-45/D.04/2023', 'Financial Services Authority (OJK)', ${nowTs(-60)}, ${nowTs(-59)}, ${nowTs(-60)}, ${nowTs(-60)} FROM users WHERE email = 'broker1@greenshift.dev';`,

		// projects that reached the broker stage
		`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
	VALUES (${BUSINESS}, 'Industrial Waste Heat Recovery', 'Recovery of kiln exhaust heat into the plant steam network with a heat exchanger and automatic bypass control.', 'funding', 1800000000, 'Cilacap', 'cement', 640, 900000, 31, ${nowTs(-30)}, ${nowTs(-3)});`,
		`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
	VALUES (${BUSINESS}, 'Cold Storage Efficiency Retrofit', 'Retrofit of the cold storage refrigeration plant: high-efficiency compressors, electronic expansion valves and control optimisation.', 'funding', 950000000, 'Bekasi', 'cold chain & logistics', 240, 380000, 26, ${nowTs(-40)}, ${nowTs(-25)});`,
		`UPDATE projects SET status = 'monitoring' WHERE id = ${projectId("Biomass Boiler")};`,

		// LVV GRK validated blueprints (validation precedes the broker stage)
		`INSERT INTO blueprints (project_id, status, document, validated_at, created_at, updated_at)
	VALUES (${projectId("Biomass Boiler")}, 'validated', '{"financialProjections":{"npv":520000000,"irr":16.5,"paybackPeriod":4}}', ${nowTs(-22)}, ${nowTs(-24)}, ${nowTs(-22)});`,
		`INSERT INTO blueprints (project_id, status, document, validated_at, created_at, updated_at)
	VALUES (${projectId("Industrial Waste Heat Recovery")}, 'validated', '{"financialProjections":{"npv":412000000,"irr":14.8,"paybackPeriod":4}}', ${nowTs(-20)}, ${nowTs(-22)}, ${nowTs(-20)});`,
		`INSERT INTO blueprints (project_id, status, document, validated_at, created_at, updated_at)
	VALUES (${projectId("Cold Storage Efficiency Retrofit")}, 'validated', '{"financialProjections":{"npv":186000000,"irr":13.2,"paybackPeriod":4}}', ${nowTs(-34)}, ${nowTs(-36)}, ${nowTs(-34)});`,

		// awarded tenders and the accepted proposals behind each assignment
		`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, 'closed', 'closed', 400000000, 520000000, ${nowTs(-70)}, ${nowTs(-90)}, ${nowTs(-70)});`,
		`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
	VALUES (${projectId("Electric Motor Efficiency")}, 'closed', 'closed', 240000000, 320000000, ${nowTs(-100)}, ${nowTs(-120)}, ${nowTs(-100)});`,
		`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
	VALUES (${projectId("Industrial Waste Heat Recovery")}, 'closed', 'closed', 1500000000, 1900000000, ${nowTs(-25)}, ${nowTs(-40)}, ${nowTs(-25)});`,
		`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
	VALUES (${projectId("Cold Storage Efficiency Retrofit")}, 'closed', 'closed', 800000000, 1000000000, ${nowTs(-35)}, ${nowTs(-50)}, ${nowTs(-35)});`,

		`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, reviewed_at, created_at, updated_at)
	VALUES (${tenderId("Factory Chiller Retrofit")}, ${vendorProfileId("PT Eco Power Indonesia")}, 480000000, 'Magnetic bearing chiller, variable primary flow, plant controller with kW/ton optimisation.', 24000000, 12.5, 36, 'accepted', 0, ${nowTs(-66)}, ${nowTs(-52)}, ${nowTs(-66)}, ${nowTs(-52)});`,
		`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, reviewed_at, created_at, updated_at)
	VALUES (${tenderId("Electric Motor Efficiency")}, ${vendorProfileId("PT Bio Thermal Energy")}, 290000000, 'IE3 premium efficiency motors with variable speed drives on the main process lines.', 14000000, 16, 24, 'accepted', 0, ${nowTs(-96)}, ${nowTs(-84)}, ${nowTs(-96)}, ${nowTs(-84)});`,
		`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, reviewed_at, created_at, updated_at)
	VALUES (${tenderId("Industrial Waste Heat Recovery")}, ${vendorProfileId("PT Bio Thermal Energy")}, 1750000000, 'Kiln exhaust heat exchanger, steam drum, automatic bypass and insulation works.', 95000000, 14, 36, 'accepted', 0, ${nowTs(-21)}, ${nowTs(-8)}, ${nowTs(-21)}, ${nowTs(-8)});`,
		`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, reviewed_at, created_at, updated_at)
	VALUES (${tenderId("Cold Storage Efficiency Retrofit")}, ${vendorProfileId("PT Eco Power Indonesia")}, 930000000, 'Screw compressor retrofit, electronic expansion valves, CO2 monitoring and control optimisation.', 48000000, 13, 30, 'accepted', 0, ${nowTs(-31)}, ${nowTs(-26)}, ${nowTs(-31)}, ${nowTs(-26)});`,
		`UPDATE tenders SET status = 'awarded', awarded_proposal_id = (SELECT id FROM proposals WHERE tender_id = tenders.id)
	WHERE project_id IN (${projectId("Factory Chiller Retrofit")}, ${projectId("Electric Motor Efficiency")}, ${projectId("Industrial Waste Heat Recovery")}, ${projectId("Cold Storage Efficiency Retrofit")});`,

		// official risk assessments (read-only for the broker)
		`INSERT INTO risk_assessments (project_id, financial_score, technical_score, implementation_score, environmental_score, overall_score, recommendations, notes, assessed_by, assessed_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, 42, 30, 44, 26, 36, '["Stage the retrofit outside the peak cooling season","Hold a spare compressor on site"]', 'Financial risk follows the tenant occupancy profile of the facility; the technical baseline is metered and verified. Anomaly detection flagged the latest reporting period.', 'system', ${nowTs(-75)});`,
		`INSERT INTO risk_assessments (project_id, financial_score, technical_score, implementation_score, environmental_score, overall_score, recommendations, notes, assessed_by, assessed_at)
	VALUES (${projectId("Electric Motor Efficiency")}, 22, 24, 38, 18, 26, '["Sequence motor replacements per production line"]', 'Mature technology with predictable savings and a short delivery window.', 'system', ${nowTs(-105)});`,
		`INSERT INTO risk_assessments (project_id, financial_score, technical_score, implementation_score, environmental_score, overall_score, recommendations, notes, assessed_by, assessed_at)
	VALUES (${projectId("Biomass Boiler")}, 34, 28, 46, 31, 35, '["Secure a long-term feedstock supply contract","Schedule the performance test before handover"]', 'Feedstock supply and commissioning schedule drive the residual risk; emission measurement methodology was validated.', 'system', ${nowTs(-26)});`,
		`INSERT INTO risk_assessments (project_id, financial_score, technical_score, implementation_score, environmental_score, overall_score, recommendations, notes, assessed_by, assessed_at)
	VALUES (${projectId("Industrial Waste Heat Recovery")}, 38, 32, 41, 27, 35, '["Confirm kiln shutdown windows before installation"]', 'Heat recovery depends on kiln uptime; the baseline is derived from continuous stack measurements.', 'system', ${nowTs(-18)});`,
		`INSERT INTO risk_assessments (project_id, financial_score, technical_score, implementation_score, environmental_score, overall_score, recommendations, notes, assessed_by, assessed_at)
	VALUES (${projectId("Cold Storage Efficiency Retrofit")}, 30, 26, 36, 22, 29, '["Retrofit one cold room at a time to protect stock"]', 'Refrigeration load is stable and well metered; the retrofit is executed in stages.', 'system', ${nowTs(-30)});`,

		// broker assignments: one per lifecycle stage
		`INSERT INTO broker_assignments (project_id, broker_id, company_id, status, assigned_at, responded_at, bond_status, bond_amount, tenor_months, coupon_rate_percent, issuance_date, maturity_date, created_at, updated_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, ${BROKER}, ${BUSINESS}, 'UNDER_REVIEW', ${nowTs(-40)}, ${nowTs(-38)}, 'IN_PROGRESS', 480000000, 36, 8.5, ${nowTs(13)}, ${nowTs(1110)}, ${nowTs(-40)}, ${nowTs(-6)});`,
		`INSERT INTO broker_assignments (project_id, broker_id, company_id, status, assigned_at, responded_at, bond_status, bond_amount, tenor_months, coupon_rate_percent, issuance_date, maturity_date, created_at, updated_at)
	VALUES (${projectId("Electric Motor Efficiency")}, ${BROKER}, ${BUSINESS}, 'READY_FOR_BOND_ISSUANCE', ${nowTs(-70)}, ${nowTs(-68)}, 'IN_PROGRESS', 290000000, 24, 8.25, ${nowTs(7)}, ${nowTs(740)}, ${nowTs(-70)}, ${nowTs(-9)});`,
		`INSERT INTO broker_assignments (project_id, broker_id, company_id, status, assigned_at, responded_at, bond_status, bond_serial_number, bond_amount, tenor_months, coupon_rate_percent, issuance_date, maturity_date, created_at, updated_at)
	VALUES (${projectId("Biomass Boiler")}, ${BROKER}, ${BUSINESS}, 'MONITORING', ${nowTs(-95)}, ${nowTs(-93)}, 'ISSUED', 'GS-BND-2026-004', 2100000000, 48, 9, ${nowTs(-34)}, ${nowTs(-34)}, ${nowTs(-95)}, ${nowTs(-34)});`,
		`INSERT INTO broker_assignments (project_id, broker_id, company_id, status, assigned_at, created_at, updated_at)
	VALUES (${projectId("Industrial Waste Heat Recovery")}, ${BROKER}, ${BUSINESS}, 'ASSIGNED', ${nowTs(-3)}, ${nowTs(-3)}, ${nowTs(-3)});`,
		`INSERT INTO broker_assignments (project_id, broker_id, company_id, status, decline_reason, assigned_at, responded_at, created_at, updated_at)
	VALUES (${projectId("Cold Storage Efficiency Retrofit")}, ${BROKER}, ${BUSINESS}, 'DECLINED', 'The feedstock and off-take contract structure for this facility does not meet our underwriting requirements at this tenor.', ${nowTs(-25)}, ${nowTs(-24)}, ${nowTs(-25)}, ${nowTs(-24)});`,

		// delivery milestones behind the reported progress
		`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, 1, 'Cooling Load Audit & Design', 'Metered cooling load audit, plant room layout and stamped design drawings.', ${nowTs(-38)}, ${nowTs(-30)}, 100, 'APPROVED', 'Audit report and Rev B drawings issued.', 'Approved by the facility engineer.', ${nowTs(-38)}, ${nowTs(-30)});`,
		`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, 2, 'Chiller & Controls Procurement', 'Chiller, pumps and plant controller procurement with factory tests.', ${nowTs(-30)}, ${nowTs(-16)}, 100, 'APPROVED', 'Factory test reports attached.', 'Accepted.', ${nowTs(-30)}, ${nowTs(-16)});`,
		`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, 3, 'Installation & Commissioning', 'Chiller replacement, piping, controls integration and commissioning.', ${nowTs(-16)}, ${nowTs(14)}, 45, 'IN_PROGRESS', 'Chiller set in place; piping and control wiring in progress.', NULL, ${nowTs(-16)}, ${nowTs(-5)});`,
		`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId("Electric Motor Efficiency")}, 1, 'Motor Inventory & Verification', 'Nameplate survey of the process motors and verification against the audit list.', ${nowTs(-68)}, ${nowTs(-50)}, 100, 'APPROVED', 'Survey report with 42 motors verified.', 'Approved.', ${nowTs(-68)}, ${nowTs(-50)});`,
		`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId("Electric Motor Efficiency")}, 2, 'Motor & VSD Replacement', 'Progressive replacement of motors and installation of variable speed drives.', ${nowTs(-50)}, ${nowTs(-10)}, 60, 'IN_PROGRESS', 'Line 1 and 2 complete; line 3 scheduled for the next shutdown.', NULL, ${nowTs(-50)}, ${nowTs(-8)});`,

		// document requests across the lifecycle (§18)
		`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, additional_notes, status, submitted_file_name, submitted_file_url, submitted_at, created_at, updated_at)
	VALUES (${brokerAssignmentId("Factory Chiller Retrofit")}, ${projectId("Factory Chiller Retrofit")}, ${BROKER}, ${BUSINESS}, 'Financial', 'Audited Financial Statements', '2025 (Full Year)', 'Required for solvency ratio analysis and bond underwriting preparation.', ${nowTs(-12)}, 'Please include the independent auditor opinion.', 'SUBMITTED', 'Audited_Financial_Statements_2025.pdf', '/documents/audited-financial-statements-2025.pdf', ${nowTs(-14)}, ${nowTs(-24)}, ${nowTs(-14)});`,
		`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, additional_notes, status, created_at, updated_at)
	VALUES (${brokerAssignmentId("Factory Chiller Retrofit")}, ${projectId("Factory Chiller Retrofit")}, ${BROKER}, ${BUSINESS}, 'Legal', 'Company Deed & Business License (NIB)', 'Current', 'Verification of the borrowing entity and its registered business scope.', ${nowTs(5)}, 'Certified copies are sufficient.', 'REQUESTED', ${nowTs(-6)}, ${nowTs(-6)});`,
		`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, status, submitted_file_name, submitted_file_url, submitted_at, created_at, updated_at)
	VALUES (${brokerAssignmentId("Electric Motor Efficiency")}, ${projectId("Electric Motor Efficiency")}, ${BROKER}, ${BUSINESS}, 'Technical', 'Motor & VSD Warranty Certificate', '5-Year Warranty', 'Verification of equipment warranty supporting the operational cash flow assumptions.', ${nowTs(-20)}, 'UNDER_REVIEW', 'IE3_Motor_VSD_Warranty.pdf', '/documents/ie3-motor-vsd-warranty.pdf', ${nowTs(-22)}, ${nowTs(-30)}, ${nowTs(-22)});`,
		`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, status, submitted_file_name, submitted_file_url, submitted_at, reviewed_at, rejection_reason, created_at, updated_at)
	VALUES (${brokerAssignmentId("Electric Motor Efficiency")}, ${projectId("Electric Motor Efficiency")}, ${BROKER}, ${BUSINESS}, 'Project', 'Project Budget Breakdown per Work Package', '2026', 'Budget breakdown per milestone is required to structure the bond cash flows.', ${nowTs(-30)}, 'RESUBMISSION', 'Project_Budget_Breakdown_v1.pdf', '/documents/project-budget-breakdown-v1.pdf', ${nowTs(-33)}, ${nowTs(-28)}, 'The submitted budget does not break the spending down per work package, so the cash flow schedule cannot be structured. Please resubmit with a per-milestone breakdown.', ${nowTs(-36)}, ${nowTs(-28)});`,
		`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, status, submitted_file_name, submitted_file_url, submitted_at, reviewed_at, created_at, updated_at)
	VALUES (${brokerAssignmentId("Biomass Boiler")}, ${projectId("Biomass Boiler")}, ${BROKER}, ${BUSINESS}, 'Legal', 'Environmental Permit (UKL-UPL)', '2026-2031', 'Environmental compliance evidence for the bond information memorandum.', ${nowTs(-50)}, 'APPROVED', 'Environmental_Permit_UKL_UPL.pdf', '/documents/environmental-permit.pdf', ${nowTs(-56)}, ${nowTs(-54)}, ${nowTs(-60)}, ${nowTs(-54)});`,

		// official report payloads for the latest period of each monitored project
		`UPDATE emission_reports SET report_data = '{"plannedBudgetAmount":420000000,"actualSpendingAmount":441000000,"expectedEnergySavingsKwh":10500,"expectedCarbonReductionTons":8.0,"projectedRoiPercent":12.5,"actualRoiPerformancePercent":9.1,"overallStatus":"AT_RISK","detectedRisksOrAnomalies":["Measured savings are 6.3% against a planned 8.2% for the period.","Cooling load rose after the production line addition, pushing consumption above the baseline expectation."],"overallConclusion":"Progress is behind plan and measured savings are below the project assumption. Corrective action is required before the performance test."}' WHERE id = (SELECT max(id) FROM emission_reports WHERE project_id = ${projectId("Factory Chiller Retrofit")});`,
		`UPDATE emission_reports SET report_data = '{"plannedBudgetAmount":180000000,"actualSpendingAmount":168000000,"expectedEnergySavingsKwh":21000,"expectedCarbonReductionTons":14.8,"projectedRoiPercent":16,"actualRoiPerformancePercent":17.2,"overallStatus":"ON_TRACK","detectedRisksOrAnomalies":[],"overallConclusion":"Motor replacement is ahead of the planned spend and measured savings are in line with the audit estimate."}' WHERE id = (SELECT max(id) FROM emission_reports WHERE project_id = ${projectId("Electric Motor Efficiency")});`,
		`UPDATE emission_reports SET report_data = '{"evidenceDocs":["MRV_Biomass_2026-08.pdf"],"plannedBudgetAmount":1050000000,"actualSpendingAmount":1012000000,"expectedEnergySavingsKwh":275000,"expectedCarbonReductionTons":192.6,"projectedRoiPercent":16.5,"actualRoiPerformancePercent":17.1,"overallStatus":"ON_TRACK","detectedRisksOrAnomalies":[],"overallConclusion":"Erection is complete and commissioning is under way; measured emission reduction matches the validated baseline."}' WHERE id = (SELECT max(id) FROM emission_reports WHERE project_id = ${projectId("Biomass Boiler")});`,

		// project documents already on file (read-only for the broker)
		`INSERT INTO project_documents (project_id, type, file_name, file_url, ocr_status, extracted_data, uploaded_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, 'utility_bill', 'PLN_Utility_Bill_2025_Q4.pdf', '/documents/pln-utility-bill-2025-q4.pdf', 'done', '{"totalKwh":120000,"monthlyCost":108000000,"billingPeriod":"2025-Q4","facilityName":"Sidoarjo plant"}', ${nowTs(-110)});`,
		`INSERT INTO project_documents (project_id, type, file_name, file_url, ocr_status, extracted_data, uploaded_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, 'audit_report', 'Energy_Audit_Report_2025.pdf', '/documents/energy-audit-report-2025.pdf', 'done', '{"billingPeriod":"2025","facilityName":"Sidoarjo plant"}', ${nowTs(-100)});`,
		`INSERT INTO project_documents (project_id, type, file_name, file_url, ocr_status, uploaded_at)
	VALUES (${projectId("Biomass Boiler")}, 'utility_bill', 'Coal_Consumption_Log_2025.pdf', '/documents/coal-consumption-log-2025.pdf', 'done', ${nowTs(-90)});`,

		// broker notifications (§38)
		`INSERT INTO notifications (user_id, type, title, body, read, link, created_at)
	VALUES (${BROKER}, 'assignment', 'New project assigned: Industrial Waste Heat Recovery', 'PT Green Nusantara assigned a validated project to you. Accept, request information, or decline with a reason.', 0, '/broker/projects', ${nowTs(-3)});`,
		`INSERT INTO notifications (user_id, type, title, body, read, link, created_at)
	VALUES (${BROKER}, 'documents', 'Document received: Audited Financial Statements', 'PT Green Nusantara uploaded the 2025 audited financial statements for Factory Chiller Retrofit.', 0, '/broker/document-requests', ${nowTs(-14)});`,
		`INSERT INTO notifications (user_id, type, title, body, read, link, created_at)
	VALUES (${BROKER}, 'reporting', 'Monthly report available: Factory Chiller Retrofit', 'The latest monitoring report is published with status ATTENTION REQUIRED. Review it before the next investor update.', 0, '/broker/monthly-reports', ${nowTs(-5)});`,
		`INSERT INTO notifications (user_id, type, title, body, read, link, created_at)
	VALUES (${BROKER}, 'documents', 'Resubmission required: Project Budget Breakdown', 'The budget breakdown for Electric Motor Efficiency was returned with a reason.', 1, '/broker/document-requests', ${nowTs(-28)});`,
		`INSERT INTO notifications (user_id, type, title, body, read, link, created_at)
	VALUES (${BROKER}, 'bond', 'Bond issued: Biomass Boiler', 'The external issuance for Biomass Boiler is recorded as issued (GS-BND-2026-004).', 1, '/broker/projects', ${nowTs(-34)});`,
	);

	// Keep the broker group in the full output as well, in order.
	lines.push(...brokerLines);

	// Then bring every other list up to the floor of five rows.
	lines.push(...buildVolumeFixtures());

	// Audit trail. The admin Audit Log page reads this table, so the demo carries
	// the decisions behind the fixtures above rather than an empty page. Actions
	// and actors are the ones the modules themselves write, and every entry
	// lands after the row it references.
	const actor = (email: string) =>
		`(SELECT id FROM users WHERE email = '${email}')`;
	const ADMIN = actor("admin1@greenshift.dev");
	const VENDOR1 = actor("vendor1@greenshift.dev");

	lines.push(
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Textile Factory Retrofit")}, ${BUSINESS}, 'project.status_changed', 'project', ${projectId("Textile Factory Retrofit")}, '{"from":"draft","to":"tendering"}', ${nowTs(-45)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, ${ADMIN}, 'blueprint.status_changed', 'blueprint', (SELECT id FROM blueprints WHERE project_id = ${projectId("Factory Chiller Retrofit")}), '{"to":"published"}', ${nowTs(-112)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, ${ADMIN}, 'user.verified', 'user', ${BUSINESS}, '{"role":"business"}', ${nowTs(-40)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Solar Rooftop 500 kWp")}, ${VENDOR1}, 'vendor.verified', 'vendor_profile', ${VENDOR}, '{"companyName":"EcoTech Solutions"}', ${nowTs(-30)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Solar Rooftop 500 kWp")}, ${VENDOR1}, 'vendor.profile_updated', 'vendor_profile', ${VENDOR}, '{"companyName":"EcoTech Solutions"}', ${nowTs(-30)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Solar Rooftop 500 kWp")}, ${VENDOR1}, 'proposal.submitted', 'proposal', (SELECT id FROM proposals WHERE tender_id = ${tenderId("Solar Rooftop 500 kWp")}), '{"amount":850000000}', ${nowTs(-5)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, ${BUSINESS}, 'proposal.submitted', 'proposal', (SELECT id FROM proposals WHERE tender_id = ${tenderId("Factory Chiller Retrofit")}), '{"amount":480000000}', ${nowTs(-66)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Industrial Waste Heat Recovery")}, ${ADMIN}, 'project.status_changed', 'project', ${projectId("Industrial Waste Heat Recovery")}, '{"from":"tendering","to":"funding"}', ${nowTs(-20)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Biomass Boiler")}, ${ADMIN}, 'blueprint.status_changed', 'blueprint', (SELECT id FROM blueprints WHERE project_id = ${projectId("Biomass Boiler")}), '{"to":"validated"}', ${nowTs(-22)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, ${BROKER}, 'broker.assignment_accepted', 'broker_assignment', ${brokerAssignmentId("Factory Chiller Retrofit")}, NULL, ${nowTs(-38)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Factory Chiller Retrofit")}, ${BROKER}, 'broker.document_requested', 'document_request', (SELECT id FROM document_requests WHERE document_type_name = 'Audited Financial Statements'), '{"documentTypeName":"Audited Financial Statements"}', ${nowTs(-24)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Cold Storage Efficiency Retrofit")}, ${BROKER}, 'broker.assignment_declined', 'broker_assignment', ${brokerAssignmentId("Cold Storage Efficiency Retrofit")}, '{"reason":"Underwriting requirements not met at this tenor."}', ${nowTs(-24)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Biomass Boiler")}, ${BROKER}, 'broker.bond_status_updated', 'broker_assignment', ${brokerAssignmentId("Biomass Boiler")}, '{"from":"IN_PROGRESS","to":"ISSUED"}', ${nowTs(-34)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Biomass Boiler")}, ${BROKER}, 'milestone.evidence.uploaded', 'milestone_evidence', (SELECT id FROM milestone_evidence WHERE file_name = 'Factory_Acceptance_Test_Report.pdf'), '{"milestoneId":2,"fileName":"Factory_Acceptance_Test_Report.pdf"}', ${nowTs(-3)});`,
		`INSERT INTO audit_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
	VALUES (${projectId("Biomass Boiler")}, ${ADMIN}, 'project.status_changed', 'project', ${projectId("Biomass Boiler")}, '{"from":"funding","to":"monitoring"}', ${nowTs(-3)});`,
	);

	return { full: lines, broker: brokerLines };
}

/** Every list a signed-in role can open carries at least this many rows. */
const ROW_FLOOR = 5;

const MEASURES = [
	"Boiler Retrofit",
	"Solar Rooftop PV",
	"Chiller Replacement",
	"LED Relamping",
	"Compressed Air Upgrade",
	"Waste Heat Recovery",
	"Motor Efficiency",
	"Biomass Conversion",
];
const CITIES = [
	"Cilacap",
	"Bekasi",
	"Karawang",
	"Sidoarjo",
	"Gresik",
	"Malang",
	"Pasuruan",
	"Surabaya",
	"Semarang",
	"Tangerang",
];
const SECTORS = [
	"textile",
	"manufacturing",
	"food & beverage",
	"chemical",
	"paper",
	"cement",
	"base metals",
	"cold chain & logistics",
];
const BUSINESS_EMAILS = [
	"business1",
	"business2",
	"business3",
	"business4",
	"business5",
];
const VENDOR_EMAILS = ["vendor1", "vendor2", "vendor3", "vendor4", "vendor5"];
const BROKER_EMAILS = ["broker1", "broker2", "broker3", "broker4", "broker5"];
const INVESTOR_EMAILS = [
	"investor1",
	"investor2",
	"investor3",
	"investor4",
	"investor5",
];
const VENDOR_COMPANIES = [
	"EcoTech Solutions",
	"PT Eco Power Indonesia",
	"PT Bio Thermal Energy",
	"PT Solar Cipta Energi",
	"PT Efisiensi Mesin Nusantara",
];

/**
 * Indices whose measures give the five discovery tenders one distinct vendor
 * speciality each (boiler, solar, chiller, motor, biomass), so every vendor has
 * a top-ranked opportunity on its own Discover page.
 */
const DISCOVERY_INDICES = [0, 1, 2, 6, 7] as const;

const userByEmail = (email: string) =>
	`(SELECT id FROM users WHERE email = '${email}@greenshift.dev')`;

/**
 * Title of the nth generated project. The title repeats once n%8 and n%10
 * repeat together, i.e. every 40 values, so callers must keep their indices
 * inside one 40-wide band: 0-4 for the discovery tenders and 10-34 for the
 * broker stage. The uniqueness guard below enforces that.
 */
const generatedTitle = (n: number) =>
	`${MEASURES[n % MEASURES.length]}, ${CITIES[n % CITIES.length]} Plant`;

/** The fixture lookups find a project, a tender and a vendor by name, so a
 * repeated title would silently point two statements at the same row. */
const usedTitles = new Set<string>();

function claimTitle(n: number): string {
	const title = generatedTitle(n);
	if (usedTitles.has(title)) {
		throw new Error(`duplicate generated project title: ${title}`);
	}
	usedTitles.add(title);
	return title;
}

/** A project carries exactly one broker assignment, so this lookup is unique. */
const assignmentIdFor = (title: string) =>
	`(SELECT id FROM broker_assignments WHERE project_id = ${projectId(title)})`;

/**
 * Volume fixtures. The statements in `buildSeed` above tell the curated demo
 * story; this block fills the remaining lists a signed-in role can open: vendor
 * discovery, deals, negotiations, portfolio and notification feed; broker
 * assignments, document requests and reports; admin users, vendors and audit
 * log; and the public bond catalog, so none of them renders an empty state.
 *
 * Everything here is generated from the small tables above rather than hand
 * written, because the only requirement is that each list reaches ROW_FLOOR.
 */
function buildVolumeFixtures(): string[] {
	const out: string[] = [];

	// ── vendor profiles beyond the story fixtures ─────────────
	for (const v of [
		{
			email: "vendor4",
			company: "PT Solar Cipta Energi",
			description:
				"Solar PV engineering, procurement and construction for rooftop and ground-mount systems, including net-metering permits.",
			certifications: '["SNI ISO 9001","K3 Certificate","IUPTLU Solar"]',
			portfolio:
				'["Rooftop solar 500 kWp PT Tekstil Jaya (2025)","Ground-mount 1 MWp PT Sawit Lestari (2024)"]',
			rating: 4.3,
			total: 7,
		},
		{
			email: "vendor5",
			company: "PT Efisiensi Mesin Nusantara",
			description:
				"Industrial motor and drive efficiency specialist: energy audits, IE3 retrofits and variable speed drive integration.",
			certifications: '["SNI ISO 50001","K3 Certificate"]',
			portfolio:
				'["IE3 motor retrofit PT Kertas Nusantara (2025)","VSD integration PT Baja Prima (2024)"]',
			rating: 4.1,
			total: 5,
		},
	]) {
		out.push(
			`INSERT INTO vendor_profiles (user_id, company_name, description, certifications, portfolio, rating, total_projects, verified_at, created_at)
	SELECT id, '${v.company}', '${v.description}', '${v.certifications}', '${v.portfolio}', ${v.rating}, ${v.total}, ${nowTs(-150)}, ${nowTs(-150)} FROM users WHERE email = '${v.email}@greenshift.dev';`,
		);
	}

	// ── broker profiles beyond broker1 ───────────────────────
	for (const b of [
		{
			email: "broker2",
			company: "Nusantara Sekuritas Hijau",
			rep: "Rina Kusuma, CSA",
			domain: "nusantarasekuritas.co.id",
			nib: "9120803410292",
			license: "KEP-46/D.04/2023",
		},
		{
			email: "broker3",
			company: "Mitra Obligasi Indonesia",
			rep: "Hendra Gunawan, CSA",
			domain: "mitraobligasi.co.id",
			nib: "9120803410293",
			license: "KEP-47/D.04/2023",
		},
		{
			email: "broker4",
			company: "Pacific Sustainable Capital",
			rep: "Maria Tanuwijaya, CSA",
			domain: "pacificsustainable.co.id",
			nib: "9120803410294",
			license: "KEP-48/D.04/2023",
		},
		{
			email: "broker5",
			company: "Graha Green Underwriters",
			rep: "Yusuf Maulana, CSA",
			domain: "grahagreen.co.id",
			nib: "9120803410295",
			license: "KEP-49/D.04/2023",
		},
	]) {
		out.push(
			`INSERT INTO broker_profiles (user_id, company_name, description, representative, contact_email, contact_phone, website, address, nib, financial_license_number, license_authority, submitted_at, verified_at, created_at, updated_at)
	SELECT id, '${b.company}', 'Green bond underwriter and financial intermediary for verified industrial decarbonisation projects.', '${b.rep}', 'contact@${b.domain}', '+62 21 5000 1200', 'https://${b.domain}', 'Jakarta, Indonesia', '${b.nib}', '${b.license}', 'Financial Services Authority (OJK)', ${nowTs(-60)}, ${nowTs(-59)}, ${nowTs(-60)}, ${nowTs(-60)} FROM users WHERE email = '${b.email}@greenshift.dev';`,
		);
	}

	// ── vendor discovery: open tenders with a live negotiation ─
	// Five open tenders carry vendor1 bids in negotiation, so Discover and the
	// negotiation inbox are populated without disturbing the bid-free tender the
	// story fixtures keep for the submit-and-conflict demo.
	for (const n of DISCOVERY_INDICES) {
		const title = claimTitle(n);
		const budget = 400000000 + n * 150000000;
		const bid = Math.round(budget * 0.88);

		out.push(
			`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
	VALUES (${userByEmail(BUSINESS_EMAILS[n % BUSINESS_EMAILS.length])}, '${title}', '${MEASURES[n % MEASURES.length]} at the ${CITIES[n % CITIES.length]} plant, covering design, equipment supply, installation and commissioning.', 'tendering', ${budget}, '${CITIES[n % CITIES.length]}', '${SECTORS[n % SECTORS.length]}', ${120 + n * 25}, ${200000 + n * 40000}, ${20 + (n % 5) * 4}, ${nowTs(-22 - n)}, ${nowTs(-22 - n)});`,
			`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
	VALUES (${projectId(title)}, 'open', 'open', ${Math.round(budget * 0.7)}, ${budget}, ${nowTs(9 + n)}, ${nowTs(-22 - n)}, ${nowTs(-22 - n)});`,
			`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, created_at, updated_at)
	VALUES (${tenderId(title)}, ${vendorProfileId("EcoTech Solutions")}, ${bid}, 'Detailed engineering, equipment supply, installation and commissioning with performance verification against the agreed baseline.', ${Math.round(budget * 0.06)}, ${13 + (n % 4)}, ${24 + (n % 3) * 12}, 'submitted', 1, ${nowTs(-9 - n)}, ${nowTs(-9 - n)}, ${nowTs(-9 - n)});`,
			`INSERT INTO proposal_revisions (proposal_id, revision_number, note, amount, previous_amount, created_by, created_at)
	VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId(title)}), 1, 'Please confirm the equipment list and the delivery schedule against the tender scope.', ${bid}, NULL, 'company', ${nowTs(-6 - n)});`,
			`INSERT INTO negotiations (proposal_id, iteration_number, status, requested_price_reduction, requested_warranty_years, requested_timeline_months, requested_fields, company_note, created_at, updated_at)
	VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId(title)}), 1, 'PENDING_VENDOR_RESPONSE', ${Math.round(budget * 0.03)}, 36, 6, '["Total Project Price","Unit & Service Warranty Period","Implementation Timeline"]', 'The board requires a longer warranty and a tighter implementation timeline for this package. Please revise the offer.', ${nowTs(-6 - n)}, ${nowTs(-6 - n)});`,
		);
	}

	// ── broker stage: five assignments for each broker ────────
	// Each generated project carries the full chain the broker and admin
	// surfaces read: a validated or published blueprint, an awarded tender, an
	// accepted proposal, a risk assessment, an assignment, monthly MRV reports,
	// delivery milestones and a document request.
	const STAGE_PROJECTS = ROW_FLOOR * ROW_FLOOR;
	for (let j = 0; j < STAGE_PROJECTS; j++) {
		const n = 10 + j;
		const title = claimTitle(n);
		const city = CITIES[n % CITIES.length];
		const sector = SECTORS[n % SECTORS.length];
		const budget = 600000000 + (j % 7) * 250000000;
		const company = userByEmail(
			BUSINESS_EMAILS[j % BUSINESS_EMAILS.length] as string,
		);
		const vendor = vendorProfileId(
			VENDOR_COMPANIES[j % VENDOR_COMPANIES.length] as string,
		);
		const broker = userByEmail(
			BROKER_EMAILS[Math.floor(j / ROW_FLOOR)] as string,
		);
		const cost = Math.round(budget * 0.85);
		// The first ten carry a published blueprint, which is what the public
		// catalog reads as "verified"; the rest stay in progress.
		const published = j < 10;
		const irr = 12 + (j % 6);

		out.push(
			`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, target_emission_reduction, estimated_energy_saving, risk_score, created_at, updated_at)
	VALUES (${company}, '${title}', '${MEASURES[n % MEASURES.length]} at the ${city} plant, delivered as a performance-verified retrofit with metered reporting.', 'monitoring', ${budget}, '${city}', '${sector}', ${150 + (j % 8) * 40}, ${240000 + (j % 9) * 55000}, ${18 + (j % 6) * 4}, ${nowTs(-70 - (j % 20))}, ${nowTs(-5 - (j % 4))});`,
			`INSERT INTO blueprints (project_id, status, document, validated_at, published_at, created_at, updated_at)
	VALUES (${projectId(title)}, '${published ? "published" : "validated"}', '{"financialProjections":{"npv":${budget / 12},"irr":${irr},"paybackPeriod":4}}', ${nowTs(-40)}, ${published ? nowTs(-36) : "NULL"}, ${nowTs(-42)}, ${nowTs(-36)});`,
			`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
	VALUES (${projectId(title)}, 'closed', 'closed', ${Math.round(budget * 0.75)}, ${budget}, ${nowTs(-32)}, ${nowTs(-48)}, ${nowTs(-32)});`,
			`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, reviewed_at, created_at, updated_at)
	VALUES (${tenderId(title)}, ${vendor}, ${cost}, 'Turnkey delivery: detailed engineering, equipment supply, installation, commissioning and performance verification.', ${Math.round(budget * 0.05)}, ${irr}, 36, 'accepted', 0, ${nowTs(-30)}, ${nowTs(-24)}, ${nowTs(-30)}, ${nowTs(-24)});`,
			`UPDATE tenders SET status = 'awarded', awarded_proposal_id = (SELECT id FROM proposals WHERE tender_id = tenders.id) WHERE project_id = ${projectId(title)};`,
			`INSERT INTO risk_assessments (project_id, financial_score, technical_score, implementation_score, environmental_score, overall_score, recommendations, notes, assessed_by, assessed_at)
	VALUES (${projectId(title)}, ${20 + (j % 5) * 4}, ${24 + (j % 4) * 3}, ${30 + (j % 6) * 4}, ${18 + (j % 5) * 3}, ${24 + (j % 5) * 3}, '["Confirm the shutdown window before installation","Agree the metering boundary before commissioning"]', 'Financial, technical, implementation and environmental scores follow the platform model; the baseline is metered and verified.', 'system', ${nowTs(-26)});`,
			`INSERT INTO broker_assignments (project_id, broker_id, company_id, status, assigned_at, responded_at, bond_status, bond_serial_number, bond_amount, tenor_months, coupon_rate_percent, issuance_date, maturity_date, created_at, updated_at)
	VALUES (${projectId(title)}, ${broker}, ${company}, 'MONITORING', ${nowTs(-22)}, ${nowTs(-20)}, 'ISSUED', 'GS-BND-2026-1${String(j).padStart(2, "0")}', ${cost}, 36, ${7.5 + (j % 4) * 0.5}, ${nowTs(-18)}, ${nowTs(-18 + 1095)}, ${nowTs(-22)}, ${nowTs(-18)});`,
			`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, status, submitted_file_name, submitted_file_url, submitted_at, created_at, updated_at)
	VALUES (${assignmentIdFor(title)}, ${projectId(title)}, ${broker}, ${company}, '${["Financial", "Technical", "Legal", "Project"][j % 4]}', '${["Audited Financial Statements", "Operation & Maintenance Plan", "Company Deed & Business License (NIB)", "Project Budget Breakdown per Work Package"][j % 4]}', '2026', 'Required for the information memorandum and the ongoing monitoring obligation.', ${nowTs(-10)}, 'APPROVED', 'Monitoring_Pack_${String(j + 1).padStart(2, "0")}.pdf', '/documents/monitoring-pack-${String(j + 1).padStart(2, "0")}.pdf', ${nowTs(-14)}, ${nowTs(-20)}, ${nowTs(-14)});`,
		);

		// Two reporting periods per project: the broker monthly-report list and
		// the admin anomaly surface both read emission_reports.
		for (const period of [1, 2]) {
			const anomaly = j % 9 === 0 && period === 2;
			out.push(
				`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, anomaly_score, anomaly_note, report_data, verified_by, verified_at, created_at)
	VALUES (${projectId(title)}, ${nowTs(-60 + period * 30)}, ${nowTs(-30 + period * 30)}, ${Math.round(400000 - (j % 7) * 15000 + period * 6000)}, 420000, ${(4 + (j % 6) * 0.9).toFixed(2)}, ${anomaly ? 1 : 0}, ${anomaly ? 0.74 : "NULL"}, ${anomaly ? "'Consumption rose against the previous period while savings stayed below the blueprint expectation.'" : "NULL"}, '{"plannedBudgetAmount":${budget},"actualSpendingAmount":${cost},"overallStatus":"${anomaly ? "AT_RISK" : "ON_TRACK"}","detectedRisksOrAnomalies":[],"overallConclusion":"Metered reduction is tracked against the validated baseline."}', ${userByEmail("admin1")}, ${nowTs(-30 + period * 30)}, ${nowTs(-30 + period * 30)});`,
			);
		}

		// Delivery milestones, so every vendor has assigned work to report on.
		for (let step = 1; step <= 3; step++) {
			const done = step < 3;
			out.push(
				`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId(title)}, ${step}, '${["Site Survey & Engineering Design", "Procurement & Factory Acceptance Test", "Installation & Commissioning"][step - 1]}', 'Delivered against the approved engineering package with evidence for each stage.', ${nowTs(-18 + step * 8)}, ${nowTs(-10 + step * 8)}, ${done ? 100 : 45}, '${done ? "APPROVED" : "IN_PROGRESS"}', ${done ? "'Stage completed and evidence uploaded for review.'" : "'Works are under way on site.'"}, ${done ? "'Reviewed and approved.'" : "NULL"}, ${nowTs(-18 + step * 8)}, ${nowTs(-9 + step * 8)});`,
			);
		}

		// One evidence file and one OCR-extracted document for the first few
		// projects, which is what the project drill-downs display.
		if (j < ROW_FLOOR) {
			out.push(
				`INSERT INTO milestone_evidence (milestone_id, kind, file_name, file_url, notes, uploaded_at)
	VALUES ((SELECT id FROM project_milestones WHERE project_id = ${projectId(title)} AND step_number = 1), 'document', 'Engineering_Package_${String(j + 1).padStart(2, "0")}.pdf', '/documents/engineering-package-${String(j + 1).padStart(2, "0")}.pdf', 'Stamped drawings issued for construction.', ${nowTs(-10 + j)});`,
				`INSERT INTO project_documents (project_id, type, file_name, file_url, ocr_status, extracted_data, uploaded_at)
	VALUES (${projectId(title)}, 'utility_bill', 'PLN_Utility_Bill_Monitoring_${String(j + 1).padStart(2, "0")}.pdf', '/documents/pln-utility-bill-monitoring-${String(j + 1).padStart(2, "0")}.pdf', 'done', '{"totalKwh":420000,"billingPeriod":"2026-Q1","facilityName":"${city} plant"}', ${nowTs(-40)});`,
			);
		}
	}

	// ── notification feeds: vendor and broker are the roles with a bell ─
	for (let v = 0; v < VENDOR_EMAILS.length; v++) {
		for (let k = 0; k < ROW_FLOOR; k++) {
			out.push(
				`INSERT INTO notifications (user_id, type, title, body, read, link, created_at)
	VALUES (${userByEmail(VENDOR_EMAILS[v] as string)}, '${["deadline", "negotiation", "status_change", "tender"][k % 4]}', '${["Tender deadline approaching", "Revision requested on a live bid", "Delivery milestone awaiting review", "New tender published in your sector"][k % 4]}', 'Open the item to see the detail and the action expected from you.', ${k > 2 ? 1 : 0}, '/vendor/deals', ${nowTs(-1 - k - v)});`,
			);
		}
	}
	for (let b = 0; b < BROKER_EMAILS.length; b++) {
		for (let k = 0; k < ROW_FLOOR; k++) {
			out.push(
				`INSERT INTO notifications (user_id, type, title, body, read, link, created_at)
	VALUES (${userByEmail(BROKER_EMAILS[b] as string)}, '${["assignment", "documents", "reporting", "bond"][k % 4]}', '${["New project assigned", "Document received for review", "Monthly report available", "Bond issuance recorded"][k % 4]}', 'Review it before the next investor update.', ${k > 2 ? 1 : 0}, '/broker/projects', ${nowTs(-1 - k - b)});`,
			);
		}
	}

	// ── vendor portfolio entries ──────────────────────────────
	// vendor1 already has three from the story fixtures; the rest start empty.
	const PORTFOLIO_EXISTING: Record<string, number> = {
		"EcoTech Solutions": 3,
	};
	for (let v = 0; v < VENDOR_EMAILS.length; v++) {
		const company = VENDOR_COMPANIES[v] as string;
		const existing = PORTFOLIO_EXISTING[company] ?? 0;
		for (let k = existing; k < ROW_FLOOR; k++) {
			const value = 780000000 + k * 240000000;
			const year = 2021 + (k % 5);
			out.push(
				`INSERT INTO vendor_portfolio_items (vendor_id, project_name, client_name, project_type, location, description, project_value, duration_months, services_provided, energy_saving_percent, carbon_reduction_tons, completion_year, status, document_name, created_at, updated_at)
	VALUES (${vendorProfileId(company)}, '${MEASURES[k % MEASURES.length]}, ${CITIES[k % CITIES.length]}', '${["PT Tekstil Jaya", "PT Baja Prima", "PT Kertas Nusantara", "PT Sawit Lestari", "PT Sentra Graha Medika"][k % 5]}', '${SECTORS[k % SECTORS.length]}', '${CITIES[k % CITIES.length]}', 'Delivered as a turnkey efficiency package with metered savings verification and operator training.', ${value}, ${3 + (k % 6)}, 'Energy audit, detailed engineering, supply, installation, commissioning, operator training', ${(12 + (k % 8) * 1.7).toFixed(1)}, ${90 + (k % 7) * 45}, ${year}, '${k % 2 === 0 ? "VERIFIED" : "COMPLETED"}', 'Completion_Report_${year}.pdf', ${nowTs(-400 + k * 20)}, ${nowTs(-400 + k * 20)});`,
			);
		}
	}

	// ── funding: active investments behind the public catalog ─
	// The catalog derives funding progress from active investments, so these
	// rows are what turn a bare budget figure into a funding percentage.
	for (let n = 0; n < 10; n++) {
		// These are the first ten broker-stage projects, all of which carry a
		// published blueprint; the title is already claimed above.
		const title = generatedTitle(10 + n);
		const investment = userByEmail(
			INVESTOR_EMAILS[n % INVESTOR_EMAILS.length] as string,
		);
		const amount = 120000000 + n * 45000000;
		out.push(
			`INSERT INTO investments (project_id, investor_id, amount, roi_paid, status, bond_serial_number, invested_at, created_at)
	VALUES (${projectId(title)}, ${investment}, ${amount}, ${Math.round(amount * 0.08)}, '${n % 5 === 4 ? "completed" : "active"}', 'GS-BND-2026-1${String(n).padStart(2, "0")}', ${nowTs(-16 + n)}, ${nowTs(-16 + n)});`,
		);
	}

	// ── ROI schedules for the admin payout queue ──────────────
	for (let n = 0; n < ROW_FLOOR; n++) {
		const investmentId = `(SELECT id FROM investments WHERE bond_serial_number = 'GS-BND-2026-1${String(n).padStart(2, "0")}')`;
		for (let period = 1; period <= ROW_FLOOR; period++) {
			const paid = period < 3;
			out.push(
				`INSERT INTO roi_payments (investment_id, amount, period, status, escrow_tx_id, paid_at, created_at)
	VALUES (${investmentId}, 4250000, 'Period ${period}', '${paid ? "paid" : "scheduled"}', ${paid ? `'ESC-2026-${String(n * 10 + period).padStart(4, "0")}'` : "NULL"}, ${paid ? nowTs(-40 + period * 7) : "NULL"}, ${nowTs(-60)});`,
			);
		}
	}

	// ── scope of work for every project ───────────────────────
	// The vendor project detail renders the description, the technical
	// requirements and the deliverables. The description comes from the project
	// row; these two come from the measure actually being installed, so each
	// project reads as its own scope instead of shared copy.
	const SCOPE_BY_MEASURE: Record<
		string,
		{ requirements: string[]; deliverables: string[] }
	> = {
		"Boiler Retrofit": {
			requirements: [
				"Burner retrofit and flue-gas heat recovery sized to the existing steam boiler",
				"Steam piping modification within the boiler house battery limit",
				"Combustion tuning with emissions measurement to the applicable standard",
			],
			deliverables: [
				"Retrofit burner package with combustion controls",
				"Heat recovery unit with insulated ducting",
				"Combustion commissioning report including emissions results",
			],
		},
		"Solar Rooftop PV": {
			requirements: [
				"Rooftop structural assessment and load certification before installation",
				"Modules, string inverters and DC protection to the applicable SNI standard",
				"Net-metering application handled through the utility",
			],
			deliverables: [
				"Complete PV array with mounting structure and cabling",
				"Inverter station with a monitoring gateway",
				"Commissioning report and the net-metering approval",
			],
		},
		"Chiller Replacement": {
			requirements: [
				"Cooling load audit to size the replacement chiller",
				"Variable primary flow with plant-level optimisation control",
				"Refrigerant handling by a licensed technician",
			],
			deliverables: [
				"High-efficiency chiller charged and tested",
				"Plant controller with kW/ton optimisation",
				"Performance test report at design load",
			],
		},
		"LED Relamping": {
			requirements: [
				"Illuminance survey to the applicable workplace lighting standard",
				"High-bay LED luminaires with occupancy and daylight control",
				"Works scheduled outside production hours",
			],
			deliverables: [
				"Luminaire schedule with photometric verification",
				"Occupancy and daylight control system",
				"Illuminance verification report",
			],
		},
		"Compressed Air Upgrade": {
			requirements: [
				"Plant-wide leak survey and repair before equipment replacement",
				"Variable speed drive compressor with dryer and receiver sizing",
				"Automatic pressure and sequencing control",
			],
			deliverables: [
				"VSD compressor package with dryer and receiver",
				"Pressure control and sequencing system",
				"Leak repair register with a before and after audit",
			],
		},
		"Waste Heat Recovery": {
			requirements: [
				"Stack measurement to establish the recoverable heat baseline",
				"Heat exchanger and steam drum integration with automatic bypass",
				"Insulation and condensate management across the new circuit",
			],
			deliverables: [
				"Heat exchanger and steam drum package",
				"Automatic bypass control with safety interlocks",
				"Recovered-heat measurement report",
			],
		},
		"Motor Efficiency": {
			requirements: [
				"Nameplate survey of every motor in scope",
				"IE3 premium efficiency motors with variable speed drives",
				"Replacement sequenced per production line",
			],
			deliverables: [
				"Motor and drive schedule with a spares list",
				"Installed drives with parameter documentation",
				"Efficiency verification against the audit estimate",
			],
		},
		"Biomass Conversion": {
			requirements: [
				"Fuel supply study and feedstock specification",
				"Biomass boiler with automatic feeding and emission control",
				"Emission measurement to the permitted limits",
			],
			deliverables: [
				"Biomass boiler with feeding and ash handling",
				"Emission control equipment with stack measurement",
				"72-hour performance test and the handover manual",
			],
		},
	};

	// Every project, not just the open opportunities: the scope card renders on
	// any project detail the vendor can open.
	const scoped: Array<[string, string]> = [
		...DISCOVERY_INDICES.map(
			(n) =>
				[generatedTitle(n), MEASURES[n % MEASURES.length]] as [string, string],
		),
		["Textile Factory Retrofit", "Boiler Retrofit"],
		["Solar Rooftop 500 kWp", "Solar Rooftop PV"],
		["Compressed Air Optimization", "Compressed Air Upgrade"],
		["Factory LED Lighting", "LED Relamping"],
		["Biomass Boiler", "Biomass Conversion"],
		["Factory Chiller Retrofit", "Chiller Replacement"],
		["Electric Motor Efficiency", "Motor Efficiency"],
		["Industrial Waste Heat Recovery", "Waste Heat Recovery"],
		["Cold Storage Efficiency Retrofit", "Chiller Replacement"],
		...Array.from(
			{ length: STAGE_PROJECTS },
			(_, j) =>
				[generatedTitle(10 + j), MEASURES[(10 + j) % MEASURES.length]] as [
					string,
					string,
				],
		),
	];
	for (const [title, measure] of scoped) {
		const scope = SCOPE_BY_MEASURE[measure];
		if (!scope) throw new Error(`no scope authored for measure: ${measure}`);
		out.push(
			`UPDATE projects SET technical_requirements = '${JSON.stringify(scope.requirements)}', deliverables = '${JSON.stringify(scope.deliverables)}' WHERE id = ${projectId(title)};`,
		);
	}

	// ── vendor matching scores for the open opportunities ─────
	// The matching model scores five weighted criteria per project and vendor.
	// The values are computed from the vendor attributes and the project risk
	// score that are already in the database, so the ranking is reproducible
	// rather than arbitrary. Scores are 0-100 and `projectRisk` is inverted so
	// a higher number always means a better outcome.
	const clamp = (value: number) =>
		Math.max(0, Math.min(100, Math.round(value)));

	// What each vendor actually specialises in. Without this the biggest vendor
	// wins every project and the ranking carries no information; with it, fit
	// depends on the project, which is what makes the recommended list useful.
	const VENDOR_SPECIALTIES: Record<string, string[]> = {
		"EcoTech Solutions": ["Boiler Retrofit", "Compressed Air Upgrade"],
		"PT Eco Power Indonesia": ["Chiller Replacement"],
		"PT Bio Thermal Energy": ["Biomass Conversion", "Waste Heat Recovery"],
		"PT Solar Cipta Energi": ["Solar Rooftop PV", "LED Relamping"],
		"PT Efisiensi Mesin Nusantara": ["Motor Efficiency"],
	};

	// Every tender the vendor can see is scored, so no opportunity card renders
	// unscored. The story fixtures carry their own risk score and budget, so
	// those are passed in rather than recomputed.
	const matchTargets: Array<{
		title: string;
		measure: string;
		risk: number;
		budget: number;
		seed: number;
	}> = [
		...DISCOVERY_INDICES.map((n) => ({
			title: generatedTitle(n),
			measure: MEASURES[n % MEASURES.length] as string,
			risk: 20 + (n % 5) * 4,
			budget: 400000000 + n * 150000000,
			seed: n,
		})),
		{
			title: "Textile Factory Retrofit",
			measure: "Boiler Retrofit",
			risk: 28,
			budget: 500000000,
			seed: 5,
		},
		{
			title: "Solar Rooftop 500 kWp",
			measure: "Solar Rooftop PV",
			risk: 35,
			budget: 1000000000,
			seed: 6,
		},
		{
			title: "Compressed Air Optimization",
			measure: "Compressed Air Upgrade",
			risk: 22,
			budget: 100000000,
			seed: 7,
		},
		{
			title: "Factory LED Lighting",
			measure: "LED Relamping",
			risk: 18,
			budget: 1500000000,
			seed: 8,
		},
		{
			title: "Biomass Boiler",
			measure: "Biomass Conversion",
			risk: 41,
			budget: 2500000000,
			seed: 9,
		},
	];

	for (const { title, measure, risk, budget, seed } of matchTargets) {
		const scored = VENDOR_EMAILS.map((email, v) => {
			const company = VENDOR_COMPANIES[v] as string;
			const rating = [4.6, 4.4, 4.7, 4.3, 4.1][v] as number;
			const completed = [12, 9, 14, 7, 5][v] as number;
			// A vendor whose speciality covers the installed technology fits the
			// scope better and has more comparable projects behind it.
			const specialist =
				VENDOR_SPECIALTIES[company]?.includes(measure) === true;
			const technicalFit = clamp(
				45 + completed * 1.6 + (seed % 3) + (specialist ? 30 : 0),
			);
			const relevantExperience = clamp(
				40 + completed * 1.8 - (seed % 4) + (specialist ? 28 : 0),
			);
			const historicalPerformance = clamp(rating * 20);
			const priceValue = clamp(
				72 + rating * 3 - (budget / 1000000000) * 6 - (v % 3),
			);
			const projectRisk = clamp(96 - risk + rating * 2);
			const totalScore = clamp(
				technicalFit * 0.25 +
					relevantExperience * 0.2 +
					historicalPerformance * 0.2 +
					priceValue * 0.2 +
					projectRisk * 0.15,
			);
			return {
				email,
				company,
				technicalFit,
				relevantExperience,
				historicalPerformance,
				priceValue,
				projectRisk,
				totalScore,
			};
		});

		// Rank within the project: best weighted total first.
		const ranked = [...scored].sort((a, b) => b.totalScore - a.totalScore);

		for (const row of scored) {
			const rank = ranked.findIndex((r) => r.email === row.email) + 1;
			out.push(
				`INSERT INTO vendor_match_scores (project_id, vendor_id, technical_fit, relevant_experience, historical_performance, price_value, project_risk, total_score, rank, created_at)
	VALUES (${projectId(title)}, ${vendorProfileId(row.company)}, ${row.technicalFit}, ${row.relevantExperience}, ${row.historicalPerformance}, ${row.priceValue}, ${row.projectRisk}, ${row.totalScore}, ${rank}, ${nowTs(-4)});`,
			);
		}
	}

	// ── predictive-analytics periods ──────────────────────────
	// One forecast per project per month ahead, with the held-out accuracy
	// metrics the model was scored on. Forward looking: a forecast describes the
	// periods that have not happened yet, which is what the vendor sees alongside
	// the reported actuals.
	//
	// Covers every project in delivery, including the story fixtures, so the
	// vendor's active-project view always has a forecast rather than an empty card.
	const forecastTargets: Array<{ title: string; seed: number }> = [
		...Array.from({ length: STAGE_PROJECTS }, (_, j) => ({
			title: generatedTitle(10 + j),
			seed: j,
		})),
		{ title: "Biomass Boiler", seed: 30 },
		{ title: "Factory Chiller Retrofit", seed: 31 },
		{ title: "Electric Motor Efficiency", seed: 32 },
		{ title: "Industrial Waste Heat Recovery", seed: 33 },
		{ title: "Cold Storage Efficiency Retrofit", seed: 34 },
	];

	for (const { title, seed } of forecastTargets) {
		const baseline = 420000 - (seed % 7) * 15000;
		for (let period = 0; period < ROW_FLOOR; period++) {
			const consumption = baseline - (seed % 5) * 8000 - period * 2500;
			const savings = Math.round((baseline - consumption) * 0.82);
			out.push(
				`INSERT INTO energy_forecasts (project_id, period_start, period_end, forecasted_consumption, forecasted_savings, model_name, shap_values, metrics, created_at)
	VALUES (${projectId(title)}, ${nowTs(period * 30)}, ${nowTs((period + 1) * 30)}, ${consumption}, ${savings}, 'random_forest', '{"baseline_consumption":${(0.34 + (seed % 3) * 0.02).toFixed(2)},"production_load":${(0.27 + (seed % 4) * 0.01).toFixed(2)},"ambient_temperature":0.14,"equipment_age":0.12,"operating_hours":0.09}', '{"mae":${(1180 + (seed % 6) * 45).toFixed(1)},"rmse":${(1620 + (seed % 5) * 60).toFixed(1)},"r2":${(0.9 - (seed % 4) * 0.007).toFixed(3)},"cvRmse":${(8.4 + (seed % 5) * 0.3).toFixed(2)}}', ${nowTs(-2)});`,
			);
		}
	}

	return out;
}

if (import.meta.main) {
	const { full } = await buildSeed();
	console.log(full.join("\n"));
}

