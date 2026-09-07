import { useState } from 'react';
import { GameState } from '../../types';
import { carveStructure } from '../../utils/structurePlacer';
import { DESIGNER_LEGEND } from './types';

export function useGodDesignerState(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  triggerSuccessLog: (msg: string) => void,
  setJsonError: (err: string | null) => void
) {
  const [designerWidth, setDesignerWidth] = useState<number>(6);
  const [designerHeight, setDesignerHeight] = useState<number>(6);
  const [designerId, setDesignerId] = useState<string>('custom_house_1');
  const [designerName, setDesignerName] = useState<string>('Cozy House');
  const [designerDescription, setDesignerDescription] = useState<string>(
    'A custom crafted house featuring clean wooden floorboards and brick wall bounds.'
  );
  const [designerEmoji, setDesignerEmoji] = useState<string>('🏠');
  const [designerPaintChar, setDesignerPaintChar] = useState<string>('#');
  const [designerGrid, setDesignerGrid] = useState<string[][]>(() => {
    return Array(6)
      .fill(null)
      .map(() => Array(6).fill('.'));
  });

  const [customX, setCustomX] = useState<number>(gameState?.playerX || 0);
  const [customY, setCustomY] = useState<number>(gameState?.playerY || 0);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tiny_shelter');

  const [structuresJsonText, setStructuresJsonText] = useState(() => {
    const list = (window as any).customStructures || [
      {
        id: 'combat_arena_custom',
        name: 'Custom Training Grounds',
        description: 'A custom blueprint containing training dummies and high walls generated on-the-fly.',
        emoji: '🏟️',
        width: 6,
        height: 6,
        grid: ['######', '#....#', '#.cc.#', '#.ff.#', '#....#', '##D###'],
        legend: {
          '#': 'Wall',
          '.': 'Floor',
          D: 'Door',
          c: 'Chair',
          f: 'Campfire'
        },
        enemies: [
          { rx: 2, ry: 1, type: 'Rat', name: 'Training Target r' },
          { rx: 3, ry: 4, type: 'Mage', name: 'Spelldummy S', isElite: true }
        ]
      }
    ];
    if (!(window as any).customStructures) {
      (window as any).customStructures = list;
    }
    return JSON.stringify(list, null, 2);
  });

  const adjustDesignerGridDimensions = (newW: number, newH: number) => {
    setDesignerWidth(newW);
    setDesignerHeight(newH);
    setDesignerGrid((prev) => {
      return Array(newH)
        .fill(null)
        .map((_, y) => {
          return Array(newW)
            .fill(null)
            .map((_, x) => {
              if (prev[y] && prev[y][x] !== undefined) {
                return prev[y][x];
              }
              return '.';
            });
        });
    });
  };

  const paintCell = (x: number, y: number) => {
    setDesignerGrid((prev) => {
      return prev.map((r, ri) => {
        return r.map((c, ci) => {
          if (ri === y && ci === x) {
            return designerPaintChar;
          }
          return c;
        });
      });
    });
  };

  const clearDesignerGrid = () => {
    setDesignerGrid(
      Array(designerHeight)
        .fill(null)
        .map(() => Array(designerWidth).fill('.'))
    );
    triggerSuccessLog('Reset designer grid to empty floor tiles!');
  };

  const surroundDesignerWithWalls = () => {
    setDesignerGrid((prev) => {
      return prev.map((row, y) => {
        return row.map((char, x) => {
          if (y === 0 || y === designerHeight - 1 || x === 0 || x === designerWidth - 1) {
            return '#';
          }
          return char;
        });
      });
    });
    triggerSuccessLog('Built wall shell surrounding the structure!');
  };

  const handleLoadPresetToDesigner = (preset: any) => {
    setDesignerId(preset.id);
    setDesignerName(preset.name);
    setDesignerDescription(preset.description || '');
    setDesignerEmoji(preset.emoji || '🏠');
    setDesignerWidth(preset.width);
    setDesignerHeight(preset.height);

    const parsedGrid: string[][] = Array(preset.height)
      .fill(null)
      .map((_, y) => {
        const rowStr = preset.grid[y] || '';
        return Array(preset.width)
          .fill(null)
          .map((_, x) => {
            const rawChar = rowStr[x];
            if (!rawChar) return '.';
            if (preset.legend) {
              const tileTypeName = preset.legend[rawChar];
              if (tileTypeName) {
                const standardChar = Object.keys(DESIGNER_LEGEND).find(
                  (key) => DESIGNER_LEGEND[key] === tileTypeName
                );
                if (standardChar) return standardChar;
              }
            }
            return rawChar;
          });
      });
    setDesignerGrid(parsedGrid);
    triggerSuccessLog(`Loaded template "${preset.name}" into visual painter!`);
  };

  const handleSaveCustomDesignerStructure = () => {
    if (!designerId.trim() || !designerName.trim()) {
      setJsonError('Structure ID and Display Name are required!');
      return;
    }
    const rows = designerGrid.map((row) => row.join(''));
    const newStructurePreset = {
      id: designerId.trim(),
      name: designerName.trim(),
      description: designerDescription.trim(),
      emoji: designerEmoji.trim(),
      width: designerWidth,
      height: designerHeight,
      grid: rows,
      legend: { ...DESIGNER_LEGEND }
    };

    let updatedList = [...((window as any).customStructures || [])];
    const existingIndex = updatedList.findIndex((p: any) => p.id === designerId);

    if (existingIndex >= 0) {
      updatedList[existingIndex] = newStructurePreset;
      triggerSuccessLog(`Successfully updated custom structure "${designerName}"!`);
    } else {
      updatedList.push(newStructurePreset);
      triggerSuccessLog(`Successfully compiled "${designerName}" to memory!`);
    }

    (window as any).customStructures = updatedList;
    setStructuresJsonText(JSON.stringify(updatedList, null, 2));
    setSelectedPresetId(designerId);
    setJsonError(null);
  };

  const handlePlaceDesignerStructure = () => {
    if (!designerId.trim() || !designerName.trim()) {
      setJsonError('Structure ID and Display Name are required before carving!');
      return;
    }
    const rows = designerGrid.map((row) => row.join(''));
    const newStructurePreset = {
      id: designerId.trim(),
      name: designerName.trim(),
      description: designerDescription.trim(),
      emoji: designerEmoji.trim(),
      width: designerWidth,
      height: designerHeight,
      grid: rows,
      legend: { ...DESIGNER_LEGEND }
    };

    let updatedList = [...((window as any).customStructures || [])];
    const existingIndex = updatedList.findIndex((p: any) => p.id === designerId);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = newStructurePreset;
    } else {
      updatedList.push(newStructurePreset);
    }
    (window as any).customStructures = updatedList;
    setStructuresJsonText(JSON.stringify(updatedList, null, 2));
    setSelectedPresetId(designerId);

    const finalX = Math.max(0, Math.min(gameState.levelWidth - 1, customX));
    const finalY = Math.max(0, Math.min(gameState.levelHeight - 1, customY));
    const result = carveStructure(gameState, designerId, finalX, finalY);
    if (result.success) {
      setGameState((prev) => ({
        ...prev,
        map: result.updatedMap,
        enemies: result.newEnemies,
        logs: [
          ...prev.logs,
          {
            id: `build_designer_structure_${Date.now()}`,
            text: `🔨 ARCHITECT: Visually painted & carved custom "${designerName}" directly onto coordinates (${finalX}, ${finalY})!`,
            type: 'system',
            timestamp: 'GOD'
          }
        ]
      }));
      setJsonError(null);
      triggerSuccessLog(`Carved "${designerName}" successfully at (${finalX}, ${finalY})!`);
    } else {
      setJsonError(result.error || `Carving structure failed coordinate bounds checks.`);
      setTimeout(() => setJsonError(null), 6000);
    }
  };

  const handleCopyBlueprintJson = () => {
    const rows = designerGrid.map((row) => row.join(''));
    const legendFiltered: Record<string, string> = {};
    rows.forEach((row) => {
      for (const char of row) {
        if (DESIGNER_LEGEND[char]) {
          legendFiltered[char] = DESIGNER_LEGEND[char];
        }
      }
    });
    const blueprint = {
      id: designerId.trim() || 'custom_house',
      name: designerName.trim() || 'Custom House',
      description: designerDescription.trim() || 'A custom painted house.',
      emoji: designerEmoji.trim() || '🏠',
      width: designerWidth,
      height: designerHeight,
      grid: rows,
      legend: legendFiltered
    };
    navigator.clipboard
      .writeText(JSON.stringify(blueprint, null, 2))
      .then(() => triggerSuccessLog(`Copied raw JSON for "${designerName}" to clipboard!`))
      .catch(() => triggerSuccessLog(`Failed to copy to clipboard`));
  };

  const handleCopyAsTsConstant = () => {
    const rows = designerGrid.map((row) => row.join(''));
    const legendFiltered: Record<string, string> = {};
    rows.forEach((row) => {
      for (const char of row) {
        if (DESIGNER_LEGEND[char]) {
          legendFiltered[char] = DESIGNER_LEGEND[char];
        }
      }
    });
    const tsCode = `  {
    id: '${designerId.trim() || 'custom_house'}',
    name: '${designerName.trim() || 'Custom House'}',
    description: '${designerDescription.trim() || 'A custom crafted structure.'}',
    emoji: '${designerEmoji.trim() || '🏠'}',
    width: ${designerWidth},
    height: ${designerHeight},
    grid: [
${rows.map((r) => `      "${r}"`).join(',\n')}
    ],
    legend: {
${Object.entries(legendFiltered)
  .map(([k, v]) => `      "${k}": "${v}"`)
  .join(',\n')}
    }
  }`;
    navigator.clipboard
      .writeText(tsCode)
      .then(() => triggerSuccessLog(`Copied TypeScript Preset Constant for "${designerName}" to clipboard!`))
      .catch(() => triggerSuccessLog(`Failed to copy TS Preset Code`));
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Must be a single JSON structure object.');
        }
        if (!parsed.id) throw new Error("Missing 'id' field in blueprint.");
        if (!parsed.name) throw new Error("Missing 'name' field in blueprint.");
        if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number') {
          throw new Error("Missing or invalid 'width' or 'height' fields (must be numbers).");
        }
        if (!parsed.grid || !Array.isArray(parsed.grid)) {
          throw new Error("Missing or invalid 'grid' field (must be an array of strings).");
        }
        const cleanWidth = Math.max(3, Math.min(12, parsed.width));
        const cleanHeight = Math.max(3, Math.min(12, parsed.height));
        setDesignerId(parsed.id);
        setDesignerName(parsed.name);
        setDesignerDescription(parsed.description || '');
        setDesignerEmoji(parsed.emoji || '🏠');
        setDesignerWidth(cleanWidth);
        setDesignerHeight(cleanHeight);
        const parsedGrid: string[][] = Array(cleanHeight)
          .fill(null)
          .map((_, y) => {
            const rowStr = parsed.grid[y] || '';
            return Array(cleanWidth)
              .fill(null)
              .map((_, x) => rowStr[x] || '.');
          });
        setDesignerGrid(parsedGrid);
        triggerSuccessLog(`Imported "${parsed.name}" blueprint successfully!`);
      } catch (err: any) {
        triggerSuccessLog(`⚠️ Import Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadBlueprintJson = () => {
    const rows = designerGrid.map((row) => row.join(''));
    const legendFiltered: Record<string, string> = {};
    rows.forEach((row) => {
      for (const char of row) {
        if (DESIGNER_LEGEND[char]) {
          legendFiltered[char] = DESIGNER_LEGEND[char];
        }
      }
    });
    const blueprint = {
      id: designerId.trim() || 'custom_house',
      name: designerName.trim() || 'Custom House',
      description: designerDescription.trim() || 'A custom painted house.',
      emoji: designerEmoji.trim() || '🏠',
      width: designerWidth,
      height: designerHeight,
      grid: rows,
      legend: legendFiltered
    };
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${designerId.trim() || 'custom_house'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerSuccessLog(`Downloaded "${designerName}" blueprint file successfully!`);
  };

  const handleApplyStructuresJson = () => {
    try {
      const parsed = JSON.parse(structuresJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Custom structures configuration must be a JSON array!');
      }
      (window as any).customStructures = parsed;
      triggerSuccessLog(`Successfully applied ${parsed.length} custom structure presets!`);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleResetStructures = () => {
    (window as any).customStructures = [];
    setStructuresJsonText('[]');
    triggerSuccessLog('Reset custom structures to factory presets!');
  };

  return {
    designerWidth,
    designerHeight,
    designerId,
    setDesignerId,
    designerName,
    setDesignerName,
    designerDescription,
    setDesignerDescription,
    designerEmoji,
    setDesignerEmoji,
    designerPaintChar,
    setDesignerPaintChar,
    designerGrid,
    customX,
    setCustomX,
    customY,
    setCustomY,
    selectedPresetId,
    setSelectedPresetId,
    structuresJsonText,
    setStructuresJsonText,
    adjustDesignerGridDimensions,
    paintCell,
    clearDesignerGrid,
    surroundDesignerWithWalls,
    handleLoadPresetToDesigner,
    handleSaveCustomDesignerStructure,
    handlePlaceDesignerStructure,
    handleCopyBlueprintJson,
    handleCopyAsTsConstant,
    handleImportFile,
    handleDownloadBlueprintJson,
    handleApplyStructuresJson,
    handleResetStructures
  };
}
