# 📚 Documentation Index

Complete map of all documentation for indian.rent. Start here to find what you need.

---

## 🎯 Quick Navigation

### 👶 For Absolute Beginners
Start with these in order:

1. **[GETTING_STARTED.md](./GETTING_STARTED.md)** (5 min read)
   - Copy-paste setup instructions
   - Common issues & solutions
   - First code change example

2. **[README.md](./README.md)** (15 min read)
   - Project overview
   - Feature explanations
   - File guide
   - Troubleshooting

3. **[CONTRIBUTING.md](./CONTRIBUTING.md)** (20 min read)
   - How to fork & clone
   - Git workflow
   - Code style guide
   - PR process

---

### 🏗️ For Understanding Architecture
Go deeper with these:

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** (30 min read)
   - System design diagrams
   - Component tree
   - Data flow
   - Database schema

2. **[WIKI.md](./WIKI.md)** (45 min read)
   - Feature modules (map, forms, analytics)
   - API reference
   - Map engine deep dive
   - Performance & caching
   - Security model

---

### 💻 For Making Changes
Reference these while coding:

| Document | What's In It |
|----------|------------|
| **README.md** | File guide, setup, troubleshooting |
| **CONTRIBUTING.md** | Code style, commit format, testing |
| **ARCHITECTURE.md** | Data structures, API contracts |
| **WIKI.md** | Feature documentation, advanced topics |

---

### 🚀 For Contributing
Follow this path:

1. Read **[CONTRIBUTING.md](./CONTRIBUTING.md)** fully
2. Fork & clone repo
3. Create feature branch
4. Make changes (reference **[ARCHITECTURE.md](./ARCHITECTURE.md)** as needed)
5. Open PR with clear description
6. Wait for review & merge!

---

## 📖 Document Descriptions

### [GETTING_STARTED.md](./GETTING_STARTED.md)
**Best for:** First-time setup, 5-minute quick start

**Contains:**
- Copy-paste setup commands
- How to get API keys
- Try it out (add a property)
- Common issues with solutions
- Learning path for Week 1-4
- First code change example

**Read when:** You just cloned the repo and want to run it NOW

---

### [README.md](./README.md)
**Best for:** Project overview, features, 10-minute understanding

**Contains:**
- What is indian.rent (problem & solution)
- Quick start (2 minutes)
- First steps for developers
- Architecture overview
- Database schema simplified
- Setup guide (detailed)
- Key features explained
- File guide for newcomers
- Development task examples
- Testing checklist
- Troubleshooting
- Documentation map
- Contributing guidelines
- License

**Read when:** You want to understand what the project does and how to set it up

---

### [ARCHITECTURE.md](./ARCHITECTURE.md)
**Best for:** System design, how components connect

**Contains:**
- System overview (high-level diagram)
- Component architecture (page structure, component tree)
- Data flow (happy path, error handling, real-time)
- Database schema (normalized tables with PostGIS)
- API contracts (server actions, HTTP routes)
- Deployment architecture (local, production, Vercel)
- Security model (auth, RLS, privacy)
- Error handling strategy
- Performance optimizations

**Read when:** You need to understand how systems connect or add a new feature

---

### [WIKI.md](./WIKI.md)
**Best for:** Deep dives, feature documentation, advanced topics

**Contains:**
- Core architecture (server actions, RPC, RLS)
- Data models & schema (detailed with indexes)
- Feature modules (Map, Form, Analytics, Metro, Legend)
- API reference (full request/response specs)
- Map engine deep dive (clustering, reverse geocoding)
- Database design (indexes, PostGIS queries)
- Performance & caching (Redis strategy)
- Security & privacy (IP hashing, auth flow)
- Deployment & DevOps (env vars, monitoring)
- Troubleshooting guide (10 common issues)
- Advanced topics (custom hooks, migrations)

**Read when:** You need detailed documentation of a specific feature

---

### [CONTRIBUTING.md](./CONTRIBUTING.md)
**Best for:** Contributing code, PR process, code style

**Contains:**
- Code of conduct
- Getting started (fork, clone, branch)
- Making changes (commit message format)
- Code style guide (TypeScript, components, Tailwind, comments)
- Testing checklist
- Bug reporting template
- Learning resources
- PR checklist
- Common mistakes
- Example workflow
- Tips for successful PRs

**Read when:** You want to contribute code to the project

---

### [CLAUDE.md](./CLAUDE.md)
**Best for:** AI assistants (Claude Code, GitHub Copilot)

**Contains:**
- Build & dev commands
- graphify knowledge graph commands
- Architecture patterns (last updated)
- Recent session changes
- Knowledge graph stats
- Search strategy

**Read when:** You're using AI tools to help with development

---

### [UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md)
**Best for:** UX issues, roadmap, improvement tracking

**Contains:**
- Critical fixes implemented
- High-priority improvements
- Mobile-specific issues
- Desktop enhancements
- Success metrics
- Performance targets

**Read when:** You want to work on UX improvements or see what's planned

---

## 🔍 Document Map by Topic

### Setup & Installation
- **GETTING_STARTED.md** — Quick setup (5 min)
- **README.md** → Setup Guide section (30 min)
- **CONTRIBUTING.md** → Getting Started section

### Understanding the Code
- **README.md** → Architecture Overview + File Guide
- **ARCHITECTURE.md** → System Overview + Component Tree
- **WIKI.md** → Core Architecture + Feature Modules

### Making Changes
- **ARCHITECTURE.md** → API Contracts (what to change)
- **CONTRIBUTING.md** → Code Style (how to write)
- **README.md** → Common Development Tasks

