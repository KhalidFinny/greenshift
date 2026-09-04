import type { MarketProject } from "@greenshift/api/contracts";
import { faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "@greenshift/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Spinner,
} from "@greenshift/ui";
import { formatIdr } from "../lib/format";

interface BondBuyDialogProps {
	project: MarketProject | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function BondBuyDialog({
	project,
	open,
	onOpenChange,
}: BondBuyDialogProps) {
	const queryClient = useQueryClient();
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const remaining = project ? Math.max((project.budget ?? 0) - project.funded, 0) : 0;

	useEffect(() => {
		if (open) {
			setAmount("");
			setError(null);
		}
	}, [open]);

	const buy = useMutation({
		mutationFn: (value: number) => {
			if (!project) throw new Error("Proyek belum dipilih");
			return api.investor.buyBond({ projectId: project.id, amount: value });
		},
		onSuccess: async () => {
			onOpenChange(false);
			await queryClient.invalidateQueries({ queryKey: ["investor", "market"] });
			await queryClient.invalidateQueries({ queryKey: ["investor", "portfolio"] });
		},
	});

	const submit = () => {
		const value = Number(amount);
		if (!Number.isInteger(value) || value <= 0) {
			setError("Masukkan jumlah dalam rupiah (angka bulat positif).");
			return;
		}
		if (remaining <= 0 || value > remaining) {
			setError(`Jumlah melebihi sisa pendanaan (${formatIdr(remaining)} tersisa).`);
			return;
		}
		setError(null);
		buy.mutate(value);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-lg">Beli Obligasi Hijau</DialogTitle>
					<DialogDescription className="text-base">
						{project?.title ?? "Proyek"} · sisa pendanaan <span className="tabular-nums text-foreground">{formatIdr(remaining)}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2">
					<Label htmlFor="bond-amount">Jumlah investasi (Rp)</Label>
					<Input
						id="bond-amount"
						type="text"
						inputMode="numeric"
						autoComplete="off"
						placeholder="contoh: 10000000"
						value={amount}
						onChange={(event) => setAmount(event.target.value)}
					/>
					{error && (
						<p role="alert" className="text-base text-destructive">
							{error}
						</p>
					)}
				</div>

				<DialogFooter className="sm:justify-between">
					<DialogClose asChild>
						<Button size="lg" variant="outline">Batal</Button>
					</DialogClose>
					<Button size="lg" onClick={submit} disabled={buy.isPending || remaining <= 0} className="cursor-pointer">
						{buy.isPending ? (
							<span className="inline-flex items-center gap-2">
								<Spinner className="size-4" />
								Memproses…
							</span>
						) : (
							<>
								<FontAwesomeIcon icon={faCoins} />
								Konfirmasi Pembelian
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
