/**
 * Site configuration.
 *
 * You cannot import this client-side. It is passed down from the root +layout.server.ts file.
 * And can be accessed client-side using the `useSiteConfig` hook or via `page.data.config`.
 */
export const siteConfig = {
	appName: 'Job Board Starter',
	flags: {
		darkMode: true
	},
	auth: {
		authPageImage: '/public/auth-screen.jpg'
	},
	featuredRecruiters: [
		{
			name: 'Linear',
			logo: 'https://metadata.stacksee.com/linear.app',
			href: 'https://linear.app'
		},
		{
			name: 'Plausible',
			logo: 'https://metadata.stacksee.com/plausible.io',
			href: 'https://plausible.io'
		},
		{
			name: 'Slash',
			logo: 'https://metadata.stacksee.com/slash.com',
			href: 'https://slash.com'
		}
	],
	featuredTalents: [
		{
			name: 'Sindre Sorhus',
			avatar: '/public/avatar-1.png'
		},
		{
			name: 'Kent C. Dodds',
			avatar: '/public/avatar-2.png'
		},
		{
			name: 'Cassidy Williams',
			avatar: '/public/avatar-3.png'
		}
	]
} as const;

export type SiteConfig = typeof siteConfig;
