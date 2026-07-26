# SimplJSON ⚡

SimplJSON is a lightweight, premium, and highly interactive developer-focused JSON parser and viewer. Standard online JSON formatters are often bloated with ads, clunky, or lack critical keyboard search navigation. SimplJSON addresses these pain points with a clean, responsive single-screen workspace designed to streamline raw API response inspection.

🚀 **Try the Live App:** [json-parser-q4zd.onrender.com](https://json-parser-q4zd.onrender.com/)

---

## ✨ Features

### 🖥️ Resizable Split Panel Workspace
- **Customizable Layout**: Drag the vertical divider to scale the editor vs. tree viewer width.
- **Strict Single-Screen Height**: Fits 100% of the viewport height with no duplicate scrollbars.

### 🔍 Advanced Search & Match Navigation
- **Filter vs. Highlight Modes**: Choose between hiding non-matching elements entirely or highlighting matches while keeping the full tree hierarchy visible.
- **Live Match Counters**: Displays `currentMatch/totalMatches` directly inside the input container.
- **Enter Key Cycling**: Focus on the search field and press `Enter` to cycle forward (or `Shift+Enter` backward). The viewer will automatically smooth-scroll the active match and **center it vertically** in the view.
- **Active Highlight Ring**: The currently navigated match is highlighted in a distinct indigo background with a focus outline to stand out.

### 🌳 Premium Interactive Tree View
- **Collapsible Structure**: Expand or collapse nested objects and arrays instantly.
- **Selective Collapsing ("Collapse Parents")**: Collapse all deep parent objects/arrays with a single click while keeping top-level root keys fully visible.
- **Property Path Copying**: Click any key to copy its exact accessor path (e.g. `root.Account_Module[0].ID`) directly to your clipboard.
- **JSON Block Copying**: Copy complete parsed object/array blocks as formatted string data.

### 🎨 Visual & Theme Design
- **Ultra-Slim Header**: Streamlined controls designed to maximize vertical view space.
- **Frictionless Dark Mode**: Smooth glassmorphic transitions between light and dark themes.
- **Real-Time Validation**: Instant JSON validation with descriptive syntax error line numbers and character offsets as you paste.

---

## 🛠️ Tech Stack

- **Core**: React 18 & Vite
- **Styling**: Tailwind CSS
- **Icons**: Custom inline SVGs

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (version 18+ recommended) installed.

### Installation & Run

1. Clone or download the repository:
   ```bash
   git clone <repository-url>
   cd json-parser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
|---|---|---|
| `Enter` | Focus next search match | Search Input |
| `Shift + Enter` | Focus previous search match | Search Input |
| `Escape` | Clear search filter | Search Input |
