import { redirect, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrganizationById } from '$lib/features/organizations/server/repository';
import { recruiterProfileRepository } from '$lib/features/recruiters/server/repository';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/login');
	}

	// Get organization ID from cookie or query param
	const orgId = event.url.searchParams.get('orgId') || event.cookies.get('onboarding_org_id');

	if (!orgId) {
		redirect(302, '/onboarding/recruit/find-company');
	}

	const organization = await getOrganizationById(orgId);

	if (!organization) {
		redirect(302, '/onboarding/recruit/find-company');
	}

	// Store org ID in cookie for next steps
	event.cookies.set('onboarding_org_id', orgId, {
		path: '/onboarding',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 // 1 hour
	});

	return {
		user,
		organization
	};
};

export const actions: Actions = {
	sendVerification: async (event) => {
		const user = event.locals.user;

		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await event.request.formData();
		const emailPrefix = formData.get('emailPrefix') as string;

		if (!emailPrefix?.trim()) {
			return fail(400, { error: 'Email prefix is required' });
		}

		const orgId = event.cookies.get('onboarding_org_id');

		if (!orgId) {
			return fail(400, { error: 'Organization not found' });
		}

		try {
			const organization = await getOrganizationById(orgId);

			if (!organization) {
				return fail(404, { error: 'Organization not found' });
			}

			// Get email domain from organization metadata
			let emailDomain = 'company.com';
			if (organization.metadata) {
				const metadata = typeof organization.metadata === 'string'
					? JSON.parse(organization.metadata)
					: organization.metadata;

				if (metadata.website) {
					try {
						const url = new URL(metadata.website.startsWith('http') ? metadata.website : `https://${metadata.website}`);
						emailDomain = url.hostname.replace('www.', '');
					} catch {
						// Use default domain
					}
				}
			}

			const fullEmail = `${emailPrefix.trim()}@${emailDomain}`;

			// TODO: Send verification email
			// This would integrate with your email service (e.g., Resend, SendGrid)
			// For now, we'll just log it
			console.log(`Sending verification email to: ${fullEmail}`);
			console.log(`Organization: ${organization.name}`);
			console.log(`User: ${user.email}`);

			// Store email for verification
			event.cookies.set('verification_email', fullEmail, {
				path: '/onboarding',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 // 1 hour
			});

			return {
				success: true,
				email: fullEmail
			};
		} catch (error) {
			console.error('Error sending verification email:', error);
			return fail(500, { error: 'Failed to send verification email' });
		}
	}
};
