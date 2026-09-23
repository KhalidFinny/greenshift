import { api } from "@greenshift/core";
import { Avatar, AvatarFallback, AvatarImage } from "../atoms/avatar";
import { cn } from "../lib/utils";

export function initialsOf(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word.charAt(0).toUpperCase())
		.join("");
}

interface AccountAvatarProps {
	name: string;
	avatarKey: string | null;
	className?: string;
	fallbackClassName?: string;
	size?: "default" | "sm" | "lg";
}

export function AccountAvatar({
	name,
	avatarKey,
	className,
	fallbackClassName,
	size,
}: AccountAvatarProps) {
	return (
		<Avatar className={className} size={size}>
			{avatarKey ? (
				<AvatarImage src={api.account.avatarPath(avatarKey)} alt="" />
			) : null}
			<AvatarFallback className={cn(fallbackClassName)}>
				{initialsOf(name)}
			</AvatarFallback>
		</Avatar>
	);
}
