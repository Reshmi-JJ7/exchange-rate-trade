# Exchange Rate & Trade Analyzer
1. Open the folder in VS Code.
2. Quick run (no chat AI): right-click index.html > Open with Live Server (or just double-click it).
3. Full run with AI chat: copy .env.example to .env, put your Anthropic API key in it, then in the terminal: `node --env-file=.env server.js` and open http://localhost:3000. Never commit .env.
4. Data: the project ships with cleaned real data (FY2018-FY2025) in data.js and trade_data.csv. To use your own, build a CSV with columns year,usd_inr,sector,imports,exports (US$ billion) and load it with the "Load real data" box, or paste it into data.js.
Sector keys: see SECTOR_NAMES in data.js (add new ones there).
