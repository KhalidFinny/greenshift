import type { RoiPaymentSummary } from "@greenshift/api/contracts";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@greenshift/ui";
import type { ReactNode } from "react";
import { formatDate, formatIdr } from "../lib/format";
import {
	PAYMENT_STATUS_LABEL,
	PAYMENT_STATUS_TONE,
	STATUS_BADGE_CLASS,
} from "../lib/labels";

export interface PaymentRow extends RoiPaymentSummary {
	projectTitle: string;
}

interface PaymentsTableProps {
	title: string;
	rows: PaymentRow[];
	/** Optional header action, e.g. the escrow CSV download button. */
	action?: ReactNode;
}

export function PaymentsTable({ title, rows, action }: PaymentsTableProps) {
	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between space-y-0">
				<CardTitle className="text-lg">{title}</CardTitle>
				{action}
			</CardHeader>
			<CardContent className="pt-0">
				<div className="overflow-x-auto">
					<Table className="text-base">
						<TableHeader>
							<TableRow>
								<TableHead>Periode</TableHead>
								<TableHead>Proyek</TableHead>
								<TableHead className="text-right">Jumlah</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Ref Escrow</TableHead>
								<TableHead>Dibayar</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((payment) => (
								<TableRow key={payment.id}>
									<TableCell className="tabular-nums">
										{payment.period ?? "—"}
									</TableCell>
									<TableCell>
										<p className="font-medium">{payment.projectTitle}</p>
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatIdr(payment.amount)}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												PAYMENT_STATUS_TONE[payment.status] ?? "outline"
											}
											className={STATUS_BADGE_CLASS}
										>
											{PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
										</Badge>
									</TableCell>
									<TableCell className="tabular-nums">
										{payment.escrowTxId ?? "—"}
									</TableCell>
									<TableCell className="tabular-nums">
										{formatDate(payment.paidAt)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
