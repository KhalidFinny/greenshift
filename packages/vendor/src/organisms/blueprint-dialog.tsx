import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@greenshift/ui";
import type { VendorBlueprint } from "../lib/types";
import { BlueprintCard } from "./blueprint-card";

interface BlueprintDialogProps {
	/** Null while the project carries no validated blueprint; the card states that in the dialog. */
	blueprint: VendorBlueprint | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	loading?: boolean;
}

/** The blueprint on its own, so a bidder reads the case the tender was cleared on without losing a half-written bid. */
export function BlueprintDialog({
	blueprint,
	isOpen,
	onOpenChange,
	loading = false,
}: BlueprintDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle className="text-lg font-semibold">
						Green Project Blueprint
					</DialogTitle>
				</DialogHeader>
				<BlueprintCard
					blueprint={blueprint}
					loading={loading}
					showHeader={false}
				/>
			</DialogContent>
		</Dialog>
	);
}
