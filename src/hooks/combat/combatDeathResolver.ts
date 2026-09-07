import { GameState, Enemy, CraftedWeapon, EquipmentItem } from '../../types';
import { getItemDurabilityDecay } from '../../utils/spellsAndEquipment';
import { getRandomRelicDraft, SanctumRelic } from '../../utils/relics';
import { getUpdatedTerritoriesOnKill } from '../../utils/caravanAndTerritory';
import { formatGameTime } from '../../utils/overworld';

export function incrementDefeatedEnemyCount(
  currentCounts: { [key: string]: number } | undefined,
  enemyName: string,
  enemyType: string,
  isBoss: boolean
): { [key: string]: number } {
  const counts = { ...(currentCounts || {}) };
  const key = isBoss ? `boss_${enemyName.toLowerCase().replace(/\s+/g, '_')}` : enemyType.toLowerCase();
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}

const isToolItem = (item: any, toolType: string) => {
  if (!item) return false;
  const name = item.name ? item.name.toLowerCase() : '';
  const sub = item.subType ? item.subType.toLowerCase() : '';
  const id = item.id ? item.id.toLowerCase() : '';
  return name.includes(toolType) || sub.includes(toolType) || id.includes(toolType);
};

export function updateWeaponDurability(
  weapon: CraftedWeapon | null,
  addLogMessage: (msg: string, type?: string) => void
): CraftedWeapon | null {
  if (!weapon) return null;
  const curDur = weapon.durability ?? 100;
  const maxD = weapon.maxDurability ?? 100;
  const decayAmt = getItemDurabilityDecay(weapon, 1);
  const nextDur = Math.max(0, curDur - decayAmt);
  if (nextDur === 0 && curDur > 0) {
    if (
      isToolItem(weapon, 'hatchet') ||
      isToolItem(weapon, 'pickaxe') ||
      (weapon as any).isTool
    ) {
      addLogMessage(
        `💥 TOOL BROKE: Your ${weapon.name} broke into pieces from heavy wear and was destroyed! [Craft a new tool in Crafting -> Survival]`,
        'danger'
      );
      return null;
    } else {
      addLogMessage(
        `⚠️ WARNING: Your Right Hand item [${weapon.name}] has broken! Its damage drops to 1! Repair it at the Town Blacksmith!`,
        'danger'
      );
      return { ...weapon, durability: nextDur, maxDurability: maxD };
    }
  }
  return { ...weapon, durability: nextDur, maxDurability: maxD };
}

export function updateShieldDurability(
  shield: EquipmentItem | null,
  addLogMessage: (msg: string, type?: string) => void
): EquipmentItem | null {
  if (!shield) return null;
  if (
    shield.type === 'weapon' ||
    isToolItem(shield, 'hatchet') ||
    isToolItem(shield, 'pickaxe') ||
    (shield as any).isTool
  ) {
    const curDur = shield.durability ?? 100;
    const maxD = shield.maxDurability ?? 100;
    const decayAmt = getItemDurabilityDecay(shield, 1);
    const nextDur = Math.max(0, curDur - decayAmt);
    if (nextDur === 0 && curDur > 0) {
      if (
        isToolItem(shield, 'hatchet') ||
        isToolItem(shield, 'pickaxe') ||
        (shield as any).isTool
      ) {
        addLogMessage(
          `💥 TOOL BROKE: Your ${shield.name} broke into pieces from heavy wear and was destroyed! [Craft a new tool in Crafting -> Survival]`,
          'danger'
        );
        return null;
      } else {
        addLogMessage(
          `⚠️ WARNING: Your Left Hand weapon [${shield.name}] has broken! Its damage drops to 1! Repair it at the Town Blacksmith!`,
          'danger'
        );
        return { ...shield, durability: nextDur, maxDurability: maxD };
      }
    }
    return { ...shield, durability: nextDur, maxDurability: maxD };
  }
  return shield;
}
