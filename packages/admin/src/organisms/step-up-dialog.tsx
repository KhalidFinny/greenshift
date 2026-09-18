import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "@greenshift/core";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	useAppForm,
} from "@greenshift/ui";
import { useState } from "react";

interface StepUpDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export function StepUpDialog({
	isOpen,
	onClose,
	onSuccess,
}: StepUpDialogProps) {
	const [error, setError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			setError(null);
			try {
				await api.auth.stepUp(value.password);
				form.reset();
				onSuccess();
				onClose();
			} catch (e: unknown) {
				setError(
					e instanceof Error ? e.message : "Password confirmation failed",
				);
			}
		},
	});

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<FontAwesomeIcon icon={faLock} /> Security Confirmation
					</DialogTitle>
					<DialogDescription className="text-base">
						Enter your password to continue with this sensitive action.
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
					noValidate
				>
					<div className="space-y-4 py-4">
						<form.AppField
							name="password"
							validators={{
								onChange: ({ value }) =>
									value ? undefined : "Password is required",
							}}
						>
							{(field) => (
								<field.PasswordField
									label="Password"
									autoComplete="current-password"
								/>
							)}
						</form.AppField>
						{error && <p className="text-base text-destructive">{error}</p>}
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<form.AppForm>
							<form.SubmitButton>Confirm</form.SubmitButton>
						</form.AppForm>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
