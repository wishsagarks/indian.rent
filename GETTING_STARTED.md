# Getting Started with indian.rent 🚀

Welcome! This is your **5-minute quick start** guide. If you get stuck, see [README.md](./README.md) for more details.

---

## ⚡ Super Quick Start (Copy-Paste)

```bash
# 1. Clone the project
git clone https://github.com/your-org/indian-rent.git
cd indian-rent

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy environment template
cp .env.example .env.local

# 4. Add your API keys (see "Getting API Keys" below)

# 5. Start dev server
npm run dev

# App opens at http://localhost:3000
```

Done! 🎉

---

## 🔑 Getting API Keys (3 minutes)

### Option A: Google Maps Only (Simplest)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project (any name)
3. Search "Maps JavaScript API" → Enable it
4. Click "Create Credentials" → API Key
5. Copy the key
6. In `.env.local`, find this line:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_key
   ```
   Replace `your_google_key` with your copied key

Done! App will use Google Maps.

### Option B: Add Supabase (For Real Data)

If you want actual data (not just demo mode):

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to start (2-3 min)
4. Go to Settings → API
5. Copy these two values:
   ```
   NEXT_PUBLIC_SUPABASE_URL = (copy this)
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (copy this)
   ```
6. Paste into `.env.local`

Done! Now data is saved to your database.

---

## 🎮 Try It Out

### Add Your First Property

1. Open http://localhost:3000 in browser
2. Click the **+** button at the bottom
3. Click on map where you want to add property
4. Fill out the form:
   - Building name: "Test Building"
   - Rent: 50000
   - BHK: 2
   - Your name: "Your Name"
5. Click "Submit"
6. See your property appear on the map! 🎉

### Try Filtering

1. Move the Budget slider left/right
2. Click BHK buttons (1, 2, 3)
3. See listings update in real-time

### Check Analytics

1. Click the **📊** button (bottom nav)
2. See statistics dashboard

---

## 📁 Where's the Code?

```
src/
├── app/explore       ← Map page code
├── components/       ← Reusable UI components
├── lib/              ← Database & API helpers
└── hooks/            ← React hooks
```

**Most Important Files:**
- `src/components/map/RefinedMapEngine.tsx` — Main map
- `src/components/map/AddPropertyForm.tsx` — Form
- `src/app/actions/map-actions.ts` — Backend logic

---

## 🧪 Check If It Works

Run these commands to verify setup:

```bash
# 1. Type check (should see no errors)
npm run build

# 2. Lint check
npm run lint

# 3. Dev server test
npm run dev
# Should print: "Local: http://localhost:3000"
```

---

## 🆘 Common Issues

### "Map doesn't load"
- Check `.env.local` has Google API key
- Go to Google Cloud Console → Check API is enabled
- Refresh browser (Cmd+Shift+R on Mac)

### "Can't submit form"
- Check network tab for errors (DevTools → Network)
- Supabase URL in `.env.local`?
- Try waiting 10 seconds (free tier might be slow)

### "npm install fails"
```bash
# Clear npm cache and try again
npm cache clean --force
npm install --legacy-peer-deps
```

### "Port 3000 already in use"
```bash
# Kill process using port 3000
# On Mac:
lsof -ti:3000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📚 Next Steps

### To Learn Code Structure
Read [WIKI.md](./WIKI.md) → "Feature Modules" section

### To Make Your First Change
1. Open `src/components/map/RefinedMapEngine.tsx`
2. Find line with "Map Explorer" text
3. Change it to "My Test Map"
4. Save file (browser hot-reloads!)
5. See change in app

### To Make Your First Commit
```bash
git status                    # See changed files
git add src/                  # Stage changes
git commit -m "test: my first change"
git push origin main
```

### To Contribute
See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guide

---

## 🎯 Learning Path

**Week 1: Understand the Code**
- [ ] Run app locally
- [ ] Add/edit a property on map
- [ ] Read [README.md](./README.md) → "Architecture Overview"
- [ ] Read [WIKI.md](./WIKI.md) → "Core Architecture"

**Week 2: Explore Components**
- [ ] Open RefinedMapEngine.tsx in code editor
- [ ] Find a component, understand what it does
- [ ] Make a small visual change (button color, text)
- [ ] See it update in browser

**Week 3: Database Work**
- [ ] Learn SQL basics (SELECT, INSERT, UPDATE)
- [ ] Access Supabase dashboard
- [ ] View your data in browser
- [ ] Read [ARCHITECTURE.md](./ARCHITECTURE.md) → "Database Schema"