### Adding Features
- **ARCHITECTURE.md** → Data Flow (impact analysis)
- **WIKI.md** → Feature Modules (existing patterns)
- **CONTRIBUTING.md** → Commit Guidelines

### Fixing Bugs
- **README.md** → Troubleshooting (common issues)
- **WIKI.md** → Troubleshooting Guide (advanced)
- **ARCHITECTURE.md** → Error Handling Strategy

### Contributing Code
- **CONTRIBUTING.md** (entire document)
- **ARCHITECTURE.md** → Data Models (database impact)
- **README.md** → Contributing section

### Database Design
- **README.md** → Database Schema (simplified)
- **ARCHITECTURE.md** → Database Schema (full)
- **WIKI.md** → Database Design (indexes, queries)

### API Integration
- **ARCHITECTURE.md** → API Contracts
- **WIKI.md** → API Reference (detailed)
- **README.md** → Common Development Tasks

---

## 📚 Reading Time Estimates

| Document | Time | Best For |
|----------|------|----------|
| **GETTING_STARTED.md** | 5 min | First-time setup |
| **README.md** | 20 min | Overview & setup |
| **ARCHITECTURE.md** | 30 min | System design |
| **WIKI.md** | 45 min | Feature deep-dives |
| **CONTRIBUTING.md** | 25 min | Before contributing |
| **CLAUDE.md** | 5 min | AI tools only |

**Total Learning Path:** ~2.5 hours to understand everything

---

## 🎯 Which Document Should I Read?

### Scenario 1: "I just cloned the repo"
→ Read **GETTING_STARTED.md** (5 min)
→ Run `npm run dev`
→ Try adding a property

### Scenario 2: "I want to understand how the app works"
→ Read **README.md** → Architecture Overview
→ Read **ARCHITECTURE.md** → System Overview
→ Read **WIKI.md** → Feature Modules

### Scenario 3: "I want to fix a bug"
→ Read **README.md** → Troubleshooting
→ If not found: Read **WIKI.md** → Troubleshooting Guide
→ Check **ARCHITECTURE.md** → Error Handling

### Scenario 4: "I want to add a new feature"
→ Read **ARCHITECTURE.md** → Data Flow
→ Read **CONTRIBUTING.md** → Code Style
→ Reference **WIKI.md** for similar existing features

### Scenario 5: "I want to contribute code"
→ Read **CONTRIBUTING.md** (entire document)
→ Create feature branch
→ Reference **ARCHITECTURE.md** & **WIKI.md** while coding
→ Submit PR

### Scenario 6: "I'm stuck on something specific"
→ Search this file for the topic
→ Go to the recommended document
→ If still stuck: Check **README.md** → Troubleshooting
→ Ask in GitHub Discussions

---

## 🔗 Cross-References

### Map Engine Questions
- Where? `README.md` → File Guide
- How it works? `ARCHITECTURE.md` → Component Architecture
- Details? `WIKI.md` → Map Engine Deep Dive
- Code style? `CONTRIBUTING.md` → Code Style Guide

### Database Questions
- Schema? `README.md` → Database Schema
- Detailed? `ARCHITECTURE.md` → Database Schema
- Queries? `WIKI.md` → Database Design
- Migrations? `WIKI.md` → Advanced Topics

### Deployment Questions
- How? `ARCHITECTURE.md` → Deployment Architecture
- Env vars? `README.md` → Setup Guide
- Details? `WIKI.md` → Deployment & DevOps

### Contributing Questions
- How to contribute? `CONTRIBUTING.md` (entire document)
- Code style? `CONTRIBUTING.md` → Code Style Guide
- Commit format? `CONTRIBUTING.md` → Commit with Good Messages

---

## 💡 Pro Tips

1. **Use browser search** — Open doc in GitHub, press Cmd+F to search
2. **Read section by section** — Don't try to read entire wiki in one go
3. **Code as you read** — Open VS Code alongside docs
4. **Reference while coding** — Keep ARCHITECTURE.md open as you work
5. **Ask questions** — GitHub Discussions for anything unclear

---

## 🚀 Getting Started (TL;DR)

1. Read **GETTING_STARTED.md** (5 min)
2. Run setup commands (copy-paste from there)
3. Run `npm run dev`
4. Try adding a property
5. When you understand basics, read **ARCHITECTURE.md**
6. When you want to code, read **CONTRIBUTING.md**
7. Reference **WIKI.md** for specific features

---

## 📞 Still Have Questions?

| Question | Where to Ask |
|----------|------------|
| Setup problem | GitHub Discussions |
| Found a bug | GitHub Issues |
| How do I X? | This docs index + WIKI.md |
| Code style question | CONTRIBUTING.md |
| Architecture question | ARCHITECTURE.md |
| General help | hello@wishlabs.in |

---

## 📋 Documentation Checklist

- [x] **GETTING_STARTED.md** — 5-minute setup
- [x] **README.md** — Project overview & guide
- [x] **ARCHITECTURE.md** — System design
- [x] **WIKI.md** — Feature documentation
- [x] **CONTRIBUTING.md** — Contribution guide
- [x] **CLAUDE.md** — AI tool guidelines
- [x] **UX_IMPROVEMENTS.md** — Roadmap
- [x] **DOCS_INDEX.md** — This file!

All documentation is in place! 🎉

---

## 🎓 Learning Philosophy

This documentation is organized by **audience** and **time commitment**:

- **GETTING_STARTED.md** — For people with 5 minutes
- **README.md** — For people with 20 minutes
- **ARCHITECTURE.md** — For people with 30 minutes
- **WIKI.md** — For people with 45+ minutes
- **CONTRIBUTING.md** — For people who want to code

Each document is **standalone** but links to others for deeper dives.

---

**Happy learning! 🚀**

*Last updated: May 2026*
