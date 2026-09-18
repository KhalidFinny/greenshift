import { faFilter, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger } from "@greenshift/ui";
import { useState } from "react";
import { useVendorData } from "../lib/use-vendor-data";
import { VendorProjectCard } from "../organisms/vendor-project-card";

export function VendorProjectsPage() {
	const { projects, toggleSaveProject } = useVendorData();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredProjects = projects.filter(
		(p) =>
			p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.industrySector.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const recommended = filteredProjects.filter(
		(p) => p.matchmaking.overallMatch >= 90,
	);
	const saved = filteredProjects.filter((p) => p.isSaved);

	return (
		<div className="space-y-6">
			{/* Search & Filter Bar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<FontAwesomeIcon
						icon={faSearch}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
					/>
					<Input
						placeholder="Cari berdasarkan nama proyek, klien, atau sektor industri..."
						className="pl-9"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<Button variant="outline" className="shrink-0 gap-2">
					<FontAwesomeIcon icon={faFilter} />
					Filter Sektor & Anggaran
				</Button>
			</div>

			<Tabs defaultValue="all">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="all">
						Semua Proyek ({filteredProjects.length})
					</TabsTrigger>
					<TabsTrigger value="recommended">
						Rekomendasi ({recommended.length})
					</TabsTrigger>
					<TabsTrigger value="saved">Tersimpan ({saved.length})</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="mt-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{filteredProjects.map((proj) => (
							<VendorProjectCard
								key={proj.id}
								project={proj}
								onSave={toggleSaveProject}
							/>
						))}
					</div>
				</TabsContent>

				<TabsContent value="recommended" className="mt-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{recommended.map((proj) => (
							<VendorProjectCard
								key={proj.id}
								project={proj}
								onSave={toggleSaveProject}
								variant="recommended"
							/>
						))}
					</div>
				</TabsContent>

				<TabsContent value="saved" className="mt-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{saved.map((proj) => (
							<VendorProjectCard
								key={proj.id}
								project={proj}
								onSave={toggleSaveProject}
							/>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
