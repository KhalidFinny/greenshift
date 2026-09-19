import {
	faBookmark,
	faLeaf,
	faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	EmptyState,
	Input,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@greenshift/ui";
import { useState } from "react";
import { isTopMatch } from "../lib/matchmaking";
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

	const recommended = filteredProjects.filter((p) => isTopMatch(p.matchmaking));
	const saved = filteredProjects.filter((p) => p.isSaved);

	return (
		<div className="space-y-6">
			{/* Search bar */}
			<div className="relative">
				<FontAwesomeIcon
					icon={faSearch}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
				/>
				<Input
					placeholder="Search by project name, client, or industry sector..."
					className="pl-9"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			<Tabs defaultValue="all">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="all">
						All Projects ({filteredProjects.length})
					</TabsTrigger>
					<TabsTrigger value="recommended">
						Recommended ({recommended.length})
					</TabsTrigger>
					<TabsTrigger value="saved">Saved ({saved.length})</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="mt-6">
					{filteredProjects.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faSearch} />}
							title="No projects match your search"
							description="No published tender matches that name, client, or sector. Clear the search field to see every open project."
						/>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredProjects.map((proj) => (
								<VendorProjectCard
									key={proj.id}
									project={proj}
									onSave={toggleSaveProject}
								/>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="recommended" className="mt-6">
					{recommended.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faLeaf} />}
							title="No strong matches"
							description="Tenders scoring 90 or above on matchmaking are listed here once they are published."
						/>
					) : (
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
					)}
				</TabsContent>

				<TabsContent value="saved" className="mt-6">
					{saved.length === 0 ? (
						<EmptyState
							icon={<FontAwesomeIcon icon={faBookmark} />}
							title="No saved projects"
							description="Bookmark a tender from any card to shortlist it here."
						/>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{saved.map((proj) => (
								<VendorProjectCard
									key={proj.id}
									project={proj}
									onSave={toggleSaveProject}
								/>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
