import type {
	ActiveVendorProject,
	CompanyVerificationDetails,
	NegotiationRequest,
	OpenBidLeaderboardEntry,
	StructuredProposal,
	VendorNotification,
	VendorPerformanceMetrics,
	VendorPortfolioItem,
	VendorProjectCardData,
} from "./types";

export const initialVerificationDetails: CompanyVerificationDetails = {
	status: "VERIFIED",
	nib: "9120405821034",
	npwp: "01.345.678.9-012.000",
	legalDocUrl: "SIUP_EcoTech_Solutions.pdf",
	escoCertificationUrl: "ESCO_Class_A_License.pdf",
	isoCertificationUrl: "ISO_50001_Energy_Management.pdf",
	submittedAt: "2026-01-15T09:00:00Z",
	verifiedAt: "2026-01-15T09:05:00Z",
};

export const sampleProjects: VendorProjectCardData[] = [
	{
		id: "proj-1",
		title: "1.2 MWp Rooftop Solar PV Installation for Textile Facility",
		companyName: "PT Sinar Tekstil Indonesia",
		industrySector: "Manufacturing & Textiles",
		location: "Cikarang, West Java",
		estimatedValue: 12500000000,
		clientBudget: 13000000000,
		carbonReductionTargetTons: 1420,
		procurementMethod: "OPEN_BIDDING",
		tenderDeadlineAt: "2026-09-12T17:00:00Z",
		description:
			"On-grid 1.2 MWp Rooftop Solar PV installation project for a 24/7 continuous textile manufacturing plant. Requires industrial-grade inverters and integrated IoT energy monitoring system.",
		riskScore: 82,
		technicalRequirements: [
			"Tier-1 Tier-A Solar Panels (min 550Wp)",
			"Three-Phase String Inverters with efficiency > 98.5%",
			"Real-time SCADA & Smart Metering Integration",
			"Corrosion-resistant Anodized Aluminium Mounting Structure",
		],
		deliverables: [
			"Engineering & Detailed Design Specification (DED)",
			"Procurement & Installation of 1.2 MWp PV System",
			"72-Hour Commissioning & Load Reliability Testing",
			"Plant Operations & Maintenance Training",
		],
		matchmaking: {
			technicalFit: 95,
			technicalFitExplanation:
				"Your company holds Class-A ESCO certification and extensive 3-phase industrial inverter procurement experience.",
			relevantExperience: 92,
			relevantExperienceExplanation:
				"You have successfully delivered 8 manufacturing rooftop solar installations over the past 3 years.",
			historicalPerformance: 94,
			historicalPerformanceExplanation:
				"96% on-time completion rate across projects exceeding 1 MWp capacity.",
			priceAndValue: 88,
			priceAndValueExplanation:
				"Your historical cost structure is highly competitive against PT Sinar Tekstil's allocated budget.",
			projectRisk: 90,
			projectRiskExplanation:
				"Proven engineering execution substantially mitigates grid-tie synchronization risks.",
			overallMatch: 92,
		},
		isSaved: true,
	},
	{
		id: "proj-2",
		title: "High-Efficiency HVAC & Smart Chiller Retrofit",
		companyName: "PT Sentra Graha Medika",
		industrySector: "Healthcare & Hospitals",
		location: "Surabaya, East Java",
		estimatedValue: 8400000000,
		clientBudget: 9000000000,
		carbonReductionTargetTons: 890,
		procurementMethod: "CLOSED_BIDDING",
		tenderDeadlineAt: "2026-09-15T15:00:00Z",
		description:
			"Replacement of aging central chiller units with modern VFD Magnetic Bearing Chillers and hospital cleanroom Building Management System (BMS) integration.",
		riskScore: 78,
		technicalRequirements: [
			"Water-Cooled Centrifugal VFD Chiller",
			"BACnet IP Integration with Hospital BMS",
			"Acoustic Noise Level < 65 dBA",
			"5-Year Compressor & Performance Warranty",
		],
		deliverables: [
			"Energy Audit & Chiller Load Dynamic Modeling",
			"Zero-Downtime HVAC Central Plant Retrofit",
			"ISO 50001 Energy Savings Measurement & Verification (M&V)",
		],
		matchmaking: {
			technicalFit: 90,
			technicalFitExplanation:
				"Your HVAC engineering team is certified in magnetic bearing chiller deployment.",
			relevantExperience: 86,
			relevantExperienceExplanation:
				"Executed 5 hospital cleanroom retrofit projects in East Java.",
			historicalPerformance: 92,
			historicalPerformanceExplanation:
				"Consistently exceeded client efficiency baselines by an average of 4.2%.",
			priceAndValue: 85,
			priceAndValueExplanation:
				"Turnkey proposal falls well within the hospital group's capital expenditure limit.",
			projectRisk: 88,
			projectRiskExplanation:
				"Staged installation plan eliminates patient care facility disruption risks.",
			overallMatch: 88,
		},
		isSaved: false,
	},
	{
		id: "proj-3",
		title: "Commercial Tower Smart LED Lighting & IoT Energy Management",
		companyName: "PT Menara Sentosa Abadi",
		industrySector: "Commercial Real Estate",
		location: "Jakarta Pusat",
		estimatedValue: 4200000000,
		clientBudget: 4500000000,
		carbonReductionTargetTons: 410,
		procurementMethod: "DIRECT_SELECTION",
		invitedVendorId: "vendor-1", // Only this vendor can see direct selection projects
		tenderDeadlineAt: "2026-09-20T12:00:00Z",
		description:
			"Full lighting retrofit across a 32-story commercial office tower with IoT daylight sensors and tenant sub-metering management.",
		riskScore: 92,
		technicalRequirements: [
			"Smart LED Troffer & Downlight DALI-2 Driver",
			"Daylight Harvesting & Motion Sensor Integration",
			"Per-floor Sub-metering Power Monitoring Dashboard",
		],
		deliverables: [
			"Installation of Smart LED Lighting across 32 Floors",
			"Commissioning Protocol & Software Dashboard Setup",
		],
		matchmaking: {
			technicalFit: 98,
			technicalFitExplanation:
				"Core specialization in enterprise smart building lighting and BMS controls.",
			relevantExperience: 95,
			relevantExperienceExplanation:
				"Completed 12 high-rise commercial buildings in the greater Jakarta area.",
			historicalPerformance: 96,
			historicalPerformanceExplanation:
				"Client satisfaction score of 4.9/5.0 with exceptional delivery punctuality.",
			priceAndValue: 92,
			priceAndValueExplanation:
				"Highly cost-effective package pricing with rapid 18-month payback.",
			projectRisk: 95,
			projectRiskExplanation:
				"Standard indoor deployment with minimal structural or operational risk.",
			overallMatch: 95,
		},
		isSaved: false,
	},
	{
		id: "proj-4",
		title: "500 kWp Floating Solar PV for Industrial Water Reservoir",
		companyName: "PT Petrokimia Gresik",
		industrySector: "Chemical Manufacturing",
		location: "Gresik, East Java",
		estimatedValue: 6800000000,
		clientBudget: 7200000000,
		carbonReductionTargetTons: 620,
		procurementMethod: "OPEN_BIDDING",
		tenderDeadlineAt: "2026-09-25T17:00:00Z",
		description:
			"Installation of floating solar PV system on chemical plant water reservoir to reduce grid dependency and meet sustainability targets. Requires specialized mounting for water surface and corrosion-resistant components.",
		riskScore: 85,
		technicalRequirements: [
			"Floating Solar PV Modules (min 550Wp)",
			"HDPE Floating Platform System",
			"Corrosion-Resistant Electrical Components (IP68)",
			"Real-time Performance Monitoring IoT",
		],
		deliverables: [
			"Feasibility Study & Reservoir Assessment",
			"Floating Platform Design & Installation",
			"PV System Commissioning & Grid Parallel",
			"12-Month O&M Training Handover",
		],
		matchmaking: {
			technicalFit: 94,
			technicalFitExplanation:
				"Your company has completed 3 floating solar projects in industrial settings.",
			relevantExperience: 91,
			relevantExperienceExplanation:
				"Proven track record in chemical plant renewable energy installations.",
			historicalPerformance: 93,
			historicalPerformanceExplanation:
				"Consistent on-time delivery with 97% client satisfaction.",
			priceAndValue: 88,
			priceAndValueExplanation:
				"Competitive pricing with proven ROI in similar industrial projects.",
			projectRisk: 90,
			projectRiskExplanation:
				"Moderate risk with proven floating platform technology.",
			overallMatch: 93,
		},
		isSaved: true,
	},
	{
		id: "proj-5",
		title: "Cement Plant Waste Heat Recovery & ORC Power Generation",
		companyName: "PT Semen Nusantara Perkasa",
		industrySector: "Heavy Industry & Cement",
		location: "Tuban, East Java",
		estimatedValue: 18500000000,
		clientBudget: 20000000000,
		carbonReductionTargetTons: 2800,
		procurementMethod: "CLOSED_BIDDING",
		tenderDeadlineAt: "2026-10-05T17:00:00Z",
		description:
			"Turnkey EPC waste heat recovery power generation utilizing Organic Rankine Cycle (ORC) from kiln exhaust gases. Requires high-temperature heat exchangers and automated power grid synchronization.",
		riskScore: 84,
		technicalRequirements: [
			"High-Temperature Exhaust Heat Recovery Exchangers",
			"Organic Rankine Cycle (ORC) Turbine Generator 3.5 MW",
			"Closed-Loop Thermal Oil Circulation System",
			"PLC & SCADA Plant Automation Integration",
		],
		deliverables: [
			"Detailed Engineering & Kiln Thermal Audit",
			"ORC System Procurement & Civil Foundations",
			"Integration Testing & Parallel Grid Operation",
			"O&M Personnel Training & Commissioning Handover",
		],
		matchmaking: {
			technicalFit: 92,
			technicalFitExplanation:
				"Strong background in heavy industry thermal energy capture and turbine systems.",
			relevantExperience: 90,
			relevantExperienceExplanation:
				"Completed 2 large-scale waste heat recovery projects in cement plants.",
			historicalPerformance: 94,
			historicalPerformanceExplanation:
				"Exceptional thermal performance compliance and punctuality record.",
			priceAndValue: 86,
			priceAndValueExplanation:
				"Comprehensive proposal offering attractive 3.2-year investment payback.",
			projectRisk: 88,
			projectRiskExplanation:
				"Engineered bypass ducts prevent kiln production disruption during tie-in.",
			overallMatch: 91,
		},
		isSaved: false,
	},
	{
		id: "proj-6",
		title: "Island Resort Hybrid Solar Microgrid & BESS Energy Storage",
		companyName: "PT Surya Wisata Bahari",
		industrySector: "Hospitality & Eco-Tourism",
		location: "Labuan Bajo, East Nusa Tenggara",
		estimatedValue: 7200000000,
		clientBudget: 7500000000,
		carbonReductionTargetTons: 640,
		procurementMethod: "OPEN_BIDDING",
		tenderDeadlineAt: "2026-09-30T15:00:00Z",
		description:
			"Off-grid island resort microgrid combining 600 kWp ground-mounted solar PV with 1.2 MWh Containerized Lithium-Iron-Phosphate (LFP) Battery Energy Storage System (BESS) and smart diesel generator dispatch.",
		riskScore: 88,
		technicalRequirements: [
			"600 kWp N-Type Bifacial Solar PV Array",
			"1.2 MWh Containerized LFP BESS with Liquid Cooling",
			"Microgrid Controller with Seamless Islanding Function",
			"Marine-Grade Anti-Corrosion Enclosures (C5-M)",
		],
		deliverables: [
			"Microgrid Dynamic Simulation & Soil Geotechnical Study",
			"Turnkey EPC Procurement & Island Logistics Transport",
			"BESS Commissioning & 100-Hour Continuous Load Testing",
			"Comprehensive Remote Cloud Monitoring Setup",
		],
		matchmaking: {
			technicalFit: 96,
			technicalFitExplanation:
				"Extensive expertise in off-grid BESS microgrids and coastal renewable engineering.",
			relevantExperience: 93,
			relevantExperienceExplanation:
				"Successfully deployed 4 remote island microgrids across Eastern Indonesia.",
			historicalPerformance: 95,
			historicalPerformanceExplanation:
				"Proven track record of zero operational downtime post-commissioning.",
			priceAndValue: 90,
			priceAndValueExplanation:
				"Highly competitive package incorporating high-cycle LFP battery technology.",
			projectRisk: 92,
			projectRiskExplanation:
				"Pre-commissioned containerized architecture dramatically minimizes on-site installation risks.",
			overallMatch: 94,
		},
		isSaved: false,
	},
];

