# Project Context: GitHub PR Management Tool

## User Stories

1. As a developer, I want to know which of my PRs is not ready, by a conflict or failing CI, in order to keep it updated.
2. As a release manager, I want to know which PRs in different repositories are related to a feature to merge them all together.
3. As a developer, I want to see the dependencies of my PRs, when working with stacked PR, to control my flow.
4. As a developer, I want to see PRs that are waiting for my review, so I can prioritize reviewing them and unblock other team members.

## Technical Decisions

- Language: JavaScript/Node.js
- Integration: GitHub API (REST/GraphQL)
- Interface: CLI tool
- Initial Scope: No webhooks/real-time updates
- Package Manager: yarn
- Build Tools: Vite

## Architecture Rules

1. Don't boilerplate with controllers and services and utils. Keep it simple and clean.
1. Use `ink` library to show interactive reactive Terminal UI.
1. On UI, try to reduce text as possible, use clickable text instead of printing full link url, use colors instead of writing status.
1. Prefer not writing comments on code, but if necessary, use it to explain why of the code.

## CLI Commands

1. `stuck` - Shows the health status of PRs organized by features
2. `list` - Interactive UI to organize PRs into features (supports authored, review, and assigned PRs)
3. `features` - Manage feature hierarchies and dependencies
4. `cleanup` - Remove closed/merged PRs and empty features

## Project Structure

- `src/components/` - React components for the UI
- `src/services/` - Services for interacting with GitHub API
- `src/stores/` - State management for the application
- `PRHealthStore` - Manages the state for the `stuck` command
- `PRHealthDisplay` - Displays PR health information with visual indicators
- `PRItem` - Renders individual PR items with status indicators
