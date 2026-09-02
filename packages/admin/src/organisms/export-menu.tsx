import { faFileExport } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@greenshift/ui";
import {
	downloadExport,
	type ExportFormat,
	type ExportSection,
} from "../lib/export";

interface ExportMenuProps {
	filename: string;
	title: string;
	sections: ExportSection[];
}

export function ExportMenu({ filename, title, sections }: ExportMenuProps) {
	const handleExport = (format: ExportFormat) =>
		downloadExport(filename, title, sections, format);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="!h-9 px-4 text-base">
					<FontAwesomeIcon icon={faFileExport} className="size-4" />
					Export
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onSelect={() => handleExport("csv")}>
					Excel (CSV)
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => handleExport("pdf")}>
					PDF
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
