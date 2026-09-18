import { api } from "@greenshift/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
	derivePerformanceMetrics,
	type LeaderboardView,
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
 */
export function useVendorData() {
	const queryClient = useQueryClient();

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

	const { data: leaderboardData } = useQuery({
		queryKey: ["vendor", "leaderboard"],
		queryFn: () => api.vendor.leaderboard(),
		staleTime: REFRESH_FAST,
	});

	const { data: portfolioData } = useQuery({
		queryKey: ["vendor", "portfolio"],
		queryFn: () => api.vendor.portfolio(),
		staleTime: REFRESH_SLOW,
	});

	// ── Derived data ────────────────────────────────────────
	const profile = profileData?.profile;
	const myProjects = myProjectsData?.projects ?? [];

	const verification = useMemo(() => {
		if (!profile) {
			return { status: "NOT_VERIFIED" as const };
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

	// Revising an open bid writes the new amount on the proposal itself.
	const { mutate: reviseBid } = useMutation({
		mutationFn: ({
			proposalId,
			amount,
		}: {
			proposalId: number;
			amount: number;
		}) => api.vendor.updateProposal(proposalId, { amount }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vendor", "leaderboard"] });
			queryClient.invalidateQueries({ queryKey: ["vendor", "proposals"] });
		},
	});

	const { mutate: createPortfolioItem } = useMutation({
		mutationFn: (item: VendorPortfolioItem) =>
			api.vendor.addPortfolioItem({
				projectName: item.projectName,
				clientName: item.clientName,
				projectType: item.projectType,
				location: item.location,
				description: item.description,
				projectValue: item.projectValue,
				durationMonths: item.durationMonths,
				servicesProvided: item.servicesProvided,
				energySavingPercent: item.energySavingPercent,
				carbonReductionTons: item.carbonReductionTons,
				completionYear: item.completionYear,
				status: item.status,
				documentName: item.documentName,
			}),
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
		reviseBid({ proposalId: Number(proposalId), amount: newPrice });
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

	const addPortfolioItem = (item: VendorPortfolioItem) => {
		createPortfolioItem(item);
	};

	const deletePortfolioItem = (itemId: string) => {
		removePortfolioItem(Number(itemId));
	};

	// Verification documents have no backend field yet (they pair with the
	// admin verification flow), so the settings form is not persisted.
	const uploadVerificationDocs = (
		_nib: string,
		_npwp: string,
		_legalDocName: string,
		_escoCertName: string,
	) => {
		console.log("Upload verification docs");
	};

	const markNotificationRead = (notifId: string) => {
		markRead(Number(notifId));
	};

	return {
		isLoading: profileLoading || projectsLoading,
		verification,
		projects,
		leaderboard: leaderboard.entries,
		leaderboardMeta: {
			myRank: leaderboard.myRank,
			myAmount: leaderboard.myAmount,
			projectTitle: leaderboard.projectTitle,
			deadlineAt: leaderboard.deadlineAt,
		},
		proposals,
		negotiations,
		activeProjects,
		portfolio,
		performanceMetrics,
		notifications,
		toggleSaveProject,
		placeOpenBid,
		submitNegotiationResponse,
		submitMilestoneEvidence,
		addPortfolioItem,
		deletePortfolioItem,
		uploadVerificationDocs,
		markNotificationRead,
	};
}
