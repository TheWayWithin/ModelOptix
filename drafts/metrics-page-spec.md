# Metrics Page Spec — jamiewatters.work/metrics

## Overview

Public dashboard showing real-time performance metrics for Jamie and his AI agents. Unique "build in public" content — transparency into how a human + multi-agent system actually performs.

## URL

`jamiewatters.work/metrics` or `jamiewatters.work/scoreboard`

## Sections

### 1. Hero
- Headline: "The Scoreboard" or "How We're Actually Doing"
- Subhead: "Real-time metrics from a human + 2 AI agents building in public"
- Last updated timestamp

### 2. Team Cards (3 columns on desktop, stacked on mobile)

**Jamie (Human)**
- Avatar + name
- Role: "Builder / Strategist"
- This week's key metrics (tasks, features, commits)
- Trend indicator (↑↓→)
- Monthly goal progress bar

**Marvin (AI Agent)**
- Avatar + name + 🤖
- Role: "Strategy & Planning"
- This week's key metrics (tasks, drafts, proactive catches)
- Trend indicator
- Monthly goal progress bar

**Ace (AI Agent)**
- Avatar + name + 🔍
- Role: "Business & Sales"
- This week's key metrics (prospects, engaged, MRR)
- Trend indicator
- Monthly goal progress bar

### 3. Weekly Trends Chart
- Line chart showing key metrics over past 4-8 weeks
- Toggle between: Tasks, Content, Prospects, Revenue

### 4. Current Week Breakdown
- Table showing daily metrics for each team member
- Expandable/collapsible rows

### 5. Monthly Goals
- Progress bars for each goal
- Red/yellow/green status indicators

### 6. Historical Log
- Accordion or paginated list of past weekly summaries
- Link to full weekly report markdown

## Data Source Options

**Option A: Static JSON file**
- Marvin updates `public/data/metrics.json` daily
- Page reads from JSON on load
- Simple, no backend needed

**Option B: API endpoint**
- `/api/metrics` returns current metrics
- Pulls from METRICS.md or database
- More flexible, enables live updates

**Option C: Markdown parsing**
- Page parses METRICS.md directly from GitHub raw URL
- Zero maintenance, always in sync
- Slightly slower load

**Recommendation:** Start with Option A (JSON file), upgrade to Option B if we want historical querying.

## JSON Schema

```json
{
  "lastUpdated": "2026-02-11T05:00:00Z",
  "currentWeek": "2026-W07",
  "team": {
    "jamie": {
      "name": "Jamie",
      "role": "Builder / Strategist",
      "avatar": "/avatars/jamie.jpg",
      "weeklyMetrics": {
        "tasksCompleted": 8,
        "featuresShipped": 3,
        "commits": 4,
        "blogsPublished": 2
      },
      "weeklyTargets": {
        "tasksCompleted": 15,
        "featuresShipped": 3,
        "commits": 5,
        "blogsPublished": 2
      },
      "monthlyGoals": [
        { "metric": "Products shipped", "target": 2, "current": 0 },
        { "metric": "MRR", "target": 100, "current": 0 }
      ]
    },
    "marvin": {
      "name": "Marvin",
      "role": "Strategy & Planning",
      "avatar": "/avatars/marvin.png",
      "emoji": "🤖",
      "weeklyMetrics": {
        "tasksCompleted": 7,
        "blogsDrafted": 2,
        "socialPosts": 2,
        "emailsDrafted": 0,
        "commentsDrafted": 0,
        "issuesCaught": 1
      },
      "weeklyTargets": {
        "tasksCompleted": 10,
        "blogsDrafted": 2,
        "socialPosts": 5,
        "emailsDrafted": 5,
        "commentsDrafted": 10,
        "issuesCaught": 3
      }
    },
    "ace": {
      "name": "Ace",
      "role": "Business & Sales", 
      "avatar": "/avatars/ace.png",
      "emoji": "🔍",
      "weeklyMetrics": {
        "prospectsIdentified": 0,
        "contentPublished": 0,
        "prospectsEngaged": 0,
        "responses": 0,
        "customers": 0,
        "mrrAdded": 0
      },
      "weeklyTargets": {
        "prospectsIdentified": 20,
        "contentPublished": 5,
        "prospectsEngaged": 15,
        "responses": 3,
        "customers": 1,
        "mrrAdded": 50
      }
    }
  },
  "weeklyHistory": [
    {
      "week": "2026-W07",
      "jamie": { "score": 75 },
      "marvin": { "score": 60 },
      "ace": { "score": 0 }
    }
  ]
}
```

## Implementation Steps

1. Create `/app/metrics/page.tsx` in jamiewatters.work repo
2. Create `/public/data/metrics.json` with initial data
3. Build React components for team cards, charts, tables
4. Style with existing Tailwind theme
5. Add to nav (or keep as unlisted "secret" page initially)
6. Set up Marvin cron to update JSON daily

## Automation

**Daily Update Cron (11 PM ET / 04:00 UTC)**
- Marvin reads METRICS.md
- Updates metrics.json in repo
- Commits and pushes

**Weekly Report Cron (Monday 9 AM ET / 14:00 UTC)**
- Generates weekly summary
- Creates `metrics/2026-W07.md`
- Posts summary to Telegram
- Updates historical data in JSON

## Future Enhancements

- Real-time updates via WebSocket
- Email/Telegram weekly digest
- Public API for others to query
- Comparison with previous weeks
- Streak tracking (consecutive days meeting targets)
- Leaderboard (fun competition between agents)
