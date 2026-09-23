import {
	faBookmark,
	faLeaf,
	faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	EmptyState,
	Input,
	PaginationBar,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	usePagedRows,
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

	// Each tab is its own list, so each pages the rows it renders.
	const allPage = usePagedRows(filteredProjects);
	const recommendedPage = usePagedRows(recommended);
	const savedPage = usePagedRows(saved);

	return (
		<div className="space-y-6">
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
				<TabsList className="flex w-full overflow-x-auto *:shrink-0 *:whitespace-nowrap sm:grid sm:grid-cols-3">
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
						<>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{allPage.pageRows.map((proj) => (
									<VendorProjectCard
										key={proj.id}
										project={proj}
										onSave={toggleSaveProject}
									/>
								))}
							</div>
							<PaginationBar
								label="Projects"
								pageIndex={allPage.pageIndex}
								pageSize={allPage.pageSize}
								pageCount={allPage.pageCount}
								total={allPage.total}
								onPageIndexChange={allPage.setPageIndex}
								onPageSizeChange={allPage.setPageSize}
							/>
						</>
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
						<>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{recommendedPage.pageRows.map((proj) => (
									<VendorProjectCard
										key={proj.id}
										project={proj}
										onSave={toggleSaveProject}
										variant="recommended"
									/>
								))}
							</div>
							<PaginationBar
								label="Recommended projects"
								pageIndex={recommendedPage.pageIndex}
								pageSize={recommendedPage.pageSize}
								pageCount={recommendedPage.pageCount}
								total={recommendedPage.total}
								onPageIndexChange={recommendedPage.setPageIndex}
								onPageSizeChange={recommendedPage.setPageSize}
							/>
						</>
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
						<>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{savedPage.pageRows.map((proj) => (
									<VendorProjectCard
										key={proj.id}
										project={proj}
										onSave={toggleSaveProject}
									/>
								))}
							</div>
							<PaginationBar
								label="Saved projects"
								pageIndex={savedPage.pageIndex}
								pageSize={savedPage.pageSize}
								pageCount={savedPage.pageCount}
								total={savedPage.total}
								onPageIndexChange={savedPage.setPageIndex}
								onPageSizeChange={savedPage.setPageSize}
							/>
						</>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
