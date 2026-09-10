# vue-split-screen

[![NPM version](https://img.shields.io/npm/v/vue-split-screen?color=a1b858&label=)](https://www.npmjs.com/package/vue-split-screen)

Deterministic split-screen routing for Vue 3 and Vue Router 4. It presents the final two pages in a navigation trail, making master-detail flows useful on foldables and wide screens without maintaining a second router.

## Install

```sh
pnpm add vue-split-screen
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SplitScreen } from 'vue-split-screen';

const split = ref(true);
const reverse = ref(false);
const maxInactivePages = ref(0);
</script>

<template>
  <RouterView v-slot="{ Component }">
    <SplitScreen
      :turn-on="split"
      :split-reverse="reverse"
      :max-inactive-pages="maxInactivePages"
    >
      <component :is="Component" />
      <template #placeholder>
        Select a page to open the second pane.
      </template>
    </SplitScreen>
  </RouterView>
</template>
```

Navigate from a page with the pane-local router:

```vue
<script setup lang="ts">
import { useSplitRouter } from 'vue-split-screen';

const router = useSplitRouter();
</script>

<template>
  <button @click="router.push('/detail/42')">
    Open detail
  </button>
</template>
```

`useRouter()` also receives the pane-local `push` and `replace` functions inside a split page. `useSplitRouter()` is recommended because it makes that dependency explicit. `useSplitRouteNode()` returns a computed ref containing the pane's stable node ID and `fullPath`.

## Navigation model

Each browser history entry stores a serializable trail of page nodes. Split mode renders its final two nodes. Given `[A, B, C]`, displaying `B | C`:

| Action | Resulting trail |
| --- | --- |
| `C.push(D)` | `[A, B, C, D]` |
| `B.push(D)` | `[A, B, D]` |
| `C.replace(D)` | `[A, B, D]` |
| `B.replace(D)` | `[A, D]` |

- Back and forward restore the exact trail stored in the destination history entry.
- Redirects commit their final route.
- Aborted, cancelled, and duplicated navigation does not mutate the trail.
- Route identity uses `fullPath`; repeated visits receive distinct node IDs.

## Retaining inactive pages

`maxInactivePages` controls inactive component retention:

- `0`, the default, unmounts a page when it leaves the visible pair.
- A positive integer retains that many inactive page nodes with least-recently-used eviction.
- The two active panes do not count toward the limit.
- Retained pages receive Vue's `activated` and `deactivated` lifecycle hooks.

## Props

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `turnOn` | `boolean` | `true` | Show the final two trail nodes instead of only the current node. |
| `splitReverse` | `boolean` | `false` | Reverse the visual order of the two panes. |
| `maxInactivePages` | `number` | `0` | Number of inactive page nodes retained by LRU. |

## Boundaries

- Vue Router remains the owner of the address bar and browser navigation.
- The default slot must directly render the `Component` supplied by `RouterView`, as shown above. Arbitrary wrappers and extra sibling nodes are not reconstructed for a companion pane.
- `$router` and `$route` on Vue global component properties remain global. Use composables inside pane components.
- The companion pane is presentation context. Vue Router navigation guards still receive the actual address-bar route as `from`.
- Independent nested `RouterView` trees are not part of the stable contract.

## Development

The repository targets Node 22, pnpm 12, and TypeScript 6. Run `pnpm check` for lint, type checks, unit tests, library builds, and the playground build. Run `pnpm test:browser` for Vitest Browser Mode coverage in Chromium.

## Contributors

<a href="https://github.com/zcf0508/vue-split-screen/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=zcf0508/vue-split-screen" alt="Project contributors" />
</a>

## License

[MIT](./LICENSE) License © 2022 [Huali](https://github.com/zcf0508)
