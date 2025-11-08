import { redirect, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrganizationById } from '$lib/features/organizations/server/repository';
import { recruiterProfileRepository } from '$lib/features/recruiters/server/repository';
import { db } from '$lib/server/db';
import { invitation } from '$lib/server/db/schema.js';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/login');
	}

	// Get organization ID from cookie
	const orgId = event.cookies.get('onboarding_org_id');

	if (!orgId) {
		redirect(302, '/onboarding/recruit/find-company');
	}

	const organization = await getOrganizationById(orgId);

	if (!organization) {
		redirect(302, '/onboarding/recruit/find-company');
	}

	return {
		user,
		organization
	};
};

export const actions: Actions = {
	sendInvites: async (event) => {
		const user = event.locals.user;

		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await event.request.formData();
		const orgId = event.cookies.get('onboarding_org_id');

		if (!orgId) {
			return fail(400, { error: 'Organization not found' });
		}

		try {
			// Extract all email fields
			const emails: string[] = [];
			let index = 0;
			while (formData.has(`email-${index}`)) {
				const email = formData.get(`email-${index}`) as string;
				if (email?.trim()) {
					emails.push(email.trim());
				}
				index++;
			}

			if (emails.length === 0) {
				return fail(400, { error: 'At least one email is required' });
			}

			// Validate emails
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			const invalidEmails = emails.filter((e) => !emailRegex.test(e));

			if (invalidEmails.length > 0) {
				return fail(400, { error: `Invalid email(s): ${invalidEmails.join(', ')}` });
			}

			// Create invitations
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

			for (const email of emails) {
				await db.insert(invitation).values({
					organizationId: orgId,
					email,
					role: 'member',
					status: 'pending',
					expiresAt,
					inviterId: user.id
				});

				// TODO: Send invitation email
				// This would integrate with your email service (e.g., Resend, SendGrid)
				console.log(`Sending invitation to: ${email}`);
			}

			return {
				success: true,
				inviteCount: emails.length
			};
		} catch (error) {
			console.error('Error sending invitations:', error);
			return fail(500, { error: 'Failed to send invitations' });
		}
	}
};
