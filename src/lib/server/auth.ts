import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db/index.js';
import {
	organization,
	twoFactor,
	magicLink,
	lastLoginMethod,
	multiSession
} from 'better-auth/plugins';
import { BETTER_AUTH_URL } from '$env/static/private';
import {
	ac,
	admin as adminRole,
	member as memberRole,
	owner,
	viewer
} from '$lib/shared/permissions.js';

export const auth = betterAuth({
	baseURL: BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	socialProviders: {
		google: {
			clientId: '',
			clientSecret: ''
		}
	},
	plugins: [
		organization({
			ac, // Our access control instance
			roles: {
				owner,
				admin: adminRole,
				member: memberRole,
				viewer
			},
			dynamicAccessControl: {
				enabled: true // Enable dynamic role creation
			}
			// No organization hooks needed - users will create their own API keys
			// Trial users can create keys through the dashboard with trial limits
		}),
		twoFactor(),
		magicLink({
			async sendMagicLink(data) {
				console.log('Sending magic link', {
					url: data.url
				});
			}
		}),
		lastLoginMethod(),
		multiSession()
	]
});
