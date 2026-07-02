import React, { useState } from 'react';

export default function Tournaments({ tournaments, createTournament, registerTeam, startTournament, teams, navigateTo, activePlayer, refreshData }) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTourneyId, setSelectedTourneyId] = useState(null);
  const selectedTourney = tournaments.find(t => t.id === selectedTourneyId);
  
  // Form fields
  const [name, setName] = useState('');
  const [game, setGame] = useState('Valorant');
  const [type, setType] = useState('FPS');
  const [format, setFormat] = useState('single_elimination');
  const [rules, setRules] = useState('Best of 5. Map pool: Ascent, Bind, Split, Breeze. Standard competitive rules.');
  const [entryFee, setEntryFee] = useState(0);
  const [prizePool, setPrizePool] = useState(1000);
  const [maxTeams, setMaxTeams] = useState(4);
  
  const [regTeamId, setRegTeamId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    createTournament({ name, game, type, format, rules, entry_fee: Number(entryFee), prize_pool: Number(prizePool), max_teams: Number(maxTeams) });
    setShowCreate(false);
    // Reset fields
    setName('');
  };

  const handleRegister = (tId) => {
    if (!regTeamId) return;
    registerTeam(tId, regTeamId);
    setRegTeamId('');
  };

  const simulateBracket = (tId) => {
    fetch(`http://127.0.0.1:8000/api/tournaments/${tId}/simulate-bracket`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(() => {
        if (refreshData) refreshData();
      })
      .catch(err => console.error("Error simulating bracket matches:", err));
  };

  const getFormatLabel = (fmt) => {
    switch (fmt) {
      case 'single_elimination': return 'Single Elimination';
      case 'double_elimination': return 'Double Elimination';
      case 'round_robin': return 'Round Robin';
      default: return fmt;
    }
  };

  // Helper to structure matches into rounds for Single Elimination visualizer
  const renderSingleEliminationBracket = (matches) => {
    if (!matches || matches.length === 0) return null;
    
    // Group matches by round index
    const roundGroups = {};
    matches.forEach(m => {
      if (!roundGroups[m.round]) {
        roundGroups[m.round] = [];
      }
      roundGroups[m.round].push(m);
    });

    const rounds = Object.keys(roundGroups).sort((a, b) => Number(a) - Number(b));

    return (
      <div className="bracket-container">
        {rounds.map(roundIdx => {
          const roundMatches = roundGroups[roundIdx].sort((a, b) => a.match_index - b.match_index);
          const roundName = roundMatches[0]?.round_name || `Round ${Number(roundIdx) + 1}`;
          
          return (
            <div className="bracket-round" key={roundIdx}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.8rem',
                color: 'var(--color-secondary)',
                letterSpacing: '1px',
                textAlign: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '8px',
                textTransform: 'uppercase'
              }}>
                {roundName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', justifyContent: 'center', height: '100%' }}>
                {roundMatches.map(match => {
                  const isClickable = match.team1 && match.team2 && match.status !== 'completed';
                  
                  return (
                    <div 
                      key={match.id} 
                      className={`bracket-match ${isClickable ? 'active' : ''}`}
                      onClick={() => isClickable && navigateTo('matches', match.id)}
                      style={{
                        cursor: isClickable ? 'pointer' : 'default',
                        minWidth: '220px',
                        position: 'relative'
                      }}
                    >
                      {/* Match Status Ribbon */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                        <span>Match {match.id.substring(0,4).toUpperCase()}</span>
                        {match.status === 'live' && (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>LIVE</span>
                        )}
                        {match.status === 'completed' && (
                          <span style={{ color: 'var(--color-success)' }}>DONE</span>
                        )}
                      </div>

                      {/* Team 1 */}
                      <div className={`bracket-team ${match.winner_id === match.team1?.id && match.status === 'completed' ? 'winner' : ''} ${match.winner_id && match.winner_id !== match.team1?.id && match.status === 'completed' ? 'loser' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🛡️</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                            {match.team1 ? match.team1.name : <em style={{ color: '#555' }}>TBD</em>}
                          </span>
                        </div>
                        <span className="bracket-score">{match.team1 ? match.score1 : '-'}</span>
                      </div>

                      {/* Team 2 */}
                      <div className={`bracket-team ${match.winner_id === match.team2?.id && match.status === 'completed' ? 'winner' : ''} ${match.winner_id && match.winner_id !== match.team2?.id && match.status === 'completed' ? 'loser' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🛡️</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                            {match.team2 ? match.team2.name : <em style={{ color: '#555' }}>TBD</em>}
                          </span>
                        </div>
                        <span className="bracket-score">{match.team2 ? match.score2 : '-'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Double Elimination: shows Winners and Losers separately
  const renderDoubleEliminationBracket = (matches) => {
    if (!matches) return null;
    const winners = matches.filter(m => m.bracket_type === 'winners');
    const losers = matches.filter(m => m.bracket_type === 'losers');
    const grand = matches.filter(m => m.bracket_type === 'grand_final');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div>
          <h4 style={{ color: 'var(--color-secondary)', textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: '10px' }}>Winners Bracket</h4>
          {renderSingleEliminationBracket(winners)}
        </div>
        
        {losers.length > 0 && (
          <div>
            <h4 style={{ color: '#ffb300', textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: '10px' }}>Losers Bracket</h4>
            {renderSingleEliminationBracket(losers)}
          </div>
        )}

        {grand.length > 0 && (
          <div className="glow-card" style={{ padding: '20px', maxWidth: '400px', alignSelf: 'center', border: '1px solid var(--color-primary)' }}>
            <h4 style={{ color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.9rem', margin: '0 0 10px 0', textAlign: 'center' }}>🏆 Grand Finals 🏆</h4>
            {grand.map(match => {
              const isClickable = match.team1 && match.team2 && match.status !== 'completed';
              return (
                <div 
                  key={match.id} 
                  className={`bracket-match ${isClickable ? 'active' : ''}`}
                  onClick={() => isClickable && navigateTo('matches', match.id)}
                  style={{ cursor: isClickable ? 'pointer' : 'default', padding: '15px' }}
                >
                  <div className={`bracket-team ${match.winner_id === match.team1?.id && match.status === 'completed' ? 'winner' : ''}`}>
                    <span>👑 {match.team1 ? match.team1.name : 'Winners Bracket Champ'}</span>
                    <span className="bracket-score">{match.team1 ? match.score1 : '-'}</span>
                  </div>
                  <div className={`bracket-team ${match.winner_id === match.team2?.id && match.status === 'completed' ? 'winner' : ''}`} style={{ marginTop: '8px' }}>
                    <span>🛡️ {match.team2 ? match.team2.name : 'Losers Bracket Champ'}</span>
                    <span className="bracket-score">{match.team2 ? match.score2 : '-'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render Round Robin standings and match list
  const renderRoundRobinBracket = (matches, tournamentTeams) => {
    if (!matches) return null;

    // Calculate Standings Table
    const standings = {};
    tournamentTeams.forEach(t => {
      standings[t.id] = { id: t.id, name: t.name, logo: t.logo, played: 0, wins: 0, losses: 0, points: 0 };
    });

    matches.forEach(m => {
      if (m.status === 'completed') {
        const id1 = m.team1.id;
        const id2 = m.team2.id;
        
        if (standings[id1]) standings[id1].played += 1;
        if (standings[id2]) standings[id2].played += 1;
        
        if (m.winner_id === id1) {
          if (standings[id1]) { standings[id1].wins += 1; standings[id1].points += 3; }
          if (standings[id2]) standings[id2].losses += 1;
        } else if (m.winner_id === id2) {
          if (standings[id2]) { standings[id2].wins += 1; standings[id2].points += 3; }
          if (standings[id1]) standings[id1].losses += 1;
        }
      }
    });

    const sortedStandings = Object.values(standings).sort((a, b) => b.points - a.points);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', flexWrap: 'wrap' }}>
        {/* Standings */}
        <div className="glow-card" style={{ padding: '20px' }}>
          <h4 style={{ color: 'var(--color-secondary)', margin: '0 0 15px 0', textTransform: 'uppercase' }}>Standings Table</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '10px 0' }}>Rank</th>
                <th>Team</th>
                <th>Played</th>
                <th>Wins</th>
                <th>Losses</th>
                <th style={{ color: 'var(--color-secondary)' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((row, idx) => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 0', fontWeight: 'bold' }}>#{idx + 1}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
                    <span>{row.logo}</span>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.played}</td>
                  <td style={{ color: 'var(--color-success)' }}>{row.wins}</td>
                  <td style={{ color: 'var(--color-danger)' }}>{row.losses}</td>
                  <td style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>{row.points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Schedule */}
        <div className="glow-card" style={{ padding: '20px' }}>
          <h4 style={{ color: 'var(--color-primary)', margin: '0 0 15px 0', textTransform: 'uppercase' }}>Match Schedule</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
            {matches.map(m => {
              const isClickable = m.team1 && m.team2 && m.status !== 'completed';
              return (
                <div 
                  key={m.id} 
                  className={`glow-card ${isClickable ? 'active' : ''}`}
                  onClick={() => isClickable && navigateTo('matches', m.id)}
                  style={{
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: isClickable ? 'pointer' : 'default',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{m.round_name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <strong style={{ color: m.winner_id === m.team1.id ? 'var(--color-success)' : '' }}>{m.team1.name}</strong>
                      <span style={{ color: 'var(--color-text-muted)' }}>vs</span>
                      <strong style={{ color: m.winner_id === m.team2.id ? 'var(--color-success)' : '' }}>{m.team2.name}</strong>
                    </div>
                  </div>
                  <div>
                    {m.status === 'completed' ? (
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}>
                        {m.score1} - {m.score2}
                      </span>
                    ) : m.status === 'live' ? (
                      <span className="live-badge">LIVE</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Scheduled</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Top Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }} className="neon-text-purple">Tournaments Manager</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Set custom rules, entry fees, generate automated single/double/round-robin brackets, and track live outcomes.
          </p>
        </div>
        <button className="glow-button" style={{ padding: '10px 20px' }} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Close Form' : 'Host Tournament'}
        </button>
      </div>

      {/* Creation Form */}
      {showCreate && (
        <form className="glow-card" onSubmit={handleSubmit} style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <h3 style={{ gridColumn: 'span 2', margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }} className="neon-text-cyan">
            Host New Gaming Tournament
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tournament Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Summer Esports Invitational"
              value={name} 
              onChange={e => setName(e.target.value)}
              style={{ padding: '10px', background: '#121420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Game Title</label>
            <select 
              value={game} 
              onChange={e => setGame(e.target.value)}
              style={{ padding: '10px', background: '#121420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
            >
              <option value="BGMI">BGMI (Battlegrounds Mobile India)</option>
              <option value="Free Fire">Garena Free Fire</option>
              <option value="Valorant">Valorant</option>
              <option value="League of Legends">League of Legends</option>
              <option value="Counter Strike 2">Counter Strike 2</option>
              <option value="Dota 2">Dota 2</option>
              <option value="Tekken 8">Tekken 8</option>
              <option value="Street Fighter 6">Street Fighter 6</option>
              <option value="Overwatch 2">Overwatch 2</option>
              <option value="Apex Legends">Apex Legends</option>
              <option value="Fortnite">Fortnite</option>
              <option value="Rocket League">Rocket League</option>
              <option value="FIFA 26">FIFA 26</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Game Category</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)}
              style={{ padding: '10px', background: '#121420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
            >
              <option value="FPS">FPS (First-Person Shooter)</option>
              <option value="MOBA">MOBA (Multiplayer Online Battle Arena)</option>
              <option value="Fighting">Fighting Game</option>
              <option value="Battle Royale">Battle Royale</option>
              <option value="Sports">Sports Game</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bracket Format</label>
            <select 
              value={format} 
              onChange={e => setFormat(e.target.value)}
              style={{ padding: '10px', background: '#121420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
            >
              <option value="single_elimination">Single Elimination</option>
              <option value="double_elimination">Double Elimination</option>
              <option value="round_robin">Round Robin</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Entry Fee ($)</label>
            <input 
              type="number" 
              min="0"
              value={entryFee} 
              onChange={e => setEntryFee(e.target.value)}
              style={{ padding: '10px', background: '#121420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Prize Pool ($)</label>
            <input 
              type="number" 
              min="10"
              value={prizePool} 
              onChange={e => setPrizePool(e.target.value)}
              style={{ padding: '10px', background: '#121420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Max Team Capacity</label>
            <select 
              value={maxTeams} 
              onChange={e => setMaxTeams(e.target.value)}
              style={{ padding: '10px', background: '#121420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
            >
              <option value={4}>4 Teams</option>
              <option value={8}>8 Teams</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rules & Logistics Description</label>
            <textarea 
              rows="3"
              value={rules} 
              onChange={e => setRules(e.target.value)}
              style={{ padding: '10px', background: '#121420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', resize: 'vertical' }}
            />
          </div>

          <button className="glow-button" type="submit" style={{ gridColumn: 'span 2', padding: '12px', marginTop: '10px' }}>
            Initialize Tournament
          </button>
        </form>
      )}

      {/* Main Layout: List on Left, Active Bracket / Details on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Tournament List Panel */}
        <div className="glow-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            Hosted Arenas ({tournaments.length})
          </h3>
          {tournaments.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
              No tournaments created yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tournaments.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTourneyId(t.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: selectedTourneyId === t.id ? 'rgba(143, 59, 250, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: selectedTourneyId === t.id ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>
                      {t.game.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: t.status === 'ongoing' ? 'rgba(0, 230, 118, 0.15)' : t.status === 'completed' ? 'rgba(255,255,255,0.1)' : 'rgba(255,179,0,0.15)',
                      color: t.status === 'ongoing' ? 'var(--color-success)' : t.status === 'completed' ? '#fff' : 'var(--color-warning)',
                      fontWeight: 'bold'
                    }}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                    <span>Prize: ${t.prize_pool}</span>
                    <span>Teams: {t.teams?.length}/{t.max_teams}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tournament Detail & Bracket Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {selectedTourney ? (
            <div className="glow-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedTourney.name}</h3>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    <span>Format: <strong>{getFormatLabel(selectedTourney.format)}</strong></span>
                    <span>•</span>
                    <span>Prize Pool: <strong style={{ color: 'var(--color-success)' }}>${selectedTourney.prize_pool}</strong></span>
                    <span>•</span>
                    <span>Entry Fee: <strong>{selectedTourney.entry_fee === 0 ? 'FREE' : `$${selectedTourney.entry_fee}`}</strong></span>
                  </div>
                </div>

                {selectedTourney.status === 'registration' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {selectedTourney.teams.length >= 2 && (
                      <button className="glow-button" style={{ padding: '10px 20px' }} onClick={() => startTournament(selectedTourney.id)}>
                        Start Bracket Matchups
                      </button>
                    )}
                  </div>
                )}
                {selectedTourney.status === 'ongoing' && activePlayer?.role !== 'player' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="glow-button" style={{ padding: '10px 20px' }} onClick={() => simulateBracket(selectedTourney.id)}>
                      ⚡ Fast-Simulate Bracket Matches
                    </button>
                  </div>
                )}
              </div>

              {/* Tournament Rules / Description Box */}
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)', fontSize: '0.85rem', margin: '20px 0' }}>
                <strong>Rules & Specs:</strong> {selectedTourney.rules}
              </div>

              {/* Registration Tab (If registration) */}
              {selectedTourney.status === 'registration' && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: activePlayer?.role === 'team' ? '1fr 1fr' : '1fr', 
                  gap: '30px', 
                  marginTop: '20px' 
                }}>
                  {/* Registered Teams */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--color-secondary)' }}>Registered Teams ({selectedTourney.teams?.length}/{selectedTourney.max_teams})</h4>
                    {selectedTourney.teams?.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No teams registered. Be the first to register!</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {selectedTourney.teams.map(team => (
                          <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#121212', border: '1px solid var(--color-border)', padding: '8px 12px', borderRadius: '2px' }}>
                            <span>{team.logo}</span>
                            <strong>{team.name}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Register Team Form (Only visible to Team accounts!) */}
                  {activePlayer?.role === 'team' && (
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--color-primary)' }}>Register Your Team</h4>
                      {selectedTourney.teams?.length >= selectedTourney.max_teams ? (
                        <div style={{ color: 'var(--color-warning)', fontSize: '0.85rem', border: '1px dashed var(--color-border)', padding: '10px', borderRadius: '2px' }}>
                          This bracket is completely full. Organizers will lock the roster and initiate matchups shortly.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '5px' }}>
                            You are authenticated as team <strong>{activePlayer.username}</strong>. Click below to register in this tournament.
                          </div>
                          <button 
                            className="glow-button" 
                            style={{ padding: '12px 24px', width: '100%' }} 
                            onClick={() => {
                              registerTeam(selectedTourney.id, activePlayer.id);
                            }}
                          >
                            Register {activePlayer.username} Instantly
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bracket Tree Visualizer Tab (If ongoing or completed) */}
              {(selectedTourney.status === 'ongoing' || selectedTourney.status === 'completed') && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-secondary)' }}>Live Tournament Tree</h4>
                    {selectedTourney.status === 'ongoing' && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        👉 <em>Click on a populated match to spectate and run simulation!</em>
                      </span>
                    )}
                  </div>

                  {selectedTourney.format === 'single_elimination' && renderSingleEliminationBracket(selectedTourney.matches)}
                  {selectedTourney.format === 'double_elimination' && renderDoubleEliminationBracket(selectedTourney.matches)}
                  {selectedTourney.format === 'round_robin' && renderRoundRobinBracket(selectedTourney.matches, selectedTourney.teams)}
                </div>
              )}
            </div>
          ) : (
            <div className="glow-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              🏆 Select a tournament from the sidebar panel to view details, rules, registered squads, and live bracket outcomes.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
