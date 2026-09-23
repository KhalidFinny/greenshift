/** The API returns the registered code verbatim; an unissued bond falls back to a value derived from the project, never random. */
export function bondCodeFor(project: {
	id: number;
	bondCode?: string | null;
}): string {
	if (project.bondCode) return project.bondCode;
	return `GS-BND-${String(project.id).padStart(4, "0")}`;
}

/** "Copy Code" payload: the code plus name and issuer, because it is pasted into the broker app's search field. */
export function bondSearchPayload(project: {
	id: number;
	title: string;
	bondCode?: string | null;
	companyName?: string | null;
}): string {
	const lines = [
		`Bond Code: ${bondCodeFor(project)}`,
		`Name: ${project.title}`,
	];
	if (project.companyName) lines.push(`Issuer: ${project.companyName}`);
	return lines.join("\n");
}
