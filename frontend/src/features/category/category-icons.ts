import type { ComponentType } from "react";
import {
  GiBatteries,
  GiCandleLight,
  GiCannedFish,
  GiCoffeeCup,
  GiMeat,
  GiMilkCarton,
  GiNoodles,
  GiOpenedFoodCan,
  GiPowderBag,
  GiSaltShaker,
  GiSlicedBread,
  GiSoap,
  GiSquareBottle,
  GiWashingMachine,
  GiWaterBottle,
} from "react-icons/gi";
import { MdLocalGroceryStore } from "react-icons/md";

export type CategoryIcon = ComponentType<{ className?: string; size?: number }>;

/**
 * The stored icon set for commodity categories. Keys are stable names, so a
 * category could later store one of them (e.g. an `iconKey` column) without
 * touching the icons themselves.
 */
export const CATEGORY_ICONS = {
  cannedFish: { label: "Canned fish", icon: GiCannedFish },
  milk: { label: "Milk", icon: GiMilkCarton },
  powderedMilk: { label: "Powdered milk", icon: GiPowderBag },
  coffee: { label: "Coffee", icon: GiCoffeeCup },
  bread: { label: "Bread", icon: GiSlicedBread },
  noodles: { label: "Noodles", icon: GiNoodles },
  salt: { label: "Salt", icon: GiSaltShaker },
  water: { label: "Bottled water", icon: GiWaterBottle },
  laundry: { label: "Laundry", icon: GiWashingMachine },
  candles: { label: "Candles", icon: GiCandleLight },
  cannedMeat: { label: "Canned meat", icon: GiOpenedFoodCan },
  cornedBeef: { label: "Corned beef", icon: GiMeat },
  condiments: { label: "Condiments", icon: GiSquareBottle },
  soap: { label: "Soap", icon: GiSoap },
  batteries: { label: "Batteries", icon: GiBatteries },
  other: { label: "Other", icon: MdLocalGroceryStore },
} as const satisfies Record<string, { label: string; icon: CategoryIcon }>;

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;

// First match wins, so the more specific words come first: "Powdered Milk"
// must hit `powderedMilk` before the general `milk`, and "Detergent / Laundry
// Soap" must hit `laundry` before `soap`. Matching on words rather than exact
// names means a renamed or new category ("Spanish Sardines", "Mineral Water")
// still gets a sensible icon.
const KEYWORD_RULES: Array<[RegExp, CategoryIconKey]> = [
  [/sardine|tuna|mackerel|fish/i, "cannedFish"],
  [/powder/i, "powderedMilk"],
  [/milk|creamer/i, "milk"],
  [/coffee/i, "coffee"],
  [/bread|pandesal|loaf bread/i, "bread"],
  [/noodle|mami|pancit/i, "noodles"],
  [/salt/i, "salt"],
  [/water/i, "water"],
  [/detergent|laundry/i, "laundry"],
  [/candle/i, "candles"],
  [/corned/i, "cornedBeef"],
  [/luncheon|meat ?loaf|beef ?loaf|sausage|vienna|canned meat/i, "cannedMeat"],
  [/vinegar|patis|soy|sauce|ketchup|condiment/i, "condiments"],
  [/soap/i, "soap"],
  [/batter/i, "batteries"],
];

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS) as [CategoryIconKey, ...CategoryIconKey[]];

export function isCategoryIconKey(value: unknown): value is CategoryIconKey {
  return typeof value === "string" && value in CATEGORY_ICONS;
}

/** Options for the icon dropdown on the Category form (SearchableSelect). */
export const CATEGORY_ICON_OPTIONS = CATEGORY_ICON_KEYS.map((key) => ({
  value: key,
  label: CATEGORY_ICONS[key].label,
  icon: CATEGORY_ICONS[key].icon,
}));

/** The icon key matched from a category name; "other" when nothing matches. */
export function getCategoryIconKey(categoryName: string | null | undefined): CategoryIconKey {
  if (!categoryName) return "other";
  const match = KEYWORD_RULES.find(([pattern]) => pattern.test(categoryName));
  return match ? match[1] : "other";
}

/**
 * The key to draw for a category: the icon chosen on the Category form when
 * there is one, otherwise the one matched from its name ("Automatic").
 */
export function resolveCategoryIconKey(
  categoryName: string | null | undefined,
  iconKey?: string | null,
): CategoryIconKey {
  return isCategoryIconKey(iconKey) ? iconKey : getCategoryIconKey(categoryName);
}

/** The icon component for a category, for the Commodities list rows. */
export function getCategoryIcon(categoryName: string | null | undefined, iconKey?: string | null): CategoryIcon {
  return CATEGORY_ICONS[resolveCategoryIconKey(categoryName, iconKey)].icon;
}
