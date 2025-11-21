# Post Job Page Refactoring Plan

## Current State Analysis

The `src/routes/(public)/post-a-job/+page.svelte` file is **1278 lines** and handles:
- Form state management (job type, seniority, salary, etc.)
- Draft persistence (localStorage with auto-save)
- URL prefilling with animations
- Editor management (TipTap)
- Pricing calculation with upsells
- Form validation display
- Preview/order summary sidebar
- Remote function integration

## Proposed Component Architecture

### 1. **Page Structure** (Orchestration Layer)

**Rationale**: Components are placed in `lib/features/jobs/components/` instead of route-specific folders because:
- Admin panel will reuse form sections for viewing/editing jobs
- Admin panel will reuse preview components for reviewing submissions
- Admin panel will reuse payment components for viewing payment details
- Promotes true feature-based organization
- Easier to test and maintain shared components

```
src/lib/features/jobs/components/
├── form-sections/
│   ├── job-information-section.svelte
│   ├── location-section.svelte
│   ├── working-permits-section.svelte
│   ├── salary-section.svelte
│   ├── company-information-section.svelte
│   └── upsells-section.svelte
├── preview/
│   ├── order-summary.svelte
│   ├── job-preview-card.svelte
│   └── pricing-breakdown.svelte
├── draft/
│   └── draft-manager.svelte (headless/logic component)
└── payment/
    ├── payment-button.svelte
    ├── payment-flow.svelte
    ├── pending-approval.svelte
    ├── credits-display.svelte
    └── checkout-flow.svelte

src/routes/(public)/post-a-job/
├── +page.svelte (150-200 lines - orchestration only)
└── +page.server.ts
```

### 2. **State Management Strategy**

**Option A: Context-based (Recommended)**
```typescript
// src/lib/features/jobs/contexts/job-posting-context.svelte.ts
export class JobPostingState {
  // Form state
  jobType = $state<JobType>();
  seniority = $state<SeniorityLevel[]>([]);
  // ... other fields

  // Computed
  get isValid() { /* validation */ }
  get totalPrice() { /* pricing logic */ }

  // Methods
  reset() { /* clear all */ }
  fromDraft(draft: DraftData) { /* restore */ }
  toDraft(): DraftData { /* serialize */ }
}
```

**Option B: Keep Remote Function + Props Drilling**
- Simpler, no context needed
- Pass state down through props
- Emit events up

### 3. **Component Breakdown**

#### **Main Page** (`+page.svelte`)
**Responsibility**: Orchestration only
```svelte
<script lang="ts">
  import JobPostingForm from '$lib/features/jobs/components/job-posting-form.svelte';
  import OrderSummary from '$lib/features/jobs/components/preview/order-summary.svelte';
  import DraftManager from '$lib/features/jobs/components/draft/draft-manager.svelte';
  import PaymentFlow from '$lib/features/jobs/components/payment/payment-flow.svelte';
  import PendingApproval from '$lib/features/jobs/components/payment/pending-approval.svelte';

  let { data } = $props();

  type UIState =
    | { type: 'editing', jobId?: string }
    | { type: 'submitting' }
    | { type: 'payment', jobId: string }
    | { type: 'pending-approval', jobId: string }
    | { type: 'published', jobId: string }
    | { type: 'error', error: string };

  let uiState = $state<UIState>({ type: 'editing' });
</script>

<Section.Root>
  <Section.Content>
    {#if uiState.type === 'editing' || uiState.type === 'submitting'}
      <PrefillFromUrl onSuccess={handlePrefill} />
      <JobPostingForm
        {pricing}
        disabled={uiState.type === 'submitting'}
        onSubmit={handleSubmit}
      />
    {:else if uiState.type === 'payment'}
      <PaymentFlow jobId={uiState.jobId} onSuccess={handlePaymentSuccess} />
    {:else if uiState.type === 'pending-approval'}
      <PendingApproval jobId={uiState.jobId} />
    {:else if uiState.type === 'published'}
      <JobPublished jobId={uiState.jobId} />
    {:else if uiState.type === 'error'}
      <ErrorMessage error={uiState.error} onRetry={() => uiState = { type: 'editing' }} />
    {/if}
  </Section.Content>

  <Section.Sidebar>
    {#if uiState.type === 'editing' || uiState.type === 'submitting'}
      <OrderSummary {pricing} />
    {/if}
  </Section.Sidebar>
</Section.Root>

<DraftManager />
```

