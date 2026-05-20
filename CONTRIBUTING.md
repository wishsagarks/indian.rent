# Contributing to indian.rent

Thank you for your interest in contributing! We welcome developers of all skill levels. Whether you're fixing a typo, improving docs, or building new features, your help makes indian.rent better.

---

## 🎯 Before You Start

### Code of Conduct
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report harassment to hello@wishlabs.in

### What We're Looking For
- **Bug fixes** — Found a crash or visual issue? We'd love your fix
- **Features** — Ideas for new features? Discuss in Issues first
- **Documentation** — Better explanations, clearer examples, tutorial videos
- **Tests** — Visual regression tests, unit tests, end-to-end tests
- **Design** — UI/UX improvements, better mobile layouts
- **Performance** — Faster load times, reduced bundle size

### What We Don't Need
- Cosmetic changes (unless they're part of a larger improvement)
- Unrelated refactoring (we prefer focused PRs)
- Large architectural rewrites (discuss first in Issues)

---

## 🚀 Getting Started

### 1. Fork & Clone
```bash
# Fork the repo on GitHub (click "Fork" button)

# Clone your fork
git clone https://github.com/YOUR-USERNAME/indian-rent.git
cd indian-rent

# Add upstream remote (to stay in sync)
git remote add upstream https://github.com/original-org/indian-rent.git
```

### 2. Create a Feature Branch
```bash
# Always create a new branch for your work
git checkout -b feature/my-amazing-feature

# Branch naming convention:
# feature/description      - New feature
# fix/description          - Bug fix
# docs/description         - Documentation
# perf/description         - Performance improvement
# style/description        - Code style/formatting
# refactor/description     - Code refactoring
```

### 3. Set Up Development Environment
```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy environment template
cp .env.example .env.local

# Add your API keys (see README Setup Guide)

# Start dev server
npm run dev

# Open http://localhost:3000
```

### 4. Make Your Changes
- Edit files in `src/`
- Test your changes locally
- Run linting: `npm run lint`
- Run type check: `npm run build`

### 5. Commit with Good Messages
```bash
# Stage changes
git add src/components/MyComponent.tsx

# Commit with clear message
git commit -m "feat: add dark mode toggle for map legend"

# Commit message format:
# {type}: {subject}
#
# {body}
#
# {footer}
```

#### Commit Message Guidelines

**Type:** (required)
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `style` — Code style (formatting, missing semicolons)
- `refactor` — Code refactoring without behavior change
- `perf` — Performance improvement
- `test` — Adding or updating tests
- `chore` — Build process, dependencies, tooling

**Subject:** (required)
- Clear, lowercase description
- Imperative mood ("add" not "added" or "adds")
- No period at the end
- Max 50 characters

**Body:** (optional but recommended)
- Explain *what* and *why*, not *how*
- Wrap at 72 characters
- Separate from subject with blank line

**Footer:** (optional)
- Reference related issues: `Fixes #123`
- Breaking changes: `BREAKING CHANGE: ...`

**Examples:**

```bash
# Good: Clear what was changed and why
git commit -m "feat: add metro overlay for Bengaluru

The metro lines help users understand transit accessibility.
This is useful for commute planning.

Closes #45"
```

```bash
# Good: Simple fix
git commit -m "fix: mobile nav not appearing on iPhone 12

Changed CSS selector from [class*='mobile'] to [data-testid='mobile-nav']
to reliably target the nav element on all screen sizes."
```

```bash
# Bad: Too vague
git commit -m "update stuff"

# Bad: Imperative mood
git commit -m "Added the metro overlay feature"

# Bad: Includes too much
git commit -m "feat: add metro + fix mobile + update docs + refactor components"
```

### 6. Push to Your Fork
```bash
# Push your branch
git push origin feature/my-amazing-feature
```

### 7. Open a Pull Request
1. Go to GitHub → Your fork
2. Click "Compare & pull request" button
3. Fill out the PR template:

```markdown
## Description
Brief explanation of what you're changing and why.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality change)
- [ ] Documentation update

## How to Test
Steps to verify your changes work:
1. Navigate to `/explore`
2. Click the + button
3. Verify the form appears without errors
4. Close the form with Esc key

## Checklist
- [ ] I've tested this locally
- [ ] I've run `npm run lint` and fixed any errors
- [ ] I've run `npm run build` with no errors
- [ ] I've updated documentation (if needed)
- [ ] I've added comments for complex logic
- [ ] My code follows the style guide
```

### 8. Respond to Review
- GitHub will notify you of comments
- Make requested changes in new commits (don't force-push)
- Mention reviewer once you've addressed feedback

### 9. Merge
Once approved, a maintainer will merge your PR! 🎉

---

## 📝 Code Style Guide

### TypeScript Best Practices

**Use Type-Safe Code:**
```typescript
// ❌ Avoid 'any' type
function processFlat(flat: any) {
  return flat.rent_amount;
}

// ✅ Use specific types
import { Flat } from '@/lib/types';

function processFlat(flat: Flat) {
  return flat.rent_amount;  // Type-safe!
}
```

**Naming Conventions:**
```typescript
// Components: PascalCase
export function RefinedMapEngine() { }

// Functions/variables: camelCase
const handleMapClick = () => { }
const maxBudget = 50000;

// Constants: UPPER_SNAKE_CASE
const API_TIMEOUT = 5000;
const CACHE_KEY = 'buildings:all';

// React Hooks: useXxx
function useFilteredFlats() { }

// Private functions: _prefixed (optional)
const _helperFunction = () => { }
```

**Imports: Organized**
```typescript
// 1. External libraries
import React, { useState } from 'react';
import { useQuery } from '@/hooks/useQuery';

// 2. Internal modules
import { Flat } from '@/lib/types';
import MapEngine from '@/components/map/MapEngine';

// 3. Styles
import styles from './Component.module.css';
```

### Component Structure

```typescript
'use client';  // Mark as client component if needed

import { useState } from 'react';
import { SomeType } from '@/lib/types';

interface Props {
  title: string;
  onSubmit?: (value: string) => void;
}

/**
 * MyComponent — A brief description of what it does.
 * 
 * Used in: /explore page, map detail card
 */
export default function MyComponent({ title, onSubmit }: Props) {
  const [value, setValue] = useState('');
  
  const handleSubmit = () => {
    onSubmit?.(value);  // Optional call
  };
  
  return (
    <div>
      <h2>{title}</h2>
      <input value={value} onChange={e => setValue(e.target.value)} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

### Tailwind CSS

Use utility-first approach:

```typescript
// ✅ Good: Utility classes
<div className="flex flex-col gap-4 p-6 bg-background border border-white/10 rounded-lg">
  <h2 className="text-xl font-bold text-on-background">Title</h2>
</div>

// ❌ Avoid: Custom CSS or inline styles
<div style={{ display: 'flex', gap: '16px', padding: '24px' }}>
  <h2>Title</h2>
</div>
```

Responsive classes:
```typescript
// Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">
  Mobile size → medium size → large size
</div>
```

### Comments

Only comment the *why*, not the *what*:

```typescript
// ✅ Good: Explains intent
// We use ST_DWithin instead of direct distance check
// because it's faster with geographic indexes
const buildings = await supabase
  .from('buildings')
  .select()
  .filter('location', 'nearby', { lat, lng, radius: 100 });

// ❌ Bad: Obvious from code
// Loop through each flat
flats.forEach(flat => {
  // Add the flat
  list.push(flat);
});

// ❌ Bad: Outdated/misleading
// TODO: Fix this tomorrow (if written 6 months ago)
// Increment counter (but code decrements)
count--;
```

**One-line comments for obvious code:**
```typescript
// Cache results for 1 hour
await redis.set('buildings', data, 'EX', 3600);
```

---

## 🧪 Testing Your Changes

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Feature works in development (`npm run dev`)
- [ ] No console errors in browser DevTools
- [ ] Responsive on mobile (test with DevTools mobile view)
- [ ] Works on at least 2 browsers (Chrome, Safari)
- [ ] Form submission works (if touching forms)
- [ ] Undo/refresh still works

### Running Tests

```bash
# Type checking
npm run build

# Linting
npm run lint

# Visual regression tests
npx tsx visual-regression-test.ts

# (More test suites coming soon!)
```

---

## 🐛 Reporting Bugs

Found a bug? File an Issue with:

1. **Title:** Clear, one-line description
   - ❌ "Map broken"
   - ✅ "Metro overlay not rendering on Google Maps on mobile"

2. **Environment:** Your setup
   ```
   - OS: macOS 13.0
   - Browser: Chrome 120
   - Node version: 18.17
   ```

3. **Steps to Reproduce:**
   ```
   1. Go to http://localhost:3000/explore
   2. Click the + button
   3. Drop a pin
   4. Observe: Form doesn't appear
   ```

4. **Expected vs Actual:**
   ```
   Expected: Form slides in from sidebar
   Actual: Nothing happens
   ```

5. **Screenshots:** If visual, attach a screenshot

6. **Logs:** Paste relevant errors from console

---

## 🎓 Learning Resources

### For Beginners
- [React Docs](https://react.dev) — Learn React fundamentals
- [Next.js Docs](https://nextjs.org/docs) — Next.js features
- [Tailwind CSS](https://tailwindcss.com) — CSS utilities
- [Supabase Docs](https://supabase.com/docs) — Database setup

### For This Project
- [README.md](./README.md) — Quick start & overview
- [WIKI.md](./WIKI.md) — Detailed architecture docs
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design

### Getting Help
- **In Issues:** Ask questions, discuss features
- **In Discussions:** General help, tutorials, best practices
- **Email:** hello@wishlabs.in for sensitive topics

---

## 🏆 Contributor Recognition

We recognize all contributions! Contributors who:
- Fix important bugs
- Add significant features
- Improve documentation
- Help other contributors

Will be listed in:
- [CONTRIBUTORS.md](./CONTRIBUTORS.md) (auto-generated)
- GitHub "Contributors" page

---

## 📋 PR Checklist

Before clicking "Create Pull Request":

- [ ] Branch name follows convention: `feature/...`, `fix/...`, etc.
- [ ] Commit messages are clear and follow the format
- [ ] I've tested locally (`npm run dev`)
- [ ] I've run `npm run lint` with no errors
- [ ] I've run `npm run build` with no errors
- [ ] TypeScript types are correct (no `any`)
- [ ] Responsive design tested (mobile + desktop)
- [ ] Comments explain complex logic
- [ ] PR description is clear and includes why

---

## 🚫 Common Mistakes to Avoid

### 1. Force-Pushing to Public Branches
```bash
# ❌ Don't do this on main/develop branches
git push --force origin main

# ✅ Use force-push only on your own feature branches if needed
git push --force origin feature/my-branch
```

### 2. Committing Sensitive Data
```bash
# ❌ Never commit .env files with real keys
git add .env.local

# ✅ Use .env.example template instead
git add .env.example
```

### 3. Huge PRs
```
❌ "Updated 50 files across 10 components"
✅ "Add metro overlay to map" (focused change)

Break large features into multiple small PRs.
```

### 4. No Context in Commits
```bash
# ❌ Vague message
git commit -m "fix stuff"

# ✅ Clear, detailed message
git commit -m "fix: prevent 'No Listings Yet' from appearing when filters applied

When a user set filters that match 0 listings, the empty state
modal would appear even though no actual data load error occurred.
Changed logic to only show error modal on API failures."
```

### 5. Ignoring Test Failures
```bash
# ❌ Push anyway
npm run build  # Errors! → git push anyway

# ✅ Fix before pushing
npm run build  # Errors! → Fix issues → npm run build → git push
```

---

## 🎬 Example Workflow

Let's say you want to fix a typo in the README:

```bash
# 1. Update from upstream (stay in sync)
git fetch upstream
git rebase upstream/main

# 2. Create feature branch
git checkout -b docs/fix-readme-typo

# 3. Edit file
# (Change "recieve" to "receive" in README.md)

# 4. Check what changed
git diff

# 5. Stage and commit
git add README.md
git commit -m "docs: fix typo in README

Changed 'recieve' to 'receive' in Quick Start section."

# 6. Push to your fork
git push origin docs/fix-readme-typo

# 7. Open PR on GitHub
# (GitHub will suggest "Create Pull Request" button)

# 8. Wait for review + merge ✅
```

---

## 💡 Tips for Successful PRs

1. **Start Small:** Begin with small, focused PRs to learn the process
2. **Communicate:** If you're working on something big, create an Issue first to discuss
3. **Read Feedback:** Maintainers' comments are teaching opportunities
4. **Be Patient:** Maintainers are volunteers, reviews can take a few days
5. **Ask Questions:** If feedback is unclear, ask for clarification
6. **Keep Learning:** Each PR is a chance to improve your coding skills

---

## 🎉 You Did It!

Once your PR is merged, you're officially a contributor to indian.rent! 

Your code is now part of a product helping thousands of renters and landlords save money and time.

**Celebrate! 🚀**

---

## Questions?

- **GitHub Issues:** For bug reports and feature discussions
- **GitHub Discussions:** For questions and help
- **Email:** hello@wishlabs.in
- **Twitter:** [@wishsagar](https://twitter.com/wishsagar)

---

**Thank you for contributing to making housing more accessible! ❤️**

*Last updated: May 2026*
