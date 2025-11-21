import type { AuthConfig, SessionObj, UserObj } from '$lib/server/auth';
import type { SiteConfig } from '$lib/config/site.server';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: UserObj;
			session?: SessionObj['session'];
			getSession: AuthConfig['api']['getSession'];
		}
		interface PageData {
			config: {
				flags: SiteConfig['flags'];
			};
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
