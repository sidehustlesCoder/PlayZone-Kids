# CodeArcade 🎮

**Learn Python by playing.** A browser-based platform of interactive Python mini-apps and games powered by [Pyodide](https://pyodide.org) (Python compiled to WebAssembly).

Everything runs 100% client-side — no server, no install, no backend. Just open it in your browser and start playing.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 🏗 Architecture

- **React + Vite** — fast frontend tooling
- **Pyodide** — Python-in-browser via WebAssembly, running in a Web Worker
- **Hash Routing** — SPA-compatible with GitHub Pages
- **localStorage** — all persistence (scores, to-dos, game state)
- **Zero backend** — ships as static files

## 📁 Project Structure

```
src/
├── apps/                   # One folder per mini-app
│   ├── calculator/
│   │   ├── logic.py        # Pure Python, no UI code
│   │   ├── Calculator.jsx  # React UI component
│   │   └── README.md       # What it does, key concepts
│   ├── number-guesser/
│   ├── password-gen/
│   ├── tic-tac-toe/
│   ├── quiz/
│   ├── hangman/
│   ├── todo/
│   ├── unit-converter/
│   ├── text-adventure/
│   └── data-fetcher/
├── shared/
│   ├── game_interface.py   # Common game state interface
│   ├── pyodideWorker.js    # Web Worker for Python execution
│   └── usePyodide.js       # React hook for worker communication
├── components/             # Shared UI components
├── styles/
│   └── index.css           # Design system tokens + global styles
├── App.jsx                 # Root component with routing
└── main.jsx                # Entry point
```

## 🎯 Adding a New Mini-App

1. Create a folder: `src/apps/your-app-name/`
2. Add `logic.py` — pure Python logic (no UI imports)
3. Add `YourApp.jsx` — React component for the UI
4. Add `README.md` — 2-3 sentences about the app
5. Register it in `src/App.jsx` → `APP_LIST` array
6. If it's a game, extend `GameInterface` from `shared/game_interface.py`

## 🎨 Design System

The platform uses a custom design system with:
- **Space Grotesk** — headings/branding
- **Inter** — body text
- **JetBrains Mono** — code display
- Dark/light theme toggle (persisted)
- Consistent spacing, color, and typography tokens

## 📦 Deployment

Built output is a clean static `/dist` folder — deploy to:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

No server configuration needed.

## 📝 License

MIT
