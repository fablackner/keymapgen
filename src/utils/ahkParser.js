import { ahkScanCodeToKeyd, keydToAhkScanCode } from './ahkCodes.js';

function ahkActionToKeyd(ahkAction) {
  let action = ahkAction.trim();

  // If it's a variable assignment or function call, just return it raw
  if (action.includes(':=') || action.includes('(')) {
    return action;
  }

  let isSend = false;
  if (action.match(/^Send(Input)?,?\s*/i)) {
    action = action.replace(/^Send(Input)?,?\s*/i, '');
    isSend = true;
  }

  let mods = '';
  while (action.length > 0) {
    if (action.startsWith('^')) { mods += 'C-'; action = action.substring(1); }
    else if (action.startsWith('!')) { mods += 'M-'; action = action.substring(1); }
    else if (action.startsWith('+')) { mods += 'S-'; action = action.substring(1); }
    else if (action.startsWith('#')) { mods += 'W-'; action = action.substring(1); }
    else break;
  }

  // Handle {Key} format
  let keyMatch = action.match(/^\{(.*?)\}$/);
  if (keyMatch) {
    action = keyMatch[1].toLowerCase();
  } else if (!isSend && mods.length === 0 && action.length > 1) {
    // Raw unmodded multichar string, might be a raw key like 'Home' or 'Esc'
    action = action.toLowerCase();
  }

  if (action === '{}') action = '}'; // AHK shifted {}
  if (action === '{{}') action = '{'; // AHK shifted {}

  return mods + action;
}

function keydActionToAhk(keydAction) {
  let action = keydAction.trim();

  // If it's a raw AHK command (like Sym := true), pass it through
  if (action.includes(':=') || action.includes('(')) {
    return action;
  }

  let mods = '';

  // Extract modifiers
  while (true) {
    if (action.startsWith('C-')) { mods += '^'; action = action.substring(2); }
    else if (action.startsWith('M-') || action.startsWith('A-')) { mods += '!'; action = action.substring(2); }
    else if (action.startsWith('S-')) { mods += '+'; action = action.substring(2); }
    else if (action.startsWith('W-')) { mods += '#'; action = action.substring(2); }
    else break;
  }

  const multiCharKeys = ['left', 'right', 'up', 'down', 'esc', 'home', 'end', 'pgup', 'pgdn', 'insert', 'delete', 'backspace', 'enter', 'space', 'tab', 'volume_up', 'volume_down', 'volume_mute'];

  let ahkKey = action;
  let lowerAction = action.toLowerCase();
  if (multiCharKeys.includes(lowerAction)) {
    // Capitalize first letter for AHK keys
    ahkKey = `{${action.charAt(0).toUpperCase() + action.slice(1)}}`;
    return `Send, ${mods}${ahkKey}`;
  } else if (action.length === 1) {
    if (mods.length > 0) {
      return `${mods}${action}`; // e.g. ^c
    } else {
      return `Send, ${action}`; // e.g. Send, a
    }
  } else {
    // Arbitrary action (macro) or unhandled
    return `Send, ${mods}{${action}}`;
  }
}

export function parseAhkConfig(ahkStr) {
  const lines = ahkStr.split('\n');
  const result = { ids: ['*'], layers: [] };
  let currentLayer = null;

  // Ensure main layer exists
  currentLayer = { name: 'main', modifier: null, mappings: {} };
  result.layers.push(currentLayer);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line || line.startsWith(';')) continue;

    const ifMatch = line.match(/^#If\s*(.*)$/i);
    if (ifMatch) {
      let condition = ifMatch[1].trim();
      let layerName = 'main';

      const cleanCondition = condition.replace(/\s+/g, '').toLowerCase();

      if (cleanCondition === '') layerName = 'main';
      else if (cleanCondition.startsWith('(keymapisactiveand')) {
        layerName = cleanCondition.replace(/^\(keymapisactiveand/, '').replace(/\)$/, '');
      }
      else if (cleanCondition === '(keymapisactive)' || cleanCondition === 'keymapisactive') layerName = 'main';
      else if (cleanCondition === '(curand!sym)' || cleanCondition.includes('curand!sym')) layerName = 'cur';
      else if (cleanCondition === '(!curandsym)' || cleanCondition.includes('!curandsym')) layerName = 'sym';
      else if (cleanCondition === '(curandsym)' || cleanCondition.includes('curandsym')) layerName = 'cursym';
      else if (cleanCondition === '(!curand!sym)' || cleanCondition.includes('!curand!sym')) layerName = 'base';
      else layerName = cleanCondition.replace(/^\(/, '').replace(/\)$/, '');

      currentLayer = result.layers.find(l => l.name === layerName);
      if (!currentLayer) {
        currentLayer = { name: layerName, modifier: null, mappings: {} };
        result.layers.push(currentLayer);
      }
      continue;
    }

    if (currentLayer) {
      const mappingMatch = line.match(/^\*?([a-zA-Z0-9_]+)\s*::(.*)$/);
      if (mappingMatch) {
        const rawKey = mappingMatch[1].toLowerCase();
        let rawAction = mappingMatch[2].trim();

        if (rawKey.endsWith(' up')) continue;

        const keydId = ahkScanCodeToKeyd[rawKey] || rawKey;

        if (rawAction) {
          if (rawAction === 'Cur := true') currentLayer.mappings[keydId] = 'layer(cur)';
          else if (rawAction === 'Sym := true') currentLayer.mappings[keydId] = 'layer(sym)';
          else currentLayer.mappings[keydId] = ahkActionToKeyd(rawAction);
        } else {
          let blockLines = [];
          i++;
          while (i < lines.length && lines[i].trim().toLowerCase() !== 'return') {
            if (lines[i].trim()) blockLines.push(lines[i].trim());
            i++;
          }
          const blockContent = blockLines.join('\n');
          if (blockContent.includes('Cur := true') && blockContent.includes('Sym := true')) {
            currentLayer.mappings[keydId] = 'layer(cursym)';
          } else {
            currentLayer.mappings[keydId] = blockContent;
          }
        }
      }
    }
  }

  return result;
}

