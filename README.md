# MedCare React Frontend

A medical blog frontend with an AI chatbot widget.

## Setup

```bash
npm install
npm start
```

## Connect to Backend

Edit `src/hooks/useChat.js` and set:
```js
const API_BASE = "http://localhost:3000/api";
```

Make sure your backend is running (`npm run dev` in the backend folder).

## Chat Features (Offline Fallback Included)
- Works without backend (falls back to built-in responses)
- When backend is running, uses /api/chat endpoint with FuseJS fuzzy matching
- Handles: greetings, doctor schedules, hospital hours, visiting hours, parking, contact info

## File Structure
```
src/
  App.jsx              — Root layout
  App.css              — Layout styles
  index.js             — Entry point
  index.css            — Design tokens + base styles
  hooks/
    useTheme.js        — Light/dark mode
    useChat.js         — Chat API + offline fallback
  components/
    Header.jsx/css     — Sticky header with theme toggle
    Hero.jsx/css       — Featured article hero section
    ArticleCard.jsx/css — Article listing cards
    Sidebar.jsx/css    — Email subscribe, doctors list, tags
    ChatWidget.jsx/css — Floating chat button + chat window
```
