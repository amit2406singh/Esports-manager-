import React, { useState, useEffect, useRef } from 'react';

export default function MatchCenter({ matchId, matches, startSimulation, navigateTo }) {
  const [activeMatch, setActiveMatch] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [matchLogs, setMatchLogs] = useState([]);
  const [aiCommentary, setAiCommentary] = useState("Broadcasters are prepping their gear. The arena is silent...");
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  const socketRef = useRef(null);
  const logsEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Load details and prediction
  useEffect(() => {
    let currentId = matchId;
    if (!currentId && matches.length > 0) {
      // Find first live or scheduled match
      const active = matches.find(m => m.status === 'live') || matches.find(m => m.status === 'scheduled') || matches[0];
      currentId = active?.id;
    }

    if (currentId) {
      // Fetch details from backend to trigger AI calculations
      fetch(`http://127.0.0.1:8000/api/matches/${currentId}`)
        .then(res => res.json())
        .then(data => {
          setActiveMatch(data);
          setPredictions(data.prediction || null);
          setMatchLogs([]);
          setAiCommentary(data.status === 'completed' ? `Match concluded. Victory secured by ${data.winner_id === data.team1?.id ? data.team1?.name : data.team2?.name}.` : "AI Match Analytics completed. Ready for kickoff.");
          setChatMessages([
            { sender: "System", message: `Welcome to the Match ${currentId.substring(0,4).toUpperCase()} spectating lounge!`, timestamp: "Just now" }
          ]);
        })
        .catch(err => {
          console.error("Failed to load match details:", err);
          // Local fallback
          const local = matches.find(m => m.id === currentId);
          setActiveMatch(local);
        });
    }
  }, [matchId, matches]);

  // WebSocket Connection
  useEffect(() => {
    if (!activeMatch) return;

    const wsUrl = `ws://127.0.0.1:8000/ws/match_${activeMatch.id}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log(`Connected to match WebSocket room: match_${activeMatch.id}`);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'tick') {
        // Update live scores
        setActiveMatch(prev => ({
          ...prev,
          score1: data.scores.team1,
          score2: data.scores.team2
        }));
        
        // Append telemetry log
        setMatchLogs(prev => [...prev, { text: data.message, time: new Date().toLocaleTimeString() }]);
        if (data.commentary) {
          setAiCommentary(data.commentary);
        }
      } else if (data.type === 'event') {
        setMatchLogs(prev => [...prev, { text: data.message, time: new Date().toLocaleTimeString() }]);
      } else if (data.type === 'finished') {
        setActiveMatch(prev => ({
          ...prev,
          status: 'completed',
          score1: data.scores.team1,
          score2: data.scores.team2,
          winner_id: prev.team1.name === data.winner ? prev.team1.id : prev.team2.id
        }));
        setAiCommentary(`Match finished! Champion: ${data.winner}.`);
        setMatchLogs(prev => [...prev, { text: data.message, time: new Date().toLocaleTimeString(), special: true }]);
      } else if (data.type === 'chat') {
        setChatMessages(prev => [...prev, {
          sender: data.sender,
          message: data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [activeMatch?.id]);

  // Auto-scroll logs & chat
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [matchLogs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const triggerSimulation = () => {
    if (!activeMatch) return;
    startSimulation(activeMatch.id);
    setActiveMatch(prev => ({ ...prev, status: 'live' }));
    setMatchLogs([{ text: "Initiating live server telemetry connection...", time: new Date().toLocaleTimeString() }]);
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    
    socketRef.current.send(JSON.stringify({
      type: "chat",
      sender: "Spectator_" + Math.floor(1000 + Math.random() * 9000),
      message: chatInput
    }));
    
    setChatInput('');
  };

  const activeScheduledMatches = matches.filter(m => m.team1 && m.team2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.8rem' }} className="neon-text-purple">Live Match Center</h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Spectate real-time combat simulations, audit live AI game commentary, and analyze skill projections.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.8fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Match Selector Panel */}
        <div className="glow-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            Active Roster
          </h3>
          {activeScheduledMatches.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
              No matches populated yet. Start a tournament first!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeScheduledMatches.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => navigateTo('matches', m.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: activeMatch?.id === m.id ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: activeMatch?.id === m.id ? '1px solid var(--color-secondary)' : '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Match {m.id.substring(0,4).toUpperCase()}</span>
                    {m.status === 'live' ? (
                      <span className="live-badge" style={{ padding: '2px 4px', scale: '0.85' }}>LIVE</span>
                    ) : m.status === 'completed' ? (
                      <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>FINISHED</span>
                    ) : (
                      <span>Scheduled</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.85rem' }}>
                    <span>🛡️ {m.team1.name}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
                      {m.status === 'scheduled' ? 'vs' : `${m.score1} - ${m.score2}`}
                    </span>
                    <span>{m.team2.name} 🛡️</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Arena Dashboard */}
        {activeMatch ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Arena Jumbotron / Scoreboard */}
            <div className="glow-card" style={{
              background: 'linear-gradient(180deg, #100d28 0%, #050508 100%)',
              border: '1px solid var(--color-border-glow)',
              padding: '30px',
              borderRadius: '16px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* Background ambient lighting */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '25%',
                width: '50%',
                height: '100%',
                background: 'radial-gradient(ellipse at center, rgba(143, 59, 250, 0.25) 0%, rgba(0,0,0,0) 70%)',
                pointerEvents: 'none'
              }} />

              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
                {activeMatch.round_name}
              </span>
              
              {/* Match Score Display */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', margin: '20px 0' }}>
                <div style={{ width: '220px', textAlign: 'right' }}>
                  <div style={{ fontSize: '2.5rem' }}>🛡️</div>
                  <strong style={{ fontSize: '1.4rem', display: 'block', marginTop: '8px' }}>{activeMatch.team1?.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Blue Side</span>
                </div>

                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  letterSpacing: '5px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  padding: '10px 30px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  textShadow: '0 0 15px rgba(0, 242, 254, 0.4)',
                  color: 'var(--color-secondary)'
                }}>
                  {activeMatch.score1} : {activeMatch.score2}
                </div>

                <div style={{ width: '220px', textAlign: 'left' }}>
                  <div style={{ fontSize: '2.5rem' }}>🛡️</div>
                  <strong style={{ fontSize: '1.4rem', display: 'block', marginTop: '8px' }}>{activeMatch.team2?.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Red Side</span>
                </div>
              </div>

              {/* Simulation triggers */}
              {activeMatch.status === 'scheduled' && (
                <button className="glow-button" style={{ padding: '12px 30px', fontSize: '1rem', marginTop: '10px' }} onClick={triggerSimulation}>
                  ⚡ Start Gameplay Telemetry Simulator
                </button>
              )}

              {activeMatch.status === 'live' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,23,68,0.1)', border: '1px solid var(--color-danger)', padding: '8px 16px', borderRadius: '8px', color: '#ff5252', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  <span className="live-dot" /> STREAMING TELEMETRY LOGS IN REAL-TIME
                </div>
              )}

              {activeMatch.status === 'completed' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(0,230,118,0.1)', border: '1px solid var(--color-success)', padding: '8px 16px', borderRadius: '8px', color: 'var(--color-success)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  🏆 MATCH CONCLUDED: {activeMatch.winner_id === activeMatch.team1?.id ? activeMatch.team1?.name : activeMatch.team2?.name} VICTORY
                </div>
              )}
            </div>

            {/* Split Grid: AI analytics on Left, Telemetry & Chat on Right */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '30px', flexWrap: 'wrap' }}>
              
              {/* Left Column: AI Analytics & Predictions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* AI Odds & Prediction */}
                <div className="glow-card-cyan" style={{ padding: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🤖 AI Matchmaker Skill Matrix
                  </h4>
                  
                  {predictions ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      
                      {/* Prediction bars */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                          <span>{activeMatch.team1?.name} Odds</span>
                          <strong>{Math.round(predictions.team1_win_probability * 100)}%</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${predictions.team1_win_probability * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                          <span>{activeMatch.team2?.name} Odds</span>
                          <strong>{Math.round(predictions.team2_win_probability * 100)}%</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${predictions.team2_win_probability * 100}%`, height: '100%', background: 'linear-gradient(90deg, #ff1744 0%, #ffb300 100%)' }} />
                        </div>
                      </div>

                      {/* Handicap details */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', marginTop: '10px' }}>
                        <strong style={{ color: 'var(--color-warning)', display: 'block', marginBottom: '4px' }}>⚖️ Handicap Recommendations:</strong>
                        <span style={{ color: 'var(--color-text-muted)' }}>{predictions.handicap_suggestion}</span>
                      </div>

                      {/* Narrative */}
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.4', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                        <strong>AI Tactical Narrative:</strong>
                        <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>{predictions.ai_analysis}</p>
                      </div>

                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px' }}>
                      Awaiting AI Odds generation... Both teams must be set.
                    </div>
                  )}
                </div>

                {/* AI Live Commentary Box */}
                <div className="glow-card" style={{ padding: '20px', borderLeft: '4px solid var(--color-primary)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    🎙️ AI Shoutcaster Box
                  </h4>
                  <div style={{
                    fontSize: '0.95rem',
                    fontStyle: 'italic',
                    color: '#e2e8f0',
                    lineHeight: '1.4',
                    background: 'rgba(255,255,255,0.01)',
                    padding: '12px',
                    borderRadius: '6px'
                  }}>
                    "{aiCommentary}"
                  </div>
                </div>

              </div>

              {/* Right Column: Telemetry Event Ticker & Spectator Chat */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Telemetry log ticker */}
                <div className="glow-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '240px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                    📡 Game Server Event Telemetry
                  </h4>
                  <div style={{ flex: 1, overflowY: 'auto', background: '#090a10', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {matchLogs.length === 0 ? (
                      <div style={{ color: '#444', textAlign: 'center', padding: '20px' }}>
                        Waiting for server events...
                      </div>
                    ) : (
                      matchLogs.map((log, idx) => (
                        <div key={idx} style={{
                          borderBottom: '1px solid rgba(255,255,255,0.02)',
                          paddingBottom: '4px',
                          color: log.special ? 'var(--color-success)' : '#e2e8f0'
                        }}>
                          <span style={{ color: '#555', marginRight: '6px' }}>[{log.time}]</span>
                          <span dangerouslySetInnerHTML={{ __html: log.text }} />
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>

                {/* Spectator Chat Component */}
                <div className="glow-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '280px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                    💬 Fan Spectator Chat Lounge
                  </h4>
                  
                  {/* Messages container */}
                  <div style={{ flex: 1, overflowY: 'auto', background: '#090a10', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <strong style={{ color: msg.sender === 'System' ? 'var(--color-primary)' : msg.sender.startsWith('Spectator_') ? 'var(--color-secondary)' : '#fff' }}>
                            {msg.sender}
                          </strong>
                          <span style={{ color: '#444' }}>{msg.timestamp}</span>
                        </div>
                        <span style={{ color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.01)', padding: '4px 6px', borderRadius: '4px' }}>
                          {msg.message}
                        </span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Send chat */}
                  <form onSubmit={sendChatMessage} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Type a chat message..." 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#121420',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.85rem'
                      }}
                    />
                    <button className="glow-button" type="submit" style={{ padding: '0 16px', fontSize: '0.85rem' }}>
                      Send
                    </button>
                  </form>
                </div>

              </div>

            </div>

          </div>
        ) : (
          <div className="glow-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            📡 Please select an active scheduled match from the sidebar to inspect telemetry streams, AI handicap calibrations, and viewer chats.
          </div>
        )}

      </div>
    </div>
  );
}
