import { command, form } from '$app/server';
import type { RequestEvent } from '@sveltejs/kit';
import {
	companySearchSchema,
	createCompanySchema,
	verifyEmailSchema,
	inviteTeamSchema,
	type CreateCompanyInput,
	type VerifyEmailInput,
	type InviteTeamInput
} from '$lib/features/recruiters/validators';
import {
	searchOrganizations,
	createOrganization,
	addUserToOrganization,
	getOrganizationById
} from '$lib/features/organizations/server/repository';
import { db } from '$lib/server/db';
import { member, user } from '$lib/server/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Step 1: Search for existing companies
 * This is a command (not a form submission) because it's just for search
 */
export const searchCompanies = command(companySearchSchema, async (data, event: RequestEvent) => {
	const results = await searchOrganizations(data.query);

	return {
		success: true,
		organizations: results
	};
});

/**
 * Step 1: Create a new company if not found
 */
export const createNewCompany = form(createCompanySchema, async (data, event: RequestEvent) => {
	// Check if user is authenticated (Better Auth integration)
	const session = event.locals.session;
	if (!session?.user) {
		return {
			success: false,
			error: 'You must be logged in to create a company'
		};
	}

	try {
		// Create the organization
		const organization = await createOrganization({
			name: data.name,
			website: data.website
		});

		// Add the current user as an admin
		await addUserToOrganization(session.user.id, organization.id, 'admin');

		return {
			success: true,
			organization: {
				id: organization.id,
				name: organization.name,
				slug: organization.slug
			}
		};
	} catch (error) {
		console.error('Failed to create company:', error);
		return {
			success: false,
			error: 'Failed to create company. Please try again.'
		};
	}
});

/**
 * Step 2: Verify work email
 * Smart verification:
 * - If email already exists as member → auto-verify (skip email)
 * - Otherwise → send verification email
 */
export const verifyWorkEmail = form(verifyEmailSchema, async (data, event: RequestEvent) => {
	const session = event.locals.session;
	if (!session?.user) {
		return {
			success: false,
			error: 'You must be logged in'
		};
	}

	const fullEmail = `${data.emailPrefix}${data.domain}`;

	try {
		// Check if this email already exists as a member of the organization
		const [existingMember] = await db
			.select({
				userId: member.userId,
				email: user.email
			})
			.from(member)
			.innerJoin(user, eq(member.userId, user.id))
			.where(and(eq(member.organizationId, data.organizationId), eq(user.email, fullEmail)))
			.limit(1);

		if (existingMember) {
			// User is already a member - auto-verify
			// Check if the current user is the same as the existing member
			if (existingMember.userId === session.user.id) {
				return {
					success: true,
					autoVerified: true,
					message: "You're already a member of this organization!"
				};
			} else {
				return {
					success: true,
					autoVerified: true,
					message: 'This email is already registered. You have been verified!'
				};
			}
		}

		// TODO: Send verification email using Better Auth
		// For now, we'll just simulate sending the email
		console.log('Sending verification email to:', fullEmail);

		return {
			success: true,
			autoVerified: false,
			message: 'Verification email sent! Please check your inbox.',
			email: fullEmail
		};
	} catch (error) {
		console.error('Failed to verify email:', error);
		return {
			success: false,
			error: 'Failed to verify email. Please try again.'
		};
	}
});

/**
 * Step 2: Resend verification email
 */
export const resendVerificationEmail = command(z.string().email(), async (email, event: RequestEvent) => {
	// TODO: Implement resend logic with Better Auth
	console.log('Resending verification email to:', email);

	return {
		success: true,
		message: 'Verification email resent!'
	};
});

/**
 * Step 3: Invite team members
 */
export const inviteTeamMembers = form(inviteTeamSchema, async (data, event: RequestEvent) => {
	const session = event.locals.session;
	if (!session?.user) {
		return {
			success: false,
			error: 'You must be logged in'
		};
	}

	try {
		// Verify the user is a member of the organization
		const [membership] = await db
			.select()
			.from(member)
			.where(and(eq(member.userId, session.user.id), eq(member.organizationId, data.organizationId)))
			.limit(1);

		if (!membership) {
			return {
				success: false,
				error: 'You are not a member of this organization'
			};
		}

		// TODO: Send team invites using Better Auth invitation system
		// For now, we'll just log the invites
		console.log('Sending invites to:', data.emails);

		// Get organization details for the success message
		const organization = await getOrganizationById(data.organizationId);

		return {
			success: true,
			message: `${data.emails.length} invitation(s) sent successfully!`,
			organizationName: organization?.name
		};
	} catch (error) {
		console.error('Failed to invite team members:', error);
		return {
			success: false,
			error: 'Failed to send invitations. Please try again.'
		};
	}
});

/**
 * Get organization details by ID
 */
export const getOrganization = command(z.string(), async (organizationId, event: RequestEvent) => {
	try {
		const organization = await getOrganizationById(organizationId);

		if (!organization) {
			return {
				success: false,
				error: 'Organization not found'
			};
		}

		return {
			success: true,
			organization
		};
	} catch (error) {
		console.error('Failed to get organization:', error);
		return {
			success: false,
			error: 'Failed to retrieve organization'
		};
	}
});

// Type exports for form data
export type CreateCompanyFormData = CreateCompanyInput;
export type VerifyEmailFormData = VerifyEmailInput;
export type InviteTeamFormData = InviteTeamInput;
