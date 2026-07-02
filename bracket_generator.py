import uuid
from typing import List, Dict, Any

def generate_single_elimination(tournament_id: str, teams: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generates a single elimination bracket for a list of teams.
    Pads with 'BYE' if team count is not a power of 2.
    """
    n = len(teams)
    if n == 0:
        return []
    
    # 1. Determine size of first round (power of 2)
    pow2 = 1
    while pow2 < n:
        pow2 *= 2
        
    # Pad teams with None (BYEs)
    padded_teams = list(teams)
    while len(padded_teams) < pow2:
        padded_teams.append(None)
        
    num_teams = len(padded_teams)
    rounds_count = 0
    temp = num_teams
    while temp > 1:
        temp //= 2
        rounds_count += 1
        
    matches = []
    
    # We will build matches round-by-round from final round backwards
    # so we can easily set the next_match_id pointers.
    
    # Structure to keep track of matches in the next round we generated,
    # so the current round can point to them.
    next_round_matches = []
    
    for r in range(rounds_count - 1, -1, -1):
        round_matches_count = 2 ** (rounds_count - 1 - r)
        current_round_matches = []
        
        # Round names
        if r == rounds_count - 1:
            round_name = "Finals"
        elif r == rounds_count - 2:
            round_name = "Semifinals"
        elif r == rounds_count - 3:
            round_name = "Quarterfinals"
        else:
            round_name = f"Round {r + 1}"
            
        for m_idx in range(round_matches_count):
            match_id = str(uuid.uuid4())
            
            # Determine next match linkages
            next_match_id = None
            next_match_slot = 1
            if r < rounds_count - 1:
                # Parent match is in next_round_matches
                parent_idx = m_idx // 2
                parent_match = next_round_matches[parent_idx]
                next_match_id = parent_match["id"]
                next_match_slot = 1 if (m_idx % 2 == 0) else 2
                
            # If it's the first round, populate with initial teams
            team1 = None
            team2 = None
            status = "scheduled"
            winner_id = None
            score1 = 0
            score2 = 0
            
            if r == 0:
                t1_data = padded_teams[m_idx * 2]
                t2_data = padded_teams[m_idx * 2 + 1]
                
                team1 = {"id": t1_data["id"], "name": t1_data["name"]} if t1_data else None
                team2 = {"id": t2_data["id"], "name": t2_data["name"]} if t2_data else None
                
                # Check for BYEs
                if team1 is None and team2 is None:
                    status = "completed"
                elif team1 is not None and team2 is None:
                    status = "completed"
                    winner_id = team1["id"]
                    score1 = 1
                elif team1 is None and team2 is not None:
                    status = "completed"
                    winner_id = team2["id"]
                    score2 = 1
            
            match_node = {
                "id": match_id,
                "tournament_id": tournament_id,
                "team1": team1,
                "team2": team2,
                "score1": score1,
                "score2": score2,
                "status": status,
                "winner_id": winner_id,
                "round": r,
                "round_name": round_name,
                "match_index": m_idx,
                "next_match_id": next_match_id,
                "next_match_slot": next_match_slot,
                "bracket_type": "winners"
            }
            current_round_matches.append(match_node)
            matches.append(match_node)
            
        next_round_matches = current_round_matches
        
    return matches

def generate_round_robin(tournament_id: str, teams: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generates a round-robin schedule using the circle method.
    """
    n = len(teams)
    if n == 0:
        return []
        
    temp_teams = list(teams)
    if n % 2 != 0:
        temp_teams.append(None)  # Add BYE
        
    num_teams = len(temp_teams)
    rounds = num_teams - 1
    matches = []
    
    for r in range(rounds):
        round_name = f"Round {r + 1}"
        for i in range(num_teams // 2):
            t1 = temp_teams[i]
            t2 = temp_teams[num_teams - 1 - i]
            
            # Skip matches with BYE
            if t1 is None or t2 is None:
                continue
                
            match_id = str(uuid.uuid4())
            matches.append({
                "id": match_id,
                "tournament_id": tournament_id,
                "team1": {"id": t1["id"], "name": t1["name"]},
                "team2": {"id": t2["id"], "name": t2["name"]},
                "score1": 0,
                "score2": 0,
                "status": "scheduled",
                "winner_id": None,
                "round": r,
                "round_name": round_name,
                "match_index": i,
                "next_match_id": None,
                "next_match_slot": None,
                "bracket_type": "round_robin"
            })
            
        # Rotate teams (keep first team fixed, rotate others)
        temp_teams = [temp_teams[0]] + [temp_teams[-1]] + temp_teams[1:-1]
        
    return matches

def generate_double_elimination(tournament_id: str, teams: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generates a simplified Double Elimination bracket.
    Consists of:
    - Winners Bracket (Single elimination structure)
    - Losers Bracket (Linked to winners bracket losses)
    - Grand Finals (Winners champion vs Losers champion)
    """
    # For a clean and working layout, we generate the main Winners Bracket,
    # and set up placeholders for the Losers Bracket matches.
    # To keep it implementation-friendly, we create the Winners Bracket and
    # a shadow Losers Bracket of equivalent depth.
    winners_matches = generate_single_elimination(tournament_id, teams)
    
    # We will tag the winners matches as bracket_type = "winners" (already done)
    # And generate matching losers matches for each round except the final.
    # For simplicity of visualization, double elimination can be modeled as
    # two separate brackets: winners & losers.
    losers_matches = []
    
    # Filter winners matches by round to know how many losers matches we need
    # If Winners has Rounds 0 (Semifinals), 1 (Finals)
    # Winners Semifinals losers go to Losers Round 0
    # Winner of Losers Round 0 plays loser of Winners Finals in Losers Round 1
    # Winner of Losers Round 1 plays winner of Winners Finals in Grand Finals.
    
    rounds_in_winners = max(m["round"] for m in winners_matches) if winners_matches else 0
    
    # Let's generate Losers matches corresponding to rounds
    for r in range(rounds_in_winners):
        round_name = f"Losers Round {r + 1}"
        # Number of matches is half of winners round matches (winners losers)
        winners_in_round = [m for m in winners_matches if m["round"] == r]
        num_losers_matches = len(winners_in_round) // 2 if len(winners_in_round) > 1 else 1
        
        for m_idx in range(num_losers_matches):
            match_id = str(uuid.uuid4())
            losers_matches.append({
                "id": match_id,
                "tournament_id": tournament_id,
                "team1": None, # Filled by loser of Winners match
                "team2": None, # Filled by loser of another Winners match or winner of previous Losers match
                "score1": 0,
                "score2": 0,
                "status": "scheduled",
                "winner_id": None,
                "round": r,
                "round_name": round_name,
                "match_index": m_idx,
                "next_match_id": None, # Points to next losers match or grand finals
                "next_match_slot": 1,
                "bracket_type": "losers"
            })
            
    # Setup Grand Finals
    grand_final_id = str(uuid.uuid4())
    grand_final = {
        "id": grand_final_id,
        "tournament_id": tournament_id,
        "team1": None, # Winner of Winners Bracket
        "team2": None, # Winner of Losers Bracket
        "score1": 0,
        "score2": 0,
        "status": "scheduled",
        "winner_id": None,
        "round": rounds_in_winners + 1,
        "round_name": "Grand Finals",
        "match_index": 0,
        "next_match_id": None,
        "next_match_slot": None,
        "bracket_type": "grand_final"
    }
    
    return winners_matches + losers_matches + [grand_final]
