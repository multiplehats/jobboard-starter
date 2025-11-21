# Form Simplification Strategy

## The Problem

We're duplicating state between intermediate variables and form fields:

```svelte
<!-- ❌ Current: Redundant state -->
<script>
  let selectedJobType = $state(); // duplicates fields.job.type
  let selectedSeniority = $state([]); // duplicates fields.job.seniority
</script>

<JobInformationSection
  bind:selectedJobType
  bind:selectedSeniority
  {fields}
/>
```

**Issues:**
1. State duplication between UI vars and `submitJobPosting.fields`
2. Complex bindings throughout components
3. Draft manager has to track both UI state AND form state
4. Hard to reason about which is the "source of truth"

## The Solution

**Work directly with form fields!** Eliminate intermediate state for form data.

### Pattern 1: Native Inputs - Use `.as()` Spread

```svelte
<!-- ✅ Native inputs: No state needed! -->
<Input {...fields.job.title.as('text')} />
<textarea {...fields.job.appLinkOrEmail.as('text')} />
```

### Pattern 2: Custom Components - Use `value` + `onChange`

```svelte
<!-- ✅ Custom components: Read with .value(), write with .set() -->
<script>
  // Reactive getter - reads from form
  const selectedJobType = $derived(fields.job.type.value());
</script>

<Select.Root
  value={selectedJobType}
  onValueChange={(v) => fields.job.type.set(v)}
>
  <!-- ... -->
</Select.Root>
```

### Pattern 3: Complex UI State - Keep Only What's Needed

```svelte
<script>
  // ✅ ONLY keep pure UI state (not form data)
  let deadlinePopoverOpen = $state(false); // UI state: is popover open?
  let jobDescriptionEditor = $state<Editor>(); // UI state: editor instance

  // ❌ DON'T keep form data as separate state
  // let selectedJobType = $state(); // This duplicates fields.job.type!
</script>
```

## State Categories

### ✅ KEEP (Pure UI State)
- `deadlinePopoverOpen` - popover open/close state
- `jobDescriptionEditor` - TipTap editor instance
- `isPrefilling` - animation state
- `prefilledFields` - tracks which fields were prefilled

### ❌ ELIMINATE (Duplicates Form Fields)
- `selectedJobType` → use `fields.job.type.value()`
- `selectedSeniority` → use `fields.job.seniority.value()` (parse JSON)
- `selectedLocationType` → use `fields.locationType.value()`
- `selectedCurrency` → use `fields.salary.currency.value()`
- `salaryRange` → use `fields.salary.min/max.value()`

### 🤔 SPECIAL CASES (Type Conversions)
- `applicationDeadline` - Calendar needs CalendarDate object, form stores ISO string
  - Option A: Convert on-the-fly in handlers
  - Option B: Keep as UI state for convenience

## Updated Component Patterns

### Before (Complex)
```svelte
<script>
  let {
    fields,
    selectedJobType = $bindable(),
    selectedSeniority = $bindable(),
    // ... 10 more bindable props
  } = $props();
</script>

<!-- Parent must bind everything -->
<SectionComponent
  bind:selectedJobType
  bind:selectedSeniority
  {fields}
/>
```

### After (Simple)
```svelte
<script>
  let { fields } = $props();

  // Reactive getters from form
  const selectedJobType = $derived(fields.job.type.value());

  // Pure UI state only
  let popoverOpen = $state(false);
</script>

<!-- Parent just passes fields -->
<SectionComponent {fields} />
```

## Draft Manager Simplification

### Before
```typescript
// Draft manager tracks EVERYTHING
const draftManager = useDraftManager({
  form: submitJobPosting,
  getUIState: () => ({
    selectedJobType,      // ← Duplicate of form field
    selectedSeniority,    // ← Duplicate of form field
    selectedCurrency,     // ← Duplicate of form field
    salaryRange,          // ← Duplicate of form field
    // ... and 10 more duplicates
  })
});
```

### After
```typescript
// Draft manager tracks ONLY pure UI state
const draftManager = useDraftManager({
  form: submitJobPosting,
  getUIState: () => ({
    // Only UI state that's NOT in the form
    deadlinePopoverOpen,
    isPrefilling,
    prefilledFields
  })
});

// Form fields auto-save because they're part of form.fields.value()!
```

## Implementation Steps

1. **Refactor sections** to work directly with `fields`
   - Remove `$bindable()` props for form data
   - Use `fields.something.value()` for reading
   - Use `fields.something.set(value)` for writing

2. **Simplify +page.svelte**
   - Remove intermediate state variables
   - Remove all `bind:` directives to sections
   - Keep only pure UI state

3. **Simplify draft manager**
   - Remove form data from `getUIState()`
   - Use `form.fields.value()` to get all form data
   - Only track pure UI state separately

4. **Update types**
   - Remove form field props from section prop interfaces
   - Keep only `fields` prop

## Benefits

- ✅ **Single source of truth**: Form fields are the only state
- ✅ **Less code**: No intermediate variables
- ✅ **Simpler draft manager**: Auto-saves form fields
- ✅ **Easier to reason about**: Clear separation of form data vs UI state
- ✅ **Less reactivity complexity**: No complex bindings

## Example: Complete Section

See `job-information-section-SIMPLE.svelte` for a full working example of this pattern.
