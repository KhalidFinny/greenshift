import type { VendorNotification as ApiNotification } from "@greenshift/api/contracts";
import { api } from "@greenshift/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
	derivePerformanceMetrics,
	type LeaderboardView,
	mapBlueprint,
	mapLeaderboard,
	mapNegotiation,
	mapNotification,
	mapPortfolioItem,
	mapProjectToCardData,
	mapToActiveProject,
	mapToPortfolioItem,
	mapToStructuredProposal,
	mapVerificationStatus,
} from "./api-mappers";
import type {
	ActiveVendorProject,
	EvidenceFile,
	NegotiationRequest,
	StructuredProposal,
	VendorBlueprint,
	VendorNotification,
	VendorPerformanceMetrics,
	VendorPortfolioItem,
	VendorProjectCardData,
} from "./types";

const REFRESH_FAST = 60 * 1000;
const REFRESH_SLOW = 2 * 60 * 1000;

const EMPTY_LEADERBOARD: LeaderboardView = {
	entries: [],
	tenderId: null,
	projectTitle: null,
	deadlineAt: null,
	myProposalId: null,
	myAmount: null,
	myRank: null,
};

/**
 * Everything the vendor dashboard renders comes from `/api/vendor/*`.
 * Bookmarks are the one exception: saving a project is client-side UI state
 * with no endpoint yet.
 *
 * The detail endpoint is read only when a screen names a project: the market
 * list is enough for the cards, and the detail carries what only one project
 * needs, such as the validated blueprint.
 */
