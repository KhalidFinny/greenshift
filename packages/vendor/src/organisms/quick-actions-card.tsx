import {
	faFileSignature,
	faLeaf,
	faTasks,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@greenshift/ui";
import { Link } from "@tanstack/react-router";

export function QuickActionsCard() {
	return (
		<Card className="flex flex-col justify-between">
			<CardHeader>
				<CardTitle className="text-lg">Quick Actions</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<Link to="/vendor/opportunities" className="block">
					<Button variant="outline" className="w-full justify-start gap-2">
						<FontAwesomeIcon icon={faLeaf} className="text-emerald-700" />
						Explore Opportunities
					</Button>
				</Link>

				<Link to="/vendor/deals" className="block">
					<Button variant="outline" className="w-full justify-start gap-2">
						<FontAwesomeIcon icon={faFileSignature} className="text-blue-600" />
						Review Proposals & Deals
					</Button>
				</Link>

				<Link to="/vendor/deals" className="block">
					<Button variant="outline" className="w-full justify-start gap-2">
						<FontAwesomeIcon icon={faTasks} className="text-amber-700" />
						Update Active Milestones
					</Button>
				</Link>
			</CardContent>
		</Card>
	);
}
