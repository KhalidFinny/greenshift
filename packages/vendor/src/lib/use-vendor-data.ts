import { api } from "@greenshift/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
	derivePerformanceMetrics,
	mapProjectToCardData,
	mapToActiveProject,
	mapToPortfolioItem,
	mapToStructuredProposal,
	mapVerificationStatus,
} from "./api-mappers";
// ── Fallback demo data (used when API fails) ─────────────
import { sampleNotifications, sampleOpenBidLeaderboard } from "./demo-data";
import type {
	ActiveVendorProject,
	EvidenceFile,
	NegotiationRequest,
	OpenBidLeaderboardEntry,
	StructuredProposal,
	VendorNotification,
	VendorPerformanceMetrics,
	VendorPortfolioItem,
	VendorProjectCardData,
} from "./types";

export function useVendorData() {
	// ── Local state (before derived data that depends on them) ─────
	const [savedProjects, setSavedProjects] = useState<Set<string>>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("vendor_saved_projects");
			return saved ? new Set(JSON.parse(saved)) : new Set();
		}
		return new Set();
	});

	const [userPortfolio, setUserPortfolio] = useState<VendorPortfolioItem[]>(
		() => {
			if (typeof window !== "undefined") {
				const saved = localStorage.getItem("vendor_portfolio");
				return saved ? JSON.parse(saved) : [];
			}
			return [];
		},
	);

	const [leaderboard, setLeaderboard] = useState<OpenBidLeaderboardEntry[]>(
		sampleOpenBidLeaderboard,
	);

	const [readNotifications, setReadNotifications] = useState<Set<string>>(
		() => {
			if (typeof window !== "undefined") {
				const saved = localStorage.getItem("vendor_read_notifications");
				return saved ? new Set(JSON.parse(saved)) : new Set();
			}
			return new Set();
		},
	);

	// ── Fetch data from API ─────────────────────────────────
	const { data: profileData, isLoading: profileLoading } = useQuery({
		queryKey: ["vendor", "profile"],
		queryFn: () => api.vendor.profile(),
		staleTime: 5 * 60 * 1000,
	});

	const { data: myProjectsData, isLoading: projectsLoading } = useQuery({
		queryKey: ["vendor", "my-projects"],
		queryFn: () => api.vendor.myProjects(),
		staleTime: 2 * 60 * 1000,
	});

	const { data: marketProjectsData } = useQuery({
		queryKey: ["vendor", "projects"],
		queryFn: () => api.vendor.projects(),
		staleTime: 2 * 60 * 1000,
	});

	const { data: proposalsData } = useQuery({
		queryKey: ["vendor", "proposals"],
		queryFn: () => api.vendor.proposals(),
		staleTime: 2 * 60 * 1000,
	});

	// ── Derived data ───────────────────────────────────────
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

	const apiPortfolio: VendorPortfolioItem[] = useMemo(() => {
		return myProjects
			.map(mapToPortfolioItem)
			.filter((p): p is VendorPortfolioItem => p !== null);
	}, [myProjects]);

	const portfolio: VendorPortfolioItem[] = useMemo(() => {
		const apiIds = new Set(apiPortfolio.map((p) => p.id));
		const uniqueUserItems = userPortfolio.filter((p) => !apiIds.has(p.id));
		return [...apiPortfolio, ...uniqueUserItems];
	}, [apiPortfolio, userPortfolio]);

	const proposals: StructuredProposal[] = useMemo(() => {
		const items = proposalsData?.proposals ?? [];
		return items.map(mapToStructuredProposal);
	}, [proposalsData]);

	const performanceMetrics: VendorPerformanceMetrics = useMemo(() => {
		if (!profile) {
			return {
				completionRatePercent: 95,
				onTimeCompletionPercent: 92,
				technicalPerformanceScore: 90,
				energySavingAchievementPercent: 100,
				carbonReductionAchievementPercent: 100,
				averageProjectValue: 8500000000,
				totalCompletedProjects: 0,
				clientApprovalRatePercent: 95,
				historicalTrend: [
					{ period: "24Q1", score: 85 },
					{ period: "24Q3", score: 88 },
					{ period: "25Q1", score: 90 },
					{ period: "25Q3", score: 93 },
					{ period: "26Q1", score: 95 },
				],
				bastRating: 4.7,
				retentionRate: "High",
			};
		}
		return derivePerformanceMetrics(profile, myProjects);
	}, [profile, myProjects]);

	const negotiations: NegotiationRequest[] = [];

	const notifications: VendorNotification[] = sampleNotifications;

	const notificationsWithRead: VendorNotification[] = useMemo(() => {
		return notifications.map((n) => ({
			...n,
			isRead: readNotifications.has(n.id) || n.isRead,
		}));
	}, [notifications, readNotifications]);

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
		setLeaderboard((prev) => {
			const updated = prev.map((item) =>
				item.isCurrentVendor
					? {
							...item,
							currentPrice: newPrice,
							updatedAt: new Date().toISOString(),
						}
					: item,
			);
			return updated
				.sort((a, b) => a.currentPrice - b.currentPrice)
				.map((item, idx) => ({ ...item, rank: idx + 1 }));
		});
	};

	const submitProposal = (newProposal: StructuredProposal) => {
		console.log("Submit proposal:", newProposal);
	};

	const submitNegotiationResponse = (
		negId: string,
		_revisedPrice?: number,
		_revisedWarranty?: number,
		_revisedTimeline?: number,
		_responseNote?: string,
	) => {
		console.log("Negotiation response:", negId);
	};

	const submitMilestoneEvidence = (
		activeProjectId: string,
		milestoneId: string,
		_evidenceItem: EvidenceFile,
		_notes: string,
	) => {
		console.log("Submit evidence:", activeProjectId, milestoneId);
	};

	const addPortfolioItem = (item: VendorPortfolioItem) => {
		setUserPortfolio((prev) => {
			const updated = [item, ...prev];
			if (typeof window !== "undefined") {
				localStorage.setItem("vendor_portfolio", JSON.stringify(updated));
			}
			return updated;
		});
	};

	const deletePortfolioItem = (itemId: string) => {
		setUserPortfolio((prev) => {
			const updated = prev.filter((p) => p.id !== itemId);
			if (typeof window !== "undefined") {
				localStorage.setItem("vendor_portfolio", JSON.stringify(updated));
			}
			return updated;
		});
	};

	const uploadVerificationDocs = (
		_nib: string,
		_npwp: string,
		_legalDocName: string,
		_escoCertName: string,
	) => {
		console.log("Upload verification docs");
	};

	const markNotificationRead = (notifId: string) => {
		setReadNotifications((prev) => {
			const next = new Set(prev);
			next.add(notifId);
			if (typeof window !== "undefined") {
				localStorage.setItem(
					"vendor_read_notifications",
					JSON.stringify([...next]),
				);
			}
			return next;
		});
	};

	return {
		isLoading: profileLoading || projectsLoading,
		verification,
		projects,
		leaderboard,
		proposals,
		negotiations,
		activeProjects,
		portfolio,
		performanceMetrics,
		notifications: notificationsWithRead,
		toggleSaveProject,
		placeOpenBid,
		submitProposal,
		submitNegotiationResponse,
		submitMilestoneEvidence,
		addPortfolioItem,
		deletePortfolioItem,
		uploadVerificationDocs,
		markNotificationRead,
	};
}
