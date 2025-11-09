import type { AuthConfig, SessionObj, UserObj } from '$lib/server/auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: UserObj;
			session?: SessionObj['session'];
			getSession: AuthConfig['api']['getSession'];
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
