import {
	adminClient,
	apiKeyClient,
	inferAdditionalFields,
	multiSessionClient,
	organizationClient
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { AuthConfig } from '$lib/server/auth';
import {
	ac,
	admin as adminRole,
	member as memberRole,
	owner,
	viewer
} from '$lib/shared/auth/permissions.js';

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<AuthConfig>(),
		adminClient(),
		organizationClient({
			ac, // Pass access control to client
			roles: {
				owner,
				admin: adminRole,
				member: memberRole,
				viewer
			},
			dynamicAccessControl: {
				enabled: true // Enable dynamic role creation on client
			}
		}),
		multiSessionClient(),
		apiKeyClient()
	],
	baseURL: PUBLIC_APP_URL
});
export type AuthClient = typeof authClient;

export type Session = AuthClient['$Infer']['Session'] | null;
export type User = AuthClient['$Infer']['Session']['user'] | null;