#### **Form Sections** (Each 100-200 lines)

**job-information-section.svelte**
```svelte
<script lang="ts">
  let {
    fields,  // Remote function fields
    state,   // Local reactive state
    errors   // Validation errors
  } = $props();
</script>

<Field.Set>
  <Field.Legend>Job Information</Field.Legend>
  <!-- Job Title -->
  <!-- Job Type -->
  <!-- Seniority -->
  <!-- Description (Editor) -->
  <!-- Application Method -->
  <!-- Deadline -->
</Field.Set>
```

**location-section.svelte**, **salary-section.svelte**, etc. follow same pattern

#### **draft-manager.svelte** (Headless Component)
```svelte
<script lang="ts">
  import { PersistedState } from 'runed';

  let { formState } = $props<{ formState: JobPostingState }>();

  const draftState = new PersistedState<DraftData>('job-posting-draft', {});
  let hasLoaded = $state(false);

  // Load draft on mount
  $effect(() => {
    if (!hasLoaded && draftState.current) {
      formState.fromDraft(draftState.current);
      hasLoaded = true;
    }
  });

  // Auto-save on changes
  $effect(() => {
    if (hasLoaded) {
      // Debounced save
      saveDraft();
    }
  });
</script>
```

#### **order-summary.svelte** (Sidebar)
```svelte
<script lang="ts">
  let { formState, pricing } = $props();

  const totalPrice = $derived(calculateTotal(formState, pricing));
  const previewData = $derived(createPreview(formState));
</script>

<div class="flex flex-col gap-y-5">
  <PricingBreakdown {pricing} upsells={formState.selectedUpsells} />
  <JobPreviewCard {previewData} />
  <CheckoutButton {totalPrice} currency={pricing.currency} />
  <TrustSignals />
</div>
```

### 4. **Payment Flow Integration**

#### **Using Existing Job Status Types**

The database already defines these job statuses (see `src/lib/features/jobs/constants.ts`):
- `draft` - Job created but not submitted
- `awaiting_payment` - Submitted, waiting for payment
- `awaiting_approval` - Paid, waiting for admin approval
- `published` - Live on the site
- `rejected` - Rejected by admin
- `expired` - Past expiration date

#### **UI State Machine**
For the post-a-job page UI, we need a simpler state that maps to the job status:
```typescript
type PostJobUIState =
  | { type: 'editing', jobId?: string }           // Creating/editing draft
  | { type: 'submitting' }                         // Validation + creating job
  | { type: 'payment', jobId: string }             // Job is 'awaiting_payment'
  | { type: 'pending-approval', jobId: string }    // Job is 'awaiting_approval'
  | { type: 'published', jobId: string }           // Job is 'published'
  | { type: 'error', error: string };
```

#### **Submission Flow**
```typescript
async function handleSubmit() {
  uiState = { type: 'submitting' };

  try {
    // 1. Validate form
    const validation = await submitJobPosting.validate();
    if (!validation.success) {
      uiState = { type: 'editing' };
      return;
    }

    // 2. Check credits
    const hasCredits = await checkUserCredits();

    if (hasCredits) {
      // 3a. Use credit - create with status 'awaiting_approval'
      const result = await createJobWithCredit(formData);
      // Job status: 'awaiting_approval'
      uiState = { type: 'pending-approval', jobId: result.jobId };
    } else {
      // 3b. Create job with status 'awaiting_payment'
      const result = await createPendingJob(formData);
      // Job status: 'awaiting_payment'

      // 4. Create Stripe checkout session
      const checkout = await createCheckoutSession(result.jobId);

      // 5. Show payment UI
      uiState = { type: 'payment', jobId: result.jobId };
      // Redirect to Stripe or show embedded checkout
    }
  } catch (error) {
    uiState = { type: 'error', error: error.message };
  }
}
```

