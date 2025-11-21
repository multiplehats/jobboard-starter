# Integration Example

This document shows how to integrate the DraftManager component into the post-a-job page.

## Step 1: Import the Component

```svelte
<script lang="ts">
  import { DraftManager } from '$lib/features/jobs/components/draft';
  // ... other imports
</script>
```

## Step 2: Wrap Your Form with DraftManager

Replace the existing draft logic (lines 113-533 in the original page) with:

```svelte
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
    <!-- Your existing form content -->
    <form {...submitJobPosting} class="w-full">
      <!-- All your existing form fields -->

      <!-- Update the Save Draft button to use the exposed saveDraft function -->
      <Field.Field orientation="horizontal">
        <Button type="button" variant="outline" size="lg" onclick={saveDraft}>
          Save as Draft
        </Button>
        <Button type="submit" size="lg" class="bg-gradient-to-r from-primary to-primary/80">
          <CheckCircleIcon class="mr-2 size-5" />
          Publish Job Posting
        </Button>
      </Field.Field>
    </form>
  {/snippet}
</DraftManager>
```

## Step 3: Remove Old Draft Logic

You can safely remove the following from the original page:

### Remove these type definitions (lines 114-126):
```typescript
// DELETE THIS:
type DraftData = {
  selectedJobType?: JobType;
  selectedSeniority: SeniorityLevel[];
  // ... rest of the type
};
```

### Remove these state variables (lines 128-143):
```typescript
// DELETE THIS:
const draftState = new PersistedState<DraftData>('job-posting-draft', {
  // ... default values
});

let hasLoadedDraft = $state(false);
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
```

### Remove these effects and functions (lines 364-533):
```typescript
// DELETE THIS:
// Load draft on mount
$effect(() => {
  // ... draft loading logic
});

// Auto-save function with debouncing
function saveDraft() {
  // ... auto-save logic
}

// Watch for changes and trigger auto-save
$effect(() => {
  // ... auto-save trigger logic
});

// Handle Save Draft button click
function handleSaveDraft() {
  // ... manual save logic
}
```

## Complete Minimal Example

Here's what the structure should look like after integration:

```svelte
<script lang="ts">
  import { submitJobPosting } from '$lib/features/jobs/actions/post-job.remote.js';
  import { DraftManager } from '$lib/features/jobs/components/draft';
  // ... other imports

  let { data }: { data: PageData } = $props();

  // Form state (no draft logic here anymore!)
  let selectedJobType = $state<JobType>();
  let selectedSeniority = $state<SeniorityLevel[]>([]);
  // ... other state variables

  // Editor state
  let jobDescriptionEditor = $state<Editor>();
  let jobDescriptionJSON = $state('');
</script>

<Intro.Root>
  <Intro.Title>Post a Job</Intro.Title>
  <Intro.Description>Your job post will be pinned...</Intro.Description>
</Intro.Root>

<Section.Root>
  <Section.Content animate={true} animateDelay={0.45}>
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
        {#if page.data.config.flags.prefillJobFromURL}
          <PrefillFromUrlAction
            title="Prefill from ATS or Job URL"
            description="Save time by pasting a job URL."
            onSuccess={handlePrefillSuccess}
            onReset={handlePrefillReset}
          />
        {/if}

        <form {...submitJobPosting} class="w-full">
          <!-- All your form fields here -->

          <Field.Field orientation="horizontal">
            <Button type="button" variant="outline" size="lg" onclick={saveDraft}>
              Save as Draft
            </Button>
            <Button type="submit" size="lg">
              <CheckCircleIcon class="mr-2 size-5" />
              Publish Job Posting
            </Button>
          </Field.Field>
        </form>
      {/snippet}
    </DraftManager>
  </Section.Content>

  <Section.Sidebar>
    <!-- Sidebar content -->
  </Section.Sidebar>
</Section.Root>
```

## Benefits After Refactoring

1. **Cleaner Page Component**: ~150 lines of draft logic removed from the page
2. **Reusable Logic**: Can use DraftManager in other forms
3. **Better Separation**: Draft logic is isolated from UI logic
4. **Easier Testing**: Can test draft logic independently
5. **Type Safety**: All types are exported and reusable
