import React from 'react';
import { Clock, MapPin, Compass, Map, Navigation } from 'lucide-react';
import { GameState, TileType } from '../../types';
import { getNextStepTowards } from '../../utils/ai';

export interface GodNpcRoutePlannerProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  selectedSimNpcId: string | null;
  setSelectedSimNpcId: (id: string | null) => void;
  simHour: number;
  setSimHour: (hour: number) => void;
  simWeather: 'clear' | 'rainy' | 'snowy';
  setSimWeather: (weather: 'clear' | 'rainy' | 'snowy') => void;
  onRegenerateCurrentLocation: () => void;
  triggerSuccessLog: (msg: string) => void;
}

export function GodNpcRoutePlanner({
  gameState,
  setGameState,
  selectedSimNpcId,
  setSelectedSimNpcId,
  simHour,
  setSimHour,
  simWeather,
  setSimWeather,
  onRegenerateCurrentLocation,
  triggerSuccessLog,
}: GodNpcRoutePlannerProps) {
  const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
  const currentChunk = gameState.overworldChunks?.[chunkKey];
  const groundMap = currentChunk?.map || gameState.map;
  const secondMap = currentChunk?.secondFloorMap || null;
  const activeNpcs = gameState.npcs || [];

  // Local Helper to find tiles in map
  const findTileInMapLocal = (map: TileType[][], tileType: TileType, refX: number, refY: number) => {
    let bestX = -1;
    let bestY = -1;
    let bestDist = 9999;
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y] && map[y][x] === tileType) {
          const d = Math.abs(x - refX) + Math.abs(y - refY);
          if (d < bestDist) {
            bestDist = d;
            bestX = x;
            bestY = y;
          }
        }
      }
    }
    return bestX !== -1 ? { x: bestX, y: bestY } : null;
  };

  // Calculate current real-time state for an NPC
  const calculateNpcTargetAndState = (npc: any, hr: number, wet: string) => {
    let sched: 'home' | 'work' | 'leisure' = 'work';
    if (hr >= 20 || hr < 7) {
      sched = 'home';
    } else if (wet === 'rainy' || wet === 'snowy' || (hr >= 16 && hr < 20)) {
      const isTavernVisitor = npc.id?.includes('villager') || npc.id?.includes('apothecary') || npc.id?.includes('companion') || npc.id?.includes('merchant');
      if (isTavernVisitor) {
        sched = 'leisure';
      } else {
        sched = 'home';
      }
    }

    let tx = npc.workX;
    let ty = npc.workY;
    let tz = npc.workZ || 0;

    if (sched === 'home') {
      tx = npc.homeX;
      ty = npc.homeY;
      tz = npc.homeZ || 0;
    } else if (sched === 'leisure') {
      const tavernNpc = activeNpcs.find((n: any) => n.id?.startsWith('npc_tavernmaster_'));
      if (tavernNpc) {
        const offset = Math.abs((npc.name.charCodeAt(0) * 3) % 4) - 2;
        tx = tavernNpc.homeX + offset;
        ty = tavernNpc.homeY + 2;
      } else {
        tx = 22 + Math.abs((npc.homeX * 3) % 6);
        ty = 5;
      }
      tz = 0;
    }

    return { tx, ty, tz, sched };
  };

  // Find selected simulated NPC info if valid
  const selectedNpc = activeNpcs.find(n => n.id === selectedSimNpcId) || activeNpcs[0];

  // Perform route tracing simulation for selected NPC
  let simulationResult: any = null;
  if (selectedNpc) {
    const { tx, ty, tz, sched } = calculateNpcTargetAndState(selectedNpc, simHour, simWeather);
    const steps: { x: number; y: number; z: number; note?: string }[] = [];
    let curX = selectedNpc.x;
    let curY = selectedNpc.y;
    let curZ = selectedNpc.z !== undefined ? selectedNpc.z : 0;

    let limit = 0;
    while ((curX !== tx || curY !== ty || curZ !== tz) && limit < 100) {
      limit++;
      steps.push({ x: curX, y: curY, z: curZ });

      if (curZ !== tz) {
        if (curZ === 0) {
          const stairs = findTileInMapLocal(groundMap, TileType.StairsUp, selectedNpc.homeX, selectedNpc.homeY);
          if (stairs) {
            if (curX === stairs.x && curY === stairs.y) {
              curZ = 1;
              steps.push({ x: curX, y: curY, z: curZ, note: "Climb up Oakhaven Loft Stairs 🪜" });
              continue;
            } else {
              const next = getNextStepTowards(curX, curY, stairs.x, stairs.y, groundMap, true, []);
              if (next) {
                curX = next.x;
                curY = next.y;
              } else {
                break;
              }
            }
          } else {
            break;
          }
        } else {
          if (secondMap) {
            const stairs = findTileInMapLocal(secondMap, TileType.StairsDown, selectedNpc.homeX, selectedNpc.homeY);
            if (stairs) {
              if (curX === stairs.x && curY === stairs.y) {
                curZ = 0;
                steps.push({ x: curX, y: curY, z: curZ, note: "Climb down to ground level 🪜" });
                continue;
              } else {
                const next = getNextStepTowards(curX, curY, stairs.x, stairs.y, secondMap, true, []);
                if (next) {
                  curX = next.x;
                  curY = next.y;
                } else {
                  break;
                }
              }
            } else {
              break;
            }
          } else {
            break;
          }
        }
      } else {
        const currentLevelMap = curZ === 1 && secondMap ? secondMap : groundMap;
        const next = getNextStepTowards(curX, curY, tx, ty, currentLevelMap, true, []);
        if (next) {
          curX = next.x;
          curY = next.y;
        } else {
          break;
        }
      }
    }
    steps.push({ x: curX, y: curY, z: curZ });
    simulationResult = { steps, tx, ty, tz, sched };
  }

  return (
    <div className="space-y-5 font-mono pb-6 text-xs">
      {/* Header Badge */}
      <div className="flex justify-between items-center border-b border-emerald-950 pb-2">
        <div>
          <h4 className="font-bold text-emerald-400 uppercase tracking-widest text-[11px] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Sovereign NPC Route & Day-Cycle Coordinate Planner</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
            Visualize pathfinding route steps, coordinates, and schedule state transitions dynamically across randomized overworld chunks.
          </p>
        </div>

        <button
          onClick={() => {
            setGameState(prev => ({
              ...prev,
              isOverworld: true,
              overworldZ: 0,
              currentChunkX: 0,
              currentChunkY: 0,
              playerX: 25,
              playerY: 25
            }));
            setTimeout(() => {
              onRegenerateCurrentLocation();
            }, 100);
            triggerSuccessLog("Teleported to Oakhaven Town Square Chunk (0,0) Ground Floor!");
          }}
          className="py-1 px-2 bg-emerald-950 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>📍 Go To Town</span>
        </button>
      </div>

      {/* Theoretical Explanation */}
      <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-[10px] uppercase tracking-wider font-bold">
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span>How NPC Coordinates Remain Fully Stable on Randomized Maps</span>
        </div>
        <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
          Since the overworld is procedurally generated with dynamic town blueprints, absolute grid indices (e.g. <code className="text-emerald-300">(10, 15)</code>) cannot be hardcoded. Instead, the game engine uses a <strong className="text-emerald-400 font-semibold">Relative Coordinate Binding Architecture</strong>:
        </p>
        <ul className="list-disc pl-4 text-[10px] text-slate-400 space-y-1 font-sans">
          <li>The generator carves buildings (like the <strong>Tavern</strong> or <strong>Forge</strong>) and records their layout offsets in <code>housesList</code> metadata.</li>
          <li>NPCs are spawned with targets bound directly to their buildings (e.g. Blacksmith shop workbench is calculated as <code>blacksmithHouse.x + 3</code>).</li>
          <li>Schedules dynamically query those calculated points depending on time (Hour) and weather, using deterministic pathfinding and stairs to move between floor levels.</li>
        </ul>
      </div>

      {activeNpcs.length === 0 ? (
        <div className="p-6 text-center border border-slate-800/60 bg-slate-950/20 rounded-xl space-y-3">
          <div className="text-slate-400 text-xs">⚠️ No active town NPCs found in the current chunk!</div>
          <p className="text-[10.5px] text-slate-500 max-w-md mx-auto leading-normal font-sans">
            NPC Day-Cycles operate inside Overworld Settlements. Click the button below to teleport to the central settlement and load town inhabitants!
          </p>
          <button
            onClick={() => {
              setGameState(prev => ({
                ...prev,
                isOverworld: true,
                overworldZ: 0,
                currentChunkX: 0,
                currentChunkY: 0,
                playerX: 25,
                playerY: 25
              }));
              setTimeout(() => {
                onRegenerateCurrentLocation();
              }, 100);
              triggerSuccessLog("Teleported to Oakhaven Town Square!");
            }}
            className="py-2 px-4 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-lg cursor-pointer transition-all inline-flex items-center gap-1.5"
          >
            <Map className="w-4 h-4" />
            <span>Teleport & Generate Oakhaven Settlement</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          
          {/* Left Column: Interactive Time Slider */}
          <div className="xl:col-span-6 space-y-4">
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                ⏰ Day-Cycle Time-Warp Simulator
              </span>
              <p className="text-[9.5px] text-slate-500 font-sans">
                Drag the timeline slider or toggle inclement weather to see target coordinate predictions mutate in real-time.
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Simulated Time:</span>
                  <span className="text-emerald-400 font-mono">
                    {simHour.toString().padStart(2, '0')}:00 {simHour >= 12 ? 'PM' : 'AM'} {simHour >= 20 || simHour < 7 ? '🌙 (Night / Sleep)' : '☀️ (Day)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={simHour}
                  onChange={(e) => setSimHour(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Simulated Weather:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'clear', label: '☀️ Clear Skies' },
                    { id: 'rainy', label: '🌧️ Heavy Rain' },
                    { id: 'snowy', label: '❄️ Blizzard Snow' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSimWeather(item.id as any)}
                      className={`py-1.5 text-[9.5px] font-bold rounded border cursor-pointer text-center transition-all ${
                        simWeather === item.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : 'border-slate-850 bg-slate-900 text-slate-450'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Expected Schedule destinations */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Day-Cycle Predictions Map
              </span>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {activeNpcs.map((n: any) => {
                  const { tx, ty, tz, sched } = calculateNpcTargetAndState(n, simHour, simWeather);
                  return (
                    <div
                      key={n.id}
                      onClick={() => setSelectedSimNpcId(n.id)}
                      className={`p-2.5 border rounded-lg transition-all text-xs cursor-pointer flex items-center justify-between ${
                        selectedSimNpcId === n.id || (!selectedSimNpcId && activeNpcs[0].id === n.id)
                          ? 'border-emerald-600 bg-emerald-950/15'
                          : 'border-slate-850 hover:border-slate-800 bg-slate-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800 font-bold" style={{ color: n.color }}>
                          {n.char}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200">{n.name}</div>
                          <div className="text-[9px] text-slate-500 font-sans uppercase">Role: {n.role}</div>
                        </div>
                      </div>
                      
                      <div className="text-right font-mono">
                        <div className={`text-[9.5px] font-bold uppercase ${
                          sched === 'home' ? 'text-indigo-400' : sched === 'leisure' ? 'text-pink-400' : 'text-emerald-400'
                        }`}>
                          {sched === 'home' ? '🏠 Sleep' : sched === 'leisure' ? '🍻 Tavern / Inn' : '🔨 Work Shop'}
                        </div>
                        <div className="text-[9.5px] text-slate-400">
                          Target: <span className="text-slate-200 font-bold">({tx}, {ty}, Z:{tz})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Active NPC Ground Coordinates */}
          <div className="xl:col-span-6 space-y-4">
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider flex items-center gap-1.5">
                📍 Active NPC Ground Coordinates & Real-Time Teleporter
              </span>
              <p className="text-[9.5px] text-slate-500 font-sans">
                Click <strong>📍 Teleport NPC</strong> to instantly position them to their active destination. Click <strong>🧭 Trace Route</strong> to visually map their current coordinate path.
              </p>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {activeNpcs.map((n: any) => {
                  const curHour = Math.floor(gameState.gameTime / 60);
                  const curWeather = (gameState.weather === 'rainy' || gameState.weather === 'snowy') ? gameState.weather : 'clear';
                  const { tx, ty, tz, sched } = calculateNpcTargetAndState(n, curHour, curWeather);
                  const isAtTarget = n.x === tx && n.y === ty && (n.z !== undefined ? n.z : 0) === tz;

                  return (
                    <div
                      key={n.id}
                      className="p-3 bg-slate-900/50 border border-slate-850 rounded-xl space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm w-7 h-7 flex items-center justify-center bg-slate-950 rounded-lg border border-slate-800 font-bold" style={{ color: n.color }}>
                            {n.char}
                          </span>
                          <div>
                            <span className="font-bold text-slate-200 text-xs block">{n.name}</span>
                            <span className="text-[9px] text-slate-500 block uppercase font-sans">State: {n.scheduleState || sched}</span>
                          </div>
                        </div>

                        <div className="text-right font-mono text-[10px]">
                          <div>Pos: <span className="text-slate-200 font-bold">({n.x}, {n.y}, Z:{n.z !== undefined ? n.z : 0})</span></div>
                          <div>Target: <span className="text-emerald-400">({tx}, {ty}, Z:{tz})</span></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-950">
                        <button
                          onClick={() => {
                            setGameState(prev => {
                              const nextNpcsList = prev.npcs.map(item => {
                                if (item.id === n.id) {
                                  return { ...item, x: tx, y: ty, z: tz };
                                }
                                return item;
                              });
                              return { ...prev, npcs: nextNpcsList };
                            });
                            triggerSuccessLog(`📍 Teleported ${n.name} directly to target coordinate (${tx}, ${ty})!`);
                          }}
                          className={`py-1 px-2 border rounded font-bold text-[9px] uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
                            isAtTarget
                              ? 'border-emerald-950 bg-emerald-950/20 text-emerald-500 hover:text-emerald-400'
                              : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300'
                          }`}
                        >
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>{isAtTarget ? 'Arrived' : 'Teleport NPC'}</span>
                        </button>

                        <button
                          onClick={() => setSelectedSimNpcId(n.id)}
                          className={`py-1 px-2 border rounded font-bold text-[9px] uppercase cursor-pointer transition-all flex items-center justify-center gap-1 ${
                            selectedSimNpcId === n.id
                              ? 'border-teal-500 bg-teal-950/20 text-teal-300 font-black'
                              : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300'
                          }`}
                        >
                          <Navigation className="w-3 h-3 text-teal-400 animate-pulse" />
                          <span>Trace Route</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Panel: Interactive Path Tracing */}
      {selectedNpc && simulationResult && (
        <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-4 font-mono">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                🧭 Interactive Path Tracer & Local Route Overlay
              </span>
              <p className="text-[9.5px] text-slate-500 font-sans">
                Tracing step-by-step pathfinding route for <strong className="text-slate-300 font-semibold">{selectedNpc.name}</strong> from current coord to target.
              </p>
            </div>
            
            <div className="text-[10px] text-slate-400 text-right">
              <span>Total Steps: </span>
              <strong className="text-emerald-400 font-mono text-xs">{simulationResult.steps.length - 1} paces</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Step-by-step Coordinate Ledger */}
            <div className="lg:col-span-5 space-y-2">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Pathfinding Coordinate Ledger:</span>
              <div className="p-3 bg-slate-950 border border-slate-900/60 rounded-lg max-h-[220px] overflow-y-auto text-[10px] space-y-1.5 leading-relaxed font-mono">
                {simulationResult.steps.map((st: any, i: number) => {
                  const arrow = i < simulationResult.steps.length - 1 ? '↓' : '🏁';
                  return (
                    <div key={i} className="flex items-center justify-between hover:bg-slate-900/40 p-0.5 rounded transition-all">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-slate-600 font-sans">#{i}</span>
                        <span className="font-bold text-slate-350">Coord: ({st.x}, {st.y})</span>
                        <span className="text-[9px] text-slate-500">Floor: Z{st.z}</span>
                      </div>
                      {st.note ? (
                        <span className="text-emerald-400 font-sans text-[9px] font-bold">{st.note}</span>
                      ) : (
                        <span className="text-slate-600 font-sans text-[9px]">{arrow}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Localized ASCII Map View */}
            <div className="lg:col-span-7 space-y-2">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block flex justify-between">
                <span>Localized ASCII Routing Map (11x11 Grid):</span>
                <span className="text-[8.5px] text-slate-500 font-sans">CENTERED AROUND NPC CURRENT POSITION</span>
              </span>
              
              <div className="p-3.5 bg-slate-950 border border-slate-900/60 rounded-lg flex flex-col md:flex-row items-center justify-center gap-5">
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-850 font-mono text-sm leading-tight tracking-widest text-center select-none shadow-inner">
                  {(() => {
                    const npcZ = selectedNpc.z !== undefined ? selectedNpc.z : 0;
                    const currentMap = npcZ === 1 && secondMap ? secondMap : groundMap;
                    const viewWidth = 11;
                    const viewHeight = 11;
                    const hWidth = Math.floor(viewWidth / 2);
                    const hHeight = Math.floor(viewHeight / 2);
                    const rows: React.ReactNode[] = [];

                    for (let dy = -hHeight; dy <= hHeight; dy++) {
                      const mapY = selectedNpc.y + dy;
                      const cols: React.ReactNode[] = [];

                      for (let dx = -hWidth; dx <= hWidth; dx++) {
                        const mapX = selectedNpc.x + dx;

                        if (mapY < 0 || mapY >= currentMap.length || mapX < 0 || mapX >= (currentMap[mapY]?.length || 0)) {
                          cols.push(<span key={dx} className="text-slate-800">·</span>);
                          continue;
                        }

                        if (mapX === selectedNpc.x && mapY === selectedNpc.y) {
                          cols.push(
                            <span key={dx} className="font-bold" style={{ color: selectedNpc.color }}>
                              {selectedNpc.char}
                            </span>
                          );
                          continue;
                        }

                        if (mapX === simulationResult.tx && mapY === simulationResult.ty && npcZ === simulationResult.tz) {
                          cols.push(
                            <span key={dx} className="text-yellow-400 font-bold animate-pulse">
                              ★
                            </span>
                          );
                          continue;
                        }

                        const pathIdx = simulationResult.steps.findIndex((s: any) => s.x === mapX && s.y === mapY && s.z === npcZ);
                        if (pathIdx !== -1) {
                          cols.push(
                            <span key={dx} className="text-emerald-400 font-extrabold">
                              ·
                            </span>
                          );
                          continue;
                        }

                        const tile = currentMap[mapY][mapX];
                        let char = '.';
                        let color = 'text-slate-700';

                        if (tile === TileType.Wall) {
                          char = '#';
                          color = 'text-slate-600';
                        } else if (tile === TileType.Water) {
                          char = '~';
                          color = 'text-blue-600';
                        } else if (tile === TileType.Tree) {
                          char = 't';
                          color = 'text-emerald-800';
                        } else if (tile === TileType.StairsUp || tile === TileType.StairsDown) {
                          char = '🪜';
                          color = 'text-indigo-400';
                        } else if (tile === TileType.Door) {
                          char = 'D';
                          color = 'text-amber-700';
                        }

                        cols.push(<span key={dx} className={color}>{char}</span>);
                      }
                      rows.push(<div key={dy} className="flex justify-center gap-1.5">{cols}</div>);
                    }

                    return <div className="space-y-0.5">{rows}</div>;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
