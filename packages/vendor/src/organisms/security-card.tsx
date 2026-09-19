import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@greenshift/ui";
import { useState } from "react";

export function SecurityCard() {
	const [password, setPassword] = useState("");

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">
					Account Security & Login Sessions
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				<p className="text-muted-foreground">
					Password changes from the dashboard are not available yet. Use the
					account recovery flow until the password change endpoint ships.
				</p>
				<form
					onSubmit={(e) => e.preventDefault()}
					className="max-w-md space-y-2"
				>
					<Label htmlFor="sec-pass" className="font-semibold">
						New Password:
					</Label>
					<Input
						id="sec-pass"
						type="password"
						placeholder="••••••••"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						disabled
					/>
					<Button
						type="submit"
						size="sm"
						disabled
						className="mt-2 bg-[#00712D] text-white hover:bg-[#00712D]/90"
					>
						Change Password
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
