import type { LiteralUnion } from "@better-auth/core";
import { createId as createCuid2Id } from "@paralleldrive/cuid2";

type BetterAuthModels =
	| "user"
	| "account"
	| "session"
	| "verification"
	| "organization"
	| "member"
	| "invitation"
	| "two-factor";

export const prefixes = {
	test: "test",
} as const;

export const betterAuthPrefixes: Record<BetterAuthModels, string> = {
	user: "user",
	account: "acc",
	session: "sess",
	verification: "ver",
	organization: "org",
	member: "mbr",
	invitation: "inv",
	"two-factor": "2fa",
};

export function createId<TPrefix extends keyof typeof prefixes>(
	prefix?: TPrefix,
	divider: "_" | "-" = "_",
) {
	if (!prefix) {
		return createCuid2Id();
	}

	return `${prefixes[prefix]}${divider}${createCuid2Id()}` as const;
}

export function createBetterAuthId<
	TModel extends LiteralUnion<BetterAuthModels, string>,
>(model: TModel, divider: "_" | "-" = "_") {
	const prefix = (betterAuthPrefixes as Record<string, string>)[model] || model;
	return `${prefix}${divider}${createCuid2Id()}`;
}
