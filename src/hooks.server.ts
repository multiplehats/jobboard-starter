import { paraglideMiddleware } from '$lib/paraglide/server';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { initPaymentSystem } from '$lib/features/payments/server/init';

// Initialize payment system once during app startup
initPaymentSystem();

const betterAuthHandler: Handle = async ({ event, resolve }) => {
	event.locals.getSession = auth.api.getSession;

	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

const guardHandler: Handle = async ({ event, resolve }) => {
	const isAdminRoute = event.route.id?.startsWith('/admin');

	/**
	 * Only check admin routes, we do not have auth on public routes.
	 */
	if (!isAdminRoute) {
		return resolve(event);
	}

	/**
	 * Redirect to root if the user is trying to hit the
	 * login or signup route while having a session
	 */
	if (
		event.url.pathname.startsWith('/sign-in') ||
		event.url.pathname.startsWith('/sign-up') ||
		event.url.pathname.startsWith('/magic-link') ||
		event.url.pathname.startsWith('/forgot-password')
	) {
		if (event.locals.session) {
			return Response.redirect(new URL('/admin', event.url));
		}
	}

	if (!event.locals.session) {
		return Response.redirect(new URL('/sign-in', event.url));
	}

	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

export const handle = sequence(betterAuthHandler, guardHandler, handleParaglide);