export const sampleOpenBidLeaderboard: OpenBidLeaderboardEntry[] = [
	{
		rank: 1,
		vendorName: "Vendor A",
		isCurrentVendor: false,
		currentPrice: 11800000000,
		updatedAt: "2026-09-05T14:30:00Z",
	},
	{
		rank: 2,
		vendorName: "EcoTech Solutions (You)",
		isCurrentVendor: true,
		currentPrice: 12100000000,
		updatedAt: "2026-09-05T10:15:00Z",
	},
	{
		rank: 3,
		vendorName: "Vendor B",
		isCurrentVendor: false,
		currentPrice: 12450000000,
		updatedAt: "2026-09-05T11:00:00Z",
	},
];

export const sampleProposals: StructuredProposal[] = [
	{
		id: "prop-101",
		tenderId: "tender-1",
		projectId: "proj-1",
		projectTitle: "1.2 MWp Rooftop Solar PV Installation for Textile Facility",
		companyName: "PT Sinar Tekstil Indonesia",
		procurementMethod: "OPEN_BIDDING",
		status: "UNDER_EVALUATION",
		executiveSummary:
			"Turnkey 1.2 MWp Rooftop Solar PV solution utilizing Tier-1 Jinko Solar 560Wp panels with Huawei SUN2000 string inverters. Engineered to maximize plant self-consumption during daytime manufacturing peaks.",
		technicalSolution:
			"1.2 MWp On-Grid system featuring 2,142 high-efficiency PV modules, 10 units of 100kW string inverters, and corrosion-resistant aluminium mounting with 12-degree tilt angle.",
		equipmentSpecs:
			"Jinko Solar 560Wp N-Type, Huawei SUN2000-100KTL Inverters.",
		includedScope:
			"Design, Procurement, Civil/Structural Racking, Electrical Wiring, Testing & Commissioning, PLN Parallel Net-Metering Permit.",
		excludedScope:
			"Structural reinforcement of legacy warehouse roofing if needed.",
		estimatedStartDate: "2026-10-01",
		estimatedDurationMonths: 4,
		costBreakdown: {
			equipmentCost: 8900000000,
			installationCost: 1800000000,
			laborCost: 900000000,
			operationalCost: 300000000,
			otherCost: 200000000,
			totalPrice: 12100000000,
		},
		expectedImpact: {
			energySavingsPercent: 26,
			carbonReductionTons: 1450,
			projectedRoiPercent: 18.2,
		},
		warrantyYears: 5,
		warrantyCoverage:
			"25-Year Solar Module Linear Performance Warranty, 10-Year Inverter Warranty, 5-Year Full Workmanship & Maintenance Coverage.",
		pdfDocumentName: "Technical_Proposal_SolarPV_SinarTekstil.pdf",
		submittedAt: "2026-09-04T11:20:00Z",
		revisionCount: 1,
	},
	{
		id: "prop-102",
		tenderId: "tender-2",
		projectId: "proj-2",
		projectTitle: "High-Efficiency HVAC & Smart Chiller Retrofit",
		companyName: "PT Sentra Graha Medika",
		procurementMethod: "CLOSED_BIDDING",
		status: "NEGOTIATION",
		executiveSummary:
			"Replacement of 2 aging 300 TR conventional chillers with high-efficiency Daikin Magnetic Bearing Centrifugal Chillers featuring COP 6.8 and hospital BMS integration.",
		technicalSolution:
			"Chilled water piping reconfiguration, circulation pump VFD installation, and BACnet IP gateway integration to central hospital facility control.",
		equipmentSpecs:
			"Daikin MagBear 300TR, Danfoss VFD Drives, Schneider Electric Smart Power Meters.",
		includedScope:
			"Decommissioning of legacy chillers, equipment procurement, BMS integration, ISO 50001 energy measurement verification.",
		excludedScope: "Civil foundation modifications outside central pump room.",
		estimatedStartDate: "2026-10-15",
		estimatedDurationMonths: 3,
		costBreakdown: {
			equipmentCost: 6100000000,
			installationCost: 1200000000,
			laborCost: 600000000,
			operationalCost: 300000000,
			otherCost: 150000000,
			totalPrice: 8350000000,
		},
		expectedImpact: {
			energySavingsPercent: 28,
			carbonReductionTons: 920,
			projectedRoiPercent: 21.5,
		},
		warrantyYears: 5,
		warrantyCoverage:
			"5-Year Chiller Unit Warranty, 2-Year Comprehensive Preventative Maintenance.",
		pdfDocumentName: "Proposal_HVAC_Retrofit_SentraGraha.pdf",
		submittedAt: "2026-09-02T16:00:00Z",
		revisionCount: 2,
	},
];

