import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import random
import os

from database import db
from websocket_manager import manager
from bracket_generator import generate_single_elimination, generate_double_elimination, generate_round_robin
from ai_service import ai_service

app = FastAPI(title="RosterLock Tournament Platform API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class UserCreate(BaseModel):
    username: str
    password: str
    game: str
    role: str = "player"

class UserLogin(BaseModel):
    username: str
    password: str

class TeamCreate(BaseModel):
    name: str
    password: str
    captain_id: str
    logo: str = "🛡️"

class TeamLogin(BaseModel):
    name: str
    password: str

class TournamentCreate(BaseModel):
    name: str
    game: str
    type: str
    format: str = "single_elimination"  # single_elimination, double_elimination, round_robin
    rules: str
    entry_fee: float = 0.0
    prize_pool: float = 1000.0
    max_teams: int = 8

class ScoreUpdate(BaseModel):
    score1: int
    score2: int

class CoachingQuery(BaseModel):
    player_id: str
    query: str

class MatchTelemetry(BaseModel):
    match_id: str
    logs: List[Dict[str, Any]]

class GameIdQuery(BaseModel):
    game: str
    game_id: str

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Gaming Tournament Platform API"}

# USERS
@app.get("/api/users")
def get_users():
    return db.find("users")

@app.post("/api/users")
def create_user(user: UserCreate):
    existing = db.find_one("users", {"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="This Gamer ID is already registered.")
        
    # Perform game telemetry lookup to scrape stats
    stats = ai_service.generate_game_id_stats(user.game, user.username)
    
    # Map rank to MMR scale
    rank = stats["rank"]
    if any(k in rank for k in ["Radiant", "Challenger", "Conqueror", "God"]):
        mmr = random.randint(2400, 2800)
    elif any(k in rank for k in ["Immortal", "Master", "Ace", "Legend"]):
        mmr = random.randint(2000, 2399)
    elif any(k in rank for k in ["Diamond", "Crown", "Heroic"]):
        mmr = random.randint(1700, 1999)
    elif any(k in rank for k in ["Platinum", "Emerald"]):
        mmr = random.randint(1400, 1699)
    else:
        mmr = random.randint(1000, 1399)
        
    # Translate stats to initial badges
    achievements = ["badge_first_win"]
    if stats["win_rate"] > 0.55:
        achievements.append("badge_sportsman")
    if stats["accuracy"] > 40 or (user.game in ["League of Legends", "Dota 2", "Tekken 8", "Street Fighter 6"] and stats["accuracy"] > 80):
        achievements.append("badge_sharpshooter")
    if mmr > 2100:
        achievements.append("badge_mvp")
        
    new_user = {
        "username": user.username,
        "password": user.password,
        "game": user.game,
        "role": user.role,
        "skills": {
            "MMR": mmr,
            "win_rate": stats["win_rate"],
            "precision": stats["accuracy"],
            "positioning": random.randint(70, 95),
            "teamwork": random.randint(70, 95),
            "sportsmanship": random.randint(75, 98),
            "cheat_risk": random.randint(0, 10)
        },
        "achievements": achievements,
        "team_id": None
    }
    return db.insert_one("users", new_user)

@app.post("/api/users/login")
def login_user(creds: UserLogin):
    user = db.find_one("users", {"username": creds.username})
    if not user or user.get("password") != creds.password:
        raise HTTPException(status_code=401, detail="Invalid Gamer ID or password.")
    return user

# TEAMS
@app.get("/api/teams")
def get_teams():
    teams = db.find("teams")
    # Hydrate with members details
    for team in teams:
        members_data = []
        for m_id in team.get("members", []):
            user = db.find_one("users", {"id": m_id})
            if user:
                members_data.append(user)
        team["members_data"] = members_data
    return teams

@app.post("/api/teams")
def create_team(team: TeamCreate):
    captain = db.find_one("users", {"id": team.captain_id})
    if not captain:
        raise HTTPException(status_code=404, detail="Captain user not found")
        
    new_team = {
        "name": team.name,
        "password": team.password,
        "captain_id": team.captain_id,
        "members": [team.captain_id],
        "logo": team.logo,
        "stats": {"wins": 0, "losses": 0}
    }
    inserted = db.insert_one("teams", new_team)
    # Update captain's team
    db.update_one("users", {"id": team.captain_id}, {"team_id": inserted["id"]})
    return inserted

@app.post("/api/teams/login")
def login_team(creds: TeamLogin):
    team = db.find_one("teams", {"name": creds.name})
    if not team or team.get("password") != creds.password:
        raise HTTPException(status_code=401, detail="Invalid Team Name or password.")
        
    # Hydrate members details for easy UI sync
    members_data = []
    for m_id in team.get("members", []):
        user = db.find_one("users", {"id": m_id})
        if user:
            members_data.append(user)
    team["members_data"] = members_data
    return team

@app.post("/api/teams/{team_id}/join")
def join_team(team_id: str, payload: Dict[str, str]):
    player_id = payload.get("player_id")
    if not player_id:
        raise HTTPException(status_code=400, detail="player_id is required")
        
    team = db.find_one("teams", {"id": team_id})
    player = db.find_one("users", {"id": player_id})
    if not team or not player:
        raise HTTPException(status_code=404, detail="Team or player not found")
        
    if player_id not in team["members"]:
        team["members"].append(player_id)
        db.update_one("teams", {"id": team_id}, {"members": team["members"]})
        db.update_one("users", {"id": player_id}, {"team_id": team_id})
        
    return {"message": "Successfully joined team", "team": team}

# TOURNAMENTS
@app.get("/api/tournaments")
def get_tournaments():
    return db.find("tournaments")

@app.get("/api/tournaments/{tourney_id}")
def get_tournament_details(tourney_id: str):
    tourney = db.find_one("tournaments", {"id": tourney_id})
    if not tourney:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Hydrate matches
    matches = db.find("matches", {"tournament_id": tourney_id})
    tourney["matches"] = matches
    return tourney

@app.post("/api/tournaments")
def create_tournament(tourney: TournamentCreate):
    new_tourney = {
        "name": tourney.name,
        "game": tourney.game,
        "type": tourney.type,
        "format": tourney.format,
        "rules": tourney.rules,
        "entry_fee": tourney.entry_fee,
        "prize_pool": tourney.prize_pool,
        "max_teams": tourney.max_teams,
        "status": "registration",
        "teams": []  # List of team dicts
    }
    return db.insert_one("tournaments", new_tourney)

@app.post("/api/tournaments/{tourney_id}/register")
def register_tournament_team(tourney_id: str, payload: Dict[str, str]):
    team_id = payload.get("team_id")
    if not team_id:
        raise HTTPException(status_code=400, detail="team_id is required")
        
    tourney = db.find_one("tournaments", {"id": tourney_id})
    if not tourney:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    if tourney["status"] != "registration":
        raise HTTPException(status_code=400, detail="Tournament is not open for registration")
        
    if len(tourney["teams"]) >= tourney["max_teams"]:
        raise HTTPException(status_code=400, detail="Tournament is full")
        
    # Check if team is already registered
    if any(t["id"] == team_id for t in tourney["teams"]):
        raise HTTPException(status_code=400, detail="Team already registered")
        
    team = db.find_one("teams", {"id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    tourney["teams"].append({
        "id": team["id"],
        "name": team["name"],
        "logo": team.get("logo", "🛡️")
    })
    
    db.update_one("tournaments", {"id": tourney_id}, {"teams": tourney["teams"]})
    return {"message": "Team registered successfully", "tournament": tourney}

@app.post("/api/tournaments/{tourney_id}/start")
def start_tournament(tourney_id: str):
    tourney = db.find_one("tournaments", {"id": tourney_id})
    if not tourney:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    if len(tourney["teams"]) < 2:
        raise HTTPException(status_code=400, detail="At least 2 teams are required to start")
        
    # Generate Brackets
    teams = tourney["teams"]
    format_type = tourney["format"]
    
    if format_type == "single_elimination":
        matches = generate_single_elimination(tourney_id, teams)
    elif format_type == "double_elimination":
        matches = generate_double_elimination(tourney_id, teams)
    else:  # round_robin
        matches = generate_round_robin(tourney_id, teams)
        
    # Write matches
    for match in matches:
        db.insert_one("matches", match)
        
    # Update tournament status
    db.update_one("tournaments", {"id": tourney_id}, {"status": "ongoing"})
    
    return {"message": "Tournament started and brackets generated", "matches": matches}

@app.post("/api/tournaments/{tourney_id}/simulate-bracket")
async def simulate_entire_bracket(tourney_id: str):
    tourney = db.find_one("tournaments", {"id": tourney_id})
    if not tourney:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    if tourney["status"] != "ongoing":
        raise HTTPException(status_code=400, detail="Tournament is not in ongoing state")
        
    # We will repeatedly resolve unplayed matches that have both teams populated
    max_iterations = 30 # prevention of infinite loops
    for _ in range(max_iterations):
        matches = db.find("matches", {"tournament_id": tourney_id})
        uncompleted = [m for m in matches if m["status"] != "completed"]
        if not uncompleted:
            break
            
        simulated_any = False
        for m in uncompleted:
            if m.get("team1") and m.get("team2"):
                score1 = random.choice([3, 3, 3, 0, 1, 2])
                if score1 == 3:
                    score2 = random.choice([0, 1, 2])
                else:
                    score2 = 3
                    score1 = random.choice([0, 1, 2])
                    
                winner_id = m["team1"]["id"] if score1 > score2 else m["team2"]["id"]
                winner_name = m["team1"]["name"] if score1 > score2 else m["team2"]["name"]
                
                db.update_one("matches", {"id": m["id"]}, {
                    "status": "completed",
                    "score1": score1,
                    "score2": score2,
                    "winner_id": winner_id
                })
                
                # Advance using our async advancement handler
                await resolve_bracket_advancement(m, winner_id, winner_name)
                simulated_any = True
                
        if not simulated_any:
            break
            
    return {"message": "Tournament bracket simulated to completion. Prizes distributed."}

# MATCHES & SIMULATOR
@app.get("/api/matches/{match_id}")
def get_match(match_id: str):
    match = db.find_one("matches", {"id": match_id})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    # Inject AI matchmaking/prediction info
    if match["team1"] and match["team2"]:
        team1_details = db.find_one("teams", {"id": match["team1"]["id"]})
        team2_details = db.find_one("teams", {"id": match["team2"]["id"]})
        
        # Hydrate members for AI stats calculation
        if team1_details and team2_details:
            team1_details["members_data"] = [db.find_one("users", {"id": m}) for m in team1_details.get("members", [])]
            team2_details["members_data"] = [db.find_one("users", {"id": m}) for m in team2_details.get("members", [])]
            
            ai_data = ai_service.predict_match_outcome(team1_details, team2_details)
            match["prediction"] = ai_data
    return match

# Real-time Match Simulator logic
async def simulate_match_task(match_id: str):
    """Asynchronous background task to simulate a live match."""
    match = db.find_one("matches", {"id": match_id})
    if not match or match["status"] != "live":
        return
        
    print(f"Starting simulation for match: {match_id}")
    t1_name = match["team1"]["name"]
    t2_name = match["team2"]["name"]
    
    score1 = 0
    score2 = 0
    max_score = 3 # Best of 5 standard simulator
    
    events = [
        "cleared the site with a stunning double kill!",
        "secured a stealthy knife takedown!",
        "landed a frame-perfect headshot from long range!",
        "clutched a 1v2 scenario under pressure!",
        "outpositioned the opponent with map-wide teleport!",
        "missed a critical reload, giving away position!",
        "threw a perfect flashbang, blinding the enemy team!"
    ]
    
    players1 = db.find("users", {"team_id": match["team1"]["id"]})
    players2 = db.find("users", {"team_id": match["team2"]["id"]})
    all_players = players1 + players2
    
    # Broadcast start event
    await manager.broadcast_to_room(f"match_{match_id}", {
        "type": "event",
        "message": f"Match started: {t1_name} vs {t2_name}!",
        "scores": {"team1": 0, "team2": 0}
    })
    
    while score1 < max_score and score2 < max_score:
        await asyncio.sleep(4) # simulate event every 4 seconds
        
        # Determine who gets the point
        scoring_team = random.choice([1, 2])
        if scoring_team == 1:
            score1 += 1
            scorer = random.choice(players1) if players1 else {"username": "Player1"}
            action = random.choice(events)
            msg = f"[{t1_name}] **{scorer['username']}** {action}"
        else:
            score2 += 1
            scorer = random.choice(players2) if players2 else {"username": "Player2"}
            action = random.choice(events)
            msg = f"[{t2_name}] **{scorer['username']}** {action}"
            
        # AI Commentary generator
        commentary = f"Splendid play! The tension is mounting. {t1_name if scoring_team == 1 else t2_name} takes the lead in this execution."
        if score1 == score2:
            commentary = "It's neck and neck! Complete stalemate in this round."
        elif abs(score1 - score2) >= 2:
            commentary = f"Dominant performance! {t1_name if score1 > score2 else t2_name} is running away with the match."
            
        # Update match in DB
        db.update_one("matches", {"id": match_id}, {"score1": score1, "score2": score2})
        
        # Broadcast match tick
        await manager.broadcast_to_room(f"match_{match_id}", {
            "type": "tick",
            "scores": {"team1": score1, "team2": score2},
            "message": msg,
            "commentary": commentary
        })

    # Match over!
    winner_id = match["team1"]["id"] if score1 > score2 else match["team2"]["id"]
    winner_name = t1_name if score1 > score2 else t2_name
    
    db.update_one("matches", {"id": match_id}, {
        "status": "completed",
        "score1": score1,
        "score2": score2,
        "winner_id": winner_id
    })
    
    await manager.broadcast_to_room(f"match_{match_id}", {
        "type": "finished",
        "winner": winner_name,
        "scores": {"team1": score1, "team2": score2},
        "message": f"Match Finished! {winner_name} wins {score1} - {score2}."
    })
    
    # Resolve next bracket nodes
    await resolve_bracket_advancement(match, winner_id, winner_name)

async def resolve_bracket_advancement(match: Dict[str, Any], winner_id: str, winner_name: str):
    """Advances winning teams to their next round slots."""
    next_match_id = match.get("next_match_id")
    if not next_match_id:
        # Grand finals or tournament end
        # Update tournament to completed if all matches done
        tourney_id = match["tournament_id"]
        tourney = db.find_one("tournaments", {"id": tourney_id})
        
        all_matches = db.find("matches", {"tournament_id": tourney_id})
        unfinished = [m for m in all_matches if m["status"] != "completed" and m["id"] != match["id"]]
        
        if not unfinished:
            # Mark tournament completed
            db.update_one("tournaments", {"id": tourney_id}, {"status": "completed"})
            
            # Auto prize distribution
            prize_pool = tourney.get("prize_pool", 1000.0)
            p1_share = round(prize_pool * 0.7, 2)
            p2_share = round(prize_pool * 0.3, 2)
            
            # Find runner up
            runner_up_id = match["team1"]["id"] if winner_id == match["team2"]["id"] else match["team2"]["id"]
            runner_up = db.find_one("teams", {"id": runner_up_id})
            runner_name = runner_up["name"] if runner_up else "Unknown Runner Up"
            
            # Insert prize documents
            db.insert_one("prizes", {
                "tournament_id": tourney_id,
                "team_id": winner_id,
                "team_name": winner_name,
                "amount": p1_share,
                "place": 1,
                "status": "unclaimed"
            })
            if runner_up_id:
                db.insert_one("prizes", {
                    "tournament_id": tourney_id,
                    "team_id": runner_up_id,
                    "team_name": runner_name,
                    "amount": p2_share,
                    "place": 2,
                    "status": "unclaimed"
                })
                
            # Award recommendations
            players = db.find("users")
            awards = ai_service.generate_award_recommendations(all_matches, players)
            
            # Update user badges
            for award in awards:
                recipient_name = award["recipient"]
                user = db.find_one("users", {"username": recipient_name})
                if user:
                    badge = "badge_mvp" if "MVP" in award["award"] else "badge_sportsman"
                    if badge not in user.get("achievements", []):
                        user["achievements"].append(badge)
                        db.update_one("users", {"id": user["id"]}, {"achievements": user["achievements"]})
            
            # Broadcast tournament completion
            await manager.broadcast_to_room(f"tournament_{tourney_id}", {
                "type": "tournament_completed",
                "winner": winner_name,
                "awards": awards
            })
        return

    # Update next match slot
    next_match = db.find_one("matches", {"id": next_match_id})
    if not next_match:
        return
        
    slot = match.get("next_match_slot", 1)
    team_data = {"id": winner_id, "name": winner_name}
    
    if slot == 1:
        next_match["team1"] = team_data
    else:
        next_match["team2"] = team_data
        
    # Check if next match now has a BYE situation resolved
    db.update_one("matches", {"id": next_match_id}, {
        "team1": next_match["team1"],
        "team2": next_match["team2"]
    })
    
    # Broadcast update to the tournament page
    await manager.broadcast_to_room(f"tournament_{match['tournament_id']}", {
        "type": "bracket_updated",
        "match_id": next_match_id,
        "team_slot": slot,
        "team_data": team_data
    })

@app.post("/api/matches/{match_id}/start-sim")
def start_match_simulation(match_id: str, background_tasks: BackgroundTasks):
    match = db.find_one("matches", {"id": match_id})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if not match["team1"] or not match["team2"]:
        raise HTTPException(status_code=400, detail="Cannot start match. Both teams must be populated.")
        
    db.update_one("matches", {"id": match_id}, {"status": "live"})
    
    # Launch in background
    def run_sim():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(simulate_match_task(match_id))
        
    background_tasks.add_task(run_sim)
    return {"message": "Simulation started successfully"}

# AI SERVICES
@app.post("/api/analytics/coaching")
def ask_ai_coach(query: CoachingQuery):
    player = db.find_one("users", {"id": query.player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    advice_res = ai_service.generate_coaching_advice(player, query.query)
    return advice_res

@app.post("/api/game-id/lookup")
def lookup_game_id(query: GameIdQuery):
    return ai_service.generate_game_id_stats(query.game, query.game_id)

@app.post("/api/analytics/cheat-check")
def trigger_cheat_check(payload: Dict[str, Any]):
    player_id = payload.get("player_id")
    if not player_id:
        raise HTTPException(status_code=400, detail="player_id is required")
        
    player = db.find_one("users", {"id": player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    # Generate some fake logs or retrieve them
    # If the client sent logs, use them, otherwise create dummy logs
    logs = payload.get("logs")
    if not logs:
        logs = []
        for _ in range(5):
            # Check if this player is marked as suspicious
            # (ApexPredator = 5% risk, ShadowSniper = 15% risk, and high chance if requested cheat trigger)
            is_cheater = payload.get("simulate_cheating", False)
            precision = random.randint(96, 99) if is_cheater else random.randint(70, 92)
            rt = random.randint(30, 80) if is_cheater else random.randint(120, 240)
            shots = 100
            headshots = random.randint(85, 98) if is_cheater else random.randint(15, 35)
            logs.append({
                "match": f"match_{random.randint(100,999)}",
                "precision": precision,
                "reaction_time_ms": rt,
                "shots": shots,
                "headshots": headshots
            })
            
    cheat_report = ai_service.analyze_cheat_patterns(player["username"], logs)
    
    # Store cheat analysis
    db.insert_one("analytics", {
        "player_id": player_id,
        "player_name": player["username"],
        "timestamp": "2026-07-02T10:23:00",
        "cheat_report": cheat_report,
        "logs_analyzed": logs
    })
    
    # Update player skill card
    skills = player.get("skills", {})
    skills["cheat_risk"] = cheat_report["risk_score"]
    db.update_one("users", {"id": player_id}, {"skills": skills})
    
    return cheat_report

@app.get("/api/analytics/cheat-reports/{player_id}")
def get_cheat_reports(player_id: str):
    return db.find("analytics", {"player_id": player_id})

# PRIZES
@app.get("/api/prizes")
def get_prizes():
    return db.find("prizes")

@app.post("/api/prizes/{prize_id}/claim")
def claim_prize(prize_id: str, payload: Dict[str, str]):
    region = payload.get("region", "US") # US, EU, IN, etc.
    prize = db.find_one("prizes", {"id": prize_id})
    if not prize:
        raise HTTPException(status_code=404, detail="Prize record not found")
        
    if prize["status"] == "claimed":
        raise HTTPException(status_code=400, detail="Prize already claimed")
        
    # Calculate tax based on region
    amount = prize["amount"]
    tax_rate = 0.30 if region == "US" else 0.20 if region == "EU" else 0.15 if region == "IN" else 0.10
    tax_amount = round(amount * tax_rate, 2)
    final_amount = round(amount - tax_amount, 2)
    
    db.update_one("prizes", {"id": prize_id}, {
        "status": "claimed",
        "region_claimed": region,
        "tax_paid": tax_amount,
        "final_payout": final_amount,
        "claimant_wallet": payload.get("wallet_address", "MOCK_STRIPE_PAYMENT_PAYOUT")
    })
    
    return {
        "message": "Prize claimed successfully!",
        "receipt": {
            "prize_id": prize_id,
            "original_amount": amount,
            "tax_rate_percent": tax_rate * 100,
            "tax_deducted": tax_amount,
            "payout": final_amount,
            "status": "paid"
        }
    }

# SYSTEM DASHBOARD
@app.get("/api/dashboard")
def get_dashboard_summary():
    users = db.find("users")
    teams = db.find("teams")
    tournaments = db.find("tournaments")
    matches = db.find("matches")
    prizes = db.find("prizes")
    
    total_pool = sum(t.get("prize_pool", 0) for t in tournaments)
    return {
        "counts": {
            "users": len(users),
            "teams": len(teams),
            "tournaments": len(tournaments),
            "matches": len(matches),
            "prizes": len(prizes),
            "total_prize_pool": total_pool
        },
        "live_matches": [m for m in matches if m["status"] == "live"]
    }

# WEBSOCKET ROUTER
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket message (like live chat message)
            try:
                msg_json = json.loads(data)
                if msg_json.get("type") == "chat":
                    # Broadcast chat message to the room
                    await manager.broadcast_to_room(room_id, {
                        "type": "chat",
                        "sender": msg_json.get("sender", "Guest"),
                        "message": msg_json.get("message", ""),
                        "timestamp": "2026-07-02T10:23:00"
                    })
            except Exception as parse_err:
                print(f"Failed to parse incoming WebSocket message: {parse_err}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        # Broadcast user leaving notification if it's a chat room
        print(f"Client disconnected from room {room_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
