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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		alert("Kata sandi berhasil diperbarui.");
		setPassword("");
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Keamanan Akun & Sesi Login</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-xs">
				<form onSubmit={handleSubmit} className="max-w-md space-y-2">
					<Label htmlFor="sec-pass" className="font-semibold">
						Kata Sandi Baru:
					</Label>
					<Input
						id="sec-pass"
						type="password"
						placeholder="••••••••"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<Button
						type="submit"
						size="sm"
						className="mt-2 bg-[#03442C] text-white hover:bg-[#03442C]/90"
					>
						Ubah Kata Sandi
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
