<script lang="ts" module>
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { tv, type VariantProps } from "tailwind-variants";
import { cn, type WithElementRef } from "$lib/utils/ui.js";

export const wrapperVariants = tv({
	base: "@container flex flex-col w-full",
	variants: {
		alignment: {
			start: "mr-auto",
			center: "mx-auto",
			end: "ml-auto",
		},
		size: {
			sm: "max-w-(--breakpoint-sm)",
			md: "max-w-(--breakpoint-md)",
			lg: "max-w-(--breakpoint-lg)",
		},
		gap: {
			xs: "gap-y-fluid-xs",
			sm: "gap-y-fluid-sm",
			md: "gap-y-fluid-md",
			lg: "gap-y-fluid-lg",
			xl: "gap-y-fluid-xl",
		},
	},
	defaultVariants: {
		alignment: "start",
		gap: "md",
	},
});

export type WrapperProps = WithElementRef<HTMLAttributes<HTMLDivElement>> &
	VariantProps<typeof wrapperVariants> & {
		child?: Snippet<[{ props: HTMLAttributes<HTMLDivElement> }]>;
	};
</script>

<script lang="ts">
  let {
    ref = $bindable(null),
    class: className,
    alignment,
    size,
    gap,
    child,
    children,
    ...restProps
  }: WrapperProps = $props();

  const attrs = $derived({
    class: cn(wrapperVariants({ alignment, size, gap }), className),
    ...restProps,
  });
</script>

{#if child}
  {@render child({ props: attrs })}
{:else}
  <div bind:this={ref} {...attrs}>
    {@render children?.()}
  </div>
{/if}
