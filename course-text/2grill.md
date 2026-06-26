# Use The /grill-me Skill

This is an intro to the `/grill-me` skill, separate from my video on [my top 5 skills](https://aihero.dev/5-agent-skills-i-use-every-day). It's the most flexible skill I've ever created, and one I use outside of coding too.

## Steps To Complete

### Invoke the Grill Me Skill

- [ ] Type `/grill-me` into your agent conversation

This invokes the Grill Me skill. The agent will load the skill definition from `.claude/skills/grill-me/SKILL.md` and start asking clarifying questions.

- [ ] Reference the `client-brief.md` file in your message

Let the agent know that the full product brief is available in `client-brief.md` at the root of the repository. This helps the agent understand the context and ask better questions.

- [ ] Do not clear the context with `/clear` or start a new conversation

You need to maintain the conversation thread. The skill will reference back to your interpretation of the brief as it asks questions.

### Run Through the Grill Me Process

- [ ] Let the agent ask you all of its questions

The agent will go through the Grill Me skill systematically. Answer each question honestly. There are no "wrong" answers here - you're just clarifying ambiguity.

- [ ] Answer based on what _you think_ makes sense for the product

If Sarah's brief doesn't specify something, make a reasonable assumption. For example: "I think points should range from 1-10 per activity" or "Levels should be themed around learning milestones."

- [ ] When the agent asks follow-up questions, answer those too

The skill is designed to dig deeper when your answers raise new questions. Lean into this - it's part of the process.

- [ ] Don't `/clear` the context window

It's essential that you retain all of the interview in context; it will be important for the next exercise.

### Reflect on What You've Learned

- [ ] Review the questions the agent asked you

Notice patterns. Did it ask about users? Success criteria? Edge cases? Trade-offs?

- [ ] Think about how different your answers are from Sarah's original brief

This is the whole point - the Grill Me skill forces you to think through details that were glossed over in the initial request.
