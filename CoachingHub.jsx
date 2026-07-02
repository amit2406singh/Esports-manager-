import React, { useState, useEffect, useRef } from 'react';

export default function CoachingHub({ activePlayer }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [drills, setDrills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (activePlayer) {
      setMessages([
        {
          sender: "Coach AI",
          text: `Welcome to the **ROSTER // LOCK** AI Assistant!\n\nI can help you with tactical gaming drills, or guide you on how to use our platform features. Ask me anything, or try querying about:\n- **Match Center** (Live scrim updates & spectating)\n- **Prize Hub** (Prize distributions & claim steps)\n- **Sentinel Anomaly Detector** (Cheat detection checks)\n- **Player Performance Analytics** (Combat telemetry mapping)`
        }
      ]);
      setDrills([]);
    }
  }, [activePlayer?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleQuery = (queryText) => {
    if (isLoading || !queryText.trim()) return;

    // Append user message
    setMessages(prev => [...prev, { sender: activePlayer?.username || "Player", text: queryText }]);
    setIsLoading(true);

    fetch('http://127.0.0.1:8000/api/analytics/coaching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: activePlayer.id,
        query: queryText
      })
    })
      .then(res => res.json())
      .then(data => {
        setMessages(prev => [...prev, { sender: "Coach AI", text: data.coach_advice }]);
        setDrills(data.suggested_drills || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("AI Coach query failed:", err);
        setMessages(prev => [...prev, { sender: "Coach AI", text: "I ran into a server synchronization issue while pulling your telemetry logs. Let's try that query again in a moment." }]);
        setIsLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleQuery(input);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          AI Tactical Consultant & Strategy Hub
        </h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Ask Coach AI for platform walkthroughs (Match Center, Prize Hub, Sentinel) or general esports strategy drills.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Chat Lounge */}
        <div className="glow-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '520px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.5px' }}>
            Tactical Assistant Terminal
          </h3>
          
          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: '#121212',
            padding: '20px',
            borderRadius: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginBottom: '15px',
            border: '1px solid var(--color-border)'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === 'Coach AI' ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                background: msg.sender === 'Coach AI' ? 'var(--color-primary-glow)' : 'rgba(255, 255, 255, 0.02)',
                border: msg.sender === 'Coach AI' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                padding: '12px 16px',
                borderRadius: '2px',
                fontSize: '0.88rem',
                lineHeight: '1.5'
              }}>
                <div style={{
                  fontSize: '0.72rem',
                  color: msg.sender === 'Coach AI' ? 'var(--color-primary)' : '#ffffff',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: 'var(--font-display)',
                  marginBottom: '6px'
                }}>
                  {msg.sender}
                </div>
                <div style={{ color: '#e5e7eb', whiteSpace: 'pre-wrap' }}>
                  {msg.text.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#ffffff' }}>{chunk}</strong> : chunk)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '10px 15px', border: '1px dashed var(--color-border)', borderRadius: '2px', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                Analyzing tactical nodes... 📡
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Send form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Ask anything about match center, prize hub, sentinel checks, or strategy..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px',
                background: '#121212',
                border: '1px solid var(--color-border)',
                borderRadius: '2px',
                color: '#fff',
                fontSize: '0.88rem'
              }}
            />
            <button className="glow-button" type="submit" style={{ padding: '0 24px' }} disabled={isLoading}>
              Ask Coach
            </button>
          </form>
        </div>

        {/* Suggested Drills Panel */}
        <div className="glow-card" style={{ padding: '20px', minHeight: '300px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.5px' }}>
            Tactical Operations Checklist
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0 0 20px 0' }}>
            Recommended routines or walkthrough tasks compiled by Coach AI based on your session.
          </p>

          {drills.length === 0 ? (
            <div style={{
              padding: '30px',
              textAlign: 'center',
              border: '1px dashed var(--color-border)',
              borderRadius: '2px',
              color: 'var(--color-text-muted)',
              fontSize: '0.8rem'
            }}>
              Queries will output recommended task lists here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {drills.map((drill, idx) => (
                <div key={idx} style={{
                  background: '#121212',
                  padding: '12px',
                  borderRadius: '2px',
                  border: '1px solid var(--color-border)',
                  borderLeft: '3px solid var(--color-primary)'
                }}>
                  <strong style={{ fontSize: '0.72rem', color: 'var(--color-primary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-display)' }}>
                    Action #{idx + 1}
                  </strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                    {drill}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
