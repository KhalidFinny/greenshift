import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";

export function DocumentsVaultCard({
	documents = [],
}: {
	documents?: string[];
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">
					Penyimpanan Dokumen Perusahaan
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-xs">
				{documents.length === 0 && (
					<p className="text-muted-foreground">
						Belum ada dokumen perusahaan yang diunggah.
					</p>
				)}
				{documents.map((doc) => (
					<div
						key={doc}
						className="flex items-center justify-between rounded-lg border border-border p-3"
					>
						<span className="flex items-center gap-2 font-semibold">
							<FontAwesomeIcon
								icon={faFilePdf}
								className="text-base text-red-500"
							/>
							{doc}
						</span>
						<Button size="sm" variant="outline">
							Unduh
						</Button>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