export function generateAhkConfig(configObj) {
  let output = `#Persistent\n#MaxHotkeysPerInterval 999999999\n\n`;

  configObj.layers.forEach(layer => {
    if (layer.name === 'main') {
      output += `#If (keymapIsActive)\n\n`;
    } else {
      const capitalizedLayer = layer.name.charAt(0).toUpperCase() + layer.name.slice(1);
      output += `#If (keymapIsActive and ${capitalizedLayer})\n\n`;
    }

    // Sort keys just like keyd config
    const KEY_ORDER = [
      'esc', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
      'grave', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace',
      'tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', 'enter',
      'capslock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", '\\',
      'shift', '102nd', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'rightshift',
      'control', 'meta', 'alt', 'space', 'rightalt', 'rightmeta', 'compose', 'rightcontrol'
    ];

    const sortedKeys = Object.keys(layer.mappings).sort((a, b) => {
      const indexA = KEY_ORDER.indexOf(a);
      const indexB = KEY_ORDER.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    for (const key of sortedKeys) {
      const value = layer.mappings[key];
      if (value) {
        let mappedKey = key;
        if (mappedKey === 'altgr') mappedKey = 'rightalt'; // map altgr alias
        const ahkKey = keydToAhkScanCode[mappedKey] || mappedKey.toUpperCase();

        if (value.startsWith('layer(')) {
          const layerMatch = value.match(/^layer\((.*?)\)$/);
          if (layerMatch) {
            const layerName = layerMatch[1];
            if (layerName === 'cursym') {
              output += `\t*${ahkKey}::\n\t\tCur := true\n\t\tSym := true\n\treturn\n\n`;
              output += `\t*${ahkKey} Up::\n\t\tCur := false\n\t\tSym := false\n\treturn\n`;
            } else {
              const varName = layerName.charAt(0).toUpperCase() + layerName.slice(1);
              output += `\t*${ahkKey}::${varName} := true\n`;
              output += `\t*${ahkKey} Up::${varName} := false\n`;
            }
          }
        } else {
          const ahkAction = keydActionToAhk(value);
          if (ahkAction.includes('\n')) {
            output += `\t${ahkKey}::\n`;
            const blockLines = ahkAction.split('\n');
            blockLines.forEach(l => {
              output += `\t\t${l}\n`;
            });
            output += `\treturn\n`;
          } else {
            output += `\t${ahkKey}::${ahkAction}\n`;
          }
        }
      }
    }
    output += '\n';
  });

  output += `#If\n\n`;

  output += `; --- Boilerplate ---

keymapIsActive := true

#SC001::
	{
		keymapIsActive := false
		stopBox("keymap - STOPPED")
	}
return

#SC00E::
	{
		keymapIsActive := true
		activeBox("keymap - ACTIVE")
	}
return

stopBox(text){
	Gui, +AlwaysOnTop +ToolWindow -SysMenu -Caption
	Gui, Color, d71d37 ;changes background color
	Gui, Font, 000000 s20 wbold, Verdana ;changes font color, size and font
	Gui, Add, Text, x0 y0, %text% ;the text to display
	Gui, Show, NoActivate X0 Y0, "test"

	sleep, 1000
	Gui, Destroy
}

activeBox(text){
	Gui, +AlwaysOnTop +ToolWindow -SysMenu -Caption
	Gui, Color, 2dd635 ;changes background color
	Gui, Font, 000000 s20 wbold, Verdana ;changes font color, size and font
	Gui, Add, Text, x0 y0, %text% ;the text to display
	Gui, Show, NoActivate X0 Y0, "test"

	sleep, 1000
	Gui, Destroy
}
`;

  return output;
}
