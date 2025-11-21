import type { RemoteFormField, RemoteFormFieldType, RemoteFormFieldValue } from '@sveltejs/kit';

/**
 * A helper function to generate a list of objects with a customizable key and value.
 * You can optionally change the key or value name to suit your needs.
 *
 * IMPORTANT: The labels object MUST have exactly the same keys as the items array.
 * TypeScript will enforce this - no extra or missing keys allowed.
 *
 * @example
 * ```ts
 * const postStatuses = ['published', 'draft', 'expired'] as const;
 * const postStatusesLabels = {
 * 	published: 'Published',
 * 	draft: 'Draft',
 * 	expired: 'Expired'
 * } as const;
 *
 * export const postStatusesList = <K extends string = 'title', V extends string = 'value'>(keyName: K, valueName: V) =>
 * 	generateList(postStatuses, postStatusesLabels, keyName, valueName);
 *
 * // Returns:
 * // [
 * // 	{ title: 'Published', value: 'published' },
 * // 	{ title: 'Draft', value: 'draft' },
 * // 	{ title: 'Expired', value: 'expired' }
 * // ]
 *
 * // Usage:
 * // postStatusesList('title', 'value')
 * // postStatusesList('label', 'id')
 * // postStatusesList('name', 'id')
 *
 * // You can also use it with an array of strings:
 * // generateList(['published', 'draft', 'expired'], postStatusesLabels)
 * // generateList(['published', 'draft', 'expired'], postStatusesLabels, 'label', 'value')
 * // generateList(['published', 'draft', 'expired'], postStatusesLabels, 'name', 'id')
 * ```
 *
 * @param items Array of string values
 * @param labels Object with string values - MUST have exactly the keys from items array
 * @param keyName Key name for the label
 * @param valueName Key name for the value
 *
 * @returns Array of objects with keyName and valueName
 */
export function generateList<
	T extends readonly string[],
	K extends string = 'title',
	V extends string = 'value'
>(
	items: T,
	labels: Record<T[number], string>,
	keyName: K = 'title' as K,
	valueName: V = 'value' as V
) {
	type ItemType = (typeof items)[number];
	return items.map((key) => ({
		[keyName]: labels[key as ItemType],
		[valueName]: key
	})) as Array<{ [P in K]: string } & { [Q in V]: T[number] }>;
}

/**
 * Creates an enum list factory that supports i18n integration.
 * This is a higher-order function that returns a list generator function.
 *
 * @example
 * ```ts
 * // With default labels (no i18n)
 * const jobTypesList = createEnumListFactory(JOB_TYPES, JOB_TYPE_LABELS);
 * const list = jobTypesList(); // Uses default labels
 *
 * // With Paraglide i18n
 * import * as m from '$paraglide/messages';
 * const list = jobTypesList((value) => m.jobs.jobTypes[value]());
 *
 * // With custom key names
 * const list = jobTypesList(undefined, 'name', 'id');
 * // => [{ name: 'Full Time', id: 'full_time' }, ...]
 * ```
 *
 * @param enumValues Array of enum values (e.g., ['full_time', 'part_time'])
 * @param defaultLabels Default label mapping for fallback
 * @returns A function that generates a list with optional i18n support
 */
export function createEnumListFactory<T extends readonly string[]>(
	enumValues: T,
	defaultLabels: Record<T[number], string>
) {
	return <K extends string = 'label', V extends string = 'value'>(
		labelGetter?: (value: T[number]) => string,
		keyName: K = 'label' as K,
		valueName: V = 'value' as V
	) => {
		const labels = labelGetter
			? (Object.fromEntries(enumValues.map((value) => [value, labelGetter(value)])) as Record<
					T[number],
					string
				>)
			: defaultLabels;

		return generateList(enumValues, labels, keyName, valueName) as Array<
			Record<K, string> & Record<V, T[number]>
		>;
	};
}

export function getFormFieldIssues(field: RemoteFormField<RemoteFormFieldValue>) {
	return field?.issues?.() ?? [];
}
