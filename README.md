# ⚡ ROSTER // LOCK (Esports Tournament Manager & Anti-Cheat Hub)

**ROSTERLOCK** is a professional, brutalist-inspired esports event management and anti-cheat auditing platform. Built for tournament organizers, team coaches, and players, it integrates real-time match spectating, secure prize payouts, and an AI telemetry detector to flag cheat patterns.

---

## 🎨 Design Theme: Midnight Obsidian & Intense Yellow
RosterLock features an authentic streetwear gaming aesthetic, featuring sharp solid borders, flat grid systems, custom visualizers, and heavy uppercase tactical branding.

---

## 🚀 Key Features

### 1. 🛡️ Sentinel Anomaly Checker (Anti-Cheat Engine)
Sentinel monitors mouse coordinate logs and click triggers to maintain tournament integrity:
*   **Trigger-Bot Audit**: Identifies reaction times below the human limit ($\Delta t \le 80\text{ ms}$).
*   **Recoil Script Audit**: Monitors spray offset coordinate standard deviation to flag zero-recoil scripts ($\sigma^2 < 0.05$).
*   **Aim-Lock Scan**: Flags abrupt, deceleration-free angle snaps.

### 2. ⚡ Match Center
*   **Live Spectate View**: Real-time round progression feed, spectator commentary, and kill logs.
*   **Bracket Fast-Simulator**: Allows hosts to auto-simulate tournament matchups and automatically push winners to the next rounds.

### 3. 💰 Prize Hub & Claims
*   **Automated Prize Splits**: Divides prize pools (70% for 1st, 30% for 2nd) upon tournament completion.
*   **Regional Tax Deductor**: Automatically applies regional esports tax adjustments (10% default).
*   **Instant Claims**: Secure dashboard for teams to link payment methods (UPI, PayPal, Crypto) and claim wins.

### 4. 📊 Player Performance Analytics
*   **MMR Rating Engine**: Volatility-based matchmaking calculations.
*   **Radar Metrics**: Visualizes headshot accuracy (Precision), exit-duel timings (Positioning), and utility (Teamwork).
*   **Playstyle Labeler**: Automatically classifies player behaviors (e.g., *Entry Slayer*, *Anchor*, *Lurker*).

---

## 🛠️ Tech Stack
*   **Frontend**: React (Vite), JavaScript, custom HSL Vanilla CSS variables, Rajdhani Display & Inter typography.
*   **Backend**: FastAPI, MongoDB (JSON document database), Python Uvicorn.
*   **Anti-Cheat Simulation**: Frame-level coordinate log analyzers.

---

## ⚙️ Running Locally

### 1. Start the Backend API
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