export const sampleNegotiations: NegotiationRequest[] = [
	{
		id: "neg-201",
		proposalId: "prop-102",
		projectId: "proj-2",
		projectTitle: "High-Efficiency HVAC & Smart Chiller Retrofit",
		companyName: "PT Sentra Graha Medika",
		iterationNumber: 2,
		maxIterations: 3,
		status: "PENDING_VENDOR_RESPONSE",
		requestedPriceReduction: 8000000000,
		requestedWarrantyYears: 7,
		requestedFields: ["Total Project Price", "Unit & Service Warranty Period"],
		companyNote:
			"Please adjust the total investment value to Rp 8,000,000,000 and extend service warranty from 5 to 7 years to meet board capital allocation guidelines.",
		vendorResponseNote: "",
		vendorRevisedPrice: 8150000000,
		vendorRevisedWarrantyYears: 7,
		updatedAt: "2026-09-05T09:30:00Z",
	},
];

export const sampleActiveProjects: ActiveVendorProject[] = [
	{
		id: "act-1",
		title: "800 kWp Rooftop Solar PV for Food Processing Plant",
		companyName: "PT Pangan Utama Sejahtera",
		industrySector: "Food & Beverage Manufacturing",
		location: "Karawang, West Java",
		agreedBudget: 8900000000,
		overallProgressPercent: 68,
		currentMilestoneTitle: "Electrical Cabling & Inverter Interconnection",
		deadlineDate: "2026-11-30",
		status: "IN_PROGRESS",
		expectedEnergySavingsPercent: 22,
		actualEnergySavingsPercent: 23.5,
		expectedCarbonReductionTons: 980,
		actualCarbonReductionTons: 1020,
		milestones: [
			{
				id: "ms-1",
				stepNumber: 1,
				title: "Site Survey & Detailed Engineering Design (DED)",
				description:
					"Roof structure verification, wind-load structural engineering, and schematic single-line diagram approval.",
				startDate: "2026-05-01",
				dueDate: "2026-05-25",
				completionPercent: 100,
				status: "COMPLETED",
				evidence: [
					{
						id: "ev-1",
						name: "Roof_Structural_Engineering_Report.pdf",
						type: "document",
						url: "#",
						uploadedAt: "2026-05-20",
					},
					{
						id: "ev-2",
						name: "Approved_DED_PanganUtama.pdf",
						type: "document",
						url: "#",
						uploadedAt: "2026-05-24",
					},
				],
				vendorNotes:
					"Design approved without revisions by the Chief Engineering Director.",
				companyReviewNotes: "DED verified and signed off.",
			},
			{
				id: "ms-2",
				stepNumber: 2,
				title: "Solar Module & Central Inverter Procurement",
				description:
					"Delivery of 1,480 units of 550Wp modules and 8 inverter units to the facility staging yard.",
				startDate: "2026-05-26",
				dueDate: "2026-06-30",
				completionPercent: 100,
				status: "APPROVED",
				evidence: [
					{
						id: "ev-3",
						name: "Container_Delivery_Staging_Inspection.jpg",
						type: "photo",
						url: "#",
						uploadedAt: "2026-06-25",
					},
					{
						id: "ev-4",
						name: "Material_Handover_Certificate_BAST.pdf",
						type: "inspection",
						url: "#",
						uploadedAt: "2026-06-28",
					},
				],
				vendorNotes:
					"All Tier-1 modules inspected and verified intact with factory flash test certificates.",
				companyReviewNotes:
					"Physical delivery validated against import manifests.",
			},
			{
				id: "ms-3",
				stepNumber: 3,
				title: "Racking Installation & Electrical DC/AC Wiring",
				description:
					"Mounting of corrosion-resistant aluminium racking on metal roofing and DC cable tray laying.",
				startDate: "2026-07-01",
				dueDate: "2026-09-15",
				completionPercent: 75,
				status: "IN_PROGRESS",
				evidence: [
					{
						id: "ev-5",
						name: "Roof_Racking_Array_Overview.jpg",
						type: "photo",
						url: "#",
						uploadedAt: "2026-08-20",
					},
					{
						id: "ev-6",
						name: "DC_Cable_Insulation_Resistance_Test.pdf",
						type: "inspection",
						url: "#",
						uploadedAt: "2026-09-02",
					},
				],
				vendorNotes:
					"Array Section A & B fully wired; Section C in progress ahead of schedule.",
				companyReviewNotes: "Site QA team confirmed torque spec adherence.",
			},
			{
				id: "ms-4",
				stepNumber: 4,
				title: "Grid Synchronization, Testing & Commissioning",
				description:
					"PLN parallel net-metering interconnection test and 72-hour continuous full-load burn-in run.",
				startDate: "2026-09-16",
				dueDate: "2026-10-31",
				completionPercent: 0,
				status: "NOT_STARTED",
				evidence: [],
			},
			{
				id: "ms-5",
				stepNumber: 5,
				title: "Final BAST (Handover Certificate) & Operations Training",
				description:
					"Official project handover, client O&M manual delivery, and IoT SCADA credentials issuance.",
				startDate: "2026-11-01",
				dueDate: "2026-11-30",
				completionPercent: 0,
				status: "NOT_STARTED",
				evidence: [],
			},
		],
		monthlyReports: [
			{
				id: "rep-1",
				projectId: "act-1",
				period: "2026-07",
				energySavedKwh: 42500,
				carbonSavedTons: 36.1,
				actualConsumptionKwh: 145000,
				baselineConsumptionKwh: 187500,
				evidenceDocs: ["July_Interconnection_Report.pdf"],
				submittedAt: "2026-08-02",
			},
			{
				id: "rep-2",
				projectId: "act-1",
				period: "2026-08",
				energySavedKwh: 44200,
				carbonSavedTons: 37.5,
				actualConsumptionKwh: 141800,
				baselineConsumptionKwh: 186000,
				evidenceDocs: ["August_Smart_Meter_Log.pdf"],
				submittedAt: "2026-09-01",
			},
		],
	},
	{
		id: "act-2",
		title: "Commercial Tower Central HVAC & Smart Chiller Retrofit",
		companyName: "PT Graha Surya Mandiri",
		industrySector: "Commercial Real Estate",
		location: "Surabaya, East Java",
		agreedBudget: 8150000000,
		overallProgressPercent: 42,
		currentMilestoneTitle: "Chiller Unit Delivery & Primary Piping",
		deadlineDate: "2027-02-28",
		status: "IN_PROGRESS",
		expectedEnergySavingsPercent: 25,
		actualEnergySavingsPercent: 26.2,
		expectedCarbonReductionTons: 860,
		actualCarbonReductionTons: 895,
		milestones: [
			{
				id: "ms-201",
				stepNumber: 1,
				title: "Energy Audit & Baseline Load Verification",
				description:
					"Calibrated energy baseline measurement over 30 days under peak cooling conditions.",
				startDate: "2026-06-01",
				dueDate: "2026-06-30",
				completionPercent: 100,
				status: "COMPLETED",
				evidence: [
					{
						id: "ev-201",
						name: "Chilled_Water_Baseline_Audit.pdf",
						type: "document",
						url: "#",
						uploadedAt: "2026-06-28",
					},
				],
				vendorNotes: "Baseline verified with certified ultrasonic flow meters.",
				companyReviewNotes: "Verified and accepted.",
			},
			{
				id: "ms-202",
				stepNumber: 2,
				title: "Chiller Delivery & Header Piping Retrofit",
				description:
					"Placement of 2 Magnetic Bearing Chillers and primary condenser loop pipe fitting.",
				startDate: "2026-07-01",
				dueDate: "2026-09-30",
				completionPercent: 80,
				status: "IN_PROGRESS",
				evidence: [
					{
						id: "ev-202",
						name: "Rigging_Chiller_Placement_Log.jpg",
						type: "photo",
						url: "#",
						uploadedAt: "2026-08-15",
					},
				],
				vendorNotes:
					"Units placed on vibration dampeners; hydro-testing scheduled.",
			},
			{
				id: "ms-203",
				stepNumber: 3,
				title: "Building Management System (BMS) Automation",
				description:
					"BACnet sensor integration, variable speed pumping calibration, and central dashboard configuration.",
				startDate: "2026-10-01",
				dueDate: "2026-11-30",
				completionPercent: 0,
				status: "NOT_STARTED",
				evidence: [],
			},
			{
				id: "ms-204",
				stepNumber: 4,
				title: "Commissioning & Final Handover (BAST)",
				description:
					"Final performance verification, ISO 50001 compliance sign-off, and client operations handover.",
				startDate: "2026-12-01",
				dueDate: "2027-02-28",
				completionPercent: 0,
				status: "NOT_STARTED",
				evidence: [],
			},
		],
		monthlyReports: [
			{
				id: "rep-201",
				projectId: "act-2",
				period: "2026-08",
				energySavedKwh: 28400,
				carbonSavedTons: 24.1,
				actualConsumptionKwh: 98200,
				baselineConsumptionKwh: 126600,
				evidenceDocs: ["HVAC_August_Power_Logs.pdf"],
				submittedAt: "2026-09-02",
			},
		],
	},
];

