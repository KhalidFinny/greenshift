import { api } from "@greenshift/core";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

/** Up to two initials from a display name ("Eco Tech Solutions" -> "ET"). */
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
	/** R2 object key of the picture, or null when the account has none. */
	avatarKey: string | null;
	className?: string;
	fallbackClassName?: string;
	size?: "default" | "sm" | "lg";
}

/** The account picture with initials behind it. Radix renders the fallback
 * whenever there is no picture or the image fails, so the avatar is never empty. */
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