export function useVendorData(options: { projectId?: string } = {}) {
	const queryClient = useQueryClient();
	const projectId = options.projectId;

	// ── Local-only UI state ─────────────────────────────────
	const [savedProjects, setSavedProjects] = useState<Set<string>>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("vendor_saved_projects");
			return saved ? new Set(JSON.parse(saved)) : new Set();
		}
		return new Set();
	});

	// ── Queries ─────────────────────────────────────────────
	const { data: profileData, isLoading: profileLoading } = useQuery({
		queryKey: ["vendor", "profile"],
		queryFn: () => api.vendor.profile(),
		staleTime: 5 * 60 * 1000,
	});

	const { data: myProjectsData, isLoading: projectsLoading } = useQuery({
		queryKey: ["vendor", "my-projects"],
		queryFn: () => api.vendor.myProjects(),
		staleTime: REFRESH_SLOW,
	});

	const { data: marketProjectsData } = useQuery({
		queryKey: ["vendor", "projects"],
		queryFn: () => api.vendor.projects(),
		staleTime: REFRESH_SLOW,
	});

	const { data: proposalsData } = useQuery({
		queryKey: ["vendor", "proposals"],
		queryFn: () => api.vendor.proposals(),
		staleTime: REFRESH_SLOW,
	});

	const { data: notificationsData } = useQuery({
		queryKey: ["vendor", "notifications"],
		queryFn: () => api.vendor.notifications(),
		staleTime: REFRESH_FAST,
	});

	const { data: negotiationsData } = useQuery({
		queryKey: ["vendor", "negotiations"],
		queryFn: () => api.vendor.negotiations(),
		staleTime: REFRESH_FAST,
	});

	/* A ranking belongs to one tender. A screen that names a project reads the
	   ranking for that project's own tender; the screens that carry the vendor's
	   live open bidding read the default one. `null` means the project's tender
	   is not known yet, which is the only case that holds the read back: ranking
	   another tender under this project's heading would be a wrong answer, not a
	   slow one. */
	const scopedTenderId = useMemo(() => {
		if (projectId === undefined || projectId === "") return undefined;
		const project = (marketProjectsData?.projects ?? []).find(
			(candidate) => String(candidate.id) === projectId,
		);
		return project?.tender?.id ?? null;
	}, [marketProjectsData, projectId]);

	const { data: leaderboardData } = useQuery({
		queryKey: ["vendor", "leaderboard", scopedTenderId ?? "default"],
		queryFn: () => api.vendor.leaderboard(scopedTenderId ?? undefined),
		enabled: scopedTenderId !== null,
		staleTime: REFRESH_FAST,
	});

	const { data: portfolioData } = useQuery({
		queryKey: ["vendor", "portfolio"],
		queryFn: () => api.vendor.portfolio(),
		staleTime: REFRESH_SLOW,
	});

	const { data: projectDetailData } = useQuery({
		queryKey: ["vendor", "project-detail", projectId],
		queryFn: () => api.vendor.projectDetail(Number(projectId)),
		enabled: projectId !== undefined && projectId !== "",
		staleTime: REFRESH_SLOW,
	});

	// ── Derived data ────────────────────────────────────────
	const profile = profileData?.profile;
	const myProjects = myProjectsData?.projects ?? [];

	const verification = useMemo(() => {
		if (!profile) {
			return { status: "NOT_VERIFIED" as const, certifications: [] };
		}
		return mapVerificationStatus(profile);
	}, [profile]);

	const projects: VendorProjectCardData[] = useMemo(() => {
		const items = marketProjectsData?.projects ?? [];
		return items.map((item) => ({
			...mapProjectToCardData(item),
			isSaved: savedProjects.has(String(item.id)),
		}));
	}, [marketProjectsData, savedProjects]);

	const activeProjects: ActiveVendorProject[] = useMemo(() => {
		return myProjects
			.map(mapToActiveProject)
			.filter((p): p is ActiveVendorProject => p !== null);
	}, [myProjects]);

	// Portfolio = awarded projects from the API plus the references the vendor
	// authored in the portfolio tab.
	const apiPortfolio: VendorPortfolioItem[] = useMemo(() => {
		return myProjects
			.map(mapToPortfolioItem)
			.filter((p): p is VendorPortfolioItem => p !== null);
	}, [myProjects]);

	const authoredPortfolio: VendorPortfolioItem[] = useMemo(() => {
		return (portfolioData?.portfolio ?? []).map(mapPortfolioItem);
	}, [portfolioData]);

	const portfolio: VendorPortfolioItem[] = useMemo(() => {
		const apiIds = new Set(apiPortfolio.map((item) => item.id));
		return [
			...apiPortfolio,
			...authoredPortfolio.filter((item) => !apiIds.has(item.id)),
		];
	}, [apiPortfolio, authoredPortfolio]);

	const proposals: StructuredProposal[] = useMemo(() => {
		const items = proposalsData?.proposals ?? [];
		return items.map(mapToStructuredProposal);
	}, [proposalsData]);

	const blueprint: VendorBlueprint | null = useMemo(() => {
		const detail = projectDetailData?.project?.blueprint;
		return detail ? mapBlueprint(detail) : null;
	}, [projectDetailData]);

	const performanceMetrics: VendorPerformanceMetrics = useMemo(() => {
		if (!profile) {
			return {
				completionRatePercent: 0,
				onTimeCompletionPercent: 0,
				technicalPerformanceScore: 0,
				energySavingAchievementPercent: 0,
				carbonReductionAchievementPercent: 0,
				averageProjectValue: 0,
				totalCompletedProjects: 0,
				clientApprovalRatePercent: 0,
				historicalTrend: [],
				bastRating: 0,
				retentionRate: "Unknown",
			};
		}
		return derivePerformanceMetrics(profile, myProjects);
	}, [profile, myProjects]);

	const negotiations: NegotiationRequest[] = useMemo(() => {
		return (negotiationsData?.negotiations ?? []).map(mapNegotiation);
	}, [negotiationsData]);

	const notifications: VendorNotification[] = useMemo(() => {
		return (notificationsData?.notifications ?? []).map(mapNotification);
	}, [notificationsData]);

	const leaderboard: LeaderboardView = useMemo(() => {
		return leaderboardData
			? mapLeaderboard(leaderboardData)
			: EMPTY_LEADERBOARD;
	}, [leaderboardData]);

	// ── Mutations ───────────────────────────────────────────
	const { mutate: markRead } = useMutation({
		mutationFn: (id: number) => api.vendor.readNotification(id),
		// The card stops reading as unread the moment it is marked, and the refetch
		// below confirms it rather than being what makes it happen.
		onMutate: async (id: number) => {
			await queryClient.cancelQueries({
				queryKey: ["vendor", "notifications"],
			});
			queryClient.setQueryData(
				["vendor", "notifications"],
				(previous: { notifications: ApiNotification[] } | undefined) =>
					previous
						? {
								...previous,
								notifications: previous.notifications.map((notification) =>
									notification.id === id
										? { ...notification, read: true }
										: notification,
								),
							}
						: previous,
			);
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["vendor", "notifications"] }),
	});

	const { mutate: respondToNegotiation } = useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: number;
			body: {
				revisedPrice?: number;
				revisedWarrantyYears?: number;
				revisedTimelineMonths?: number;
				note?: string;
			};
		}) => api.vendor.respondNegotiation(id, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vendor", "negotiations"] });
			queryClient.invalidateQueries({ queryKey: ["vendor", "proposals"] });
			queryClient.invalidateQueries({ queryKey: ["vendor", "my-projects"] });
		},
	});

	// Revising an open bid writes the new amount on the proposal itself, and
	// replaces the proposal document when a new one is chosen.
	const { mutateAsync: reviseBid } = useMutation({
		mutationFn: async (input: {
			proposalId: number;
			amount: number;
			file?: File | null;
		}) => {
			await api.vendor.updateProposal(input.proposalId, {
				amount: input.amount,
			});
			if (input.file) {
				await api.vendor.uploadProposalDocument(input.proposalId, input.file);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vendor", "leaderboard"] });
			queryClient.invalidateQueries({ queryKey: ["vendor", "proposals"] });
		},
	});

	// Both awaitable: the bid dialog only closes on a filed bid, so a rejection
	// keeps the vendor's entry in front of them instead of discarding it. The
	// document goes with the bid in the same request, so a bid cannot exist
	// without the case it is made on.
	const { mutateAsync: submitProposal } = useMutation({
		mutationFn: (input: {
			fields: {
				tenderId: number;
				amount: number;
				technicalSpec?: string;
				operationalCost?: number;
				warrantyPeriod?: number;
			};
			file: File;
		}) => api.vendor.submitProposal(input.fields, input.file),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vendor", "proposals"] });
			queryClient.invalidateQueries({ queryKey: ["vendor", "leaderboard"] });
		},
	});

	const { mutateAsync: createPortfolioItem } = useMutation({
		mutationFn: (item: VendorPortfolioItem) =>
			api.vendor.addPortfolioItem({
				projectName: item.projectName,
				clientName: item.clientName,
				projectType: item.projectType,
				location: item.location,
				description: item.description,
				projectValue: item.projectValue,
				durationMonths: item.durationMonths ?? undefined,
				servicesProvided: item.servicesProvided,
				energySavingPercent: item.energySavingPercent ?? undefined,
				carbonReductionTons: item.carbonReductionTons ?? undefined,
				completionYear: item.completionYear ?? undefined,
			}),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["vendor", "portfolio"] }),
	});

	// The file is a second request: a document is keyed to the record's id, so
	// the record has to exist first.
	const { mutateAsync: filePortfolioDocument } = useMutation({
		mutationFn: ({ id, file }: { id: number; file: File }) =>
			api.vendor.uploadPortfolioDocument(id, file),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["vendor", "portfolio"] }),
	});

	const { mutate: removePortfolioItem } = useMutation({
		mutationFn: (id: number) => api.vendor.deletePortfolioItem(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["vendor", "portfolio"] }),
	});

	const { mutate: sendMilestoneEvidence } = useMutation({
		mutationFn: ({
			milestoneId,
			body,
		}: {
			milestoneId: number;
			body: {
				kind: string;
				fileName: string;
				notes?: string;
				fileUrl?: string;
			};
		}) => api.vendor.addMilestoneEvidence(milestoneId, body),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["vendor", "my-projects"] }),
	});

	const { mutate: saveProfile } = useMutation({
		mutationFn: (body: {
			companyName: string;
			description: string;
			serviceCategory?: string;
			location?: string;
		}) =>
			api.vendor.saveProfile({
				companyName: body.companyName,
				description: body.description,
				serviceCategory: body.serviceCategory,
				location: body.location,
				certifications: profile?.certifications ?? [],
				portfolio: profile?.portfolio ?? [],
			}),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["vendor", "profile"] }),
	});

	/**
	 * The legal identity a vendor is verified against. It saves onto the same
	 * profile as everything else, so a vendor registered without NIB or NPWP can
	 * add them here without touching the rest of the record.
	 */
	const { mutate: saveVerificationDetails } = useMutation({
		mutationFn: (body: { nib: string; npwp: string }) =>
			api.vendor.saveProfile({
				companyName: profile?.companyName ?? "",
				nib: body.nib,
				npwp: body.npwp,
			}),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["vendor", "profile"] }),
	});

	// ── Actions ─────────────────────────────────────────────
	const toggleSaveProject = (projectId: string) => {
		setSavedProjects((prev) => {
			const next = new Set(prev);
			if (next.has(projectId)) {
				next.delete(projectId);
			} else {
				next.add(projectId);
			}
			if (typeof window !== "undefined") {
				localStorage.setItem(
					"vendor_saved_projects",
					JSON.stringify([...next]),
				);
			}
			return next;
		});
	};

	const placeOpenBid = (newPrice: number) => {
		const proposalId = leaderboard.myProposalId;
		if (!proposalId) return;
		void reviseBid({ proposalId: Number(proposalId), amount: newPrice });
	};

	const submitNegotiationResponse = (
		negId: string,
		revisedPrice?: number,
		revisedWarranty?: number,
		revisedTimeline?: number,
		responseNote?: string,
	) => {
		respondToNegotiation({
			id: Number(negId),
			body: {
				revisedPrice,
				revisedWarrantyYears: revisedWarranty,
				revisedTimelineMonths: revisedTimeline,
				note: responseNote,
			},
		});
	};

	const submitMilestoneEvidence = (
		_activeProjectId: string,
		milestoneId: string,
		evidenceItem: EvidenceFile,
		notes: string,
	) => {
		sendMilestoneEvidence({
			milestoneId: Number(milestoneId),
			body: {
				kind: evidenceItem.type,
				fileName: evidenceItem.name,
				notes,
			},
		});
	};

	/**
	 * Creates the record, then files the chosen document on it. A failure in
	 * either request rejects, so the caller can hold its dialog open; the shared
	 * client has already raised the toast.
	 */
	const addPortfolioItem = async (
		item: VendorPortfolioItem,
		file: File | null,
	) => {
		const created = await createPortfolioItem(item);
		if (file) {
			await filePortfolioDocument({ id: created.item.id, file });
		}
	};

	const deletePortfolioItem = (itemId: string) => {
		removePortfolioItem(Number(itemId));
	};

	const markNotificationRead = (notifId: string) => {
		markRead(Number(notifId));
	};

	return {
		isLoading: profileLoading || projectsLoading,
		verification,
		profile,
		projects,
		leaderboard: leaderboard.entries,
		leaderboardMeta: {
			tenderId: leaderboard.tenderId,
			myRank: leaderboard.myRank,
			myAmount: leaderboard.myAmount,
			projectTitle: leaderboard.projectTitle,
			deadlineAt: leaderboard.deadlineAt,
		},
		proposals,
		negotiations,
		blueprint,
		projectDetailLoading: projectDetailData === undefined,
		activeProjects,
		portfolio,
		performanceMetrics,
		notifications,
		toggleSaveProject,
		placeOpenBid,
		submitProposal,
		reviseProposal: reviseBid,
		submitNegotiationResponse,
		submitMilestoneEvidence,
		addPortfolioItem,
		// A mutation carries one variable; the hook's callers pass the pair.
		uploadPortfolioDocument: (id: number, file: File) =>
			filePortfolioDocument({ id, file }),
		portfolioDocumentPath: api.vendor.portfolioDocumentPath,
		deletePortfolioItem,
		saveVerificationDetails,
		markNotificationRead,
		saveProfile,
	};
}
