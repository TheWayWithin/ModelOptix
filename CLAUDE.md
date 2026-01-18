# ModelOptix - Project Instructions

This file contains **project-specific instructions** that persist across AGENT-11 updates.

> **File Hierarchy:**
> - `CLAUDE.md` (this file) → ModelOptix-specific rules, environment config, personal preferences
> - `.claude/CLAUDE.md` → AGENT-11 framework instructions (may be overwritten on updates)

---

## Environment Management Protocol [CRITICAL]

### Environment Overview

| Environment | Branch | Railway Instance | Supabase Instance | Domain |
|-------------|--------|------------------|-------------------|--------|
| **Development** | `develop` | Local / N/A | Local or Staging | localhost:3000 |
| **Staging** | `develop` | Railway Staging | Supabase Staging | staging.modeloptix.com |
| **Production** | `main` | Railway Production | Supabase Production | modeloptix.com |

### Deployment Flow
```
develop branch → GitHub → Railway Staging → staging.modeloptix.com
main branch    → GitHub → Railway Production → modeloptix.com
```

### MANDATORY: Environment Awareness

**Before ANY task, Claude MUST:**
1. **State the target environment** explicitly (dev/staging/prod)
2. **Confirm with user** if environment is ambiguous
3. **Use environment-appropriate caution levels:**
   - Dev: Move fast, experiment freely
   - Staging: Test thoroughly, verify integrations
   - Prod: Extreme caution, verify twice, never rush

**Environment Identification Checklist:**
- [ ] Which environment am I working in?
- [ ] Which database will be affected?
- [ ] Which Railway instance will be deployed to?
- [ ] Have I confirmed this with the user?

### Environment Variable Sync Protocol [GUARDRAIL]

**When adding/modifying environment variables:**

1. **Document the variable** in `handoff-notes.md`:
   ```
   ENV VAR ADDED: VARIABLE_NAME
   - Purpose: [what it does]
   - Added to: [ ] Staging [ ] Production
   - Value differs per env: Yes/No
   ```

2. **Add to BOTH environments** (unless explicitly env-specific):
   - Railway Staging: `railway variables set VARIABLE_NAME=value -e staging`
   - Railway Production: `railway variables set VARIABLE_NAME=value -e production`

3. **Verification before marking complete:**
   - [ ] Variable exists in Staging Railway
   - [ ] Variable exists in Production Railway
   - [ ] Values are appropriate for each environment
   - [ ] Documented in handoff-notes.md

**⚠️ NEVER mark an env var task complete until BOTH environments are updated.**

### Database Schema Migration Protocol [GUARDRAIL]

**When modifying database schema:**

1. **Create migration file** (not direct SQL):
   ```bash
   # Use Supabase migrations
   supabase migration new descriptive_migration_name
   ```

2. **Test migration on Staging FIRST:**
   ```bash
   supabase db push --linked  # Push to staging
   ```

3. **Document in progress.md:**
   ```
   MIGRATION: [migration_name]
   - Applied to Staging: [timestamp]
   - Tested on Staging: [ ] Pass [ ] Fail
   - Applied to Production: [ ] Pending [ ] Done [timestamp]
   ```

4. **Production deployment checklist:**
   - [ ] Migration tested on Staging
   - [ ] No data loss confirmed
   - [ ] Rollback plan documented
   - [ ] Applied to Production after code merge to main

**⚠️ NEVER apply schema changes directly to Production. Always migrate through Staging first.**

### Environment-Specific Commands Reference

| Action | Staging | Production |
|--------|---------|------------|
| Railway logs | `railway logs -e staging` | `railway logs -e production` |
| Railway deploy | `railway up -e staging` | `railway up -e production` |
| Railway vars | `railway variables -e staging` | `railway variables -e production` |
| Supabase link | `supabase link --project-ref [staging-ref]` | `supabase link --project-ref [prod-ref]` |
| Git deploy | Push to `develop` | Merge to `main` |

### Red Flags - STOP and Verify

🚨 **STOP if you see any of these:**
- Running production commands without explicit user confirmation
- Environment variable only added to one environment
- Direct SQL on production database
- Schema changes without migration file
- Uncertainty about which environment you're targeting

**When in doubt: ASK the user which environment before proceeding.**

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
