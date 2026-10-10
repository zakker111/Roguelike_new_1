/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponBaseType, WeaponTemplate, CraftedWeapon, Material, Catalyst, CatalystType, MaterialCategory } from '../../types/items';
import weaponTemplatesJson from '../../data/weaponTemplates.json';

/**
 * Fallback defaults for crafted weapon components
 */
const DEFAULT_MATERIAL: Material = {
  id: 'mat_iron_default',
  name: 'Standard Iron',
  description: 'Reliable iron smithing ingot.',
  category: MaterialCategory.Tier1,
  color: '#9ca3af',
  baseDamageMod: 2,
  critMod: 0.05,
  speedMod: 1.0
};

const DEFAULT_CATALYST: Catalyst = {
  id: 'cat_none',
  name: 'Tempered Core',
  description: 'Uninfused physical core.',
  type: CatalystType.Fire,
  color: '#ffffff',
  damageType: 'Physical',
  statusEffectChance: 0,
  statusDuration: 0
};

/**
 * Singleton WeaponRegistry providing data-driven weapon templates and crafting blueprints.
 * Conforms to Step 7 & Section 8 of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md).
 */
export class WeaponRegistry {
  private static instance: WeaponRegistry | null = null;
  private templates: Map<string, WeaponTemplate> = new Map();
  private initialized = false;

  private constructor() {
    this.initFromCatalog();
  }

  public static getInstance(): WeaponRegistry {
    if (!WeaponRegistry.instance) {
      WeaponRegistry.instance = new WeaponRegistry();
    }
    return WeaponRegistry.instance;
  }

  /**
   * Resets registry instance (for testing isolation)
   */
  public static resetInstance(): void {
    WeaponRegistry.instance = null;
  }

  /**
   * Loads weapon templates from the JSON catalog
   */
  public initFromCatalog(): void {
    if (this.initialized) return;

    if (weaponTemplatesJson && typeof weaponTemplatesJson === 'object') {
      for (const [key, raw] of Object.entries(weaponTemplatesJson as Record<string, any>)) {
        this.register({
          baseType: (raw.baseType || key) as WeaponBaseType,
          name: raw.name || key,
          description: raw.description || 'A trusty weapon.',
          baseDamage: raw.baseDamage ?? 5,
          baseCrit: raw.baseCrit ?? 0.1,
          range: raw.range ?? 1,
          manaCost: raw.manaCost ?? 0,
          icon: raw.icon || '⚔️',
          isTwoHanded: !!raw.isTwoHanded
        });
      }
    }

    this.initialized = true;
  }

  /**
   * Registers or updates a weapon template
   */
  public register(template: WeaponTemplate): void {
    this.templates.set(template.baseType, { ...template });
  }

  /**
   * Batch registers multiple weapon templates
   */
  public registerMany(templates: WeaponTemplate[]): void {
    for (const t of templates) {
      this.register(t);
    }
  }

  /**
   * Retrieves a template by weapon base type
   */
  public get(baseType: string): WeaponTemplate | undefined {
    return this.templates.get(baseType);
  }

  /**
   * Checks whether a weapon template exists
   */
  public has(baseType: string): boolean {
    return this.templates.has(baseType);
  }

  /**
   * Returns all registered weapon templates
   */
  public getAll(): WeaponTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Retrieves weapons matching range constraints
   */
  public getByRange(minRange: number, maxRange?: number): WeaponTemplate[] {
    return Array.from(this.templates.values()).filter(w => {
      if (w.range < minRange) return false;
      if (maxRange !== undefined && w.range > maxRange) return false;
      return true;
    });
  }

  /**
   * Retrieves weapons by 1-handed vs 2-handed classification
   */
  public getByHandedness(isTwoHanded: boolean): WeaponTemplate[] {
    return Array.from(this.templates.values()).filter(w => !!w.isTwoHanded === isTwoHanded);
  }

  /**
   * Creates an instantiated CraftedWeapon using the template and optional materials/catalysts
   */
  public createCraftedWeapon(params: {
    baseType: WeaponBaseType | string;
    material?: Material;
    catalyst?: Catalyst;
    name?: string;
    overrides?: Partial<CraftedWeapon>;
  }): CraftedWeapon {
    const template = this.get(params.baseType);
    if (!template) {
      throw new Error(`WeaponRegistry: cannot craft unknown weapon baseType "${params.baseType}"`);
    }

    const mat = params.material || DEFAULT_MATERIAL;
    const cat = params.catalyst || DEFAULT_CATALYST;

    const baseDamage = template.baseDamage + (mat.baseDamageMod || 0);
    const critChance = Math.min(1.0, template.baseCrit + (mat.critMod || 0));
    const weaponName = params.name || `${mat.name} ${template.name}`;

    const weapon: CraftedWeapon = {
      id: `wep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: weaponName,
      baseType: template.baseType,
      materialUsed: mat,
      catalystUsed: cat,
      damage: baseDamage,
      critChance,
      range: template.range,
      manaCost: template.manaCost,
      effectDescription: cat.description || template.description,
      color: cat.color || mat.color || '#ffffff',
      durability: 100,
      maxDurability: 100,
      upgradeLevel: 0,
      isTwoHanded: template.isTwoHanded,
      type: 'weapon',
      ...params.overrides
    };

    return weapon;
  }

  /**
   * Total number of registered templates
   */
  public count(): number {
    return this.templates.size;
  }
}
