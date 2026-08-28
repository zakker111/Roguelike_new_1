import React from 'react';
import { GameState } from '../../types';

export interface WeatherForecastBannerProps {
  gameState: GameState;
}

export const WeatherForecastBanner: React.FC<WeatherForecastBannerProps> = ({ gameState }) => {
  if (!gameState.isOverworld) return null;

  return (
    <div id="weather-forecast-banner" className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-3 shadow-xl select-none animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center text-xl shadow-inner border border-slate-800">
            {gameState.weather === 'clear'
              ? '☀️'
              : gameState.weather === 'rainy'
              ? '🌧️'
              : gameState.weather === 'foggy'
              ? '🌫️'
              : gameState.weather === 'snowy'
              ? '❄️'
              : gameState.weather === 'sandstorm'
              ? '🌪️'
              : '🌨️'}
          </div>
          <div>
            <div className="flex items-center gap-2 text-left">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Atmospheric Status
              </span>
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-bold px-1.5 py-0.5 rounded uppercase">
                {gameState.season || 'spring'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              {gameState.weather === 'clear' && '☀️ Clear Skies'}
              {gameState.weather === 'rainy' && '🌧️ Pouring Rain & Storms'}
              {gameState.weather === 'foggy' && '🌫️ Thick Ambient Fog'}
              {gameState.weather === 'snowy' && '❄️ Gentle Frosty Snowfall'}
              {gameState.weather === 'sandstorm' && '🌪️ Swirling Sandstorm'}
              {gameState.weather === 'blizzard' && '🌨️ Severe Glacial Blizzard'}
            </h4>
          </div>
        </div>

        {/* Active Modifiers brief badge */}
        <div className="flex flex-wrap gap-2 items-center justify-between sm:justify-end w-full sm:w-auto">
          <span className="text-[11px] font-mono text-slate-400 max-w-[200px] sm:max-w-[320px] leading-tight text-left">
            {gameState.weather === 'clear' &&
              '☀️ Standard traveling speeds, clear fields of view.'}
            {gameState.weather === 'rainy' &&
              '⚡ +30% Lightning catalyst, -20% Fire dmg, instant fishing bites!'}
            {gameState.weather === 'foggy' &&
              '🌫️ Vision is restricted, but +15% stealth dodge rate active!'}
            {gameState.weather === 'snowy' &&
              '❄️ Fire attacks deal +20% damage. Small chance to slip.'}
            {gameState.weather === 'sandstorm' &&
              '🐫 Blinds normal attacks. (Tip: Equip Dune-Treader boots for desert immunity!)'}
            {gameState.weather === 'blizzard' &&
              '🌨️ Freezing fatigue outdoor penalty. Frost deals +40% dmg! (Tip: Equip heavy Worg-Spiked gear!)'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherForecastBanner;