export const samplePortfolio: VendorPortfolioItem[] = [
	{
		id: "port-1",
		projectName: "1.5 MWp Rooftop Solar PV for Automotive Plant",
		clientName: "PT Astra Komponen Industri",
		projectType: "Solar PV Energy Storage",
		location: "Bekasi, West Java",
		description:
			"Installation of high-capacity rooftop solar PV system integrated with industrial string inverters & dual protection breakers.",
		projectValue: 14800000000,
		durationMonths: 5,
		servicesProvided: "EPC Full Turnkey & 2-Year Preventative Maintenance",
		energySavingPercent: 24,
		carbonReductionTons: 1650,
		completionYear: 2025,
		status: "VERIFIED",
		documentName: "BAST_Certificate_Astra_Automotive.pdf",
	},
	{
		id: "port-2",
		projectName: "Chiller Plant Optimization & BMS Retrofit",
		clientName: "PT Plaza Sentral Propertindo",
		projectType: "HVAC Energy Efficiency",
		location: "Jakarta Pusat",
		description:
			"Conversion of legacy chillers to Variable Speed Centrifugal Chillers and smart sub-metering across 28 commercial floors.",
		projectValue: 9200000000,
		durationMonths: 4,
		servicesProvided: "Energy Audit, Equipment Retrofit, BMS Integration",
		energySavingPercent: 27,
		carbonReductionTons: 940,
		completionYear: 2024,
		status: "VERIFIED",
		documentName: "Energy_Impact_Verification_Plaza.pdf",
	},
	{
		id: "port-3",
		projectName: "10 Ton/Hr Smart Biomass Boiler Conversion",
		clientName: "PT Agro Industri Nusantara",
		projectType: "Biomass Thermal Energy",
		location: "Lampung",
		description:
			"Fuel switching from coal to palm kernel shells on industrial drying lines for agro-processing facility.",
		projectValue: 11500000000,
		durationMonths: 6,
		servicesProvided: "Biomass EPC & GHG Validation Protocol",
		energySavingPercent: 32,
		carbonReductionTons: 3100,
		completionYear: 2024,
		status: "VERIFIED",
		documentName: "Certificate_Biomass_Conversion.pdf",
	},
];

