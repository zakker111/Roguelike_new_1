/**
 * Sovereign God Panel Tab: Unified Event Bus & Hook Pipeline Inspector.
 * Displays real-time event telemetry, active pipeline middlewares, listener counts,
 * and an interactive event dispatch testing console.
 */

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  Filter,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { gameEventBus } from '../../events/core/EventBus';
import { damagePipeline } from '../../events/pipeline/pipelines/damagePipeline';
import { movementPipeline } from '../../events/pipeline/pipelines/movementPipeline';
import { lootPipeline } from '../../events/pipeline/pipelines/lootPipeline';
import { spellPipeline } from '../../events/pipeline/pipelines/spellPipeline';
import { hookRegistry } from '../../events/registry/HookRegistry';
import { EventTelemetryRecord } from '../../events/types';

export const GodEventInspectorTab: React.FC = () => {
  const [telemetry, setTelemetry] = useState<EventTelemetryRecord[]>([]);
  const [throughput, setThroughput] = useState({ totalDispatched: 0, eventsPerSec: 0 });
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Test event dispatcher state
  const [testEventType, setTestEventType] = useState<string>('combat:attack');
  const [testPayloadJson, setTestPayloadJson] = useState<string>(
    JSON.stringify(
      {
        attackerId: 'player',
        targetId: 'dummy_goblin',
        isPlayerAttacker: true,
        rawDamage: 45,
        isCrit: true,
      },
      null,
      2
    )
  );
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  // Auto-refresh telemetry every 500ms
  useEffect(() => {
    const updateStats = () => {
      setTelemetry(gameEventBus.getTelemetryHistory());
      setThroughput(gameEventBus.getThroughputStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 500);
    return () => clearInterval(interval);
  }, []);

  const handleClearHistory = () => {
    gameEventBus.clearTelemetry();
    setTelemetry([]);
    setDispatchStatus('Telemetry history cleared.');
    setTimeout(() => setDispatchStatus(null), 2500);
  };

  const handleDispatchTestEvent = () => {
    try {
      const parsed = JSON.parse(testPayloadJson);
      gameEventBus.emit(testEventType as any, parsed);
      setDispatchStatus(`Dispatched '${testEventType}' successfully.`);
      setTelemetry(gameEventBus.getTelemetryHistory());
      setThroughput(gameEventBus.getThroughputStats());
      setTimeout(() => setDispatchStatus(null), 3000);
    } catch (err: any) {
      setDispatchStatus(`Error: Invalid JSON payload - ${err.message}`);
    }
  };

  const activeListeners = gameEventBus.getActiveListeners();
  const damageStats = damagePipeline.getStats();
  const movementStats = movementPipeline.getStats();
  const lootStats = lootPipeline.getStats();
  const spellStats = spellPipeline.getStats();

  const filteredTelemetry = telemetry.filter((rec) => {
    if (selectedEventFilter === 'all') return true;
    if (selectedEventFilter === 'combat') return rec.event.startsWith('combat:');
    if (selectedEventFilter === 'movement') return rec.event.startsWith('movement:');
    if (selectedEventFilter === 'spell') return rec.event.startsWith('spell:');
    if (selectedEventFilter === 'world') return rec.event.startsWith('weather:') || rec.event.startsWith('chaos:') || rec.event.startsWith('time:');
    return rec.event === selectedEventFilter;
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner & Overview */}
      <div className="bg-slate-950/80 border border-cyan-500/40 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-cyan-300 tracking-wide uppercase">
              Unified Event Bus & Hook Pipeline Monitor
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time inspection of reactive event dispatchers, priority subscribers, and composable action mutator
            pipelines (Damage, Movement, Loot, Spellcasting).
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            Clear Log
          </button>
        </div>
      </div>

      {/* Key Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Throughput
          </div>
          <div className="mt-2 text-xl font-black text-cyan-300">
            {throughput.eventsPerSec} <span className="text-xs font-normal text-slate-400">evt/sec</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Total Dispatched: {throughput.totalDispatched.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Active Listeners
          </div>
          <div className="mt-2 text-xl font-black text-emerald-300">
            {activeListeners.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Priority Sorted & Safe-Sandboxed
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            Action Pipelines
          </div>
          <div className="mt-2 text-xl font-black text-amber-300">
            4 <span className="text-xs font-normal text-slate-400">Pipelines</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Damage, Move, Loot, Spell
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Avg Latency
          </div>
          <div className="mt-2 text-xl font-black text-purple-300">
            {damageStats.avgTimeMs} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Damage Pipeline Execution
          </div>
        </div>
      </div>

      {/* Middle Section: Active Pipelines & Test Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipelines Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              Action Mutator Pipelines
            </h4>
            <span className="text-[10px] text-slate-400">
              {damageStats.middlewareCount + movementStats.middlewareCount + lootStats.middlewareCount + spellStats.middlewareCount} Total Interceptors
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="font-bold text-red-400 flex justify-between">
                <span>💥 Damage Pipeline</span>
                <span className="text-[10px] text-slate-400">{damageStats.middlewareCount} hooks</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Executions: {damageStats.executionCount} • Latency: {damageStats.avgTimeMs}ms
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="font-bold text-teal-400 flex justify-between">
                <span>👣 Movement Pipeline</span>
                <span className="text-[10px] text-slate-400">{movementStats.middlewareCount} hooks</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Executions: {movementStats.executionCount} • Latency: {movementStats.avgTimeMs}ms
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="font-bold text-yellow-400 flex justify-between">
                <span>💰 Loot Pipeline</span>
                <span className="text-[10px] text-slate-400">{lootStats.middlewareCount} hooks</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Executions: {lootStats.executionCount} • Latency: {lootStats.avgTimeMs}ms
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="font-bold text-purple-400 flex justify-between">
                <span>✨ Spell Pipeline</span>
                <span className="text-[10px] text-slate-400">{spellStats.middlewareCount} hooks</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Executions: {spellStats.executionCount} • Latency: {spellStats.avgTimeMs}ms
              </div>
            </div>
          </div>

          <div className="mt-3">
            <h5 className="text-[11px] font-bold text-slate-300 uppercase mb-1.5">
              Active Event Bus Subscribers ({activeListeners.length})
            </h5>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] scrollbar-thin">
              {activeListeners.length === 0 ? (
                <div className="text-slate-500 italic p-2 text-center">No active listeners registered.</div>
              ) : (
                activeListeners.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded border border-slate-800/80"
                  >
                    <span className="text-cyan-300">{l.event}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {l.priority}
                      </span>
                      {l.tag && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                          {l.tag}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Interactive Event Dispatcher Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Send className="w-4 h-4 text-cyan-400" />
              Interactive Event Dispatcher
            </h4>
            <span className="text-[10px] text-slate-400">Sandbox Injection</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">
                Event Type
              </label>
              <select
                value={testEventType}
                onChange={(e) => {
                  const ev = e.target.value;
                  setTestEventType(ev);
                  if (ev === 'combat:attack') {
                    setTestPayloadJson(JSON.stringify({ attackerId: 'player', targetId: 'dummy_orc', isPlayerAttacker: true, rawDamage: 30, isCrit: true }, null, 2));
                  } else if (ev === 'movement:step') {
                    setTestPayloadJson(JSON.stringify({ actorId: 'player', fromX: 10, fromY: 10, toX: 11, toY: 10, distance: 1 }, null, 2));
                  } else if (ev === 'weather:changed') {
                    setTestPayloadJson(JSON.stringify({ previousWeather: 'clear', newWeather: 'thunderstorm' }, null, 2));
                  } else if (ev === 'chaos:surged') {
                    setTestPayloadJson(JSON.stringify({ previousScore: 35, newScore: 60, surgeTitle: 'Abyssal Fog', intensity: 2 }, null, 2));
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="combat:attack">combat:attack</option>
                <option value="combat:damage">combat:damage</option>
                <option value="combat:kill">combat:kill</option>
                <option value="movement:step">movement:step</option>
                <option value="movement:chunk_transition">movement:chunk_transition</option>
                <option value="weather:changed">weather:changed</option>
                <option value="chaos:surged">chaos:surged</option>
                <option value="spell:cast">spell:cast</option>
                <option value="turn:completed">turn:completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">
                JSON Payload
              </label>
              <textarea
                value={testPayloadJson}
                onChange={(e) => setTestPayloadJson(e.target.value)}
                rows={5}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 font-mono text-[11px] rounded p-2 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleDispatchTestEvent}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Dispatch Event
              </button>

              {dispatchStatus && (
                <div
                  className={`text-[11px] flex items-center gap-1 font-mono ${
                    dispatchStatus.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {dispatchStatus.startsWith('Error') ? (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate max-w-[200px]">{dispatchStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Live Dispatched Event Stream */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">
              Dispatched Event Stream (Last 50)
            </h4>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {filteredTelemetry.length} shown
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Events</option>
              <option value="combat">Combat (*)</option>
              <option value="movement">Movement (*)</option>
              <option value="spell">Spell (*)</option>
              <option value="world">World & Atmosphere</option>
            </select>
          </div>
        </div>

        <div className="border border-slate-800 rounded-lg overflow-hidden max-h-72 overflow-y-auto font-mono text-[11px] scrollbar-thin bg-slate-900/50">
          {filteredTelemetry.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">
              No matching events dispatched yet. Take a step or dispatch a test event above!
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredTelemetry.map((rec) => {
                const isExpanded = expandedRecordId === rec.id;
                const timeStr = new Date(rec.timestamp).toLocaleTimeString();
                return (
                  <div key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <div
                      onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer gap-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="text-[10px] text-slate-500 shrink-0">{timeStr}</span>
                        <span
                          className={`font-bold truncate ${
                            rec.event.startsWith('combat:')
                              ? 'text-red-400'
                              : rec.event.startsWith('movement:')
                              ? 'text-teal-400'
                              : rec.event.startsWith('spell:')
                              ? 'text-purple-400'
                              : 'text-cyan-300'
                          }`}
                        >
                          {rec.event}
                        </span>
                        {rec.wasCancelled && (
                          <span className="text-[9px] bg-red-950 text-red-300 border border-red-800 px-1 py-0.2 rounded font-sans">
                            CANCELLED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-[10px] text-slate-400">
                        <span>{rec.durationMs}ms</span>
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                          {rec.subscriberCount} subs
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-300 font-mono">
                        <div className="mb-1 text-slate-500">Payload Summary:</div>
                        <pre className="p-2 bg-slate-900 rounded border border-slate-800 text-cyan-200 overflow-x-auto whitespace-pre-wrap">
                          {rec.payloadSummary}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
