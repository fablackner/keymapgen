import { useState, useEffect } from 'react';
import { Keyboard } from './components/Keyboard';
import { Editor } from './components/Editor';
import { parseKeymap, generateKeymap } from './utils/keymapParser';
import { parseAhkKeymap, generateAhkKeymap } from './utils/ahkParser';
import { DEFAULT_KEYMAP } from './utils/defaultKeymap';
import { PRESETS } from './utils/presets';

function App() {
  const [keymap, setKeymap] = useState(DEFAULT_KEYMAP);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [layout, setLayout] = useState('en');

  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [loadText, setLoadText] = useState('');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportText, setExportText] = useState('');
  const [fileName, setFileName] = useState('keymap.conf');
  const [exportFormat, setExportFormat] = useState('keyd');

  const activeLayer = keymap.layers[activeLayerIndex] || keymap.layers[0];

  const handleKeyClick = (keyId) => {
    setSelectedKeyId(keyId);
  };

  const handleActionChange = (newAction) => {
    if (!selectedKeyId) return;

    setKeymap(prev => {
      const newKeymap = { ...prev, layers: [...prev.layers] };
      const layerToUpdate = { ...newKeymap.layers[activeLayerIndex], mappings: { ...newKeymap.layers[activeLayerIndex].mappings } };

      if (newAction === '') {
        delete layerToUpdate.mappings[selectedKeyId];
      } else {
        layerToUpdate.mappings[selectedKeyId] = newAction;
      }

      newKeymap.layers[activeLayerIndex] = layerToUpdate;
      return newKeymap;
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

      setKeymap(prev => ({
        ...prev,
        layers: [...prev.layers, { name, modifier, mappings: {} }]
      }));
      setActiveLayerIndex(keymap.layers.length);
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

      setKeymap(prev => {
        const newKeymap = { ...prev, layers: [...prev.layers] };
        newKeymap.layers[activeLayerIndex] = { ...newKeymap.layers[activeLayerIndex], name, modifier };
        return newKeymap;
      });
    }
  };

  const removeLayer = () => {
    if (activeLayerIndex === 0) return; // Cannot remove main layer
    if (window.confirm(`Are you sure you want to remove the layer "${activeLayer.name}"?`)) {
      setKeymap(prev => {
        const newLayers = prev.layers.filter((_, idx) => idx !== activeLayerIndex);
        return { ...prev, layers: newLayers };
      });
      setActiveLayerIndex(0);
    }
  };

  const loadKeymap = () => {
    try {
      let parsed;
      if (loadText.includes('#If') || loadText.includes('::')) {
        parsed = parseAhkKeymap(loadText);
        setFileName('keymap.ahk');
        setExportFormat('ahk');
      } else {
        parsed = parseKeymap(loadText);
        setFileName('keymap.conf');
        setExportFormat('keyd');
      }
      setKeymap(parsed);
      setActiveLayerIndex(0);
      setIsLoadModalOpen(false);
      setLoadText('');
    } catch (e) {
      alert("Error parsing keymap: " + e.message);
    }
  };

  const handleLoadPreset = (preset) => {
    try {
      const parsed = parseKeymap(preset.content);
      setKeymap(parsed);
      setActiveLayerIndex(0);
      setFileName(preset.filename);
      setExportFormat('keyd');
      if (preset.layout) {
        setLayout(preset.layout);
      }
      setIsLoadModalOpen(false);
      setLoadText('');
    } catch (e) {
      alert("Error loading preset: " + e.message);
    }
  };

  const openExportModal = () => {
    if (exportFormat === 'ahk') {
      setExportText(generateAhkKeymap(keymap));
    } else {
      setExportText(generateKeymap(keymap));
    }
    setIsExportModalOpen(true);
  };

  useEffect(() => {
    if (isExportModalOpen) {
      if (exportFormat === 'ahk') {
        setExportText(generateAhkKeymap(keymap));
        setFileName(prev => prev.endsWith('.conf') ? prev.replace('.conf', '.ahk') : prev.endsWith('.ahk') ? prev : 'keymap.ahk');
      } else {
        setExportText(generateKeymap(keymap));
        setFileName(prev => prev.endsWith('.ahk') ? prev.replace('.ahk', '.conf') : prev.endsWith('.conf') ? prev : 'keymap.conf');
      }
    }
  }, [exportFormat, keymap, isExportModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isLoadModalOpen) setIsLoadModalOpen(false);
        if (isExportModalOpen) setIsExportModalOpen(false);
      }
    };

    if (isLoadModalOpen || isExportModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isLoadModalOpen, isExportModalOpen]);

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
      const parsed = file.name.toLowerCase().endsWith('.ahk') ? parseAhkKeymap(contents) : parseKeymap(contents);
      setKeymap(parsed);
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
    const finalKeymapStr = exportFormat === 'ahk' ? generateAhkKeymap(keymap) : generateKeymap(keymap);
    const blob = new Blob([finalKeymapStr], { type: 'text/plain' });
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
          <button className="btn" onClick={() => setIsLoadModalOpen(true)}>Load Keymap</button>
          <button className="btn primary" onClick={openExportModal}>Export Keymap</button>
        </div>
      </div>

      <div className="main-content">
        <div className="workspace">
          <div className="layer-tabs" style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {keymap.layers.map((layer, index) => (
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
          layers={keymap.layers}
        />
      </div>

      {isLoadModalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsLoadModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: '650px' }}>
            <h2>Load Keymap</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 600 }}>
                Presets:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '0.65rem' }}>
                {PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    className="btn"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.85rem 0.5rem',
                      textAlign: 'center',
                      border: preset.id === 'blank' ? '1px dashed var(--accent, #38bdf8)' : '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      background: 'var(--bg-color)'
                    }}
                    onClick={() => handleLoadPreset(preset)}
                  >
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: preset.id === 'blank' ? 'var(--accent, #38bdf8)' : 'var(--text-main)' }}>
                      {preset.id === 'blank' ? 'Clear' : preset.name}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {preset.id === 'blank' ? 'Blank keymap' : preset.filename}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    Load from file
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Supply a keyd .conf file from your disk
                  </div>
                </div>
                <button className="btn" onClick={handleOpenFile} style={{ padding: '0.5rem 1rem' }}>
                  Choose .conf File
                </button>
              </div>
            </div>

            <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <label style={{ fontWeight: 600 }}>Or paste keyd .conf text:</label>
              <textarea
                value={loadText}
                onChange={e => setLoadText(e.target.value)}
                placeholder="[ids]&#10;*&#10;&#10;[main]&#10;q = q&#10;..."
                rows={7}
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setIsLoadModalOpen(false)}>Cancel</button>
              <button className="btn primary" onClick={loadKeymap}>Load Text</button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsExportModalOpen(false); }}>
          <div className="modal">
            <h2>Export Keymap</h2>
            <div className="form-group" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ margin: 0 }}>Format:</label>
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px' }}>
                <option value="keyd">Keyd (.conf)</option>
                <option value="ahk">AutoHotkey (.ahk)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Keymap contents:</label>
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
