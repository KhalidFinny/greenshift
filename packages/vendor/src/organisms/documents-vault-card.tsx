import { faFilePdf, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	EmptyState,
} from "@greenshift/ui";

export function DocumentsVaultCard({
	documents = [],
}: {
	documents?: string[];
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Company Document Vault</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-sm">
				{documents.length === 0 && (
					<EmptyState
						icon={<FontAwesomeIcon icon={faFolderOpen} />}
						title="No company documents stored"
						description="Legal and industry documents tied to your vendor profile are listed here for download once they are on file."
					/>
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
							Download
						</Button>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
