import { resolve } from '$app/paths';
import type { RouteId } from '$app/types';

/**
 * Helper function to create route paths with optional search params
 * Type-safe with SvelteKit's RouteId system
 */
function createRoute(
	route: RouteId,
	paramsOrSearch?: Record<string, string | number>,
	searchParams?: Record<string, string>
): string {
	let resolvedPath: string;
	let finalSearchParams: Record<string, string> | undefined;

	// Determine if we have route params
	if (searchParams !== undefined) {
		// Three args: route, params, searchParams
		// @ts-expect-error - params structure varies by route
		resolvedPath = resolve(route, paramsOrSearch);
		finalSearchParams = searchParams;
	} else if (
		paramsOrSearch &&
		typeof paramsOrSearch === 'object' &&
		Object.keys(paramsOrSearch).length > 0
	) {
		// Two args: could be (route, params) or (route, searchParams)
		// If route needs params (like /auth/[path]), first arg is params
		// Otherwise, it's searchParams
		const routeStr = String(route);
		const hasPathParam = routeStr.includes('[path]') && 'path' in paramsOrSearch;

		if (hasPathParam) {
			// @ts-expect-error - params structure varies by route
			resolvedPath = resolve(route, paramsOrSearch);
			finalSearchParams = undefined;
		} else {
			// @ts-expect-error - route may or may not need params
			resolvedPath = resolve(route);
			finalSearchParams = paramsOrSearch as Record<string, string>;
		}
	} else {
		// One arg: just route
		// @ts-expect-error - route may or may not need params
		resolvedPath = resolve(route);
		finalSearchParams = undefined;
	}

	if (!finalSearchParams || Object.keys(finalSearchParams).length === 0) {
		return resolvedPath;
	}

	const query = new URLSearchParams(finalSearchParams).toString();
	return `${resolvedPath}?${query}`;
}

/**
 * Helper to merge multiple search param objects (later ones override earlier)
 */
function mergeSearchParams(
	...params: (Record<string, string> | undefined)[]
): Record<string, string> | undefined {
	const filtered = params.filter((p): p is Record<string, string> => p !== undefined);
	if (filtered.length === 0) return undefined;
	return Object.assign({}, ...filtered);
}

/**
 * Type-safe routes with consistent function-based API.
 *
 * Benefits:
 * - Full IntelliSense for all routes
 * - TypeScript enforces correct parameters
 * - Compile-time validation of route existence
 * - Centralized route management
 * - Consistent API - every route is a function
 * - Flexible - any route can accept search params
 */
export const routes = {
	// Home
	home: (searchParams?: Record<string, string>) => createRoute('/(public)', searchParams),

	// Post a job
	postJob: (searchParams?: Record<string, string>) =>
		createRoute('/(public)/post-a-job', searchParams)
} as const;

/**
 * Helper function to create auth route paths with optional search params
 */
function authPath(path: string, searchParams?: Record<string, string>) {
	const basePath = resolve(`/auth/${path}`);

	if (searchParams && Object.keys(searchParams).length > 0) {
		const query = new URLSearchParams(searchParams).toString();
		return `${basePath}?${query}`;
	}

	return basePath;
}

/**
 * Auth routes with consistent function-based API
 */
export const authRoutes = {
	getStarted: (searchParams?: Record<string, string>) => authPath('get-started', searchParams),
	signIn: (searchParams?: Record<string, string>) => authPath('sign-in', searchParams),
	signUp: (searchParams?: Record<string, string>) => authPath('sign-up', searchParams),
	forgotPassword: (searchParams?: Record<string, string>) =>
		authPath('forgot-password', searchParams),
	resetPassword: (searchParams?: Record<string, string>) => authPath('reset-password', searchParams)
} as const;

/**
 * Convenience route builders with pre-filled params that support additional params
 */
export const signUpTalent = (additionalParams?: Record<string, string>) =>
	authRoutes.signUp(
		mergeSearchParams({ userType: 'talent', callbackUrl: '/onboarding/talent' }, additionalParams)
	);

export const signUpRecruiter = (additionalParams?: Record<string, string>) =>
	authRoutes.signUp(
		mergeSearchParams(
			{ userType: 'recruiter', callbackUrl: '/onboarding/recruit' },
			additionalParams
		)
	);

/**
 * Convenience paths (backward compatibility)
 */
export const postAJobPath = routes.postJob();
export const signUpPath = authRoutes.getStarted();
export const signUpTalentPath = signUpTalent();
export const signUpRecruiterPath = signUpRecruiter();

/**
 * Example usage with full type safety:
 *
 * // Simple route (no params required)
 * routes.home() // ✅ '/(public)'
 *
 * // Route with params (params REQUIRED and type-checked)
 * routes.auth({ path: 'sign-in' }) // ✅ '/auth/sign-in'
 * routes.auth() // ❌ TypeScript error - missing required param
 * routes.auth({ wrong: 'sign-in' }) // ❌ TypeScript error - wrong param name
 *
 * // With search params
 * routes.auth({ path: 'sign-up' }, { userType: 'talent' })
 * // ✅ '/auth/sign-up?userType=talent'
 *
 * // Using helper functions
 * authRoutes.signIn() // ✅ '/auth/sign-in'
 * authRoutes.signUp({ userType: 'talent', callbackUrl: '/dashboard' })
 * // ✅ '/auth/sign-up?userType=talent&callbackUrl=%2Fdashboard'
 */
