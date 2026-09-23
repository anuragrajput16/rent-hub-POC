# Working rules

## Before saying it is done

```bash
cd rentease-poc
npm run build   # tsc -b && vite build — noUnusedLocals is on, an unused import fails the build
npm run lint    # oxlint; six pre-existing warnings are expected, add none
```

Report what actually ran. If the build fails, say so with the output rather than describing the
change as complete.

## Code style

- Match the file you are editing: 2-space indent, single quotes, semicolons, trailing commas.
- A file-level docblock says *why* the module exists (see `store.ts`, `icons.tsx`, `FloorPlan.tsx`).
  Inline comments are rare and explain a decision, never restate the code.
- Named exports everywhere except pages, which default-export their component.
- `import type { … }` for type-only imports — `verbatimModuleSyntax` is on.
- Types live in `src/types.ts` when they describe the domain; local prop interfaces stay in the
  component file.
- No `any`, no non-null assertion except the established `let x!: T` + `mutate` pattern in
  `src/api/index.ts`.

## Scope

- Change what was asked and the wiring it needs. Do not reformat, rename or "tidy" nearby code.
- Do not add tests, CI, docs or a changelog unless asked — there is no test setup in this project.
- Do not commit or push unless asked. Git tracks the whole home directory here, so `git add -A`
  is never right; stage explicit paths under `Desktop/RENT Project/`.
- `dist/` is git-ignored build output. Regenerate it with `npm run build`; never hand-edit it.

## Keeping the docs true

`rentease-poc/README.md` describes what works end-to-end and what is mocked. If a change adds a
flow, changes a demo account, or makes something real that used to be mocked, update the README in
the same pass. `files/` is read-only client material — never edit it.