#### **Payment Components**

**payment-button.svelte** (Replaces current submit button)
```svelte
<script lang="ts">
  let {
    totalPrice,
    hasCredits = false,
    creditsAvailable = 0,
    onSubmit
  } = $props();
</script>

{#if hasCredits}
  <Button onclick={onSubmit}>
    <CheckCircle class="mr-2" />
    Publish with Credit ({creditsAvailable} remaining)
  </Button>
{:else}
  <Button onclick={onSubmit}>
    <CreditCard class="mr-2" />
    Publish for ${totalPrice} USD
  </Button>
{/if}
```

**checkout-flow.svelte**
```svelte
<script lang="ts">
  let { jobId, pricing } = $props();

  let checkoutState = $state<'loading' | 'ready' | 'redirecting'>('loading');

  onMount(async () => {
    // Create checkout session
    const session = await createCheckoutSession(jobId);
    checkoutState = 'ready';

    // Auto-redirect or show Stripe embed
  });
</script>

{#if checkoutState === 'loading'}
  <LoadingSpinner />
{:else if checkoutState === 'ready'}
  <StripeCheckout {sessionId} />
{/if}
```

### 5. **Shared Utilities**

**Form State Helpers**
```typescript
// src/lib/features/jobs/utils/form-state.ts
export function createJobPostingState() {
  return {
    job: {
      title: $state(''),
      type: $state<JobType>(),
      seniority: $state<SeniorityLevel[]>([]),
      // ...
    },
    organization: {
      name: $state(''),
      url: $state(''),
      // ...
    },
    pricing: {
      selectedUpsells: $state(new Set<string>()),
      totalPrice: $derived.by(() => {/* calc */}),
    }
  };
}
```

**Pricing Calculator**
```typescript
// src/lib/features/jobs/utils/pricing.ts
export function calculateTotalPrice(
  basePrice: number,
  upsells: Set<string>,
  enabledUpsells: Upsell[]
): number {
  let total = basePrice;
  for (const upsell of enabledUpsells) {
    if (upsells.has(upsell.id)) {
      total += upsell.priceUSD;
    }
  }
  return total;
}
```

## Migration Plan

### Phase 1: Extract Preview Components (Low Risk)
1. Create `src/lib/features/jobs/components/preview/` directory
2. Extract `order-summary.svelte` component
3. Extract `job-preview-card.svelte` component
4. Extract `pricing-breakdown.svelte` component
5. Update imports in `+page.svelte` to use new paths
6. **Test**: Sidebar still works, preview updates correctly

### Phase 2: Extract Form Sections (Medium Risk)
1. Create `src/lib/features/jobs/components/form-sections/` directory
2. Extract form sections one-by-one:
   - `job-information-section.svelte` (title, type, seniority, description, application, deadline)
   - `location-section.svelte` (location type, hiring location, timezones)
   - `working-permits-section.svelte` (permits type, required permits)
   - `salary-section.svelte` (salary range, currency)
   - `company-information-section.svelte` (company name, URL, logo, customer email)
   - `upsells-section.svelte` (upgrades/upsells)
3. Keep remote function integration - pass `submitJobPosting.fields` as props
4. Update `+page.svelte` to use new section components
5. **Test**: Form submission still works, validation works, all fields save correctly

### Phase 3: Extract Draft Management (Low Risk)
1. Create `src/lib/features/jobs/components/draft/` directory
2. Extract `draft-manager.svelte` (headless component)
3. Move all persistence logic (auto-save, restore, manual save)
4. Keep same API with parent component
5. Update imports in `+page.svelte`
6. **Test**: Draft save/restore works, auto-save triggers correctly

