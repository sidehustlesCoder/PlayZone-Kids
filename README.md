# GameZoneKids.com 🎮

**Fun, colorful mini-games made just for kids!** A browser-based platform of interactive games that run 100% client-side — no server, no install, no backend. Just open it in your browser and start playing!

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

## 🎮 Games Available

- 🃏 **Memory Match** — Flip cards to find matching pairs
- 🎵 **Simon Says** — Repeat the color sequence
- 🌀 **Maze Runner** — Navigate from start to finish
- 🔤 **Word Search** — Find hidden words in a grid
- 🔴 **Connect Four** — Outsmart the AI, get 4 in a row
- 🧩 **Sliding Puzzle** — Arrange tiles in the right order
- 🐯 **Animal Sound Match** — Match animals to their sounds
- 🎨 **Color Splash** — Pop the right colored balloons
- 🔨 **Whack-a-Mole** — Tap moles before they disappear
- 🧩 **Shape Sorter** — Match shapes to their outlines
- ❌ **Tic-Tac-Toe** — Classic X vs O against the AI
- 🪓 **Hangman** — Guess the secret word
- 🎯 **Number Guesser** — Use hints to find the hidden number
- 🔬 **Quiz** — Test your knowledge
- 🌲 **Text Adventure** — Choose your own story path

## 🏗 Architecture

- **React + Vite** — fast frontend tooling
- **Hash Routing** — SPA-compatible with GitHub Pages
- **localStorage** — all persistence (scores, game state)
- **Zero backend** — ships as static files

## 📁 Project Structure

```
src/
├── apps/                   # One folder per mini-app
│   ├── memory-match/
│   ├── simon-says/
│   ├── maze-runner/
│   ├── word-search/
│   ├── connect-four/
│   ├── sliding-puzzle/
│   ├── animal-sound-match/
│   ├── color-splash/
│   ├── whack-a-mole/
│   ├── shape-sorter/
│   ├── tic-tac-toe/
│   ├── hangman/
│   ├── number-guesser/
│   ├── quiz/
│   └── text-adventure/
├── shared/
│   ├── useKidsProgress.js  # Star/progress tracking hook
│   └── sounds.js           # Sound effects utility
├── components/             # Shared UI components
├── styles/
│   └── index.css           # Design system tokens + global styles
├── App.jsx                 # Root component with routing
└── main.jsx                # Entry point
```

## 📦 Deployment

Built output is a clean static `/dist` folder — deploy to:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

No server configuration needed.

## 📝 License

MIT
