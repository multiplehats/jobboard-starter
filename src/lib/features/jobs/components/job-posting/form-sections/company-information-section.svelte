<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { getFormFieldIssues } from '$lib/utils/generators';
	import type { CompanyInformationSectionProps } from '../types';

	let { fields, disableFields }: CompanyInformationSectionProps = $props();
</script>

<Field.Set>
	<Field.Legend>Company Information</Field.Legend>
	<Field.Description>Details about your organization</Field.Description>
	<Field.Separator />
	<Field.Group class="@container/field-group">
		<Field.Field
			orientation="responsive"
			data-invalid={getFormFieldIssues(fields.organization.name).length > 0}
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label for="company-name">Company Name *</Field.Label>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<Input
					id="company-name"
					placeholder="Your Company Inc."
					{...fields.organization.name.as('text')}
					aria-invalid={getFormFieldIssues(fields.organization.name).length > 0}
					disabled={disableFields}
				/>
				{#each getFormFieldIssues(fields.organization.name) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
			</div>
		</Field.Field>
		<Field.Separator />
		<Field.Field
			orientation="responsive"
			data-invalid={getFormFieldIssues(fields.organization.url).length > 0}
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label for="company-url">Company Website *</Field.Label>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<Input
					id="company-url"
					placeholder="https://yourcompany.com"
					{...fields.organization.url.as('text')}
					type="url"
					aria-invalid={getFormFieldIssues(fields.organization.url).length > 0}
					disabled={disableFields}
				/>
				{#each getFormFieldIssues(fields.organization.url) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
			</div>
		</Field.Field>
		<Field.Separator />
		<Field.Field
			orientation="responsive"
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label for="company-logo">Company Logo URL</Field.Label>
				<Field.Description>Optional: URL to your company logo</Field.Description>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<Input
					id="company-logo"
					placeholder="https://yourcompany.com/logo.png"
					{...fields.organization.logo.as('text')}
					type="url"
					disabled={disableFields}
				/>
			</div>
		</Field.Field>
		<Field.Separator />
		<Field.Field
			orientation="responsive"
			data-invalid={getFormFieldIssues(fields.customerEmail).length > 0}
			class="grid grid-cols-1 gap-4 @[480px]/field-group:grid-cols-[2fr_3fr]"
		>
			<Field.Content>
				<Field.Label for="customer-email">Your Email *</Field.Label>
				<Field.Description
					>We'll send payment confirmation and job posting updates here</Field.Description
				>
			</Field.Content>
			<div class="flex flex-col gap-2">
				<Input
					id="customer-email"
					placeholder="you@company.com"
					{...fields.customerEmail.as('text')}
					type="email"
					aria-invalid={getFormFieldIssues(fields.customerEmail).length > 0}
					disabled={disableFields}
				/>
				{#each getFormFieldIssues(fields.customerEmail) as issue, i (i)}
					<Field.Error>{issue.message}</Field.Error>
				{/each}
			</div>
		</Field.Field>
	</Field.Group>
</Field.Set>