### Phase 4: Payment Flow (High Risk - Future)
1. Create `src/lib/features/jobs/components/payment/` directory
2. **Backend**: Create server action to submit job (status: 'awaiting_payment')
3. **Backend**: Create Stripe checkout session endpoint
4. **Backend**: Add Stripe webhook to update job status to 'awaiting_approval' on payment
5. **Frontend**: Create `payment-flow.svelte` component in payment directory
6. **Frontend**: Create `pending-approval.svelte` component
7. **Frontend**: Create `payment-button.svelte` component
8. **Frontend**: Integrate Stripe embedded checkout or redirect
9. Update `+page.svelte` to use UI state machine and payment components
10. **Test**: End-to-end payment flow
    - Submit form → job created with status 'awaiting_payment'
    - Complete payment → webhook updates to 'awaiting_approval'
    - Admin approves → status changes to 'published'

### Phase 5: Credits System (Future)
1. **Backend**: Add credits table/schema (user_credits table)
2. **Backend**: Create credit check/deduction functions
3. **Backend**: Modify job submission to check credits first
   - If credits available: create with status 'awaiting_approval', deduct credit
   - If no credits: create with status 'awaiting_payment', proceed to payment
4. **Frontend**: Update payment button to show credit option
5. **Frontend**: Add credits display in sidebar
6. **Test**: Credit usage flow
   - User has credits → can publish without payment
   - User has no credits → goes to payment flow
   - Credit is deducted on successful publish

## Benefits of This Approach

1. **Maintainability**: Each component has single responsibility
2. **Testability**: Can test components in isolation
3. **Reusability**: OrderSummary, sections can be reused
4. **Type Safety**: Smaller components = better type inference
5. **Progressive Enhancement**: Can add payment/credits without breaking existing
6. **Developer Experience**: Easier to find and modify specific features
7. **Performance**: Can lazy-load payment components

## Key Design Decisions

### ✅ Keep Remote Functions
- Already working well
- Type-safe form handling
- Don't reinvent the wheel

### ✅ Component-Based Architecture
- Small, focused components
- Clear boundaries
- Easy to test

### ✅ State Machine for Payment
- Clear states
- Prevents invalid states
- Easy to reason about

### ✅ Credits as Optional Layer
- Doesn't complicate base flow
- Can add/remove easily
- Feature flag friendly

## Future Admin Panel Reusability

These components will be reused in the admin panel:

### **Admin: Review Job Submissions**
```svelte
<!-- src/routes/(admin)/jobs/[id]/+page.svelte -->
<script>
  import JobPreviewCard from '$lib/features/jobs/components/preview/job-preview-card.svelte';
  import PricingBreakdown from '$lib/features/jobs/components/preview/pricing-breakdown.svelte';
  import OrderSummary from '$lib/features/jobs/components/preview/order-summary.svelte';

  let { data } = $props(); // Job with status 'awaiting_approval'
</script>

<JobPreviewCard job={data.job} />
<OrderSummary job={data.job} readonly={true} />

<Button onclick={approveJob}>Approve & Publish</Button>
<Button onclick={rejectJob}>Reject</Button>
```

### **Admin: Edit Job Details**
```svelte
<!-- src/routes/(admin)/jobs/[id]/edit/+page.svelte -->
<script>
  import JobInformationSection from '$lib/features/jobs/components/form-sections/job-information-section.svelte';
  import LocationSection from '$lib/features/jobs/components/form-sections/location-section.svelte';
  import SalarySection from '$lib/features/jobs/components/form-sections/salary-section.svelte';

  // Reuse same form sections with admin privileges!
</script>
```

### **Admin: View Payment Details**
```svelte
<!-- src/routes/(admin)/payments/[id]/+page.svelte -->
<script>
  import PricingBreakdown from '$lib/features/jobs/components/preview/pricing-breakdown.svelte';
  import CreditsDisplay from '$lib/features/jobs/components/payment/credits-display.svelte';
</script>

<PricingBreakdown selectedUpsells={data.job.selectedUpsells} readonly={true} />
```

## Next Steps

Start with Phase 1 (extracting preview components) as it's the lowest risk and provides immediate value in code organization. This also establishes the pattern for component location that will benefit the future admin panel.
