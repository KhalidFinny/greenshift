import {
	faCloudArrowUp,
	faFileLines,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { useRef } from "react";

export interface Step3Doc {
	id: string;
	title: string;
	desc: string;
}

export interface Step3Section {
	title: string;
	items: Step3Doc[];
}

export const STEP3_SECTIONS: Step3Section[] = [
	{
		title: "Entity Legality",
		items: [
			{
				id: "akta",
				title: "Company Deed",
				desc: "Deed of incorporation and the latest amendment.",
			},
			{
				id: "nib",
				title: "NIB & NPWP",
				desc: "Business Identification Number and the company tax number.",
			},
			{
				id: "profil",
				title: "Company Profile",
				desc: "A short profile of the business activity.",
			},
		],
	},
	{
		title: "Technical Documents & Emission Mitigation",
		items: [
			{
				id: "studi",
				title: "Feasibility Study",
				desc: "The technical and financial review of the project.",
			},
			{
				id: "dram",
				title: "DRAM",
				desc: "Greenhouse gas mitigation action plan.",
			},
			{
				id: "spek",
				title: "Technical Specification",
				desc: "Specification of the equipment to be installed.",
			},
		],
	},
];

export const STEP3_TOTAL = STEP3_SECTIONS.reduce(
	(n, s) => n + s.items.length,
	0,
);

export interface Step3ViewProps {
	docs: Record<string, string>;
	onUpload: (id: string, file: File | undefined) => void;
	onRemove: (id: string) => void;
}

const SECTION_HELP = [
	"Company legality records, saved with your draft.",
	"Technical and emission mitigation records, saved with your draft.",
];

export function Step3View({ docs, onUpload, onRemove }: Step3ViewProps) {
	const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
	const done = STEP3_SECTIONS.flatMap((s) => s.items).filter(
		(d) => docs[d.id],
	).length;

	return (
		<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
			<div className="min-w-0 space-y-8">
				{STEP3_SECTIONS.map((section, si) => (
					<section key={section.title} className="space-y-4">
						<div>
							<h2 className="text-lg font-semibold">
								{si === 0 ? "A" : "B"}. {section.title}
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								{SECTION_HELP[si]}
							</p>
						</div>
						<ul className="divide-y divide-border">
							{section.items.map((doc) => {
								const name = docs[doc.id];
								return (
									<li
										key={doc.id}
										className="flex items-center justify-between gap-3 py-2"
									>
										<div className="flex min-w-0 items-center gap-3">
											<FontAwesomeIcon
												icon={faFileLines}
												className="size-4 shrink-0 text-muted-foreground"
											/>
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">
													{doc.title}
												</p>
												<p className="truncate text-sm text-muted-foreground">
													{name ?? doc.desc}
												</p>
											</div>
										</div>
										<div className="flex shrink-0 items-center gap-2">
											<input
												ref={(el) => {
													fileRefs.current[doc.id] = el;
												}}
												type="file"
												className="sr-only"
												aria-label={`Upload ${doc.title}`}
												onChange={(ev) =>
													onUpload(doc.id, ev.target.files?.[0])
												}
											/>
											{name ? (
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													aria-label={`Remove ${doc.title}`}
													onClick={() => onRemove(doc.id)}
												>
													<FontAwesomeIcon icon={faTrash} />
												</Button>
											) : (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => fileRefs.current[doc.id]?.click()}
												>
													<FontAwesomeIcon icon={faCloudArrowUp} />
													Upload
												</Button>
											)}
										</div>
									</li>
								);
							})}
						</ul>
					</section>
				))}
			</div>

			<aside className="min-w-0 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Completeness</CardTitle>
						<CardDescription className="text-sm">
							{done} / {STEP3_TOTAL} documents uploaded
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div
							role="progressbar"
							aria-valuenow={done}
							aria-valuemin={0}
							aria-valuemax={STEP3_TOTAL}
							aria-label="Document completeness"
							className="h-2 overflow-hidden rounded-full bg-muted"
						>
							<div
								className="h-full rounded-full bg-primary"
								style={{ width: `${(done / STEP3_TOTAL) * 100}%` }}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">GHG LVV Guide</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Technical documents are validated by a greenhouse gas Validation
							and Verification Body. Make sure the DRAM is consistent with the
							emission reduction target.
						</p>
					</CardContent>
				</Card>
			</aside>
		</div>
	);
}
