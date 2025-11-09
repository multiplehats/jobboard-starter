<script lang="ts" module>
  import type { HTMLAttributes } from "svelte/elements";
  import { tv, type VariantProps } from "tailwind-variants";
  import { cn, type WithElementRef } from "$lib/utils/ui.js";

  export const headingVariants = tv({
    base: "font-display font-semibold",
    variants: {
      size: {
        h1: "text-3xl tracking-tight text-pretty bg-gradient-to-b from-foreground to-foreground/75 bg-clip-text text-transparent md:text-4xl",
        h2: "text-2xl tracking-tight md:text-3xl",
        h3: "text-2xl tracking-tight",
        h4: "text-xl tracking-tight",
        h5: "text-base font-sans font-medium",
        h6: "text-sm/tight font-sans font-medium",
        pageTitle:
          "font-display font-bold text-3xl tracking-tight text-pretty max-w-[14em] sm:text-4xl md:text-5xl/[1.1] lg:text-5xl/[1.05]",
      },
    },
    defaultVariants: {
      size: "h3",
    },
  });

  export type HeadingSize = VariantProps<typeof headingVariants>["size"];

  export type HeadingProps = WithElementRef<HTMLAttributes<HTMLHeadingElement>> & {
    size?: HeadingSize;
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    className?: string;
  };
</script>

<script lang="ts">
  let { class: className, size = "h3", as, ref = $bindable(null), children, ...restProps }: HeadingProps = $props();

  const tag = as ?? size ?? "h2";
  const computedClass: string = cn(headingVariants({ size }), className);
</script>

{#if tag === "h1" || tag === "pageTitle"}
  <h1 bind:this={ref} class={computedClass} {...restProps}>
    {@render children?.()}
  </h1>
{:else if tag === "h2"}
  <h2 bind:this={ref} class={computedClass} {...restProps}>
    {@render children?.()}
  </h2>
{:else if tag === "h3"}
  <h3 bind:this={ref} class={computedClass} {...restProps}>
    {@render children?.()}
  </h3>
{:else if tag === "h4"}
  <h4 bind:this={ref} class={computedClass} {...restProps}>
    {@render children?.()}
  </h4>
{:else if tag === "h5"}
  <h5 bind:this={ref} class={computedClass} {...restProps}>
    {@render children?.()}
  </h5>
{:else if tag === "h6"}
  <h6 bind:this={ref} class={computedClass} {...restProps}>
    {@render children?.()}
  </h6>
{/if}
