import { GameState, EquipmentItem } from '../../../types';

export interface TradeModalProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setActiveTab: (tab: string) => void;
  handleStartCaravanTravel: (x: number, y: number, name: string) => void;
  handleRepairAll: () => void;
  handleRepairItem: (keyOrId: string, item: any, isEquipped: boolean) => void;
  handleUpgradeBlacksmith: () => void;
  handleUpgradeApothecary: () => void;
  handleBuyRumor: () => void;
  handleTavernRest: () => void;
  handleHireMercenary: (type: 'novice' | 'veteran' | 'champion' | 'merchant_guard') => void;
  handleBuyEnchantedGear: (type: 'horse' | 'camel' | 'worg' | 'crocodile', price: number, name: string) => void;
  handleBuyEquipment: (item: EquipmentItem) => void;
  handleBuyResource: (type: 'material' | 'potion' | 'catalyst', id: string, price: number) => void;
  handleSellEquipment: (item: EquipmentItem) => void;
  handleSellResource: (type: 'material' | 'catalyst', id: string, baseValue: number) => void;
  playSound: (soundName: string) => void;
}

export interface CaravanDestination {
  x: number;
  y: number;
  name: string;
  dist: number;
  theme: string;
}

export interface EnchantedGearOption {
  id: 'horse' | 'camel' | 'worg' | 'crocodile';
  name: string;
  price: number;
  desc: string;
}

export interface TradeRoleContext {
  activeRole: string;
  isBlacksmith: boolean;
  isMerchant: boolean;
  isApothecary: boolean;
  isTavernMaster: boolean;
  isSeppo: boolean;
  isTraveler: boolean;
  isCaravanMerchant: boolean;
  travelerPriceMarkup: number;
}
