# Split history refactor

## Goal

Replace the current slot queue and browser-position guessing with a deterministic split-history model. Vue Router remains responsible for navigation and browser history; this library stores the presentation trail associated with each browser history entry.

## Navigation semantics

A trail contains stable page nodes. Split mode presents its final two nodes.

```text
trail: A -> B -> C
view:       B | C
```

Navigation starts from a specific node in the visible trail:

- `push(origin, destination)` keeps the trail through `origin`, drops descendants, and appends `destination`.
- `replace(origin, destination)` keeps the trail before `origin`, drops `origin` and its descendants, and appends `destination`.
- Browser back and forward restore the exact trail stored in the destination history entry.
- Redirects store the final route. Failed and duplicated navigations do not mutate the trail.
- Route identity uses `fullPath`; page-instance identity uses a generated node ID.

For `[A, B, C]`, currently presenting `B | C`:

| Operation | Result |
| --- | --- |
| `C.push(D)` | `[A, B, C, D]` |
| `B.push(D)` | `[A, B, D]` |
| `C.replace(D)` | `[A, B, D]` |
| `B.replace(D)` | `[A, D]` |

## Architecture

1. **Model** — pure TypeScript types, transitions, and presentation selectors.
2. **Router adapter** — records navigation intent, commits only successful final routes, and serializes trails into `history.state`.
3. **Vue integration** — provides pane-local route/router contexts and renders only visible or retained page nodes.
4. **Retention** — `maxInactivePages` defaults to `0`; positive values retain inactive nodes with LRU eviction and Vue activation lifecycle semantics.
5. **Playground** — deterministic routes and diagnostics for trail, pane, push, replace, redirect, guards, back, and forward.

## Delivery sequence

Every step must keep lint, type checking, unit tests, the library build, and the playground build green.

- [x] Add the pure split-history model and asymmetric transition tests.
- [x] Add browser-history serialization and the Vue Router adapter.
- [x] Replace the legacy component implementation and remove obsolete queue/proxy code.
- [x] Add bounded inactive-page retention.
- [x] Rebuild the playground as an executable behavior specification.
- [x] Add Vitest Browser Mode integration coverage for navigation and lifecycle behavior.
- [x] Update public documentation and package exports.

## Explicit boundaries

- The guaranteed navigation API is the pane-local split router/composable.
- `useRouter()` and `RouterLink` can use the pane-local injection; application-global `$router` and `$route` cannot be made pane-local safely.
- A companion pane is a presentation context. Vue Router's global `from` route remains the address-bar route.
- Arbitrarily nested independent `RouterView` trees are not part of the first stable contract.
