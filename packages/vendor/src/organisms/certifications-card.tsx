import { faCertificate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
	PaginationBar,
	usePagedRows,
} from "@greenshift/ui";

export function CertificationsCard({
	certifications = [],
	verified = false,
}: {
	certifications?: string[];
	verified?: boolean;
}) {
	const paged = usePagedRows(certifications);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">
					Industry Certifications (ESCO & ISO)
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-sm">
				{certifications.length === 0 && (
					<EmptyState
						icon={<FontAwesomeIcon icon={faCertificate} />}
						title="No certifications on file"
						description="ESCO registration and ISO certificates appear here once they are part of your company profile. Add them with your verification documents."
					/>
				)}
				{paged.pageRows.map((cert) => (
					<div
						key={cert}
						className="flex items-center justify-between rounded-lg border border-border p-3"
					>
						<div>
							<h4 className="text-sm font-bold">{cert}</h4>
						</div>
						{verified && (
							<Badge className="bg-emerald-700 text-white">Verified</Badge>
						)}
					</div>
				))}
				<PaginationBar
					label="Certifications"
					pageIndex={paged.pageIndex}
					pageSize={paged.pageSize}
					pageCount={paged.pageCount}
					total={paged.total}
					onPageIndexChange={paged.setPageIndex}
					onPageSizeChange={paged.setPageSize}
				/>
			</CardContent>
		</Card>
	);
}
