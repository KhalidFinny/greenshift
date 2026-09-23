import { industrySectors } from "../apps/api/src/contracts";
import {
	creditScore,
	finansialTone,
	implementasiTone,
	projectRisk,
	teknisTone,
} from "../apps/api/src/modules/business/business.scoring";
import { CHECKLIST_SLOTS } from "../apps/api/src/modules/business/business.shared";
import { buildBlueprintDocument } from "../apps/api/src/modules/business/forecast/forecast.service";
import {
	EXPERIENCE_REFERENCE,
	MATCH_WEIGHTS,
	MAX_RATING,
	PORTFOLIO_REFERENCE,
	proximityScore,
	separatingCriteria,
	VALUE_PORTFOLIO_SHARE,
} from "../apps/api/src/modules/business/matchmaking/scoring";
import {
	buildAccountStatements,
	type DemoAccount,
	DEMO_ACCOUNTS,
} from "./accounts";

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
		...VENDOR_PROFILES.slice(0, 1).map(vendorProfileStatement),

		// The two verification-step projects: one waiting on the company to
		// register it at Sistem Registri, one registered and with its LVV body.
		// Neither carries a tender, so the procurement web below is untouched.
		...projectStatements({
			company: BUSINESS,
			title: "Boiler Feedwater Economizer, Malang",
			description:
				"Boiler feedwater economizer and condensate return upgrade on the Malang steam plant, metered against the boiler baseline.",
			status: "registry",
			location: located("Malang"),
			industrySector: "Textile",
			measure: "Boiler Retrofit",
			capexRp: 750000000,
			...projectInputs({
				capexRp: 750000000,
				paybackYears: 3.5,
				tenorTahun: 5,
				savingShare: 0.18,
				faktorEmisi: 0.87,
				targetPct: 5,
				timelineQuarter: "Q3 2027",
				jaminan: "Land or building certificate",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 2,
		}),
		...projectStatements({
			company: BUSINESS,
			title: "Steam Condensate Recovery, Malang",
			description:
				"Steam condensate recovery and flash-steam heat recovery across the Malang plant, with metered performance verification.",
			status: "assessment",
			location: located("Malang"),
			industrySector: "Textile",
			measure: "Waste Heat Recovery",
			capexRp: 900000000,
			...projectInputs({
				capexRp: 900000000,
				paybackYears: 4.0,
				tenorTahun: 5,
				savingShare: 0.15,
				faktorEmisi: 0.87,
				targetPct: 4,
				timelineQuarter: "Q1 2028",
				jaminan: "Corporate guarantee",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 6,
		}),

		// projects (all in tendering)
		...projectStatements({
			company: BUSINESS,
			title: "Textile Factory Retrofit",
			description:
				"Energy efficiency for a 10 ton/hour steam boiler through burner retrofit and heat recovery.",
			status: "tendering",
			location: located("Malang"),
			industrySector: "Textile",
			measure: "Boiler Retrofit",
			capexRp: 500000000,
			...projectInputs({
				capexRp: 500000000,
				paybackYears: 4.5,
				tenorTahun: 6,
				savingShare: 0.19,
				faktorEmisi: 0.87,
				targetPct: 4,
				timelineQuarter: "Q2 2027",
				jaminan: "Land or building certificate",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 0,
		}),
		blueprintStatement("Textile Factory Retrofit", "validated", 0),
		...projectStatements({
			company: BUSINESS,
			title: "Solar Rooftop 500 kWp",
			description:
				"Installation of a 500 kWp rooftop solar PV system with a self-consumption scheme for the factory.",
			status: "tendering",
			location: located("Surabaya"),
			industrySector: "Machinery",
			measure: "Solar Rooftop PV",
			capexRp: 1000000000,
			...projectInputs({
				capexRp: 1000000000,
				paybackYears: 5.0,
				tenorTahun: 5,
				savingShare: 0.13,
				faktorEmisi: 0.79,
				targetPct: 6,
				timelineQuarter: "Q4 2027",
				jaminan: "Corporate guarantee",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 0,
		}),
		blueprintStatement("Solar Rooftop 500 kWp", "validated", 0),
		...projectStatements({
			company: BUSINESS,
			title: "Compressed Air Optimization",
			description:
				"Compressed air system optimization: leak repair and compressor replacement.",
			status: "tendering",
			location: located("Sidoarjo"),
			industrySector: "Food and beverage",
			measure: "Compressed Air Upgrade",
			capexRp: 100000000,
			...projectInputs({
				capexRp: 100000000,
				paybackYears: 2.8,
				tenorTahun: 4,
				savingShare: 0.17,
				faktorEmisi: 0.87,
				targetPct: 5,
				timelineQuarter: "Q1 2027",
				jaminan: "Machinery lien",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 0,
		}),
		blueprintStatement("Compressed Air Optimization", "validated", 0),
		...projectStatements({
			company: BUSINESS,
			title: "Factory LED Lighting",
			description:
				"High-bay LED relamping complete with occupancy controls for the production area.",
			status: "tendering",
			location: located("Gresik"),
			industrySector: "Chemical",
			measure: "LED Relamping",
			capexRp: 1500000000,
			...projectInputs({
				capexRp: 1500000000,
				paybackYears: 6.0,
				tenorTahun: 5,
				savingShare: 0.14,
				faktorEmisi: 0.88,
				targetPct: 3,
				timelineQuarter: "Q3 2028",
				jaminan: "Corporate guarantee",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 0,
		}),
		blueprintStatement("Factory LED Lighting", "validated", 0),
		...projectStatements({
			company: BUSINESS,
			title: "Biomass Boiler",
			description:
				"Replacement of a 5 MWth coal boiler with a biomass boiler with ESP.",
			status: "tendering",
			location: located("Pasuruan"),
			industrySector: "Pulp and paper",
			measure: "Biomass Conversion",
			capexRp: 2500000000,
			...projectInputs({
				capexRp: 2500000000,
				paybackYears: 7.0,
				tenorTahun: 4,
				savingShare: 0.16,
				faktorEmisi: 0.94,
				targetPct: 4,
				timelineQuarter: "Q4 2029",
				jaminan: "Offtake contract assignment",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 0,
		}),

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

		// The matchmaking choice behind each of those tenders: the company appoints
		// a vendor and a route, and the route is what opens the tender.
		...[
			"Textile Factory Retrofit",
			"Solar Rooftop 500 kWp",
			"Compressed Air Optimization",
			"Factory LED Lighting",
			"Biomass Boiler",
		].map(
			(title) => `INSERT INTO vendor_assignments (project_id, vendor_id, vendor_name, method, created_at, updated_at)
	VALUES (${projectId(title)}, ${VENDOR}, '${accountField("vendor1", "companyName")}', 'open', ${nowTs(-46)}, ${nowTs(-46)});`,
		),

		// business revision request (P3)
		`INSERT INTO proposal_revisions (proposal_id, revision_number, note, amount, previous_amount, created_by, created_at)
	VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId("Compressed Air Optimization")}), 1, 'The proposal price exceeds the tender maximum budget (IDR 100 million). Please submit a price revision.', 110000000, NULL, 'company', ${nowTs(-6)});`,

		// award the Biomass Boiler tender to vendor1
		`UPDATE tenders SET status = 'awarded', awarded_proposal_id = (SELECT id FROM proposals WHERE tender_id = tenders.id)
	WHERE project_id = ${projectId("Biomass Boiler")};`,
	);

	const verifiedBy = "(SELECT id FROM users WHERE email = 'admin1@greenshift.dev')";

	// The story's own bids, as the matching model reads them: which vendor bid,
	// and the sector of the project each bid was made on.
	for (const [vendorEmail, sector] of [
		["vendor1", "Machinery"],
		["vendor1", "Food and beverage"],
		["vendor1", "Chemical"],
		["vendor1", "Pulp and paper"],
		["vendor2", "Iron and steel"],
		["vendor2", "Food and beverage"],
		["vendor3", "Machinery"],
		["vendor3", "Cement"],
	] as const) {
		bidHistory.push({ vendorEmail, sector });
	}

	// Public bond dashboard fixtures so the dashboard is exercisable without
	// an account: two projects already past procurement (funding + published
	// blueprint) plus MRV emission reports: one anomaly-flagged to demo the
	// anomaly badge.
	lines.push(
		...projectStatements({
			company: BUSINESS,
			title: "Factory Chiller Retrofit",
			description:
				"Replacement of the old chiller with a high-efficiency unit and automatic load control.",
			status: "funding",
			location: located("Sidoarjo"),
			industrySector: "Iron and steel",
			measure: "Chiller Replacement",
			capexRp: 500000000,
			...projectInputs({
				capexRp: 500000000,
				paybackYears: 6.5,
				tenorTahun: 4,
				savingShare: 0.12,
				faktorEmisi: 0.87,
				targetPct: 4,
				timelineQuarter: "Q2 2028",
				jaminan: "Land or building certificate",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 120,
		}),
		...projectStatements({
			company: BUSINESS,
			title: "Electric Motor Efficiency",
			description:
				"Retrofit of standard electric motors to premium IE3 motors with VSD.",
			status: "funding",
			location: located("Gresik"),
			industrySector: "Machinery",
			measure: "Motor Efficiency",
			capexRp: 300000000,
			...projectInputs({
				capexRp: 300000000,
				paybackYears: 3.2,
				tenorTahun: 4,
				savingShare: 0.19,
				faktorEmisi: 0.82,
				targetPct: 5,
				timelineQuarter: "Q4 2027",
				jaminan: "Machinery lien",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 90,
		}),

		// A project that has passed verification and is in matchmaking with no
		// tender yet: the ranking is what the company reads first, and choosing a
		// route is what opens the tender.
		...projectStatements({
			company: BUSINESS,
			title: "Cooling Tower Retrofit, Gresik",
			description:
				"Replacement of the existing cooling tower with a high-efficiency unit and automatic load control, metered against the plant baseline.",
			status: "tendering",
			location: located("Gresik"),
			industrySector: "Chemical",
			measure: "Chiller Replacement",
			capexRp: 2400000000,
			...projectInputs({
				capexRp: 2400000000,
				paybackYears: 6.5,
				tenorTahun: 5,
				savingShare: 0.15,
				faktorEmisi: 0.88,
				targetPct: 5,
				timelineQuarter: "Q3 2029",
				jaminan: "Corporate guarantee",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 45,
			updatedDaysAgo: 4,
		}),
		`INSERT INTO blueprints (project_id, status, document, validated_at, published_at, created_at, updated_at)
	VALUES (${projectId("Cooling Tower Retrofit, Gresik")}, 'published', '{"financialProjections":{"npv":310000000,"irr":15.4,"paybackPeriod":4}}', ${nowTs(-40)}, ${nowTs(-38)}, ${nowTs(-42)}, ${nowTs(-38)});`,

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
	VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId("Compressed Air Optimization")}), 1, 'PENDING_VENDOR_RESPONSE', 10000000, 3, 6, '["Total Project Price","Unit & Service Warranty Period","Implementation Timeline"]', 'The proposal price exceeds the tender maximum budget (IDR 100 million) and the warranty period is shorter than the board requires. Please revise the price and extend the warranty to 36 months.', ${nowTs(-6)}, ${nowTs(-6)});`,

		`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId("Biomass Boiler")}, 1, 'Site Survey & Engineering Design', 'Load survey, boiler house layout, fuel supply study and stamped engineering drawings.', ${nowTs(-18)}, ${nowTs(-10)}, 100, 'APPROVED', 'Rev C drawings issued to the plant engineering team.', 'Reviewed and approved by the plant engineer.', ${nowTs(-18)}, ${nowTs(-11)});`,
		`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId("Biomass Boiler")}, 2, 'Procurement & Factory Acceptance Test', 'Boiler, feeding system and ESP procurement with a factory acceptance test before shipment.', ${nowTs(-11)}, ${nowTs(-2)}, 100, 'APPROVED', 'FAT witnessed at the vendor works; report attached.', 'Accepted.', ${nowTs(-11)}, ${nowTs(-3)});`,
		`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId("Biomass Boiler")}, 3, 'Installation & Commissioning', 'Erection, piping, electrical works and commissioning of the biomass boiler.', ${nowTs(-2)}, ${nowTs(12)}, 45, 'IN_PROGRESS', 'Erection complete, piping and electrical works in progress.', NULL, ${nowTs(-2)}, ${nowTs(-1)});`,
		`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId("Biomass Boiler")}, 4, 'Performance Test & Handover', '72-hour performance test, emission measurement and handover of the operating manual.', ${nowTs(12)}, ${nowTs(30)}, 0, 'NOT_STARTED', NULL, NULL, ${nowTs(-2)}, ${nowTs(-2)});`,

		`INSERT INTO milestone_evidence (milestone_id, kind, file_name, file_url, notes, uploaded_at)
	VALUES ((SELECT id FROM project_milestones WHERE project_id = ${projectId("Biomass Boiler")} AND step_number = 1), 'document', 'Boiler_House_Engineering_Drawings.pdf', 'documents/boiler-house-drawings.pdf', 'Rev C drawings, stamped by the plant engineer.', ${nowTs(-11)});`,
		`INSERT INTO milestone_evidence (milestone_id, kind, file_name, file_url, notes, uploaded_at)
	VALUES ((SELECT id FROM project_milestones WHERE project_id = ${projectId("Biomass Boiler")} AND step_number = 1), 'inspection', 'Site_Survey_Report.pdf', 'documents/site-survey-report.pdf', 'Load and fuel supply survey results.', ${nowTs(-15)});`,
		`INSERT INTO milestone_evidence (milestone_id, kind, file_name, file_url, notes, uploaded_at)
	VALUES ((SELECT id FROM project_milestones WHERE project_id = ${projectId("Biomass Boiler")} AND step_number = 2), 'document', 'Factory_Acceptance_Test_Report.pdf', 'documents/fat-report.pdf', 'FAT witnessed at the vendor works.', ${nowTs(-3)});`,

		`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, created_at)
	VALUES (${projectId("Biomass Boiler")}, ${nowTs(-60)}, ${nowTs(-30)}, 1180000, 1420000, 168.4, 0, '{"evidenceDocs":["MRV_Biomass_2026-07.pdf","Fuel_Log_2026-07.xlsx"]}', ${nowTs(-29)});`,
		`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, created_at)
	VALUES (${projectId("Biomass Boiler")}, ${nowTs(-30)}, ${nowTs(0)}, 1145000, 1420000, 192.6, 0, '{"evidenceDocs":["MRV_Biomass_2026-08.pdf"]}', ${nowTs(1)});`,

		`INSERT INTO vendor_portfolio_items (vendor_id, project_name, client_name, project_type, location, description, project_value, duration_months, services_provided, energy_saving_percent, carbon_reduction_tons, completion_year, document_name, created_at, updated_at)
	VALUES (${VENDOR}, 'Steam Boiler Retrofit', 'PT Maju Bersama', 'Steam & Thermal', 'Sidoarjo', 'Burner retrofit and flue-gas heat recovery on a 10 ton/hour steam boiler.', 1450000000, 7, 'Energy audit, burner retrofit, heat recovery installation, operator training', 18.5, 240, 2023, 'Completion_Report_MajuBersama.pdf', ${nowTs(-300)}, ${nowTs(-300)});`,
		`INSERT INTO vendor_portfolio_items (vendor_id, project_name, client_name, project_type, location, description, project_value, duration_months, services_provided, energy_saving_percent, carbon_reduction_tons, completion_year, document_name, created_at, updated_at)
	VALUES (${VENDOR}, 'Rooftop Solar PV 300 kWp', 'PT Sinar Abadi', 'Solar PV', 'Gresik', 'Turnkey rooftop solar PV installation with net-metering permit handling.', 3200000000, 5, 'Design, procurement, installation, commissioning, net-metering permit', 24.0, 310, 2024, 'Completion_Report_SinarAbadi.pdf', ${nowTs(-180)}, ${nowTs(-180)});`,
		`INSERT INTO vendor_portfolio_items (vendor_id, project_name, client_name, project_type, location, description, project_value, duration_months, services_provided, energy_saving_percent, carbon_reduction_tons, completion_year, document_name, created_at, updated_at)
	VALUES (${VENDOR}, 'Compressed Air Leak Program', 'PT Pangan Utama', 'Compressed Air', 'Pasuruan', 'Plant-wide leak survey, repair programme and VSD compressor upgrade.', 860000000, 3, 'Leak survey, repair programme, VSD compressor upgrade', 15.2, 96, 2025, NULL, ${nowTs(-90)}, ${nowTs(-90)});`,

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
		...VENDOR_PROFILES.slice(1, 3).map(vendorProfileStatement),

		// verified broker profile (self-registered, licence verified by the platform)
		`INSERT INTO broker_profiles (user_id, company_name, description, representative, contact_email, contact_phone, website, address, nib, financial_license_number, license_authority, submitted_at, verified_at, created_at, updated_at)
	SELECT id, 'Capital Green Securities', 'Green bond underwriter and financial intermediary for verified industrial decarbonisation projects.', 'Budi Santoso, CSA', 'budi.santoso@capitalgreen.co.id', '+62 21 5000 1234', 'https://capitalgreen.co.id', 'Financial Club Tower 18th Floor, SCBD, South Jakarta 12190', '9120803410291', 'KEP-45/D.04/2023', 'Financial Services Authority (OJK)', ${nowTs(-60)}, ${nowTs(-59)}, ${nowTs(-60)}, ${nowTs(-60)} FROM users WHERE email = 'broker1@greenshift.dev';`,

		// projects that reached the broker stage
		...projectStatements({
			company: BUSINESS,
			title: "Industrial Waste Heat Recovery",
			description:
				"Recovery of kiln exhaust heat into the plant steam network with a heat exchanger and automatic bypass control.",
			status: "funding",
			location: located("Cilacap"),
			industrySector: "Cement",
			measure: "Waste Heat Recovery",
			capexRp: 1800000000,
			...projectInputs({
				capexRp: 1800000000,
				paybackYears: 7.5,
				tenorTahun: 5,
				savingShare: 0.18,
				faktorEmisi: 0.88,
				targetPct: 5,
				timelineQuarter: "Q2 2029",
				jaminan: "Offtake contract assignment",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 30,
			updatedDaysAgo: 3,
		}),
		...projectStatements({
			company: BUSINESS,
			title: "Cold Storage Efficiency Retrofit",
			description:
				"Retrofit of the cold storage refrigeration plant: high-efficiency compressors, electronic expansion valves and control optimisation.",
			status: "funding",
			location: located("Bekasi"),
			industrySector: "Food and beverage",
			measure: "Chiller Replacement",
			capexRp: 950000000,
			...projectInputs({
				capexRp: 950000000,
				paybackYears: 5.5,
				tenorTahun: 6,
				savingShare: 0.13,
				faktorEmisi: 0.87,
				targetPct: 4,
				timelineQuarter: "Q1 2029",
				jaminan: "Corporate guarantee",
				revenueMultiple: 4,
			}),
			createdDaysAgo: 40,
			updatedDaysAgo: 25,
		}),
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

		// The choice each of those rounds was awarded out of.
		...(
			[
				["Factory Chiller Retrofit", "vendor2"],
				["Electric Motor Efficiency", "vendor3"],
				["Industrial Waste Heat Recovery", "vendor3"],
				["Cold Storage Efficiency Retrofit", "vendor2"],
			] as const
		).map(
			([project, vendorEmail]) =>
				`INSERT INTO vendor_assignments (project_id, vendor_id, vendor_name, method, created_at, updated_at)
	VALUES (${projectId(project)}, (SELECT id FROM vendor_profiles WHERE user_id = (SELECT id FROM users WHERE email = '${vendorEmail}@greenshift.dev')), '${accountField(vendorEmail, "companyName")}', 'closed', ${nowTs(-52)}, ${nowTs(-52)});`,
		),

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
	VALUES (${brokerAssignmentId("Factory Chiller Retrofit")}, ${projectId("Factory Chiller Retrofit")}, ${BROKER}, ${BUSINESS}, 'Financial', 'Audited Financial Statements', '2025 (Full Year)', 'Required for solvency ratio analysis and bond underwriting preparation.', ${nowTs(-12)}, 'Please include the independent auditor opinion.', 'SUBMITTED', 'Audited_Financial_Statements_2025.pdf', 'documents/audited-financial-statements-2025.pdf', ${nowTs(-14)}, ${nowTs(-24)}, ${nowTs(-14)});`,
		`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, additional_notes, status, created_at, updated_at)
	VALUES (${brokerAssignmentId("Factory Chiller Retrofit")}, ${projectId("Factory Chiller Retrofit")}, ${BROKER}, ${BUSINESS}, 'Legal', 'Company Deed & Business License (NIB)', 'Current', 'Verification of the borrowing entity and its registered business scope.', ${nowTs(5)}, 'Certified copies are sufficient.', 'REQUESTED', ${nowTs(-6)}, ${nowTs(-6)});`,
		`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, status, submitted_file_name, submitted_file_url, submitted_at, created_at, updated_at)
	VALUES (${brokerAssignmentId("Electric Motor Efficiency")}, ${projectId("Electric Motor Efficiency")}, ${BROKER}, ${BUSINESS}, 'Technical', 'Motor & VSD Warranty Certificate', '5-Year Warranty', 'Verification of equipment warranty supporting the operational cash flow assumptions.', ${nowTs(-20)}, 'UNDER_REVIEW', 'IE3_Motor_VSD_Warranty.pdf', 'documents/ie3-motor-vsd-warranty.pdf', ${nowTs(-22)}, ${nowTs(-30)}, ${nowTs(-22)});`,
		`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, status, submitted_file_name, submitted_file_url, submitted_at, reviewed_at, rejection_reason, created_at, updated_at)
	VALUES (${brokerAssignmentId("Electric Motor Efficiency")}, ${projectId("Electric Motor Efficiency")}, ${BROKER}, ${BUSINESS}, 'Project', 'Project Budget Breakdown per Work Package', '2026', 'Budget breakdown per milestone is required to structure the bond cash flows.', ${nowTs(-30)}, 'RESUBMISSION', 'Project_Budget_Breakdown_v1.pdf', 'documents/project-budget-breakdown-v1.pdf', ${nowTs(-33)}, ${nowTs(-28)}, 'The submitted budget does not break the spending down per work package, so the cash flow schedule cannot be structured. Please resubmit with a per-milestone breakdown.', ${nowTs(-36)}, ${nowTs(-28)});`,
		`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, status, submitted_file_name, submitted_file_url, submitted_at, reviewed_at, created_at, updated_at)
	VALUES (${brokerAssignmentId("Biomass Boiler")}, ${projectId("Biomass Boiler")}, ${BROKER}, ${BUSINESS}, 'Legal', 'Environmental Permit (UKL-UPL)', '2026-2031', 'Environmental compliance evidence for the bond information memorandum.', ${nowTs(-50)}, 'APPROVED', 'Environmental_Permit_UKL_UPL.pdf', 'documents/environmental-permit.pdf', ${nowTs(-56)}, ${nowTs(-54)}, ${nowTs(-60)}, ${nowTs(-54)});`,

		// official report payloads for the latest period of each monitored project
		`UPDATE emission_reports SET report_data = '{"plannedBudgetAmount":420000000,"actualSpendingAmount":441000000,"expectedEnergySavingsKwh":10500,"expectedCarbonReductionTons":8.0,"projectedRoiPercent":12.5,"actualRoiPerformancePercent":9.1,"overallStatus":"AT_RISK","detectedRisksOrAnomalies":["Measured savings are 6.3% against a planned 8.2% for the period.","Cooling load rose after the production line addition, pushing consumption above the baseline expectation."],"overallConclusion":"Progress is behind plan and measured savings are below the project assumption. Corrective action is required before the performance test."}' WHERE id = (SELECT max(id) FROM emission_reports WHERE project_id = ${projectId("Factory Chiller Retrofit")});`,
		`UPDATE emission_reports SET report_data = '{"plannedBudgetAmount":180000000,"actualSpendingAmount":168000000,"expectedEnergySavingsKwh":21000,"expectedCarbonReductionTons":14.8,"projectedRoiPercent":16,"actualRoiPerformancePercent":17.2,"overallStatus":"ON_TRACK","detectedRisksOrAnomalies":[],"overallConclusion":"Motor replacement is ahead of the planned spend and measured savings are in line with the audit estimate."}' WHERE id = (SELECT max(id) FROM emission_reports WHERE project_id = ${projectId("Electric Motor Efficiency")});`,
		`UPDATE emission_reports SET report_data = '{"evidenceDocs":["MRV_Biomass_2026-08.pdf"],"plannedBudgetAmount":1050000000,"actualSpendingAmount":1012000000,"expectedEnergySavingsKwh":275000,"expectedCarbonReductionTons":192.6,"projectedRoiPercent":16.5,"actualRoiPerformancePercent":17.1,"overallStatus":"ON_TRACK","detectedRisksOrAnomalies":[],"overallConclusion":"Erection is complete and commissioning is under way; measured emission reduction matches the validated baseline."}' WHERE id = (SELECT max(id) FROM emission_reports WHERE project_id = ${projectId("Biomass Boiler")});`,

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
	"Medan",
	"Palembang",
	"Batam",
	"Balikpapan",
	"Makassar",
];

/**
 * The province each plant city sits in. Every location the fixtures write names
 * one, because the matchmaking model reads the province off both the project
 * and the vendor: a bare city name scores as an unknown location, which would
 * hide the proximity term the ranking turns on.
 */
const PROVINCE_BY_CITY: Record<string, string> = {
	Cilacap: "Jawa Tengah",
	Bekasi: "Jawa Barat",
	Karawang: "Jawa Barat",
	Sidoarjo: "Jawa Timur",
	Gresik: "Jawa Timur",
	Malang: "Jawa Timur",
	Pasuruan: "Jawa Timur",
	Surabaya: "Jawa Timur",
	Semarang: "Jawa Tengah",
	Tangerang: "Banten",
	Medan: "Sumatera Utara",
	Palembang: "Sumatera Selatan",
	Batam: "Kepulauan Riau",
	Balikpapan: "Kalimantan Timur",
	Makassar: "Sulawesi Selatan",
};

/** A plant city as the `location` column holds it: the city, then its province. */
function located(city: string): string {
	const province = PROVINCE_BY_CITY[city];
	if (!province) throw new Error(`no province authored for city: ${city}`);
	return `${city}, ${province}`;
}

/**
 * Indonesian industrial electricity tariff, rupiah per MWh. The annual energy
 * spend is derived from it and the metered consumption, so `biaya_rp` and
 * `konsumsi_mwh` cannot disagree.
 */
const TARIFF_RP_PER_MWH = 1_400_000;

/**
 * The figures every project's Step 1 and Step 2 are built from, and the tables
 * the generated projects draw them from. The annual saving is the capex repaid
 * over a realistic payback, and the metered consumption is set so that saving
 * stays a plausible share of the annual energy spend: neither can drift from
 * the other, and the coverage ratio `saving / (capex / tenor)` lands where the
 * credit model expects a real project to sit.
 */
const GENERATED_PAYBACKS = [2.8, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 6.5, 7.0];
const GENERATED_TENORS = [4, 5, 5, 6, 5, 6, 5, 5, 4, 4];
const GENERATED_SAVING_SHARES = [
	0.18, 0.15, 0.19, 0.13, 0.17, 0.14, 0.16, 0.12, 0.19, 0.15,
];
const GENERATED_FACTORS = [0.87, 0.79, 0.94, 0.82, 0.88, 0.85, 0.9, 0.77, 0.86, 0.91];
const GENERATED_TARGET_PCTS = [4, 6, 3, 8, 5, 7, 4.5, 5.5, 4, 6];
const GENERATED_REVENUE_MULTIPLES = [4, 6, 3, 8, 5, 7, 4, 6, 5, 3];
const GENERATED_QUARTERS = [
	"Q2 2027",
	"Q4 2027",
	"Q1 2028",
	"Q3 2028",
	"Q4 2029",
	"Q2 2029",
	"Q1 2030",
	"Q3 2030",
	"Q2 2028",
	"Q4 2028",
];
const COLLATERAL_PHRASES = [
	"Land or building certificate",
	"Corporate guarantee",
	"Offtake contract assignment",
	"Machinery lien",
	"Escrow account pledge",
	"Parent company guarantee",
	"Receivables assignment",
	"Equipment mortgage",
	"Standby letter of credit",
	"Warehouse receipt pledge",
];

/** The Step 1 and Step 2 figures a capex and a payback imply. */
interface WizardInputs {
	capexRp: number;
	/** Years the annual saving takes to repay the capex. */
	paybackYears: number;
	tenorTahun: number;
	/** The saving as a share of the annual energy spend, under 0.2. */
	savingShare: number;
	faktorEmisi: number;
	targetPct: number;
	timelineQuarter: string;
	jaminan: string;
	/** Site revenue as a multiple of the annual energy spend, above 1. */
	revenueMultiple: number;
}

/** The Step 1 and Step 2 columns a project's capex and payback imply. */
type ProjectInputs = Pick<
	ProjectParams,
	| "tenorTahun"
	| "penghematanRp"
	| "pendapatanRp"
	| "konsumsiMwh"
	| "faktorEmisi"
	| "targetPct"
	| "targetMwh"
	| "timelineQuarter"
	| "jaminan"
>;

/**
 * Derives one project's Step 1 and Step 2 figures from its capex and the
 * payback the project is expected to run at. The saving is the capex repaid
 * over the payback (whole millions), and the metered consumption is whatever
 * makes that saving the given share of the annual energy spend, so the money
 * flows stay plausible against the bill they are measured against.
 */
function projectInputs(inputs: WizardInputs): ProjectInputs {
	const penghematanRp =
		Math.round(inputs.capexRp / inputs.paybackYears / 1_000_000) * 1_000_000;
	const konsumsiMwh = Math.ceil(
		penghematanRp / (inputs.savingShare * TARIFF_RP_PER_MWH),
	);
	const biayaRp = konsumsiMwh * TARIFF_RP_PER_MWH;
	return {
		tenorTahun: inputs.tenorTahun,
		penghematanRp,
		pendapatanRp: Math.round(biayaRp * inputs.revenueMultiple),
		konsumsiMwh,
		faktorEmisi: inputs.faktorEmisi,
		targetPct: inputs.targetPct,
		targetMwh: Math.round((konsumsiMwh * inputs.targetPct) / 100),
		timelineQuarter: inputs.timelineQuarter,
		jaminan: inputs.jaminan,
	};
}

/**
 * The Step 1 and Step 2 figures for a generated project of a given capex, from
 * the tables above. The seed picks a payback, a tenor, a saving share and a
 * tariff so the volume fixtures span the payback, coverage and credit bands
 * rather than all reading the same.
 */
function wizardInputs(capexRp: number, seed: number): ProjectInputs {
	const i = seed % GENERATED_PAYBACKS.length;
	return projectInputs({
		capexRp,
		paybackYears: GENERATED_PAYBACKS[i] as number,
		tenorTahun: GENERATED_TENORS[i] as number,
		savingShare: GENERATED_SAVING_SHARES[i] as number,
		faktorEmisi: GENERATED_FACTORS[i] as number,
		targetPct: GENERATED_TARGET_PCTS[i] as number,
		timelineQuarter: GENERATED_QUARTERS[i] as string,
		jaminan: COLLATERAL_PHRASES[i] as string,
		revenueMultiple: GENERATED_REVENUE_MULTIPLES[i] as number,
	});
}

/**
 * The wizard inputs of one project. Everything the submitted row stores is
 * derived from these, so a project cannot be seeded with a missing or
 * contradictory column: the baseline is consumption × emission factor, the
 * reduction target is the requested share of it, the energy saving converts the
 * target MWh to kWh, the budget is the capex, the annual spend is the metered
 * consumption at the industrial tariff, and the credit and risk figures come
 * from the scoring model the API submits with.
 */
interface ProjectParams {
	/** Company id, as a SQL expression. */
	company: string;
	title: string;
	description: string;
	status: string;
	location: string;
	industrySector: string;
	/** The measure installed: the scope of work the row carries. */
	measure: string;
	/** Step 2: the funding structure. */
	capexRp: number;
	tenorTahun: number;
	/** Annual saving in rupiah, a share of the annual energy spend. */
	penghematanRp: number;
	/** The site's annual revenue in rupiah, larger than the spend. */
	pendapatanRp: number;
	/** Collateral offered for the financing. */
	jaminan: string;
	/** Step 1: the metered baseline. */
	konsumsiMwh: number;
	faktorEmisi: number;
	targetPct: number;
	targetMwh: number;
	timelineQuarter: string;
	/** How long ago the row was created and last updated. */
	createdDaysAgo: number;
	updatedDaysAgo?: number;
}

/** The stored columns that follow from a project's wizard inputs. */
interface ProjectColumns {
	budget: number;
	biayaRp: number;
	estimatedEnergySaving: number;
	creditScore: number;
	creditRating: string;
	riskScore: number;
	riskSummary: string;
}

/** A file name as the `documents/<slug>.pdf` convention stores it. */
function slugify(name: string): string {
	return name
		.replace(/\.pdf$/i, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * The scope of work each measure carries, keyed by the measure the project
 * installs. The vendor project detail renders these beside the description, so
 * every project reads as its own scope instead of shared copy.
 */
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

/**
 * The dummy file each checklist slot holds. Keyed by the slot vocabulary, so a
 * project cannot be seeded with a missing slot, and named from the plant and
 * the measure, so it reads as that project's own document.
 */
const DOCUMENT_FILE_NAME: Record<
	(typeof CHECKLIST_SLOTS)[number],
	(city: string, measure: string) => string
> = {
	tagihan: (city) => `PLN_Bill_${city}_2026_Q1.pdf`,
	beban: (city) => `Load_Profile_${city}_2026.pdf`,
	izin: (city) => `Site_Permit_${city}.pdf`,
};

/** Every project's params, by title, so the matching block scores the stored risk. */
const paramsByTitle: Record<string, ProjectParams> = {};

/** The stored columns of one project, from its wizard inputs. */
function projectColumns(params: ProjectParams): ProjectColumns {
	const biayaRp = params.konsumsiMwh * TARIFF_RP_PER_MWH;
	const credit = creditScore({
		capex: params.capexRp,
		tenor: params.tenorTahun,
		saving: params.penghematanRp,
		docsDone: CHECKLIST_SLOTS.length,
		docsTotal: CHECKLIST_SLOTS.length,
	});
	if (credit.score === null || credit.rating === null) {
		throw new Error(`credit score unavailable for project: ${params.title}`);
	}
	const risk = projectRisk({
		finansial: finansialTone(biayaRp),
		teknis: teknisTone(params.konsumsiMwh),
		implementasi: implementasiTone(params.timelineQuarter),
		creditScore: credit.score,
		docsDone: CHECKLIST_SLOTS.length,
		docsTotal: CHECKLIST_SLOTS.length,
	});
	if (!risk) {
		throw new Error(`no risk model output for project: ${params.title}`);
	}
	return {
		budget: params.capexRp,
		biayaRp,
		estimatedEnergySaving: params.targetMwh * 1000,
		creditScore: credit.score,
		creditRating: credit.rating,
		riskScore: risk.score,
		riskSummary: risk.summary,
	};
}

/**
 * The risk score a project's own params derive. The matching block reads it so
 * the ranking it stores agrees with the risk score the project row carries.
 */
function riskScoreOf(title: string): number {
	const params = paramsByTitle[title];
	if (!params) throw new Error(`no project params registered for: ${title}`);
	return projectColumns(params).riskScore;
}

/**
 * One project as the statements that create it: the submitted row, every wizard
 * column filled from `params`, then its nine checklist documents. Every project
 * INSERT goes through here, so a project is complete by construction. The
 * reduction target is written as the SQL expression the API's derivation
 * implies, so it cannot drift from the baseline it is derived from.
 */
function projectStatements(params: ProjectParams): string[] {
	paramsByTitle[params.title] = params;
	const columns = projectColumns(params);
	const scope = SCOPE_BY_MEASURE[params.measure];
	if (!scope) throw new Error(`no scope authored for measure: ${params.measure}`);
	const updated = params.updatedDaysAgo ?? params.createdDaysAgo;
	const targetReduction = `ROUND(${params.konsumsiMwh} * ${params.faktorEmisi} * ${params.targetPct} / 100, 2)`;
	return [
		`INSERT INTO projects (company_id, title, description, status, budget, location, industry_sector, konsumsi_mwh, biaya_rp, faktor_emisi, target_pct, target_mwh, timeline_quarter, capex_rp, tenor_tahun, penghematan_rp, pendapatan_rp, jaminan, target_emission_reduction, estimated_energy_saving, credit_score, credit_rating, technical_requirements, deliverables, risk_score, risk_summary, submitted_at, created_at, updated_at)
	VALUES (${params.company}, '${params.title}', '${params.description}', '${params.status}', ${columns.budget}, '${params.location}', '${params.industrySector}', ${params.konsumsiMwh}, ${columns.biayaRp}, ${params.faktorEmisi}, ${params.targetPct}, ${params.targetMwh}, '${params.timelineQuarter}', ${params.capexRp}, ${params.tenorTahun}, ${params.penghematanRp}, ${params.pendapatanRp}, '${params.jaminan}', ${targetReduction}, ${columns.estimatedEnergySaving}, ${columns.creditScore}, '${columns.creditRating}', '${JSON.stringify(scope.requirements)}', '${JSON.stringify(scope.deliverables)}', ${columns.riskScore}, '${columns.riskSummary}', ${nowTs(-params.createdDaysAgo)}, ${nowTs(-params.createdDaysAgo)}, ${nowTs(-updated)});`,
		...projectDocumentStatements(params),
	];
}

/**
 * One project's Green Project Blueprint, written from the figures its own
 * submission carries through the same builder the API uses when verification
 * clears a project. Every project past verification carries one, because the
 * blueprint is what a bidder reads beside the tender: a project that reached
 * procurement without one would show the vendor an empty document.
 */
function blueprintStatement(
	title: string,
	status: "validated" | "published",
	daysAgo: number,
): string {
	const params = paramsByTitle[title];
	if (!params) throw new Error(`no project params registered for: ${title}`);
	const document = buildBlueprintDocument({
		capexRp: params.capexRp,
		tenorTahun: params.tenorTahun,
		penghematanRp: params.penghematanRp,
		pendapatanRp: params.pendapatanRp,
		jaminan: params.jaminan,
		konsumsiMwh: params.konsumsiMwh,
		faktorEmisi: params.faktorEmisi,
		targetPct: params.targetPct,
		targetMwh: params.targetMwh,
	});
	if (!document) throw new Error(`no blueprint document for project: ${title}`);
	const publishedAt =
		status === "published" ? nowTs(Math.max(0, daysAgo - 1)) : "NULL";
	return `INSERT INTO blueprints (project_id, status, document, validated_at, published_at, created_at, updated_at)
	VALUES (${projectId(title)}, '${status}', '${JSON.stringify(document)}', ${nowTs(daysAgo)}, ${publishedAt}, ${nowTs(daysAgo)}, ${nowTs(daysAgo)});`;
}

/** The nine checklist documents of one project, uploaded before it was submitted. */
function projectDocumentStatements(params: ProjectParams): string[] {
	const city = params.location.split(",")[0] as string;
	const uploadedAt = nowTs(-(params.createdDaysAgo + 3));
	return CHECKLIST_SLOTS.map((slot) => {
		const fileName = DOCUMENT_FILE_NAME[slot](city, params.measure);
		return `INSERT INTO project_documents (project_id, type, file_name, file_url, ocr_status, extracted_data, uploaded_at)
	VALUES (${projectId(params.title)}, '${slot}', '${fileName}', 'documents/${slugify(fileName)}.pdf', 'done', NULL, ${uploadedAt});`;
	});
}

const accountByUsername: Record<string, DemoAccount> = Object.fromEntries(
	DEMO_ACCOUNTS.map((account) => [account.username, account]),
);

/**
 * One organization field of a demo account. The accounts are the single source
 * of truth for a company's name, sector and address, so a fixture that needs
 * one reads it here rather than repeating it, and a missing field fails the
 * build instead of seeding a null the screens would have to explain.
 */
function accountField(
	username: string,
	field: "companyName" | "industrySector" | "address",
): string {
	const value = accountByUsername[username]?.[field];
	if (typeof value !== "string") {
		throw new Error(`account ${username} has no ${field}`);
	}
	return value;
}

const BUSINESS_EMAILS = DEMO_ACCOUNTS.filter(
	(account) => account.role === "business",
).map((account) => account.username);
const VENDOR_EMAILS = DEMO_ACCOUNTS.filter(
	(account) => account.role === "vendor",
).map((account) => account.username);
const BROKER_EMAILS = ["broker1", "broker2", "broker3", "broker4", "broker5"];
/**
 * One investor, because the platform has no investor surface: the bond is bought
 * and held in the partner app. The row exists for the investment and ROI
 * fixtures, which join `users` on `investor_id` and are what the admin's
 * investment list, payout queue and analytics read.
 */
const INVESTOR_EMAILS = ["investor1"];

/** What a vendor is and where it works: the profile the fixtures write. */
interface VendorProfile {
	email: string;
	/** One of `vendorServiceCategories`. */
	serviceCategory: string;
	/** City and province: the matchmaking model compares the province. */
	location: string;
	description: string;
	nib: string;
	npwp: string;
	certifications: string;
	portfolio: string;
	rating: number;
	total: number;
	/** How long the profile has been verified. */
	verifiedDaysAgo: number;
}

/**
 * The ten vendors, one profile each. The first three are written by the story
 * fixtures and the rest by the volume fixtures, in this order, because the
 * story's proposals look their bidders up by company name and the vendors have
 * to exist first.
 *
 * The locations are spread across the provinces on purpose, so the proximity
 * term separates them: two sit in the same province as most of the plants, three
 * in neighbouring Java provinces, and the rest outside Java, which is the 45
 * band. The company names come from `scripts/accounts.ts`.
 *
 * The portfolios read as an efficiency contractor's reference list because that
 * is the text the matching model tokenises when a vendor has no bid history.
 */
const VENDOR_PROFILES: readonly VendorProfile[] = [
	{
		email: "vendor1",
		serviceCategory: "ESCO",
		location: "Cikarang, Jawa Barat",
		description:
			"Industrial energy-efficiency solutions provider: energy audits, equipment retrofits, and renewable energy installation.",
		nib: "9120001234567",
		npwp: "01.234.567.8-901.000",
		certifications: '["SNI ISO 50001","K3 Certificate","PJK3"]',
		portfolio:
			'["Boiler retrofit PT Maju Bersama (2023)","Solar rooftop 300 kWp PT Sinar Abadi (2024)"]',
		rating: 4.6,
		total: 12,
		verifiedDaysAgo: 30,
	},
	{
		email: "vendor2",
		serviceCategory: "HVAC and chillers",
		location: "Surabaya, Jawa Timur",
		description:
			"HVAC and refrigeration efficiency contractor: chiller retrofits, controls, and measurement-based performance contracting.",
		nib: "9120002234567",
		npwp: "02.345.678.9-012.000",
		certifications:
			'["SNI ISO 9001","K3 Certificate","Refrigerant Handling License"]',
		portfolio:
			'["Central chiller retrofit PT Sentra Graha Medika (2024)","Cold storage controls PT Pangan Utama (2025)"]',
		rating: 4.4,
		total: 9,
		verifiedDaysAgo: 120,
	},
	{
		email: "vendor3",
		serviceCategory: "Biomass and bioenergy",
		location: "Bekasi, Jawa Barat",
		description:
			"Biomass and waste-heat thermal systems: boiler conversion, feed systems, and emission control equipment.",
		nib: "9120003234567",
		npwp: "03.456.789.0-013.000",
		certifications:
			'["SNI ISO 45001","K3 Certificate","Boiler Operator License"]',
		portfolio:
			'["Biomass boiler 5 MWth PT Agro Industri Nusantara (2026)","Waste heat recovery PT Semen Nusantara (2025)"]',
		rating: 4.7,
		total: 14,
		verifiedDaysAgo: 200,
	},
	{
		email: "vendor4",
		serviceCategory: "Solar PV EPC",
		location: "Tangerang, Banten",
		description:
			"Solar PV engineering, procurement and construction for rooftop and ground-mount systems, including net-metering permits.",
		nib: "9120004234567",
		npwp: "04.567.890.1-014.000",
		certifications: '["SNI ISO 9001","K3 Certificate","IUPTLU Solar"]',
		portfolio:
			'["Rooftop solar 500 kWp PT Tekstil Jaya (2025)","Ground-mount 1 MWp PT Sawit Lestari (2024)"]',
		rating: 4.3,
		total: 7,
		verifiedDaysAgo: 150,
	},
	{
		email: "vendor5",
		serviceCategory: "Energy audit",
		location: "Gresik, Jawa Timur",
		description:
			"Industrial motor and drive efficiency specialist: energy audits, IE3 retrofits and variable speed drive integration.",
		nib: "9120005234567",
		npwp: "05.678.901.2-015.000",
		certifications: '["SNI ISO 50001","K3 Certificate"]',
		portfolio:
			'["IE3 motor retrofit PT Kertas Nusantara (2025)","VSD integration PT Baja Prima (2024)"]',
		rating: 4.1,
		total: 5,
		verifiedDaysAgo: 150,
	},
	{
		email: "vendor6",
		serviceCategory: "Solar PV EPC",
		location: "Denpasar, Bali",
		description:
			"Rooftop and ground-mount solar PV contractor: structural assessment, modules and inverters, net-metering paperwork, and monitoring.",
		nib: "9120006234567",
		npwp: "06.789.012.3-016.000",
		certifications: '["SNI ISO 9001","K3 Certificate","IUPTLU Solar"]',
		portfolio:
			'["Rooftop solar 420 kWp PT Graha Sentra Properti (2025)","Solar carport 120 kWp hotel group (2024)"]',
		rating: 4.5,
		total: 11,
		verifiedDaysAgo: 90,
	},
	{
		email: "vendor7",
		serviceCategory: "Energy audit",
		location: "Semarang, Jawa Tengah",
		description:
			"Energy audit house: metered baselines, ISO 50001 management systems, and savings verification for industrial plants.",
		nib: "9120007234567",
		npwp: "07.890.123.4-017.000",
		certifications: '["SNI ISO 50001","K3 Certificate","PJK3"]',
		portfolio:
			'["Plant-wide energy audit PT Kertas Nusantara (2025)","ISO 50001 baseline PT Tekstil Jaya (2024)"]',
		rating: 4.8,
		total: 18,
		verifiedDaysAgo: 240,
	},
	{
		email: "vendor8",
		serviceCategory: "HVAC and chillers",
		location: "Jakarta, DKI Jakarta",
		description:
			"Cooling plant contractor for commercial buildings and cold stores: chillers, controls, and kW/ton optimisation.",
		nib: "9120008234567",
		npwp: "08.901.234.5-018.000",
		certifications:
			'["SNI ISO 9001","K3 Certificate","Refrigerant Handling License"]',
		portfolio:
			'["Chiller replacement PT Graha Sentra Properti (2025)","Cold storage retrofit PT Pangan Utama (2024)"]',
		rating: 4.2,
		total: 8,
		verifiedDaysAgo: 180,
	},
	{
		email: "vendor9",
		serviceCategory: "Lighting retrofit",
		location: "Makassar, Sulawesi Selatan",
		description:
			"Industrial lighting contractor: photometric surveys, high-bay LED relamping, and occupancy control installation.",
		nib: "9120009234567",
		npwp: "09.012.345.6-019.000",
		certifications: '["SNI ISO 9001","K3 Certificate"]',
		portfolio:
			'["High-bay LED relamping PT Baja Prima (2025)","Warehouse lighting retrofit PT Sawit Lestari (2024)"]',
		rating: 4.0,
		total: 6,
		verifiedDaysAgo: 60,
	},
	{
		email: "vendor10",
		serviceCategory: "Boiler and steam systems",
		location: "Surabaya, Jawa Timur",
		description:
			"Steam and thermal systems contractor: boiler retrofits, burner tuning, and flue-gas heat recovery on industrial plants.",
		nib: "9120010234567",
		npwp: "10.123.456.7-020.000",
		certifications:
			'["SNI ISO 45001","K3 Certificate","Boiler Operator License"]',
		portfolio:
			'["Boiler retrofit PT Pangan Utama (2025)","Steam trap programme PT Tekstil Jaya (2023)"]',
		rating: 4.4,
		total: 10,
		verifiedDaysAgo: 130,
	},
];

const VENDOR_COMPANIES = VENDOR_EMAILS.map((email) =>
	accountField(email, "companyName"),
);

/** One vendor profile as SQL. The company name comes from the account list. */
function vendorProfileStatement(profile: VendorProfile): string {
	return `INSERT INTO vendor_profiles (user_id, company_name, description, service_category, location, nib, npwp, certifications, portfolio, rating, total_projects, verified_at, created_at)
	SELECT id, '${accountField(profile.email, "companyName")}', '${profile.description}', '${profile.serviceCategory}', '${profile.location}', '${profile.nib}', '${profile.npwp}', '${profile.certifications}', '${profile.portfolio}', ${profile.rating}, ${profile.total}, ${nowTs(-profile.verifiedDaysAgo)}, ${nowTs(-profile.verifiedDaysAgo)} FROM users WHERE email = '${profile.email}@greenshift.dev';`;
}

/**
 * Indices whose measures give the five discovery tenders one distinct vendor
 * speciality each (boiler, solar, chiller, motor, biomass), so every vendor has
 * a top-ranked opportunity on its own Discover page.
 */
const DISCOVERY_INDICES = [0, 1, 2, 6, 7] as const;

const userByEmail = (email: string) =>
	`(SELECT id FROM users WHERE email = '${email}@greenshift.dev')`;

/**
 * Title of the nth generated project. The title repeats once n%8 and n%15
 * repeat together, i.e. every 120 values, so callers must keep their indices
 * inside one 120-wide band: 0-4 for the discovery tenders and 10-34 for the
 * broker stage. The uniqueness guard below enforces that.
 */
const generatedTitle = (n: number) =>
	`${MEASURES[n % MEASURES.length]}, ${CITIES[n % CITIES.length]} Plant`;

/**
 * The fixture lookups find a project, a tender and a vendor by name, so a
 * repeated title would silently point two statements at the same row. Every
 * generated title is claimed here before it is written; the authored story
 * titles are unique by inspection.
 */
const usedTitles = new Set<string>();

function claimTitle(title: string): string {
	if (usedTitles.has(title)) {
		throw new Error(`duplicate project title: ${title}`);
	}
	usedTitles.add(title);
	return title;
}

/** A project carries exactly one broker assignment, so this lookup is unique. */
const assignmentIdFor = (title: string) =>
	`(SELECT id FROM broker_assignments WHERE project_id = ${projectId(title)})`;

/**
 * Every bid the fixtures place, as the matching model reads them: the vendor
 * that made it and the sector of the project it was made on. Technical fit is
 * the share of a vendor's bids made in the project's own sector, so the fixtures
 * keep their own history: without it the ranking they seed would disagree with
 * the one a matching re-run produces.
 */
const bidHistory: Array<{ vendorEmail: string; sector: string }> = [];

/**
 * A procurement round the web runs for one company: an open tender still taking
 * bids, or a closed one it has awarded. Planned before the rows are written,
 * because the winner of an awarded round is the best-ranked vendor that bid,
 * which is only known once the matching model has scored the pool.
 */
interface WebRound {
	title: string;
	/** The company that runs it. */
	companyEmail: string;
	/** City and province: the location the vendor is scored against. */
	location: string;
	sector: string;
	/** The measure being installed, which is what the scope card reads. */
	measure: string;
	budget: number;
	/** Varies the round's own rows (IRR, deadlines, assessment scores). */
	risk: number;
	/** The full wizard inputs, so the row and its ranking share one source. */
	params: ProjectParams;
	method: "open" | "closed";
	awarded: boolean;
	/** How long ago the round opened, so the fixtures age apart. */
	openedDaysAgo: number;
	bidders: string[];
}

/**
 * The ranked pool of each scored project, best first, as the matching block
 * computed it. The web reads it to award a tender, so the vendor a company
 * appoints is one its own ranking put forward.
 */
const rankingByProject: Record<string, string[]> = {};

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
	for (const profile of VENDOR_PROFILES.slice(3)) {
		out.push(vendorProfileStatement(profile));
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
		const title = claimTitle(generatedTitle(n));
		const budget = 400000000 + n * 150000000;
		const bid = Math.round(budget * 0.88);
		const city = CITIES[n % CITIES.length] as string;
		const sector = industrySectors[n % industrySectors.length] as string;
		bidHistory.push({ vendorEmail: "vendor1", sector });

		out.push(
			...projectStatements({
				company: userByEmail(
					BUSINESS_EMAILS[n % BUSINESS_EMAILS.length] as string,
				),
				title,
				description: `${MEASURES[n % MEASURES.length]} at the ${city} plant, covering design, equipment supply, installation and commissioning.`,
				status: "tendering",
				location: located(city),
				industrySector: sector,
				measure: MEASURES[n % MEASURES.length] as string,
				capexRp: budget,
				...wizardInputs(budget, n),
				createdDaysAgo: 22 + n,
			}),
			blueprintStatement(title, "validated", 23 + n),
			`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
	VALUES (${projectId(title)}, 'open', 'open', ${Math.round(budget * 0.7)}, ${budget}, ${nowTs(9 + n)}, ${nowTs(-22 - n)}, ${nowTs(-22 - n)});`,
			`INSERT INTO vendor_assignments (project_id, vendor_id, vendor_name, method, created_at, updated_at)
	VALUES (${projectId(title)}, ${vendorProfileId(accountField("vendor1", "companyName"))}, '${accountField("vendor1", "companyName")}', 'open', ${nowTs(-24 - n)}, ${nowTs(-24 - n)});`,
			`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, created_at, updated_at)
	VALUES (${tenderId(title)}, ${vendorProfileId("EcoTech Solutions")}, ${bid}, 'Detailed engineering, equipment supply, installation and commissioning with performance verification against the agreed baseline.', ${Math.round(budget * 0.06)}, ${13 + (n % 4)}, ${24 + (n % 3) * 12}, 'submitted', 1, ${nowTs(-9 - n)}, ${nowTs(-9 - n)}, ${nowTs(-9 - n)});`,
			`INSERT INTO proposal_revisions (proposal_id, revision_number, note, amount, previous_amount, created_by, created_at)
	VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId(title)}), 1, 'Please confirm the equipment list and the delivery schedule against the tender scope.', ${bid}, NULL, 'company', ${nowTs(-6 - n)});`,
			`INSERT INTO negotiations (proposal_id, iteration_number, status, requested_price_reduction, requested_warranty_years, requested_timeline_months, requested_fields, company_note, created_at, updated_at)
	VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId(title)}), 1, 'PENDING_VENDOR_RESPONSE', ${Math.round(budget * 0.03)}, 3, 6, '["Total Project Price","Unit & Service Warranty Period","Implementation Timeline"]', 'The board requires a longer warranty and a tighter implementation timeline for this package. Please revise the offer.', ${nowTs(-6 - n)}, ${nowTs(-6 - n)});`,
		);
	}

	// ── the procurement web, planned before its rows are written ──
	// Every company runs two rounds: an open tender still taking bids, and a
	// closed one it has awarded. Five vendors bid in each, drawn from the whole
	// pool by a rotation, so every company ranks a real field of bidders and every
	// vendor carries deals at every stage.
	//
	// The plan is data because the rows depend on the matching model: an awarded
	// round goes to the best-ranked vendor that bid, which is only known once the
	// pool has been scored. The bids are recorded here, though, because the model
	// scores technical fit from the bid history.
	const WEB_BIDDERS = 5;
	const webRounds: WebRound[] = [];
	for (
		let companyIndex = 0;
		companyIndex < BUSINESS_EMAILS.length;
		companyIndex++
	) {
		const companyEmail = BUSINESS_EMAILS[companyIndex] as string;
		const location = accountField(companyEmail, "address");
		// The round happens at the company's own plant, so it is titled and
		// located by it rather than by the city rotation the generated projects
		// use: a title that named another city than the location would read as a
		// different project.
		const city = location.split(",")[0] as string;
		for (let round = 0; round < 2; round++) {
			const measure = MEASURES[
				(companyIndex * 3 + round * 5) % MEASURES.length
			] as string;
			const bidders = Array.from(
				{ length: WEB_BIDDERS },
				(_, bidder) =>
					VENDOR_EMAILS[
						(companyIndex * WEB_BIDDERS + round * 3 + bidder) %
							VENDOR_EMAILS.length
					] as string,
			);
			const title = claimTitle(`${measure}, ${city} Plant`);
			const budget =
				350000000 + ((companyIndex * 3 + round * 7) % 9) * 180000000;
			const awarded = round === 1;
			const openedDaysAgo = 14 + companyIndex * 2 + round;
			const plan: WebRound = {
				title,
				companyEmail,
				location,
				sector: accountField(companyEmail, "industrySector"),
				measure,
				budget,
				risk: 16 + ((companyIndex + round * 3) % 7) * 4,
				params: {
					company: userByEmail(companyEmail),
					title,
					description: `${measure} at the ${city} plant, procured ${
						round === 0 ? "through an open tender" : "against a closed shortlist"
					} with metered performance verification.`,
					status: awarded ? "funding" : "tendering",
					location,
					industrySector: accountField(companyEmail, "industrySector"),
					measure,
					capexRp: budget,
					...wizardInputs(budget, companyIndex * 2 + round),
					createdDaysAgo: openedDaysAgo,
					updatedDaysAgo: awarded ? 6 : 1,
				},
				method: round === 0 ? "open" : "closed",
				awarded,
				openedDaysAgo,
				bidders,
			};
			// Registered here rather than at INSERT time: the matching block below
			// scores the pool before these rows are written, and it reads the risk
			// score each project's own params derive.
			paramsByTitle[plan.title] = plan.params;
			webRounds.push(plan);
			for (const vendorEmail of bidders) {
				bidHistory.push({ vendorEmail, sector: plan.sector });
			}
		}
	}

	// ── broker stage: five assignments for each broker ────────
	// Each generated project carries the full chain the broker and admin
	// surfaces read: a validated or published blueprint, an awarded tender, an
	// accepted proposal, a risk assessment, an assignment, monthly MRV reports,
	// delivery milestones and a document request.
	const STAGE_PROJECTS = ROW_FLOOR * ROW_FLOOR;
	for (let j = 0; j < STAGE_PROJECTS; j++) {
		const n = 10 + j;
		const title = claimTitle(generatedTitle(n));
		const city = CITIES[n % CITIES.length];
		const sector = industrySectors[n % industrySectors.length];
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
		bidHistory.push({
			vendorEmail: VENDOR_EMAILS[j % VENDOR_EMAILS.length] as string,
			sector,
		});
		// The first ten carry a published blueprint, which is what the public
		// catalog reads as "verified"; the rest stay in progress.
		const published = j < 10;
		const irr = 12 + (j % 6);

		out.push(
			...projectStatements({
				company,
				title,
				description: `${MEASURES[n % MEASURES.length]} at the ${city} plant, delivered as a performance-verified retrofit with metered reporting.`,
				status: "monitoring",
				location: located(city),
				industrySector: sector,
				measure: MEASURES[n % MEASURES.length] as string,
				capexRp: budget,
				...wizardInputs(budget, j),
				createdDaysAgo: 70 + (j % 20),
				updatedDaysAgo: 5 + (j % 4),
			}),
			`INSERT INTO blueprints (project_id, status, document, validated_at, published_at, created_at, updated_at)
	VALUES (${projectId(title)}, '${published ? "published" : "validated"}', '{"financialProjections":{"npv":${budget / 12},"irr":${irr},"paybackPeriod":4}}', ${nowTs(-40)}, ${published ? nowTs(-36) : "NULL"}, ${nowTs(-42)}, ${nowTs(-36)});`,
			`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
	VALUES (${projectId(title)}, 'closed', 'closed', ${Math.round(budget * 0.75)}, ${budget}, ${nowTs(-32)}, ${nowTs(-48)}, ${nowTs(-32)});`,
			`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, reviewed_at, created_at, updated_at)
	VALUES (${tenderId(title)}, ${vendor}, ${cost}, 'Turnkey delivery: detailed engineering, equipment supply, installation, commissioning and performance verification.', ${Math.round(budget * 0.05)}, ${irr}, 36, 'accepted', 0, ${nowTs(-30)}, ${nowTs(-24)}, ${nowTs(-30)}, ${nowTs(-24)});`,
			`UPDATE tenders SET status = 'awarded', awarded_proposal_id = (SELECT id FROM proposals WHERE tender_id = tenders.id) WHERE project_id = ${projectId(title)};`,
			`INSERT INTO vendor_assignments (project_id, vendor_id, vendor_name, method, created_at, updated_at)
	VALUES (${projectId(title)}, ${vendor}, '${accountField(VENDOR_EMAILS[j % VENDOR_EMAILS.length] as string, "companyName")}', 'closed', ${nowTs(-50)}, ${nowTs(-50)});`,
			`INSERT INTO risk_assessments (project_id, financial_score, technical_score, implementation_score, environmental_score, overall_score, recommendations, notes, assessed_by, assessed_at)
	VALUES (${projectId(title)}, ${20 + (j % 5) * 4}, ${24 + (j % 4) * 3}, ${30 + (j % 6) * 4}, ${18 + (j % 5) * 3}, ${24 + (j % 5) * 3}, '["Confirm the shutdown window before installation","Agree the metering boundary before commissioning"]', 'Financial, technical, implementation and environmental scores follow the platform model; the baseline is metered and verified.', 'system', ${nowTs(-26)});`,
			`INSERT INTO broker_assignments (project_id, broker_id, company_id, status, assigned_at, responded_at, bond_status, bond_serial_number, bond_amount, tenor_months, coupon_rate_percent, issuance_date, maturity_date, created_at, updated_at)
	VALUES (${projectId(title)}, ${broker}, ${company}, 'MONITORING', ${nowTs(-22)}, ${nowTs(-20)}, 'ISSUED', 'GS-BND-2026-1${String(j).padStart(2, "0")}', ${cost}, 36, ${7.5 + (j % 4) * 0.5}, ${nowTs(-18)}, ${nowTs(-18 + 1095)}, ${nowTs(-22)}, ${nowTs(-18)});`,
			`INSERT INTO document_requests (assignment_id, project_id, broker_id, company_id, category, document_type_name, required_period, reason, deadline_date, status, submitted_file_name, submitted_file_url, submitted_at, created_at, updated_at)
	VALUES (${assignmentIdFor(title)}, ${projectId(title)}, ${broker}, ${company}, '${["Financial", "Technical", "Legal", "Project"][j % 4]}', '${["Audited Financial Statements", "Operation & Maintenance Plan", "Company Deed & Business License (NIB)", "Project Budget Breakdown per Work Package"][j % 4]}', '2026', 'Required for the information memorandum and the ongoing monitoring obligation.', ${nowTs(-10)}, 'APPROVED', 'Monitoring_Pack_${String(j + 1).padStart(2, "0")}.pdf', 'documents/monitoring-pack-${String(j + 1).padStart(2, "0")}.pdf', ${nowTs(-14)}, ${nowTs(-20)}, ${nowTs(-14)});`,
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

		// One evidence file for the first few projects, which is what the project
		// drill-downs display. The documents themselves come from the project's
		// own checklist set.
		if (j < ROW_FLOOR) {
			out.push(
				`INSERT INTO milestone_evidence (milestone_id, kind, file_name, file_url, notes, uploaded_at)
	VALUES ((SELECT id FROM project_milestones WHERE project_id = ${projectId(title)} AND step_number = 1), 'document', 'Engineering_Package_${String(j + 1).padStart(2, "0")}.pdf', 'documents/engineering-package-${String(j + 1).padStart(2, "0")}.pdf', 'Stamped drawings issued for construction.', ${nowTs(-10 + j)});`,
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
				`INSERT INTO vendor_portfolio_items (vendor_id, project_name, client_name, project_type, location, description, project_value, duration_months, services_provided, energy_saving_percent, carbon_reduction_tons, completion_year, document_name, created_at, updated_at)
	VALUES (${vendorProfileId(company)}, '${MEASURES[k % MEASURES.length]}, ${CITIES[k % CITIES.length]}', '${["PT Tekstil Jaya", "PT Baja Prima", "PT Kertas Nusantara", "PT Sawit Lestari", "PT Sentra Graha Medika"][k % 5]}', '${industrySectors[k % industrySectors.length]}', '${CITIES[k % CITIES.length]}', 'Delivered as a turnkey efficiency package with metered savings verification and operator training.', ${value}, ${3 + (k % 6)}, 'Energy audit, detailed engineering, supply, installation, commissioning, operator training', ${(12 + (k % 8) * 1.7).toFixed(1)}, ${90 + (k % 7) * 45}, ${year}, 'Completion_Report_${year}.pdf', ${nowTs(-400 + k * 20)}, ${nowTs(-400 + k * 20)});`,
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

	// ── vendor matching scores, by the model the run uses ─────
	// Same five criteria, same weights and same location vocabulary as
	// `matching.service.ts` (imported from `scoring.ts`), computed over the vendor
	// profiles and the bid history the fixtures themselves created. A re-run of
	// the matching endpoint over the same rows therefore reproduces this ranking:
	// the seeds are a starting point, not a parallel model.
	//
	// `projectRisk` is the same for every vendor (it is a property of the project)
	// and is renormalised away, exactly as the run does. The criterion values stay
	// unrounded, as the model's own `clamp` leaves them: the total is what rounds.
	const clamp = (value: number) => Math.max(0, Math.min(100, value));

	/**
	 * The share of a vendor's bids made on projects in this sector, 0-100: the
	 * record `sectorShareByVendor` reads back. A vendor with no bids at all has
	 * no record, which is the case the run answers from the profile text; the
	 * fixtures give every vendor bids, so an empty history is a fixture bug and
	 * fails here rather than seeding a fit score the run would not produce.
	 */
	function technicalFitOf(vendorEmail: string, sector: string): number {
		const bids = bidHistory.filter((bid) => bid.vendorEmail === vendorEmail);
		if (bids.length === 0) {
			throw new Error(`${vendorEmail} has no bids: give it a tender first`);
		}
		const inSector = bids.filter((bid) => bid.sector === sector).length;
		return clamp((inSector / bids.length) * 100);
	}

	/** One vendor's five criteria for one project. */
	function criteriaFor(
		vendorEmail: string,
		target: { sector: string; location: string; risk: number },
	): Record<string, number> {
		const profile = VENDOR_PROFILES.find(
			(candidate) => candidate.email === vendorEmail,
		);
		if (!profile) throw new Error(`no profile for ${vendorEmail}`);
		const delivered = profile.total / PORTFOLIO_REFERENCE;
		const record = clamp(
			(profile.rating / MAX_RATING) * 50 + delivered * 50,
		);
		return {
			technicalFit: technicalFitOf(vendorEmail, target.sector),
			relevantExperience: clamp(
				(profile.total / EXPERIENCE_REFERENCE) * 100,
			),
			historicalPerformance: clamp((profile.rating / MAX_RATING) * 100),
			priceValue: clamp(
				record * VALUE_PORTFOLIO_SHARE +
					proximityScore(profile.location, target.location) *
						(1 - VALUE_PORTFOLIO_SHARE),
			),
			projectRisk: clamp(100 - target.risk),
		};
	}

	// Every tender a vendor can see is scored, so no opportunity card renders
	// unscored, and every project a company can rank is scored too: an awarded
	// tender without a ranking behind it reads as a project that was never
	// matched. Each target carries the sector, location and risk score its own
	// project row carries, so the ranking and the project agree.
	const scoreTargets: Array<{
		title: string;
		sector: string;
		location: string;
		risk: number;
	}> = [
		...DISCOVERY_INDICES.map((n) => ({
			title: generatedTitle(n),
			sector: industrySectors[n % industrySectors.length] as string,
			location: located(CITIES[n % CITIES.length] as string),
			risk: riskScoreOf(generatedTitle(n)),
		})),
		...Array.from({ length: STAGE_PROJECTS }, (_, j) => ({
			title: generatedTitle(10 + j),
			sector: industrySectors[(10 + j) % industrySectors.length] as string,
			location: located(CITIES[(10 + j) % CITIES.length] as string),
			risk: riskScoreOf(generatedTitle(10 + j)),
		})),
		...webRounds.map((round) => ({
			title: round.title,
			sector: round.sector,
			location: round.location,
			risk: riskScoreOf(round.title),
		})),
		// The story's own projects, with the sector, location and risk their rows
		// carry: a company past procurement still shows the ranking it awarded out
		// of.
		{
			title: "Textile Factory Retrofit",
			sector: "Textile",
			location: located("Malang"),
			risk: riskScoreOf("Textile Factory Retrofit"),
		},
		{
			title: "Solar Rooftop 500 kWp",
			sector: "Machinery",
			location: located("Surabaya"),
			risk: riskScoreOf("Solar Rooftop 500 kWp"),
		},
		{
			title: "Compressed Air Optimization",
			sector: "Food and beverage",
			location: located("Sidoarjo"),
			risk: riskScoreOf("Compressed Air Optimization"),
		},
		{
			title: "Factory LED Lighting",
			sector: "Chemical",
			location: located("Gresik"),
			risk: riskScoreOf("Factory LED Lighting"),
		},
		{
			title: "Biomass Boiler",
			sector: "Pulp and paper",
			location: located("Pasuruan"),
			risk: riskScoreOf("Biomass Boiler"),
		},
		{
			title: "Factory Chiller Retrofit",
			sector: "Iron and steel",
			location: located("Sidoarjo"),
			risk: riskScoreOf("Factory Chiller Retrofit"),
		},
		{
			title: "Electric Motor Efficiency",
			sector: "Machinery",
			location: located("Gresik"),
			risk: riskScoreOf("Electric Motor Efficiency"),
		},
		{
			title: "Industrial Waste Heat Recovery",
			sector: "Cement",
			location: located("Cilacap"),
			risk: riskScoreOf("Industrial Waste Heat Recovery"),
		},
		{
			title: "Cold Storage Efficiency Retrofit",
			sector: "Food and beverage",
			location: located("Bekasi"),
			risk: riskScoreOf("Cold Storage Efficiency Retrofit"),
		},
		{
			title: "Cooling Tower Retrofit, Gresik",
			sector: "Chemical",
			location: located("Gresik"),
			risk: riskScoreOf("Cooling Tower Retrofit, Gresik"),
		},
	];

	// The rows are written after the procurement web below, because every one of
	// them keys off a project by name: a project inserted later would leave its
	// ranking unattributed.
	const matchScoreStatements: string[] = [];

	for (const target of scoreTargets) {
		const scored = VENDOR_EMAILS.map((vendorEmail) => ({
			vendorEmail,
			criteria: criteriaFor(vendorEmail, target),
		}));

		// The total renormalises over the criteria that separate the pool, which is
		// what the run does and what the screen's weights report.
		const separating = separatingCriteria(scored.map((row) => row.criteria));
		const weightTotal = separating.reduce(
			(sum, key) => sum + MATCH_WEIGHTS[key],
			0,
		);
		const ranked = scored
			.map((row) => ({
				...row,
				total: Math.round(
					separating.reduce(
						(sum, key) => sum + row.criteria[key] * MATCH_WEIGHTS[key],
						0,
					) / weightTotal,
				),
			}))
			// Best first, ties broken by the order the profiles were inserted in,
			// which is the order the run's own vendor ids break them in.
			.sort(
				(a, b) =>
					b.total - a.total ||
					VENDOR_EMAILS.indexOf(a.vendorEmail) -
						VENDOR_EMAILS.indexOf(b.vendorEmail),
			);

		rankingByProject[target.title] = ranked.map((row) => row.vendorEmail);

		ranked.forEach((row, index) => {
			const profile = VENDOR_PROFILES.find(
				(candidate) => candidate.email === row.vendorEmail,
			);
			if (!profile) throw new Error(`no profile for ${row.vendorEmail}`);
			matchScoreStatements.push(
				`INSERT INTO vendor_match_scores (project_id, vendor_id, technical_fit, relevant_experience, historical_performance, price_value, project_risk, total_score, rank, created_at)
	VALUES (${projectId(target.title)}, ${vendorProfileId(accountField(profile.email, "companyName"))}, ${row.criteria.technicalFit}, ${row.criteria.relevantExperience}, ${row.criteria.historicalPerformance}, ${row.criteria.priceValue}, ${row.criteria.projectRisk}, ${row.total}, ${index + 1}, ${nowTs(-4)});`,
			);
		});
	}

	// ── the procurement web: tenders, bids, revisions and awards ──
	// Written after the scores, because an awarded round goes to the best-ranked
	// vendor that bid: the ranking the company chose out of and the pool it chose
	// from have to tell the same story. Each round also carries the history the
	// screens read beside a bid (the revision notes, the negotiation rounds) and
	// each awarded round hands its winner milestones and reporting periods, so
	// the vendor's own project view has work in it.
	const NEGOTIATION_FIELDS =
		'["Total Project Price","Unit & Service Warranty Period","Implementation Timeline"]';

	/**
	 * Where the company marked the bidder's proposal when it asked for the first
	 * revision. Fractions of the proposal page the API renders, measured against
	 * the seeded technical scope, so a mark lands on the figure it is about and
	 * the vendor reads the same circles the company drew.
	 */
	const REVISION_MARKS = JSON.stringify([
		{
			id: "mark-amount",
			kind: "highlight",
			x: 0.06,
			y: 0.335,
			w: 0.88,
			h: 0.09,
		},
		{ id: "mark-warranty", kind: "circle", x: 0.55, y: 0.58, w: 0.4, h: 0.1 },
		{ id: "mark-scope", kind: "highlight", x: 0.06, y: 0.8, w: 0.88, h: 0.11 },
	]);

	for (const round of webRounds) {
		const ranked = rankingByProject[round.title] ?? [];
		const winner = ranked.find((email) => round.bidders.includes(email));
		if (!winner) {
			throw new Error(`no scored bidder for the round on ${round.title}`);
		}
		const opened = round.openedDaysAgo;

		out.push(
			...projectStatements(round.params),
			// A round is past verification either way, so it carries the document a
			// bidder reads beside the tender: the awarded round's is published, the
			// open one's is validated and waiting on the bids.
			...(round.awarded
				? [blueprintStatement(round.title, "published", opened - 6)]
				: [blueprintStatement(round.title, "validated", opened + 1)]),
			`INSERT INTO tenders (project_id, method, status, budget_min, budget_max, deadline_at, created_at, updated_at)
	VALUES (${projectId(round.title)}, '${round.method}', '${round.awarded ? "awarded" : "open"}', ${Math.round(round.budget * 0.78)}, ${round.budget}, ${round.awarded ? nowTs(-opened + 10) : nowTs(10 + (round.risk % 9))}, ${nowTs(-opened)}, ${nowTs(round.awarded ? -6 : -1)});`,
			// The company's matchmaking choice, which is what opened the tender: an
			// open one invites every verified vendor, a closed one only the three it
			// was offered.
			`INSERT INTO vendor_assignments (project_id, vendor_id, vendor_name, method, created_at, updated_at)
	VALUES (${projectId(round.title)}, ${vendorProfileId(accountField(round.awarded ? winner : (ranked[0] as string), "companyName"))}, '${accountField(round.awarded ? winner : (ranked[0] as string), "companyName")}', '${round.method}', ${nowTs(-opened - 1)}, ${nowTs(-opened - 1)});`,
		);

		round.bidders.forEach((vendorEmail, bidder) => {
			const amount = Math.round(round.budget * (0.82 + bidder * 0.035));
			const accepted = round.awarded && vendorEmail === winner;
			/* An awarded tender is decided, so its bids are too: the winner is
			   `accepted` and every other bid was rejected when it was awarded,
			   which is what `awardBid` writes. An open round keeps one bidder at
			   each stage instead, because that is what the screens have to show
			   while the decision is still open. */
			const status = round.awarded
				? accepted
					? "accepted"
					: "rejected"
				: bidder === 0
					? "revision"
					: bidder === 2
						? "reviewed"
						: bidder === 4
							? "rejected"
							: "submitted";
			const revisions = bidder === 3 ? 2 : bidder === 0 ? 1 : 0;
			const reviewedAt = accepted || bidder === 2 ? nowTs(-3) : "NULL";

			out.push(
				`INSERT INTO proposals (tender_id, vendor_id, amount, technical_spec, operational_cost, projected_roi, warranty_period, status, revision_count, submitted_at, reviewed_at, created_at, updated_at)
	VALUES (${tenderId(round.title)}, ${vendorProfileId(accountField(vendorEmail, "companyName"))}, ${amount}, 'Turnkey delivery against the tender scope: engineering, equipment supply, installation, commissioning and performance verification against the agreed baseline.', ${Math.round(round.budget * 0.05)}, ${12 + bidder + (round.risk % 4)}, ${24 + (bidder % 3) * 12}, '${status}', ${revisions}, ${nowTs(-opened + 2 + bidder)}, ${reviewedAt}, ${nowTs(-opened + 2 + bidder)}, ${nowTs(-3)});`,
			);

			for (let revision = 1; revision <= revisions; revision++) {
				const previous = Math.round(amount * (1 + 0.04 * revision));
				out.push(
					`INSERT INTO proposal_revisions (proposal_id, revision_number, note, amount, previous_amount, created_by, created_at)
	VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId(round.title)} AND vendor_id = ${vendorProfileId(accountField(vendorEmail, "companyName"))}), ${revision}, '${revision === 1 ? "The offer is above the tender ceiling and the warranty is shorter than the board requires. Please revise the price and extend the warranty." : "The revised price is accepted in principle; please confirm the delivery schedule against the plant shutdown window."}', ${amount}, ${previous}, '${revision === 1 ? "company" : "vendor"}', ${nowTs(-opened + 4 + revision)});`,
				);
			}

			if (bidder === 0 || bidder === 3) {
				out.push(
					`INSERT INTO negotiations (proposal_id, iteration_number, status, requested_price_reduction, requested_warranty_years, requested_timeline_months, requested_fields, company_note, annotations, vendor_revised_price, vendor_revised_warranty_years, vendor_response_note, responded_at, created_at, updated_at)
	VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId(round.title)} AND vendor_id = ${vendorProfileId(accountField(vendorEmail, "companyName"))}), 1, '${round.awarded ? (accepted ? "AGREED" : "LOCKED") : bidder === 0 ? "PENDING_VENDOR_RESPONSE" : "SUBMITTED_BY_VENDOR"}', ${Math.round(amount * 0.05)}, 3, 6, '${NEGOTIATION_FIELDS}', 'The board requires a lower price and a longer warranty for this package. Please revise the offer.', '${REVISION_MARKS}', ${bidder === 0 ? "NULL" : Math.round(amount * 0.96)}, ${bidder === 0 ? "NULL" : 3}, ${bidder === 0 ? "NULL" : "'Revised price and warranty attached; the delivery schedule is unchanged.'"}, ${bidder === 0 ? "NULL" : nowTs(-2)}, ${nowTs(-opened + 5)}, ${nowTs(-2)});`,
				);
			}
			if (bidder === 3) {
				out.push(
					`INSERT INTO negotiations (proposal_id, iteration_number, status, requested_price_reduction, requested_warranty_years, requested_timeline_months, requested_fields, company_note, vendor_revised_price, vendor_revised_warranty_years, vendor_revised_timeline_months, vendor_response_note, responded_at, created_at, updated_at)
	VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId(round.title)} AND vendor_id = ${vendorProfileId(accountField(vendorEmail, "companyName"))}), 2, '${round.awarded ? (accepted ? "AGREED" : "LOCKED") : "AGREED"}', 0, 3, 6, '${NEGOTIATION_FIELDS}', 'Agreed at the revised price, the 36-month warranty and the shortened schedule.', ${Math.round(amount * 0.96)}, 3, 6, 'Accepted; the revised offer stands as agreed.', ${nowTs(-1)}, ${nowTs(-2)}, ${nowTs(-1)});`,
				);
			}
			if (bidder === 4) {
				out.push(
					`INSERT INTO negotiations (proposal_id, iteration_number, status, requested_price_reduction, requested_warranty_years, requested_timeline_months, requested_fields, company_note, created_at, updated_at)
	VALUES ((SELECT id FROM proposals WHERE tender_id = ${tenderId(round.title)} AND vendor_id = ${vendorProfileId(accountField(vendorEmail, "companyName"))}), 1, '${accepted ? "AGREED" : "LOCKED"}', ${Math.round(amount * 0.08)}, 4, 6, '${NEGOTIATION_FIELDS}', 'The price is above the tender ceiling and the warranty cannot be extended at this price, so this offer is closed.', ${nowTs(-opened + 7)}, ${nowTs(-3)});`,
				);
			}
		});

		if (!round.awarded) continue;

		out.push(
			`UPDATE tenders SET awarded_proposal_id = (SELECT id FROM proposals WHERE tender_id = tenders.id AND status = 'accepted')
	WHERE project_id = ${projectId(round.title)};`,
			`INSERT INTO risk_assessments (project_id, financial_score, technical_score, implementation_score, environmental_score, overall_score, recommendations, notes, assessed_by, assessed_at)
	VALUES (${projectId(round.title)}, ${20 + (round.risk % 5) * 4}, ${24 + (round.risk % 4) * 3}, ${30 + (round.risk % 6) * 4}, ${18 + (round.risk % 5) * 3}, ${24 + (round.risk % 5) * 3}, '["Confirm the shutdown window before installation","Agree the metering boundary before commissioning"]', 'Financial, technical, implementation and environmental scores follow the platform model; the baseline is metered and verified.', 'system', ${nowTs(-5)});`,
		);

		for (let step = 1; step <= 3; step++) {
			const done = step < 3;
			out.push(
				`INSERT INTO project_milestones (project_id, step_number, title, description, start_date, due_date, completion_percent, status, vendor_notes, company_review_notes, created_at, updated_at)
	VALUES (${projectId(round.title)}, ${step}, '${["Site Survey & Engineering Design", "Procurement & Factory Acceptance Test", "Installation & Commissioning"][step - 1]}', 'Delivered against the approved engineering package with evidence for each stage.', ${nowTs(-4 + step * 4)}, ${nowTs(step)}, ${done ? 100 : 45}, '${done ? "APPROVED" : "IN_PROGRESS"}', ${done ? "'Stage completed and evidence uploaded for review.'" : "'Works are under way on site.'"}, ${done ? "'Reviewed and approved.'" : "NULL"}, ${nowTs(-4 + step * 4)}, ${nowTs(step)});`,
			);
		}

		for (const period of [1, 2]) {
			out.push(
				`INSERT INTO emission_reports (project_id, period_start, period_end, actual_consumption, baseline_consumption, emission_reduction, anomaly_flagged, report_data, verified_by, verified_at, created_at)
	VALUES (${projectId(round.title)}, ${nowTs(-60 + period * 30)}, ${nowTs(-30 + period * 30)}, ${Math.round(430000 - (round.risk % 6) * 14000 + period * 5000)}, 420000, ${(5 + (round.risk % 5) * 0.8).toFixed(2)}, 0, '{"overallStatus":"ON_TRACK","detectedRisksOrAnomalies":[],"overallConclusion":"Metered reduction is tracked against the validated baseline."}', ${userByEmail("admin1")}, ${nowTs(-30 + period * 30)}, ${nowTs(-30 + period * 30)});`,
			);
		}
	}

	// ── the rankings, once every project they rank exists ─────
	out.push(...matchScoreStatements);

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
		...webRounds
			.filter((round) => round.awarded)
			.map((round, index) => ({ title: round.title, seed: 50 + index })),
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

