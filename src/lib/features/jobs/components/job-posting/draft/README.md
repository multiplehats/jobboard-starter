# Draft Manager Component

A headless Svelte 5 component that manages draft state persistence for the job posting form.

## Location

`/Users/jayden/Code/jobboardstarter/src/lib/features/jobs/components/draft/draft-manager.svelte`

## Features

- **Automatic Draft Loading**: Restores saved draft data on component mount
- **Auto-Save with Debouncing**: Automatically saves changes after 500ms of inactivity
- **Manual Save**: Exposes a `saveDraft()` function for manual save triggers
- **Persistent Storage**: Uses `PersistedState` from 'runed' to save to localStorage
- **Type-Safe**: Full TypeScript support with exported types
- **Headless**: No UI - just logic

## Usage

### Basic Usage

```svelte
<script lang="ts">
  import DraftManager from '$lib/features/jobs/components/draft/draft-manager.svelte';
  import { submitJobPosting } from '$lib/features/jobs/actions/post-job.remote.js';

  // Your form state
  let selectedJobType = $state<JobType>();
  let selectedSeniority = $state<SeniorityLevel[]>([]);
  let selectedLocationType = $state('remote');
  // ... other form state

  let jobDescriptionEditor = $state<Editor>();
  let jobDescriptionJSON = $state('');
  let selectedUpsells = $state<Set<string>>(new Set());
</script>

<DraftManager
  bind:selectedJobType
  bind:selectedSeniority
  bind:selectedLocationType
  bind:selectedHiringLocationType
  bind:selectedWorkingPermitsType
  bind:selectedCurrency
  bind:salaryRange
  bind:applicationDeadline
  bind:selectedUpsells
  bind:jobDescriptionEditor
  bind:jobDescriptionJSON
  {submitJobPosting}
>
  {#snippet children({ saveDraft })}
    <!-- Your form UI here -->
    <form {...submitJobPosting}>
      <!-- Form fields -->

      <Button type="button" onclick={saveDraft}>
        Save Draft
      </Button>
    </form>
  {/snippet}
</DraftManager>
```

### With Callbacks

```svelte
<DraftManager
  bind:selectedJobType
  bind:selectedSeniority
  {/* ... other props */}
  onDraftLoaded={(draft) => {
    console.log('Draft loaded:', draft);
    // Perform additional actions after draft is loaded
  }}
  onDraftSaved={() => {
    console.log('Draft saved!');
    // Custom logic after manual save
  }}
>
  {#snippet children({ saveDraft })}
    <!-- Your form UI -->
  {/snippet}
</DraftManager>
```

## Props

### Required Props

All props use `$bindable()` to enable two-way binding:

- `selectedJobType`: `JobType | undefined` - Selected job type
- `selectedSeniority`: `SeniorityLevel[]` - Array of selected seniority levels
- `selectedLocationType`: `string` - Location type (remote/onsite/hybrid)
- `selectedHiringLocationType`: `string` - Hiring location type
- `selectedWorkingPermitsType`: `string` - Working permits type
- `selectedCurrency`: `string` - Salary currency
- `salaryRange`: `[number, number]` - Min and max salary
- `applicationDeadline`: `CalendarDate | undefined` - Application deadline
- `selectedUpsells`: `Set<string>` - Set of selected upsell IDs
- `jobDescriptionEditor`: `Editor | undefined` - TipTap editor instance
- `jobDescriptionJSON`: `string` - JSON string of editor content
- `submitJobPosting`: `any` - Remote function with `.fields` property

### Optional Props

- `onDraftLoaded`: `(draft: DraftData) => void` - Callback when draft is loaded
- `onDraftSaved`: `() => void` - Callback when manual save completes
- `children`: `Snippet<[{ saveDraft: () => void }]>` - Child content with exposed API

## Exposed API

The component exposes the following via the snippet:

- `saveDraft()`: Function to trigger immediate manual save with toast notification

## Storage

Draft data is stored in localStorage with the key: `job-posting-draft`

### Draft Data Structure

```typescript
type DraftData = {
  selectedJobType?: JobType;
  selectedSeniority: SeniorityLevel[];
  selectedLocationType: string;
  selectedHiringLocationType: string;
  selectedWorkingPermitsType: string;
  selectedCurrency: string;
  salaryRange: [number, number];
  applicationDeadline?: string;
  jobDescriptionJSON: string;
  selectedUpsells: string[];
  formValues: Record<string, unknown>;
};
```

## How It Works

1. **On Mount**: Checks localStorage for saved draft and restores all form state
2. **Auto-Save**: Watches all form state variables and auto-saves after 500ms of inactivity
3. **Manual Save**: When `saveDraft()` is called, immediately saves and shows success toast
4. **Form Values**: Recursively collects all remote function field values for storage

## Notes

- The component uses `$effect` for side effects (loading/saving), which is correct for this use case
- Debouncing prevents excessive localStorage writes
- Draft is only loaded once on mount to avoid overwriting user changes
- All state changes after initial load trigger auto-save
- Editor content is stored as JSON for full restoration capability
