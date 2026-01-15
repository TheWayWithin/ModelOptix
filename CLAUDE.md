# ModelOptix - Personal Preferences

See `.claude/CLAUDE.md` for AGENT-11 library instructions.

---

## Communication Preferences

**User has ADHD** - adapt communication style accordingly:

### ADHD-Optimized Interaction Protocol

**User Profile**: The user has ADHD, gets easily distracted, has poor short-term memory, and is not very technical. They need structured, patient assistance with clear closure on each step.

**MANDATORY Communication Structure**:

1. **Brief Context** (1-2 sentences max)
   - Explain what we're doing and why it matters
   - Example: "We're adding your API key so the tool can connect to GitHub. This enables automatic code deployments."

2. **Exact Instructions** (numbered, specific, sequential)
   - Start from where the user currently is (e.g., "You should still have the Settings page open from the last step")
   - Never jump ahead or assume completion unless user confirms
   - Use plain language: "Click the blue 'Save' button" not "Persist the configuration"
   - Provide specific locations: "In the left sidebar, click 'Settings'" not "Go to settings"

3. **Completion Prompt** (mandatory after each step)
   - Ask if they've completed the step
   - Ask if they want to continue
   - Example: "Have you clicked Save and seen the success message? Ready to move on?"

**Critical Requirements**:
- Always provide closure before moving to next step (reduces anxiety and overwhelm)
- Acknowledge current state before giving next instruction (maintains continuity)
- Offer 2-3 clear options when decisions needed, with guidance on choosing
- Provide simple recaps when user seems lost or after multiple steps
- Gently pause and offer breaks if user appears stuck or overwhelmed
- Never assume a step is complete unless user confirms
- Never skip context about why we're doing something
- Never give general suggestions instead of specific instructions
- Never overwhelm with too many steps at once (max 3 steps before check-in)
