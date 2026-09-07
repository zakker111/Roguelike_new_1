import React, { useState, useEffect } from 'react';
import { getEnemyTemplate } from '../../utils/dungeon';
import townTemplates from '../../data/townTemplates.json';

export function useGodBlueprintState(
  triggerSuccessLog: (msg: string) => void,
  setJsonError: (err: string | null) => void
) {
  // JSON editors state
  const [enemiesJsonText, setEnemiesJsonText] = useState(() => {
    const list = (window as any).customEnemies || [];
    return JSON.stringify(list, null, 2);
  });

  const [customEnemiesState, setCustomEnemiesState] = useState<any[]>(() => {
    return (window as any).customEnemies || [];
  });

  // Visual Form state for Enemy Blueprint Editor
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState<number | null>(0);
  const [formType, setFormType] = useState<string>('Rat');
  const [formName, setFormName] = useState<string>('Giant Plague Rat');
  const [formBaseHp, setFormBaseHp] = useState<number>(8);
  const [formBaseAtk, setFormBaseAtk] = useState<number>(2);
  const [formBaseDef, setFormBaseDef] = useState<number>(0);
  const [formRange, setFormRange] = useState<number>(1);
  const [formSpeed, setFormSpeed] = useState<number>(1.0);
  const [formChar, setFormChar] = useState<string>('r');
  const [formColor, setFormColor] = useState<string>('#a1a1aa');

  // Load first template on mount if available
  useEffect(() => {
    const first = (window as any).customEnemies?.[0];
    if (first) {
      setSelectedEnemyIndex(0);
      setFormType(first.type || '');
      setFormName(first.name || '');
      setFormBaseHp(first.baseHp !== undefined ? first.baseHp : first.hp || 10);
      setFormBaseAtk(first.baseAtk !== undefined ? first.baseAtk : first.atk || 3);
      setFormBaseDef(first.baseDef !== undefined ? first.baseDef : first.def || 0);
      setFormRange(first.range || 1);
      setFormSpeed(first.speed || 1.0);
      setFormChar(first.char || 'r');
      setFormColor(first.color || '#a1a1aa');
    }
  }, []);

  const selectEnemyTemplate = (index: number) => {
    const enemy = customEnemiesState[index];
    if (enemy) {
      setSelectedEnemyIndex(index);
      setFormType(enemy.type || '');
      setFormName(enemy.name || '');
      setFormBaseHp(enemy.baseHp !== undefined ? enemy.baseHp : enemy.hp || 10);
      setFormBaseAtk(enemy.baseAtk !== undefined ? enemy.baseAtk : enemy.atk || 3);
      setFormBaseDef(enemy.baseDef !== undefined ? enemy.baseDef : enemy.def || 0);
      setFormRange(enemy.range || 1);
      setFormSpeed(enemy.speed || 1.0);
      setFormChar(enemy.char || 'E');
      setFormColor(enemy.color || '#ea580c');
    }
  };

  const createNewEnemyTemplate = () => {
    setSelectedEnemyIndex(null);
    setFormType('SkeletonArcher');
    setFormName('Skeletal Archer');
    setFormBaseHp(25);
    setFormBaseAtk(5);
    setFormBaseDef(1);
    setFormRange(3);
    setFormSpeed(1.1);
    setFormChar('🏹');
    setFormColor('#94a3b8');
  };

  const saveEnemyTemplate = () => {
    if (!formType.trim() || !formName.trim()) {
      setJsonError('Type ID and Display Name are required!');
      return;
    }
    const cleanType = formType.replace(/\s+/g, '');
    const newRecord = {
      type: cleanType,
      name: formName,
      baseHp: formBaseHp,
      baseAtk: formBaseAtk,
      baseDef: formBaseDef,
      range: formRange,
      speed: formSpeed,
      char: formChar,
      color: formColor
    };

    let updatedList = [...customEnemiesState];
    if (selectedEnemyIndex !== null && selectedEnemyIndex >= 0 && selectedEnemyIndex < updatedList.length) {
      updatedList[selectedEnemyIndex] = newRecord;
      triggerSuccessLog(`Successfully updated blueprint "${formName}"!`);
    } else {
      const isDuplicate = updatedList.some((e) => e.type.toLowerCase() === cleanType.toLowerCase());
      if (isDuplicate) {
        setJsonError(`A blueprint with Type ID "${cleanType}" already exists! Select it to edit or use a unique ID.`);
        setTimeout(() => setJsonError(null), 4000);
        return;
      }
      updatedList.push(newRecord);
      setSelectedEnemyIndex(updatedList.length - 1);
      triggerSuccessLog(`Successfully added brand new blueprint "${formName}"!`);
    }

    (window as any).customEnemies = updatedList;
    setCustomEnemiesState(updatedList);
    setEnemiesJsonText(JSON.stringify(updatedList, null, 2));
    setJsonError(null);
  };

  const deleteEnemyTemplate = (index: number, ev: React.MouseEvent) => {
    ev.stopPropagation();
    const updatedList = customEnemiesState.filter((_, i) => i !== index);
    (window as any).customEnemies = updatedList;
    setCustomEnemiesState(updatedList);
    setEnemiesJsonText(JSON.stringify(updatedList, null, 2));
    setSelectedEnemyIndex(null);
    triggerSuccessLog('Blueprint removed successfully!');
  };

  const handleApplyEnemiesJson = () => {
    try {
      const parsed = JSON.parse(enemiesJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Custom enemies configuration must be a JSON array of blueprints!');
      }
      (window as any).customEnemies = parsed;
      setCustomEnemiesState(parsed);
      triggerSuccessLog(`Successfully applied ${parsed.length} custom enemy blueprints!`);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleResetEnemies = () => {
    (window as any).customEnemies = [];
    setCustomEnemiesState([]);
    setEnemiesJsonText('[]');
    setSelectedEnemyIndex(null);
    triggerSuccessLog('Reset custom enemies array to default!');
  };

  const [housesJsonText, setHousesJsonText] = useState(() => {
    const list = (window as any).customHouses || [];
    return JSON.stringify(list, null, 2);
  });

  const [selectedLayoutIndex, setSelectedLayoutIndex] = useState(0);

  const handleSelectTownLayout = (layoutIdx: number) => {
    setSelectedLayoutIndex(layoutIdx);
    const layout = townTemplates.townLayouts[layoutIdx];
    if (layout) {
      const width = 50;
      const height = 30;
      const coordinates = layout.buildings.map((b: any) => {
        let computedX = 0;
        let computedY = 0;

        if (typeof b.x === 'string') {
          const str = b.x.trim();
          if (str.startsWith('w/')) {
            const denom = parseInt(str.split('/')[1] || '2', 10);
            computedX = Math.floor(width / denom);
          } else {
            computedX = parseInt(str, 10);
          }
        } else {
          computedX = b.x;
        }

        if (typeof b.y === 'string') {
          const str = b.y.trim();
          if (str.startsWith('h/')) {
            const denom = parseInt(str.split('/')[1] || '2', 10);
            computedY = Math.floor(height / denom);
          } else {
            computedY = parseInt(str, 10);
          }
        } else {
          computedY = b.y;
        }

        return {
          id: b.id,
          name: b.name,
          x: computedX,
          y: computedY,
          w: b.w,
          h: b.h
        };
      });

      setHousesJsonText(JSON.stringify(coordinates, null, 2));
      triggerSuccessLog(`Loaded layout template: "${layout.name}" (${layout.buildings.length} structures)`);
    }
  };

  const handleApplyHousesJson = () => {
    try {
      const parsed = JSON.parse(housesJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Custom houses configuration must be a JSON array!');
      }
      (window as any).customHouses = parsed;
      triggerSuccessLog(`Successfully applied ${parsed.length} custom settlement buildings!`);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleResetHouses = () => {
    (window as any).customHouses = [];
    setHousesJsonText('[]');
    triggerSuccessLog('Reset custom houses to procedural default!');
  };

  return {
    customEnemiesState,
    selectedEnemyIndex,
    selectEnemyTemplate,
    createNewEnemyTemplate,
    deleteEnemyTemplate,
    saveEnemyTemplate,
    handleResetEnemies,
    handleApplyEnemiesJson,
    formType,
    setFormType,
    formName,
    setFormName,
    formChar,
    setFormChar,
    formColor,
    setFormColor,
    formBaseHp,
    setFormBaseHp,
    formBaseAtk,
    setFormBaseAtk,
    formBaseDef,
    setFormBaseDef,
    formRange,
    setFormRange,
    formSpeed,
    setFormSpeed,
    enemiesJsonText,
    setEnemiesJsonText,
    housesJsonText,
    setHousesJsonText,
    selectedLayoutIndex,
    handleSelectTownLayout,
    handleApplyHousesJson,
    handleResetHouses
  };
}
