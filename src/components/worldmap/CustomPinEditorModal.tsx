import React, { useState } from 'react';
import { CustomMapPin, MapPinIcon } from './types';
import { X, MapPin, Trash2, Check } from 'lucide-react';

interface CustomPinEditorModalProps {
  isOpen: boolean;
  chunkX: number;
  chunkY: number;
  existingPin?: CustomMapPin | null;
  onSavePin: (pin: CustomMapPin) => void;
  onDeletePin?: (pinId: string) => void;
  onClose: () => void;
}

const PIN_ICONS: { id: MapPinIcon; emoji: string; label: string }[] = [
  { id: 'star', emoji: '⭐', label: 'Landmark' },
  { id: 'sword', emoji: '⚔️', label: 'Dungeon' },
  { id: 'shield', emoji: '🛡️', label: 'Fortress' },
  { id: 'mine', emoji: '⛏️', label: 'Ore Vein' },
  { id: 'gem', emoji: '💎', label: 'Treasury' },
  { id: 'danger', emoji: '💀', label: 'Boss Threat' },
  { id: 'camp', emoji: '🏕️', label: 'Campsite' },
  { id: 'loot', emoji: '📦', label: 'Stash' },
  { id: 'herb', emoji: '🌿', label: 'Herb Grove' },
  { id: 'portal', emoji: '🌀', label: 'Leyline' }
];

const PIN_COLORS = [
  { id: '#f59e0b', name: 'Amber' },
  { id: '#ef4444', name: 'Ruby' },
  { id: '#3b82f6', name: 'Sapphire' },
  { id: '#10b981', name: 'Emerald' },
  { id: '#a855f7', name: 'Amethyst' },
  { id: '#06b6d4', name: 'Cyan' },
  { id: '#ec4899', name: 'Rose' },
  { id: '#e2e8f0', name: 'Silver' }
];

export const CustomPinEditorModal: React.FC<CustomPinEditorModalProps> = ({
  isOpen,
  chunkX,
  chunkY,
  existingPin,
  onSavePin,
  onDeletePin,
  onClose
}) => {
  const [label, setLabel] = useState(existingPin?.label || '');
  const [icon, setIcon] = useState<MapPinIcon>(existingPin?.icon || 'star');
  const [color, setColor] = useState(existingPin?.color || '#f59e0b');
  const [notes, setNotes] = useState(existingPin?.notes || '');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const pin: CustomMapPin = {
      id: existingPin?.id || `pin_${Date.now()}_${chunkX}_${chunkY}`,
      chunkX,
      chunkY,
      label: label.trim(),
      icon,
      color,
      notes: notes.trim()
    };

    onSavePin(pin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-5 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {existingPin ? 'Edit Cartographer Pin' : 'Place Realm Map Pin'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Sector Location: [{chunkX}, {chunkY}]
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Label */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Pin Label / Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Rich Iron Mine, Dragon Cave..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              maxLength={40}
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5">Pin Marker Icon</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {PIN_ICONS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setIcon(item.id)}
                  className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    icon === item.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold scale-105'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={item.label}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-[9px] truncate w-full text-center">{item.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Accent */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5">Color Theme</label>
            <div className="flex items-center gap-2">
              {PIN_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center border-2 ${
                    color === c.id ? 'scale-115 border-white' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.id }}
                  title={c.name}
                >
                  {color === c.id && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Explorer Notes (Optional)</label>
            <textarea
              placeholder="e.g. Deep underground vein found near the eastern river bank..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none h-18"
              maxLength={150}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            {existingPin && onDeletePin ? (
              <button
                type="button"
                onClick={() => {
                  onDeletePin(existingPin.id);
                  onClose();
                }}
                className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Pin</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer shadow"
              >
                {existingPin ? 'Save Changes' : 'Place Pin'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
