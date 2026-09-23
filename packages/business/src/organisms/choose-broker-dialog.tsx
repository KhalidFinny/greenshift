import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@greenshift/ui";
import { useState } from "react";
import { ChooseBrokerCard } from "./choose-broker-card";

/**
 * The broker choice from the matchmaking table: one row per project whose
 * proposal has been accepted, opening the verified broker pool in a dialog.
 */
export function ChooseBrokerDialog({
	projectId,
	projectTitle,
}: {
	projectId: number;
	projectTitle: string;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					Choose broker
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-lg">Choose a broker</DialogTitle>
					<DialogDescription className="text-sm">
						{projectTitle}
					</DialogDescription>
				</DialogHeader>
				<ChooseBrokerCard projectId={projectId} />
			</DialogContent>
		</Dialog>
	);
}
