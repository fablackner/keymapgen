import { useState, useEffect } from 'react';
import { Keyboard } from './components/Keyboard';
import { Editor } from './components/Editor';
import { parseConfig, generateConfig } from './utils/configParser';
import { parseAhkConfig, generateAhkConfig } from './utils/ahkParser';
import { DEFAULT_CONFIG } from './utils/defaultConfig';

function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [layout, setLayout] = useState('de');

  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [loadText, setLoadText] = useState('');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportText, setExportText] = useState('');
  const [fileName, setFileName] = useState('famak.conf');
  const [exportFormat, setExportFormat] = useState('keyd');

  const activeLayer = config.layers[activeLayerIndex];

  const handleKeyClick = (keyId) => {
    setSelectedKeyId(keyId);
  };

  const handleActionChange = (newAction) => {
    if (!selectedKeyId) return;

    setConfig(prev => {
      const newConfig = { ...prev, layers: [...prev.layers] };
      const layerToUpdate = { ...newConfig.layers[activeLayerIndex], mappings: { ...newConfig.layers[activeLayerIndex].mappings } };

      if (newAction === '') {
        delete layerToUpdate.mappings[selectedKeyId];
      } else {
        layerToUpdate.mappings[selectedKeyId] = newAction;
      }

      newConfig.layers[activeLayerIndex] = layerToUpdate;
      return newConfig;
    });
  };

  const addLayer = () => {
    const layerName = prompt("Enter new layer name (e.g. nav, sym, shift:S):");
    if (layerName) {
      let name = layerName;
      let modifier = null;
      if (layerName.includes(':')) {
        const parts = layerName.split(':');
        name = parts[0];
        modifier = parts.slice(1).join(':');
      }

      setConfig(prev => ({
        ...prev,
        layers: [...prev.layers, { name, modifier, mappings: {} }]
      }));
      setActiveLayerIndex(config.layers.length);
    }
  };

  const renameLayer = () => {
    if (activeLayerIndex === 0) return; // Cannot rename main layer
    const currentName = activeLayer.name + (activeLayer.modifier ? `:${activeLayer.modifier}` : '');
    const layerName = prompt("Rename layer (e.g. nav, sym, shift:S):", currentName);
    if (layerName && layerName !== currentName) {
      let name = layerName;
      let modifier = null;
      if (layerName.includes(':')) {
        const parts = layerName.split(':');
        name = parts[0];
        modifier = parts.slice(1).join(':');
      }

      setConfig(prev => {
        const newConfig = { ...prev, layers: [...prev.layers] };
        newConfig.layers[activeLayerIndex] = { ...newConfig.layers[activeLayerIndex], name, modifier };
        return newConfig;
      });
    }
  };

  const removeLayer = () => {
    if (activeLayerIndex === 0) return; // Cannot remove main layer
    if (window.confirm(`Are you sure you want to remove the layer "${activeLayer.name}"?`)) {
      setConfig(prev => {
        const newLayers = prev.layers.filter((_, idx) => idx !== activeLayerIndex);
        return { ...prev, layers: newLayers };
      });
      setActiveLayerIndex(0);
    }
  };

  const loadConfig = () => {
    try {
      let parsed;
      if (loadText.includes('#If') || loadText.includes('::')) {
        parsed = parseAhkConfig(loadText);
        setFileName('famak.ahk');
        setExportFormat('ahk');
      } else {
        parsed = parseConfig(loadText);
        setFileName('famak.conf');
        setExportFormat('keyd');
      }
      setConfig(parsed);
      setActiveLayerIndex(0);
      setIsLoadModalOpen(false);
      setLoadText('');
    } catch (e) {
      alert("Error parsing config: " + e.message);
    }
  };

  const openExportModal = () => {
    if (exportFormat === 'ahk') {
      setExportText(generateAhkConfig(config));
    } else {
      setExportText(generateConfig(config));
    }
    setIsExportModalOpen(true);
  };

  useEffect(() => {
    if (isExportModalOpen) {
      if (exportFormat === 'ahk') {
        setExportText(generateAhkConfig(config));
        setFileName(prev => prev.endsWith('.conf') ? prev.replace('.conf', '.ahk') : prev.endsWith('.ahk') ? prev : 'famak.ahk');
      } else {
        setExportText(generateConfig(config));
        setFileName(prev => prev.endsWith('.ahk') ? prev.replace('.ahk', '.conf') : prev.endsWith('.conf') ? prev : 'famak.conf');
      }
    }
  }, [exportFormat, config, isExportModalOpen]);

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.conf,.ahk';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setFileName(file.name);
      if (file.name.toLowerCase().endsWith('.ahk')) {
        setExportFormat('ahk');
      } else {
        setExportFormat('keyd');
      }
      const contents = await file.text();
      const parsed = file.name.toLowerCase().endsWith('.ahk') ? parseAhkConfig(contents) : parseConfig(contents);
      setConfig(parsed);
      setActiveLayerIndex(0);
      setIsLoadModalOpen(false);
      setLoadText('');
    };
    input.click();
  };

  const handleSaveFile = (saveAs = false) => {
    let nameToSave = fileName;
    if (saveAs) {
      const inputName = prompt("Enter file name:", fileName);
      if (!inputName) return;
      const expectedExt = exportFormat === 'ahk' ? '.ahk' : '.conf';
      nameToSave = inputName.endsWith(expectedExt) ? inputName : `${inputName.split('.')[0]}${expectedExt}`;
      setFileName(nameToSave);
    }
    const finalConfigStr = exportFormat === 'ahk' ? generateAhkConfig(config) : generateConfig(config);
    const blob = new Blob([finalConfigStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nameToSave;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  return (
    <div className="app-container">
      <div className="topbar">
        <h1>keymapgen</h1>
        <div className="topbar-actions">
          <select className="btn" style={{ padding: '0.4rem' }} value={layout} onChange={e => setLayout(e.target.value)}>
            <option value="en">EN Layout</option>
            <option value="de">DE Layout</option>
          </select>
          <button className="btn" onClick={() => setIsLoadModalOpen(true)}>Load Config</button>
          <button className="btn primary" onClick={openExportModal}>Export Config</button>
        </div>
      </div>

      <div className="main-content">
        <div className="workspace">
          <div className="layer-tabs" style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {config.layers.map((layer, index) => (
                <button
                  key={index}
                  className={`layer-tab ${activeLayerIndex === index ? 'active' : ''}`}
                  onClick={() => setActiveLayerIndex(index)}
                >
                  {layer.name}{layer.modifier ? `:${layer.modifier}` : ''}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {activeLayerIndex !== 0 && (
                <>
                  <button className="btn" onClick={renameLayer} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Rename</button>
                  <button className="btn" onClick={removeLayer} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--accent)' }}>Remove</button>
                </>
              )}
              <button className="btn" onClick={addLayer} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>+ Add Layer</button>
            </div>
          </div>

          <Keyboard
            currentLayerMappings={activeLayer.mappings}
            selectedKeyId={selectedKeyId}
            onKeyClick={handleKeyClick}
            layout={layout}
          />
        </div>

        <Editor
          selectedKeyId={selectedKeyId}
          currentAction={selectedKeyId ? activeLayer.mappings[selectedKeyId] : ''}
          onActionChange={handleActionChange}
          layers={config.layers}
        />
      </div>

      {isLoadModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Load Configuration</h2>
            <div className="form-group">
              <label>Paste your keyd config here:</label>
              <textarea
                value={loadText}
                onChange={e => setLoadText(e.target.value)}
                rows={15}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setIsLoadModalOpen(false)}>Cancel</button>
              <button className="btn" style={{ marginRight: 'auto' }} onClick={handleOpenFile}>Load from File</button>
              <button className="btn primary" onClick={loadConfig}>Load Text</button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Export Configuration</h2>
            <div className="form-group" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ margin: 0 }}>Format:</label>
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px' }}>
                <option value="keyd">Keyd (.conf)</option>
                <option value="ahk">AutoHotkey (.ahk)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Config contents:</label>
              <textarea
                value={exportText}
                readOnly
                rows={15}
                style={{ fontFamily: 'monospace' }}
                onClick={e => e.target.select()}
              />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setIsExportModalOpen(false)}>Cancel</button>
              <button className="btn" style={{ marginRight: 'auto' }} onClick={() => {
                navigator.clipboard.writeText(exportText);
                setIsExportModalOpen(false);
              }}>Copy Text</button>
              <button className="btn primary" onClick={() => handleSaveFile(true)}>Download As...</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
