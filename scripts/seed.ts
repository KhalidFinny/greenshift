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
	{
		username: "broker1",
		name: "Capital Green Securities",
		role: "broker",
		companyName: "Capital Green Securities",
	},
	{
		username: "vendor2",
		name: "Eco Power Indonesia",
		role: "vendor",
		companyName: "PT Eco Power Indonesia",
	},
	{
		username: "vendor3",
		name: "Bio Thermal Energy",
		role: "vendor",
		companyName: "PT Bio Thermal Energy",
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
const vendorProfileId = (companyName: string) =>
	`(SELECT id FROM vendor_profiles WHERE company_name = '${companyName}')`;
const BROKER =
	"(SELECT id FROM users WHERE email = 'broker1@greenshift.dev')";
const brokerAssignmentId = (title: string) =>
	`(SELECT id FROM broker_assignments WHERE project_id = ${projectId(title)} AND broker_id = ${BROKER})`;

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

// Broker fixtures. The broker stage starts only after LVV GRK validation and a
// Company decision, so every assignment below sits on a validated blueprint.
// broker1 carries one assignment per broker lifecycle stage, the document
// requests it raised, the risk assessments it reads and the monthly reports it
// forwards to investors.
lines.push(
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

console.log(lines.join("\n"));
