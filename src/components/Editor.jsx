import React, { useState, useEffect } from 'react';
import { keydCodes } from '../utils/keydCodes';

export function Editor({ selectedKeyId, currentAction, onActionChange, layers }) {
  const [inputValue, setInputValue] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    setInputValue(currentAction || '');
  }, [selectedKeyId, currentAction]);

  if (!selectedKeyId) {
    return (
      <div className="sidebar">
        <h2>Key Editor</h2>
        <p style={{ color: 'var(--text-muted)' }}>Select a key on the keyboard to edit its mapping.</p>
      </div>
    );
  }

  const handleInputChange = (e) => {
    let val = e.target.value;
    if (!val.includes('(') && val.length > 0) {
      const parts = val.split('-');
      const baseKey = parts.pop();
      val = [...parts, baseKey.toLowerCase()].join('-');
    }
    setInputValue(val);
    onActionChange(val);
  };

  const setAction = (action) => {
    setInputValue(action);
    onActionChange(action);
  };

  const clearAction = () => {
    setInputValue('');
    onActionChange('');
  };

  const handleDropdownChange = (e) => {
    // Kept for structural consistency, though unused now.
  };

  let errorMessage = '';
  if (inputValue) {
    if (!inputValue.includes('(')) {
      const parts = inputValue.split('-');
      const baseKey = parts[parts.length - 1].trim();
      if (baseKey && baseKey.length > 1 && !keydCodes.includes(baseKey)) {
        errorMessage = `Error: '${baseKey}' is not in the valid keys list.`;
      }
    }
  }

  return (
    <div className="sidebar">
      <h2>Key Editor</h2>
      <div className="form-group">
        <label>Selected US key code: <strong>{selectedKeyId}</strong></label>
      </div>

      <div className="form-group">
        <label>Action / Mapping</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="e.g. C-S-f5, layer(nav)"
            style={{ width: '100%' }}
          />
        </div>
        {errorMessage && (
          <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {errorMessage}
          </div>
        )}
      </div>

      <div className="form-group">
        <button className="btn" onClick={clearAction}>Clear Action</button>
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Quick Assign Layer Toggle</label>
        <div className="quick-actions">
          {layers.filter(l => l.name !== 'main').map(l => (
            <button
              key={l.name}
              className="quick-action-btn"
              onClick={() => setAction(`layer(${l.name})`)}
            >
              layer({l.name})
            </button>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Quick Modifiers</label>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => setAction(`C-`)}>Ctrl (C-)</button>
          <button className="quick-action-btn" onClick={() => setAction(`A-`)}>Alt (A-)</button>
          <button className="quick-action-btn" onClick={() => setAction(`S-`)}>Shift (S-)</button>
          <button className="quick-action-btn" onClick={() => setAction(`M-`)}>Meta (M-)</button>
          <button className="quick-action-btn" onClick={() => setAction(`G-`)}>AltGr (G-)</button>
          <button className="quick-action-btn" onClick={() => setAction(`noop`)}>noop</button>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <button 
          className="btn" 
          onClick={() => setShowHelp(!showHelp)}
          style={{ width: '100%', background: 'var(--bg-lighter)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
        >
          {showHelp ? 'Hide' : 'Show'} Valid Keycodes Help
        </button>
        {showHelp && (
          <div style={{ marginTop: '0.5rem', background: 'var(--bg-lighter)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            <input 
              type="text" 
              placeholder="Search keycodes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', marginBottom: '0.5rem', padding: '0.25rem', fontSize: '0.8rem', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            />
            <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {keydCodes.filter(k => k.includes(searchTerm.toLowerCase())).map(code => (
                <span 
                  key={code} 
                  style={{ background: 'var(--bg-dark)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.75rem', color: 'var(--text-main)', cursor: 'pointer', border: '1px solid var(--border-color)' }} 
                  onClick={() => setAction(inputValue ? (inputValue.endsWith('-') ? inputValue + code : code) : code)}
                  title={`Insert ${code}`}
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