**Week 4: Make Your First PR**
- [ ] Find an issue on GitHub
- [ ] Create feature branch
- [ ] Make change
- [ ] Open pull request
- [ ] Get feedback & merge!

---

## 💡 Pro Tips

### Keyboard Shortcuts in App

| Key | Action |
|-----|--------|
| `+` | Open add property form |
| `Esc` | Close form or popup |
| `?` | Show legend |

(Not implemented yet — good first contribution!)

### Browser DevTools Tricks

```javascript
// In browser console, see all flats:
console.log(window.__flatData);

// Check current map position:
console.log(window.__mapCenter);
```

### Code Editor Extensions (Recommended)

- **VS Code:**
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - Thunder Client (API testing)

---

## 🚨 Before Asking For Help

1. **Search existing issues** — Your question might be answered already
2. **Check the docs** — README, WIKI, ARCHITECTURE all have examples
3. **Google the error** — 90% of errors have StackOverflow answers
4. **Check browser console** — DevTools → Console tab shows errors
5. **Restart dev server** — Many issues fixed by `Ctrl+C` then `npm run dev`

**If still stuck:**
- Post in GitHub Discussions
- Create an Issue with error details
- Email hello@wishlabs.in

---

## 📞 Where to Ask Questions

| Question Type | Where to Ask |
|---------------|-------------|
| Setup issue | [GitHub Discussions](https://github.com/your-org/indian-rent/discussions) |
| Found a bug | [GitHub Issues](https://github.com/your-org/indian-rent/issues) |
| Contribution question | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| How do I X? | [WIKI.md](./WIKI.md) |
| Architecture question | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Sensitive issue | hello@wishlabs.in |

---

## 🏆 First Contribution Ideas

**Easy (30 minutes):**
- Fix a typo in docs
- Add missing comment to code
- Update example in README
- Create a GitHub Discussion

**Medium (1-2 hours):**
- Add a missing feature from [UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md)
- Write a tutorial blog post
- Improve error handling
- Add helpful console logs

**Hard (2-4 hours):**
- Implement a new feature from Roadmap
- Optimize a slow query
- Redesign a component
- Write comprehensive tests

---

## ✅ Checklist: You're Ready To Code!

- [ ] Code cloned to your computer
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created with API keys
- [ ] Dev server running (`npm run dev`)
- [ ] Can see app at http://localhost:3000
- [ ] Can add a property on map
- [ ] Know where main code is (`src/components/`)
- [ ] Understand basic git (`clone`, `add`, `commit`, `push`)
- [ ] Have code editor open (VS Code recommended)

If all checked ✅ — **You're ready to start coding!**

---

## 🎬 Example: Making Your First Code Change

Let's add a "hello" message to the map:

1. **Open file**
   ```
   src/components/map/RefinedMapEngine.tsx
   ```

2. **Find this line** (around line 1100):
   ```typescript
   <div className="absolute top-4 left-4">
   ```

3. **Add below it:**
   ```typescript
   <div className="text-white text-sm bg-primary/80 px-3 py-1 rounded">
     👋 Welcome to indian.rent!
   </div>
   ```

4. **Save** (Cmd+S)

5. **See it appear** in browser instantly! 🎉

6. **Commit it**
   ```bash
   git add src/components/map/RefinedMapEngine.tsx
   git commit -m "feat: add welcome message to map header"
   git push origin main
   ```

Done! You made code changes! 🚀

---

## 📖 Recommended Reading Order

1. **This file** (you are here) ← Start with this
2. [README.md](./README.md) — Project overview
3. [ARCHITECTURE.md](./ARCHITECTURE.md) — How systems connect
4. [WIKI.md](./WIKI.md) — Deep dives into features
5. [CONTRIBUTING.md](./CONTRIBUTING.md) — How to contribute
6. Code itself — Read actual component files

---

## 🎉 You Got This!

Remember: Every expert was once a beginner. 

- **Stuck?** Read the docs or ask for help
- **Made a mistake?** Git makes it easy to undo
- **Code doesn't work?** That's how you learn debugging
- **Found a better way?** Open a PR and share it!

Welcome to the team! 🛰️

---

**Questions?** Ask in [GitHub Discussions](https://github.com/your-org/indian-rent/discussions)

**Want to contribute?** Read [CONTRIBUTING.md](./CONTRIBUTING.md)

**Need help?** Email hello@wishlabs.in

*Happy coding! 🚀*
