import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db/index.js';
import {
	organization,
	twoFactor,
	magicLink,
	lastLoginMethod,
	multiSession,
	type Organization,
	type Member
} from 'better-auth/plugins';
import { createAuthMiddleware } from 'better-auth/api';
import { PUBLIC_APP_URL } from '$env/static/public';
import {
	ac,
	admin as adminRole,
	member as memberRole,
	owner,
	viewer
} from '$lib/shared/auth/permissions.js';
import { talentProfileRepository } from '$lib/features/talent/server/repository.js';
import { recruiterProfileRepository } from '$lib/features/recruiters/server/repository.js';

export const auth = betterAuth({
	baseURL: PUBLIC_APP_URL,
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
	],
	// Hook to create talent or recruiter profile after signup
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			// Only handle sign-up endpoints
			if (!ctx.path.startsWith('/sign-up')) {
				return;
			}

			// Get the newly created session
			const newSession = ctx.context.newSession;
			if (!newSession || !newSession.user) {
				return;
			}

			// Get the request body to extract userType
			if (!ctx.request) {
				return;
			}
			const body = await ctx.request.clone().json();
			const userType = body.userType;

			// Create the appropriate profile based on user type
			if (userType === 'talent') {
				await talentProfileRepository.create({
					userId: newSession.user.id,
					onboardingCompleted: false,
					onboardingStep: 0
				});
				console.log(`Created talent profile for user ${newSession.user.id}`);
			} else if (userType === 'recruiter') {
				await recruiterProfileRepository.create({
					userId: newSession.user.id,
					onboardingCompleted: false,
					onboardingStep: 0
				});
				console.log(`Created recruiter profile for user ${newSession.user.id}`);
			} else {
				console.warn(`Unknown user type "${userType}" for user ${newSession.user.id}`);
			}
		})
	}
});

export type AuthConfig = typeof auth;
export type SessionObj = typeof auth.$Infer.Session;
export type UserObj = typeof auth.$Infer.Session.user;
export type OrganizationObj = Organization;
export type MemberObj = Member;
