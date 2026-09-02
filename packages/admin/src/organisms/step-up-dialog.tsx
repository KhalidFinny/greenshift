import { useState } from "react";
import { api } from "@greenshift/core";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from "@greenshift/ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";

interface StepUpDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export function StepUpDialog({ isOpen, onClose, onSuccess }: StepUpDialogProps) {
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setError(null);
		try {
			await api.auth.stepUp(password);
			onSuccess();
			onClose();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Gagal konfirmasi kata sandi");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<FontAwesomeIcon icon={faLock} /> Konfirmasi Keamanan
					</DialogTitle>
					<DialogDescription className="text-base">
						Masukkan kata sandi Anda untuk melanjutkan aksi sensitif ini.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="password">Kata Sandi</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>
					{error && <p className="text-base text-destructive">{error}</p>}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Batal
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting || !password}>
						Konfirmasi
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
