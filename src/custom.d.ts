declare module '*.md' {
  import type { ComponentType, SvelteComponentTyped } from 'svelte';
  const component: ComponentType<SvelteComponentTyped>;
  export default component;
}
