# Write A PRD With The /write-a-prd Skill

A PRD (Product Requirements Document) transforms a rough idea into a structured, actionable blueprint. In the last exercise, you had a conversation with the `/grill-me` skill that clarified what you actually needed to build. Now it's time to turn that conversation into a proper PRD.

The `/write-a-prd` skill is designed to guide you through this process systematically. It asks detailed questions, explores your codebase, and ultimately produces a markdown document that becomes your north star for implementation.

Think of a PRD as a conversation artifact. It captures all the decisions you made, all the edge cases you considered, and all the technical tradeoffs you agreed on. This makes it invaluable when you hand off work to an AI agent - the agent has the full context it needs to implement correctly.

## Steps To Complete

### Understand The Skill's Purpose

The `/write-a-prd` skill has five main steps built into it:

1. It asks for a long, detailed description of the problem and potential solutions
2. It explores your repo to understand the current codebase
3. It interviews you relentlessly about every aspect of the plan
4. It sketches out the major modules you'll need to build or modify
5. It generates a PRD using a standard template and saves it to `issues/prd.md`

Take a moment to read through the skill definition in `.claude/skills/write-a-prd/SKILL.md` to understand what it's designed to do.

### Invoke The Skill With Your Idea

- [ ] Open Claude Code and invoke the `/write-a-prd` skill

You can invoke it the same way you invoked `/grill-me` in the previous exercise. Just type `/write-a-prd` in Claude Code and it will load the skill.

Alternatively, you can ask Claude directly: "Use the write-a-prd skill to create a PRD for [your feature idea]"

### Review The Generated PRD

- [ ] Check that `issues/prd.md` has been created

Once the skill completes, it will save a markdown file to `issues/prd.md`. This file is your source of truth for implementation.

- [ ] Read through the PRD carefully

Look for:

- **Problem Statement** - Does it accurately reflect the user's pain point?
- **User Stories** - Are they comprehensive and realistic?
- **Implementation Decisions** - Do they match what you discussed?
- **Testing Decisions** - Are the testing guidelines clear?

- [ ] Ask for revisions if needed

If something doesn't feel right, ask the skill to revise specific sections. For example: "The user stories for the points system need more detail about how they interact with quizzes."

### Prepare For The Next Step

- [ ] Keep the PRD open as reference material

In the next exercise, you'll turn this PRD into GitHub issues using the `prd-to-issues` skill. The PRD you just created is your input for that step.

The quality of your PRD directly impacts the quality of your issues, which impacts the quality of your implementation. Take time to get it right.
