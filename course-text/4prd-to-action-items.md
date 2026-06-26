# Turn A PRD To A Kanban Board With /prd-to-issues

You now have a PRD that's been refined through the `/grill-me` skill. You understand what tracer bullets are - thin vertical slices that cut through every layer of your system end-to-end.

Now it's time to break that PRD down into independently-workable issues. Each issue should be a single tracer bullet: small enough to implement without getting blocked, but complete enough to be demo-able on its own.

The `/prd-to-issues` skill will guide you through this process. It helps you identify the right granularity for your slices, spot dependency relationships, and distinguish between HITL (human-in-the-loop) and AFK (away-from-keyboard) work.

## Steps To Complete

- [ ] Invoke the `/prd-to-issues` skill

Invoke `/prd-to-issues` directly. The skill will ask for the file path to your PRD (e.g., `issues/prd.md`) and guide you through the breakdown process. However, it should already have the PRD in its context.

- [ ] Review the proposed tracer bullets

The skill will present a numbered list of potential issues. For each one, it shows:

- The title and description
- Whether it's HITL or AFK
- What it depends on (if anything)
- Which user stories it addresses

Read through these carefully. Do they feel like the right size? Can you imagine implementing each one independently?

**Pay special attention to the first slice.** This should be a minimal but complete vertical slice through the entire feature, something that touches every layer (database, API, UI, tests) but implements just one narrow path. All subsequent slices will build upon this foundation.

Don't worry about getting it "perfect" on the first try. Iteration is part of the process.

- [ ] Iterate until you're satisfied

Go back and forth with the skill. Split slices that feel too thick. Merge ones that feel too thin. Reorder dependencies if needed.

Once you're happy with the breakdown, approve it and move forward.

- [ ] Let the skill create the issue files

The skill will write markdown files into `issues/` using the pattern `issues/NNN-short-title.md` (e.g., `issues/001-add-points-tracking.md`).

Each file will have:

- A link back to the parent PRD
- A description of the vertical slice
- Acceptance criteria (checkboxes)
- Blocked-by relationships (referencing other issue files)
- User stories addressed

- [ ] Verify the files were created

Check the `issues/` directory. You should see numbered files in dependency order. Open a few and scan the content. Does each one feel like something you could grab and implement without being stuck?