export const samplePerformanceMetrics: VendorPerformanceMetrics = {
	completionRatePercent: 98.4,
	onTimeCompletionPercent: 96.0,
	technicalPerformanceScore: 94.5,
	energySavingAchievementPercent: 104.2, // 4.2% over target
	carbonReductionAchievementPercent: 105.8,
	averageProjectValue: 11200000000,
	totalCompletedProjects: 14,
	clientApprovalRatePercent: 97.5,
	historicalTrend: [
		{ period: "24Q1", score: 85 },
		{ period: "24Q3", score: 90 },
		{ period: "25Q1", score: 90 },
		{ period: "25Q3", score: 95 },
		{ period: "26Q1", score: 100 },
	],
	bastRating: 4.9,
	retentionRate: "High",
};

export const sampleNotifications: VendorNotification[] = [
	{
		id: "notif-1",
		category: "Negotiation",
		title: "New Negotiation Revision Received",
		message:
			"PT Sentra Graha Medika submitted price & warranty revisions for HVAC Retrofit (Revision 2 of 3).",
		timestamp: "10 minutes ago",
		isRead: false,
		linkUrl: "/vendor/deals",
	},
	{
		id: "notif-2",
		category: "Tenders",
		title: "Open Bidding Rank Update",
		message:
			"Your position in Textile Solar PV project is currently Rank 2 (Current lowest: Rp 11.80 Billion).",
		timestamp: "2 hours ago",
		isRead: false,
		linkUrl: "/vendor/opportunities",
	},
	{
		id: "notif-3",
		category: "Projects",
		title: "New Recommended Green Project",
		message:
			"1.2 MWp Rooftop Solar PV matches 92% with your company's certified expertise profile.",
		timestamp: "1 day ago",
		isRead: true,
		linkUrl: "/vendor/opportunities",
	},
	{
		id: "notif-4",
		category: "Verification",
		title: "Company Verification Confirmed",
		message:
			"Your corporate NIB & ESCO certification documents have been automatically validated by the system.",
		timestamp: "3 days ago",
		isRead: true,
		linkUrl: "/vendor/settings",
	},
];
