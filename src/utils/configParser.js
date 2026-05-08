export function parseConfig(configStr) {
  const lines = configStr.split('\n');
  const result = {
    ids: [],
    layers: []
  };

  let currentSection = null;
  let currentLayer = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const sectionMatch = line.match(/^\[(.*?)\]$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1];
      if (sectionName === 'ids') {
        currentSection = 'ids';
      } else {
        currentSection = 'layer';
        const parts = sectionName.split(':');
        currentLayer = {
          name: parts[0],
          modifier: parts.length > 1 ? parts.slice(1).join(':') : null,
          mappings: {}
        };
        result.layers.push(currentLayer);
      }
      continue;
    }

    if (currentSection === 'ids') {
      result.ids.push(line);
    } else if (currentSection === 'layer' && currentLayer) {
      let splitIdx = line.indexOf('=');
      if (splitIdx === 0) {
        splitIdx = line.indexOf('=', 1);
      }
      if (splitIdx !== -1) {
        const key = line.substring(0, splitIdx).trim();
        const value = line.substring(splitIdx + 1).trim();
        currentLayer.mappings[key] = value;
      }
    }
  }

  // Ensure 'main' layer exists
  if (!result.layers.find(l => l.name === 'main')) {
    result.layers.unshift({ name: 'main', modifier: null, mappings: {} });
  }

  return result;
}

const KEY_ORDER = [
  'esc', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
  'grave', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace',
  'tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', 'enter',
  'capslock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", '\\',
  'shift', '102nd', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'rightshift',
  'control', 'meta', 'alt', 'space', 'rightalt', 'rightmeta', 'compose', 'rightcontrol'
];

export function generateConfig(configObj) {
  let output = '';

  output += '[ids]\n';
  if (configObj.ids && configObj.ids.length > 0) {
    configObj.ids.forEach(id => {
      output += `${id}\n`;
    });
  } else {
    output += '*\n';
  }
  output += '\n';

  configObj.layers.forEach(layer => {
    let header = layer.name;
    if (layer.modifier) {
      header += `:${layer.modifier}`;
    }
    output += `[${header}]\n\n`;

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
        output += `${key} = ${value}\n`;
      }
    }
    output += '\n';
  });

  return output.trim() + '\n';
}
