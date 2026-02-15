# Sprints

This directory contains numbered sprint documents for major development initiatives in ModelOptix.

## Structure

Each sprint is self-contained and includes:
- Complete context and background
- Technical specifications
- Implementation sequence
- Testing requirements
- Documentation updates

## Naming Convention

```
sprint-[NN]-[descriptive-name].md
```

Where:
- `NN` is a zero-padded number (01, 02, 03, etc.)
- `descriptive-name` is a kebab-case description of the sprint goal

## Supporting Documents

Supporting analysis and design documents related to a sprint are kept in the same directory with descriptive names.

## Sprint List

| Sprint | Name | Status | Created |
|--------|------|--------|---------|
| 01 | Eliminate Functions Layer | Ready for Implementation | 2026-01-25 |

## How to Use

1. **For Planning:** Review sprint documents to understand upcoming work
2. **For Implementation:** Hand sprint documents to developer agents with full context
3. **For Reference:** Sprint docs serve as historical record of major changes

## Sprint vs Phase

- **Phases** (in project-plan.md): High-level project milestones with multiple tasks
- **Sprints** (this directory): Self-contained implementation initiatives, may span multiple phases or be within a single phase

Sprints can be:
- Refactoring initiatives (like Sprint 01)
- Major feature additions
- Infrastructure improvements
- Data migrations

## Creating a New Sprint

When creating a new sprint:
1. Number it sequentially (check this README for the next number)
2. Include all context needed for an agent to execute independently
3. Add entry to the table above
4. Update project-plan.md if the sprint relates to specific phases/tasks
