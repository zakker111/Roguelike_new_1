/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  TradeHeaderBar,
  CaravanRoutesWidget,
  BlacksmithRepairStation,
  ApothecaryStation,
  TavernServiceStation,
  TradeBuyStockGrid,
  TradeSellStashGrid
} from '../components/modals/trade';
import { TradeModal } from '../components/modals/TradeModal';

describe('Trade Sub-Engine Modular Components & Architecture', () => {
  it('exports all decoupled trade sub-components and master composer', () => {
    expect(TradeHeaderBar).toBeDefined();
    expect(CaravanRoutesWidget).toBeDefined();
    expect(BlacksmithRepairStation).toBeDefined();
    expect(ApothecaryStation).toBeDefined();
    expect(TavernServiceStation).toBeDefined();
    expect(TradeBuyStockGrid).toBeDefined();
    expect(TradeSellStashGrid).toBeDefined();
    expect(TradeModal).toBeDefined();
  });

  it('verifies sub-component functions are valid React functional components', () => {
    expect(typeof TradeHeaderBar).toBe('function');
    expect(typeof CaravanRoutesWidget).toBe('function');
    expect(typeof BlacksmithRepairStation).toBe('function');
    expect(typeof ApothecaryStation).toBe('function');
    expect(typeof TavernServiceStation).toBe('function');
    expect(typeof TradeBuyStockGrid).toBe('function');
    expect(typeof TradeSellStashGrid).toBe('function');
    expect(typeof TradeModal).toBe('function');
  });
});
