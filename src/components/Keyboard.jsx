import React from 'react';
import { isoLayout } from '../utils/keyboardLayout';

function formatAction(action, layout) {
  if (!action) return action;

  // Resolve US aliases first
  const usAliases = {
    // Shifted
    '!': 'S-1', '@': 'S-2', '#': 'S-3', '$': 'S-4', '%': 'S-5',
    '^': 'S-6', '&': 'S-7', '*': 'S-8', '(': 'S-9', ')': 'S-0',
    '_': 'S--', '+': 'S-=', '{': 'S-[', '}': 'S-]', '|': 'S-\\',
    ':': 'S-;', '"': 'S-\'', '<': 'S-,', '>': 'S-.', '?': 'S-/',
    '~': 'S-grave',
    // Unshifted that differ from id
    '`': 'grave'
  };

  let resolvedAction = action;
  
  if (usAliases[action]) {
    resolvedAction = usAliases[action];
  } else {
    const lastDashIndex = action.lastIndexOf('-');
    if (lastDashIndex !== -1) {
      const prefix = action.slice(0, lastDashIndex + 1);
      const suffix = action.slice(lastDashIndex + 1);
      if (usAliases[suffix]) {
        resolvedAction = prefix + usAliases[suffix];
      }
    }
  }

  let keyId = '';
  let modifiers = [];

  if (resolvedAction === '-') {
    keyId = '-';
  } else if (resolvedAction.endsWith('--')) {
    keyId = '-';
    const modsStr = resolvedAction.slice(0, -2);
    if (modsStr) {
      modifiers = modsStr.split('-');
    }
  } else {
    const parts = resolvedAction.split('-');
    keyId = parts[parts.length - 1];
    modifiers = parts.slice(0, -1);
  }

  // Find keyDef
  let keyDef = null;
  for (const row of isoLayout) {
    keyDef = row.find(k => k.id === keyId);
    if (keyDef) break;
  }

  if (keyDef) {
    const labelStr = layout === 'de' && keyDef.deLabel ? keyDef.deLabel : keyDef.label;
    const labelParts = labelStr.split(' ');

    // Check if shift or altgr is pressed
    const hasShift = modifiers.includes('S');
    const hasAltGr = modifiers.includes('G');

    let resolvedKey = keyId;
    if (labelParts.length > 2 && hasAltGr) {
      resolvedKey = labelParts[2];
    } else if (labelParts.length > 1) {
      resolvedKey = hasShift ? labelParts[1] : labelParts[0];
    } else {
      // For single part labels
      if (labelStr.length === 1) {
        resolvedKey = hasShift ? labelStr.toUpperCase() : labelStr.toLowerCase();
      } else {
        resolvedKey = labelStr;
      }
    }

    let newModifiers = modifiers;
    if (hasAltGr && labelParts.length > 2) {
        newModifiers = newModifiers.filter(m => m !== 'G');
    }
    if (hasShift && (labelParts.length > 1 || labelStr.length === 1)) {
        newModifiers = newModifiers.filter(m => m !== 'S');
    }

    if (newModifiers.length > 0) {
        return [...newModifiers, resolvedKey].join('-');
    } else {
        return resolvedKey;
    }
  }

  return action;
}

function Key({ keyDef, currentAction, isSelected, onClick, layout }) {
  const displayLabelStr = layout === 'de' && keyDef.deLabel ? keyDef.deLabel : keyDef.label;
  const firstPart = displayLabelStr.split(' ')[0];
  const displayLabel = (firstPart.length === 1 && firstPart >= 'a' && firstPart <= 'z') 
    ? firstPart.toUpperCase() 
    : firstPart;
    
  const displayAction = formatAction(currentAction, layout);
  
  const classNames = [
    'key',
    isSelected ? 'selected' : '',
    currentAction ? 'has-action' : '',
    layout === 'de' && keyDef.isoEnter ? 'iso-enter-de' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      style={{ flex: keyDef.width, marginLeft: keyDef.offset ? `${keyDef.offset * 3.5}rem` : '0' }}
      onClick={() => onClick(keyDef.id)}
    >
      <span className="key-label">{displayLabel}</span>
      <span className="key-action" title={displayAction || ''}>{displayAction || ''}</span>
    </div>
  );
}

export function Keyboard({ currentLayerMappings, selectedKeyId, onKeyClick, layout }) {
  return (
    <div className="keyboard-container">
      {isoLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map(keyDef => (
            keyDef.invisible ? (
              <div key={keyDef.id} style={{ flex: keyDef.width, visibility: 'hidden' }}></div>
            ) : (
              <Key
                key={keyDef.id}
                keyDef={keyDef}
                currentAction={currentLayerMappings[keyDef.id]}
                isSelected={selectedKeyId === keyDef.id}
                onClick={onKeyClick}
                layout={layout}
              />
            )
          ))}
        </div>
      ))}
    </div>
  );
}
