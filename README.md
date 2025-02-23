# 🔄 PRStuck - Where Stuck meets Stack!

Ever felt overwhelmed managing multiple open PRs? PRStuck helps you take control of your PR workflow, whether they're blocked, stacked, or scattered across repos! 🎯

## 😫 The Pain Points

Managing multiple open PRs can be chaotic and frustrating:

- 🕒 **Review Bottlenecks**: PRs sitting idle waiting for reviews
- 🏗️ **Large Features**: Big changes split across multiple PRs that need to land together
- ⏳ **CI/Test Delays**: PRs blocked by failing tests or long-running CI
- 📦 **Dependencies**: PRs that can't merge until other PRs are merged first
- 👥 **Team Coordination**: PRs blocked waiting for other team members' work
- 🌐 **Cross-Repo Dependencies**: PRs that depend on changes in different repositories

## ✨ How PRStuck Helps

- 🚨 **Get Unstuck**: 
  - Instantly spot which PRs have conflicts or failing CI
  - See which PRs are waiting for reviews
  - Track PRs blocked by dependencies
  
- 📚 **Stack Better**: 
  - Visualize PR dependencies in a clear hierarchy
  - Understand which PRs need to merge first
  - Get notified when dependent PRs are ready to merge

- 🔗 **Stack Together**: 
  - Track related PRs across multiple repositories
  - Group PRs by features or initiatives
  - Coordinate merging of dependent PRs

- 💡 **Smart Stacking**: 
  - Get suggestions for optimal PR stacking order _(Coming Soon)_
  - Automated dependency detection
  - Smart merge order recommendations

![PRStuck Demo](./docs/screenshot.png)

## 🚀 Quick Start

```bash
# Install the extension
gh extension install baruchiro/gh-prstuck

# Check what's blocking your PRs
gh prstuck stuck

# Organize your PRs into features
gh prstuck list

# Manage feature dependencies
gh prstuck features
```

## 🎮 Commands

### Available Now

- `gh prstuck stuck` - Find out what's keeping your PRs stuck
- `gh prstuck list` - Interactive UI to organize PRs into features
  - Press `a` to view your authored PRs
  - Press `r` to view PRs where you're requested as reviewer
  - Press `s` to view PRs assigned to you
  - Navigate with ↑/↓ arrows
  - Press Enter to select a PR
  - Choose existing feature or create new one
  - Press Esc to save and exit
- `gh prstuck features` - Manage feature hierarchies and dependencies
  - Navigate with ↑/↓ arrows
  - Press Enter to manage a feature's dependencies
  - Press Space to toggle dependencies
  - Press Esc to save and return
  - Create new features with no PRs

## 🛠 Tech Stack

- Node.js - For the core engine
- GitHub API - Your window to the PR world
- Ink - Making your terminal beautiful
- React - For smooth interactive experiences

## 💡 Pro Tips

- Keep your PRs stacked, not stuck! 📚
- Set up your GitHub token in `.env` file:
  ```
  GITHUB_TOKEN=your_github_token
  ```
- Use the `list` command to group related PRs across repositories
- Use the `features` command to define dependencies between features
- Switch between PR lists with a single keystroke (a/r/s)
- Watch the magic happen in your colorful terminal ✨

## 🗺️ Roadmap

Here's what's coming next:

- 🔄 Implement as GitHub CLI Extension
- 🔗 Fetch PRs from Project Management systems (Jira, ClickUp)
- ☁️ Remote shared status file support

## 🤝 Contributing

Found a bug? Got a cool idea? PRs are welcome! Just remember:

1. Keep it simple and clean
2. Test your changes
3. Stack responsibly!

## 📝 License

MIT - Stack freely!

---

Never get stuck, always stack right! ✨
