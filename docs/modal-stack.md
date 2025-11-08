# Modal Stack System

## Overview

The modal stack system is built on `@svelte-put/async-stack`, providing a centralized, type-safe way to manage modals. It uses a promise-based architecture that allows components to push modals onto a stack and await their resolution.

## Architecture

### Stack Configuration

Located in: `src/lib/components/modal-stack/config.ts`

```typescript
import { stack } from '@svelte-put/async-stack';

export const modalStack = stack()
	.addVariant('confirm', ConfirmationModal)
	.addVariant('addWebsite', AddWebsiteModal)
	// ... other variants
	.build();
```

### Provider Component

Located in: `src/lib/components/modal-stack/modal-stack-provider.svelte`

- Sets up the modal stack in Svelte context
- Renders active modals
- Provides the `useModals()` hook
- Automatically clears modals on navigation

## Usage

### Setup

Wrap your app in the root layout:

```svelte
<script>
	import { ModalStackProvider } from '$lib/components/modal-stack';
</script>

<ModalStackProvider>
	<!-- Your app content -->
</ModalStackProvider>
```

### Using Modals in Components

```svelte
<script lang="ts">
	import { useModals } from '$lib/components/modal-stack/modal-stack-provider.svelte';

	const modals = useModals();

	async function handleDelete() {
		const modal = modals.push('confirm', {
			props: {
				title: 'Delete Item',
				description: 'Are you sure?',
				type: 'delete'
			}
		});

		const result = await modal.resolution;
		if (result.confirmed) {
			// User confirmed
		}
	}
</script>
```

## Creating Modal Components

```svelte
<script lang="ts">
	import type { StackItemProps } from '@svelte-put/async-stack';

	let { item, title, description }: StackItemProps<{ confirmed: boolean }> & Props = $props();

	function handleConfirm() {
		item.resolve({ confirmed: true });
	}

	function handleCancel() {
		item.resolve({ confirmed: false });
	}
</script>

<dialog>
	<h2>{title}</h2>
	<p>{description}</p>
	<button onclick={handleConfirm}>Confirm</button>
	<button onclick={handleCancel}>Cancel</button>
</dialog>
```

## Adding New Modals

1. Create the modal component in `src/lib/components/modal-stack/[modal-name]/`
2. Export it from an index file
3. Add it to the stack configuration in `config.ts`
4. Use it: `modals.push('myNewModal', { props: {...} })`

## Benefits

- **Centralized Management**: All modals in one stack
- **Type Safety**: Full TypeScript support
- **Promise-Based**: Async/await pattern for results
- **Navigation Aware**: Auto-cleanup on navigation
- **Flexible**: Easy to add new modal variants

For detailed examples and best practices, see [CLAUDE.md](../CLAUDE.md).
