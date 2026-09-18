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
				<CardTitle className="text-lg">Keamanan Akun & Sesi Login</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 text-xs">
				<p className="text-muted-foreground">
					Perubahan kata sandi dari dashboard belum tersedia; gunakan alur
					pemulihan akun sampai endpoint perubahan kata sandi ada.
				</p>
				<form
					onSubmit={(e) => e.preventDefault()}
					className="max-w-md space-y-2"
				>
					<Label htmlFor="sec-pass" className="font-semibold">
						Kata Sandi Baru:
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
						className="mt-2 bg-[#03442C] text-white hover:bg-[#03442C]/90"
					>
						Ubah Kata Sandi
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
