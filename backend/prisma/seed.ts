import { prisma } from "../src/prisma";
import { passwordUtils } from "../src/shared/utils/password.utils";

const SEED_PASSWORD = "Password123!";

const COMMODITIES: Array<{ name: string; category: string; srp: number }> = [
  { name: "Wed Sugar", category: "Sugar", srp: 90 },
  { name: "Cooking Oell-milled Rice", category: "Grain", srp: 45 },
  { name: "Refinil (1L)", category: "Oil", srp: 95 },
  { name: "Red Onion", category: "Vegetable", srp: 120 },
  { name: "Garlic", category: "Vegetable", srp: 150 },
  { name: "Chicken Egg (per piece)", category: "Poultry", srp: 8 },
  { name: "Pork Belly", category: "Meat", srp: 320 },
  { name: "Dressed Chicken", category: "Poultry", srp: 190 },
  { name: "Galunggong (Round Scad)", category: "Fish", srp: 220 },
  { name: "Canned Sardines", category: "Canned Goods", srp: 25 },
];

// Sourced from FM-PSM-02v01 (DTI Price and Supply Monitoring Form). Brand +
// pack size is folded into `name` since Commodity has no separate unit field.
const DTI_COMMODITIES_WITH_SRP: Array<{ name: string; category: string; srp: number }> = [
  { name: "ABSOLUTE PURE Distilled Drinking Water 350ml", category: "Bottled Water - Distilled", srp: 12 },
  { name: "ABSOLUTE PURE Distilled Drinking Water 500ml", category: "Bottled Water - Distilled", srp: 16.25 },
  { name: "ABSOLUTE PURE Distilled Drinking Water 1L", category: "Bottled Water - Distilled", srp: 25 },
  { name: "ABSOLUTE PURE Distilled Drinking Water 6L", category: "Bottled Water - Distilled", srp: 83 },
  { name: "SM BONUS Distilled Drinking Water 325ml", category: "Bottled Water - Distilled", srp: 6.5 },
  { name: "SM BONUS Distilled Drinking Water 500ml", category: "Bottled Water - Distilled", srp: 8.5 },
  { name: "SM BONUS Distilled Drinking Water 6.6L", category: "Bottled Water - Distilled", srp: 54.5 },
  { name: "WILKINS Distilled 330mL", category: "Bottled Water - Distilled", srp: 12 },
  { name: "WILKINS Distilled 500mL", category: "Bottled Water - Distilled", srp: 17 },
  { name: "WILKINS Distilled 1L", category: "Bottled Water - Distilled", srp: 25 },
  { name: "WILKINS Distilled 7L", category: "Bottled Water - Distilled", srp: 90 },
  { name: "HIDDEN Spring Mineral Water 330mL", category: "Bottled Water - Mineral", srp: 8.8 },
  { name: "HIDDEN Spring Mineral Water 500mL", category: "Bottled Water - Mineral", srp: 12.1 },
  { name: "REFRESH Mineral Water 350ml", category: "Bottled Water - Mineral", srp: 6.6 },
  { name: "REFRESH Mineral Water 500ml", category: "Bottled Water - Mineral", srp: 9.15 },
  { name: "ROBINSONS Mall Mineral Water 500ml", category: "Bottled Water - Mineral", srp: 10.45 },
  { name: "SUMMIT Natural Drinking Water 350ml", category: "Bottled Water - Mineral", srp: 10 },
  { name: "SUMMIT Natural Drinking Water 500ml", category: "Bottled Water - Mineral", srp: 12 },
  { name: "SUMMIT Natural Drinking Water 1L", category: "Bottled Water - Mineral", srp: 19.5 },
  { name: "SUMMIT Natural Drinking Water 6L", category: "Bottled Water - Mineral", srp: 75 },
  { name: "SUPERSAVERS NATURE'S Pure Mineral Water 330ml", category: "Bottled Water - Mineral", srp: 7.15 },
  { name: "SUPERSAVERS NATURE'S Pure Mineral Water 500ml", category: "Bottled Water - Mineral", srp: 8.7 },
  { name: "VIVA Mineral Water 330ml", category: "Bottled Water - Mineral", srp: 10 },
  { name: "VIVA Mineral Water 500ml", category: "Bottled Water - Mineral", srp: 13 },
  { name: "VIVA Mineral Water 1L", category: "Bottled Water - Mineral", srp: 19 },
  { name: "MAGNOLIA Pure Purified Water 355ml", category: "Bottled Water - Purified", srp: 8.5 },
  { name: "MAGNOLIA Pure Purified Water 500ml", category: "Bottled Water - Purified", srp: 10.5 },
  { name: "MAGNOLIA Pure Purified Water 1L", category: "Bottled Water - Purified", srp: 19.5 },
  { name: "NATURES SPRING Drinking Water 500ml", category: "Bottled Water - Purified", srp: 10.5 },
  { name: "NATURES SPRING Drinking Water 1L", category: "Bottled Water - Purified", srp: 16.5 },
  { name: "REFRESH Purified Water 500ml", category: "Bottled Water - Purified", srp: 6.75 },
  { name: "SM BONUS Purified Water 300ml", category: "Bottled Water - Purified", srp: 5 },
  { name: "WILKINS Pure Purified Water 500ml", category: "Bottled Water - Purified", srp: 11 },
  { name: "WILKINS Pure Purified Water 1L", category: "Bottled Water - Purified", srp: 18 },
  { name: "PINOY Tasty 450g", category: "Bread - Loaf", srp: 44 },
  { name: "PINOY Pandesal (10pcs./pack) 250g", category: "Bread - Pandesal", srp: 27.25 },
  { name: "5-STAR Esperma (White) #6 25pcs./pack", category: "Candles", srp: 115.5 },
  { name: "5-STAR Esperma (White) #8 5pcs./pack", category: "Candles", srp: 150.25 },
  { name: "5-STAR Esperma (White) #14 4pcs./pack", category: "Candles", srp: 36.25 },
  { name: "5-STAR Esperma (White) #22 2pcs./pack", category: "Candles", srp: 117.75 },
  { name: "5-STAR Esperma (White) #3 20pcs./pack", category: "Candles", srp: 54.25 },
  { name: "EXPORT Candles & Esperma (White) # 03 20pcs./pack", category: "Candles", srp: 39 },
  { name: "EXPORT Candles & Esperma (White) # 06 20pcs./pack", category: "Candles", srp: 85 },
  { name: "EXPORT Candles & Esperma (White) # 12 10pcs./pack", category: "Candles", srp: 72.75 },
  { name: "EXPORT Candles & Esperma (White) # 14 8pcs./pack", category: "Candles", srp: 72.75 },
  { name: "EXPORT Candles & Esperma (White) # 16 4pcs./pack", category: "Candles", srp: 36.25 },
  { name: "EXPORT Candles & Esperma (White) # 18 4pcs./pack", category: "Candles", srp: 48.5 },
  { name: "EXPORT Candles & Esperma (White) # 19 4pcs./pack", category: "Candles", srp: 97 },
  { name: "EXPORT Candles & Esperma (White) # 20 x 2 2pcs./pack", category: "Candles", srp: 66.75 },
  { name: "EXPORT Candles & Esperma (White) # 20 x 4 4pcs./pack", category: "Candles", srp: 121.5 },
  { name: "EXPORT Candles White # 05 20pcs./pack", category: "Candles", srp: 60.5 },
  { name: "EXPORT Candles White # 08 12pcs./pack", category: "Candles", srp: 60.5 },
  { name: "EXPORT Candles White # 10 10pcs./pack", category: "Candles", srp: 72.75 },
  { name: "EXPORT Vigil Candles # 01 White 12pcs./pack", category: "Candles", srp: 60.5 },
  { name: "EXPORT Vigil Candles # 01 Yellow 12pcs./pack", category: "Candles", srp: 60.5 },
  { name: "EXPORT Vigil Candles # 2 x 4 White 4pcs./pack", category: "Candles", srp: 54.5 },
  { name: "EXPORT Vigil Candles # 2 x 4 Yellow 4pcs./pack", category: "Candles", srp: 54.5 },
  { name: "EXPORT Vigil Candles # 2 x 6 White 6pcs./pack", category: "Candles", srp: 85 },
  { name: "EXPORT Vigil Candles # 2 x 6 Yellow 6pcs./pack", category: "Candles", srp: 85 },
  { name: "LIWANAG Esperma #03 - White 20pcs./pack", category: "Candles", srp: 81 },
  { name: "LIWANAG Esperma #05 - White 20pcs./pack", category: "Candles", srp: 109.75 },
  { name: "LIWANAG Esperma #16 - White 4pcs./pack", category: "Candles", srp: 57.75 },
  { name: "LIWANAG Esperma #18 - White 4pcs./pack", category: "Candles", srp: 94.75 },
  { name: "LIWANAG Esperma #24 - White 2pcs./pack", category: "Candles", srp: 220 },
  { name: "MANILA WAX Sperma #02 - White 10 pcs./pack", category: "Candles", srp: 54.11 },
  { name: "MANILA WAX Sperma #03 - White 20pcs./pack", category: "Candles", srp: 64.72 },
  { name: "MANILA WAX Sperma #04 - White 20pcs./pack", category: "Candles", srp: 47.74 },
  { name: "MANILA WAX Sperma #14 - White 4pcs./pack", category: "Candles", srp: 54.1 },
  { name: "MANILA WAX Sperma #16 - White 2pcs./pack", category: "Candles", srp: 59.41 },
  { name: "MANILA WAX Votive #01 - White 6 pcs./pack", category: "Candles", srp: 82.76 },
  { name: "MANILA WAX Votive #01 - Yellow 6 pcs./pack", category: "Candles", srp: 82.76 },
  { name: "MANILA WAX Votive #02 - White 6 pcs./pack", category: "Candles", srp: 71.09 },
  { name: "MANILA WAX Votive #02 - Yellow 6 pcs./pack", category: "Candles", srp: 71.09 },
  { name: "MANILA WAX Votive #03 - White 6 pcs./pack", category: "Candles", srp: 59.41 },
  { name: "MANILA WAX Votive #03 - Yellow 6 pcs./pack", category: "Candles", srp: 59.41 },
  { name: "555 BONUS Pack Sardines (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 20.5 },
  { name: "ATAMI Sardines Easy-Open-Can (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 23.25 },
  { name: "ATAMI Sardines Regular Lid (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 22.5 },
  { name: "KING Cup Sardines (Regular Lid) (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 18 },
  { name: "LUCKY 7 Sardines (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 20.5 },
  { name: "MARIKO Sardines Regular Lid (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 23.75 },
  { name: "MIKADO Sardines Easy-Open-Can (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 23.25 },
  { name: "MIKADO Sardines Regular Lid (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 22.5 },
  { name: "SABA Philippine Sardines - Luzon/Viz/Min (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 21.5 },
  { name: "SALLENAS Sardines Regular Lid (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 24.75 },
  { name: "TOYO BONUS Canned Sardines Easy-Open-Can (Green) 155g", category: "Canned Sardines in tomato sauce", srp: 20 },
  { name: "BLEND 45 3-in-1 Coffee Mix 18g", category: "Coffee 3-in-1", srp: 5.5 },
  { name: "CAFE PURO 3-in-1 Instant Coffee Mix 17g", category: "Coffee 3-in-1", srp: 4.7 },
  { name: "GREAT TASTE Original 3-in-1 Coffee Mix - Twin Pack 33g", category: "Coffee 3-in-1", srp: 10 },
  { name: "KOPIKO Black Coffee 3-in-1 Original 30g", category: "Coffee 3-in-1", srp: 8.5 },
  { name: "NESCAFE Original 3-in-1 20g", category: "Coffee 3-in-1", srp: 7.75 },
  { name: "NESCAFE Original 3-in-1 26g", category: "Coffee 3-in-1", srp: 7.75 },
  { name: "SAN MIG Super Coffee 3-in-1 Original 20g", category: "Coffee 3-in-1", srp: 7.5 },
  { name: "HO-MI Instant Mami Noodles - Beef Brisket 55g", category: "Instant Noodles", srp: 9 },
  { name: "HO-MI Instant Mami Noodles - Chicken & Garlic 55g", category: "Instant Noodles", srp: 9 },
  { name: "LUCKY ME! Instant Mami - Beef na Beef 55g", category: "Instant Noodles", srp: 9 },
  { name: "LUCKY ME! Instant Mami - Chicken na Chicken 55g", category: "Instant Noodles", srp: 9 },
  { name: "PAYLESS Instant Mami - Beef Paborito 55g", category: "Instant Noodles", srp: 7.5 },
  { name: "PAYLESS Instant Mami - Chicken Espesyal 55g", category: "Instant Noodles", srp: 7.5 },
  { name: "QUICK CHOW Instant Mami Beef 55g", category: "Instant Noodles", srp: 7.75 },
  { name: "QUICK CHOW Instant Mami Chicken 55g", category: "Instant Noodles", srp: 7.75 },
  { name: "BARETA Bar Blue - VizMin 330g", category: "Laundry Soap", srp: 21.75 },
  { name: "BARETA BAR FabCon - Viz Min 330g", category: "Laundry Soap", srp: 23.25 },
  { name: "BARETA Bar Kalamansi - VizMin 330g", category: "Laundry Soap", srp: 21.75 },
  { name: "BARETA Bar Speckled Blue - VizMin 330g", category: "Laundry Soap", srp: 21.75 },
  { name: "BARETA Bar White - VizMin 330g", category: "Laundry Soap", srp: 21.75 },
  { name: "BONUX Bar Flower Fiesta 380g", category: "Laundry Soap", srp: 21 },
  { name: "BONUX Kalamansi Zest 380g", category: "Laundry Soap", srp: 21 },
  { name: "BUDGET Bar Kalamansi - Luzon 330g", category: "Laundry Soap", srp: 21 },
  { name: "BUDGET Bar Power Blue - Luzon 330g", category: "Laundry Soap", srp: 21 },
  { name: "BUDGET Bar Speckled Blue - Luzon 330g", category: "Laundry Soap", srp: 21 },
  { name: "BUDGET Bar White Anti Bac - Luzon 330g", category: "Laundry Soap", srp: 21 },
  { name: "BUDGET Bar with Fabcon - Luzon 330g", category: "Laundry Soap", srp: 21 },
  { name: "CHAMPION Bar Citrus Fresh 370g", category: "Laundry Soap", srp: 25 },
  { name: "CHAMPION Bar Supra Clean Original Scent 370g", category: "Laundry Soap", srp: 25 },
  { name: "SPEED Bar Speckled Blue 330g", category: "Laundry Soap", srp: 22.5 },
  { name: "SPEED Bar White 330g", category: "Laundry Soap", srp: 22.5 },
  { name: "SPEED Long Bar Blue 330g", category: "Laundry Soap", srp: 21.5 },
  { name: "SPEED Long Bar - Blue 370g", category: "Laundry Soap", srp: 25.75 },
  { name: "SPEED Long Bar Kalamansi 370g", category: "Laundry Soap", srp: 25.75 },
  { name: "SPEED Long Bar - White 370g", category: "Laundry Soap", srp: 25.75 },
  { name: "SPEED Long Bar - Speckled Blue 370g", category: "Laundry Soap", srp: 25.75 },
  { name: "SULIT Bar Blue - VizMin 330g", category: "Laundry Soap", srp: 21 },
  { name: "SULIT Bar Kalamansi - VizMin 330g", category: "Laundry Soap", srp: 21 },
  { name: "SULIT Bar Speckled Blue - VizMin 330g", category: "Laundry Soap", srp: 21 },
  { name: "SULIT Bar White - VizMin 330g", category: "Laundry Soap", srp: 21 },
  { name: "SURF ActivClean Technology - Antibacterial - Tawas/ WHITE 360g", category: "Laundry Soap", srp: 24.5 },
  { name: "SURF Active Clean - Kalamansi - GREEN 360g", category: "Laundry Soap", srp: 24.5 },
  { name: "SURF Active Clean - Power Bula Power Puti - BLUE 360g", category: "Laundry Soap", srp: 23.25 },
  { name: "TIDE Bar Ultra Original Scent 380g", category: "Laundry Soap", srp: 24 },
  { name: "JERSEY Sweetened Condensed Creamer 390g", category: "Processed Milk", srp: 44.5 },
  { name: "ANGEL Evaporated Filled Milk 370ml", category: "Processed Milk", srp: 48 },
  { name: "BEAR BRAND Fortified Powdered Milk Drink 135g", category: "Processed Milk", srp: 50 },
  { name: "BIRCH TREE Full Cream Milk 150g", category: "Processed Milk", srp: 70.75 },
  { name: "JERSEY Fortified Instant Powdered Milk 300g", category: "Processed Milk", srp: 96.25 },
  { name: "ALASKA Fortified Powdered Milk Drink 150g", category: "Processed Milk", srp: 44 },
  { name: "FIDEL Coarse (RED) LUZON 500g", category: "Salt - Iodized", srp: 21.25 },
  { name: "FIDEL Coarse (RED) VISAYAS & MINDANAO 500g", category: "Salt - Iodized", srp: 22.5 },
  { name: "FIDEL Free Flowing (GREEN) LUZON 250g", category: "Salt - Iodized", srp: 12.75 },
  { name: "FIDEL Free Flowing (GREEN) LUZON 500g", category: "Salt - Iodized", srp: 25 },
  { name: "FIDEL Free Flowing (GREEN) VISAYAS & MINDANAO 250g", category: "Salt - Iodized", srp: 13.5 },
  { name: "FIDEL Free Flowing (GREEN) VISAYAS & MINDANAO 500g", category: "Salt - Iodized", srp: 25.5 },
  { name: "FIDEL Refined (BLUE) LUZON 250g", category: "Salt - Iodized", srp: 11.75 },
  { name: "FIDEL Refined (BLUE) LUZON 500g", category: "Salt - Iodized", srp: 23 },
  { name: "FIDEL Refined (BLUE) VISAYAS & MINDANAO 250g", category: "Salt - Iodized", srp: 12.25 },
  { name: "FIDEL Refined (BLUE) VISAYAS & MINDANAO 500g", category: "Salt - Iodized", srp: 23.25 },
  { name: "LASAP Iodized Salt 100g", category: "Salt - Iodized", srp: 4.75 },
  { name: "LASAP Iodized Salt 1kg", category: "Salt - Iodized", srp: 31.5 },
  { name: "LASAP Iodized Salt 250g", category: "Salt - Iodized", srp: 9.75 },
  { name: "LASAP Iodized Salt 500g", category: "Salt - Iodized", srp: 17.25 },
  { name: "FIDEL Coarse (RED) LUZON 250g", category: "Salt - Iodized", srp: 11 },
  { name: "FIDEL Coarse (RED) VISAYAS & MINDANAO 250g", category: "Salt - Iodized", srp: 11.75 },
  { name: "LASAP Iodized Rock Salt 1kg", category: "Salt - Iodized", srp: 25 },
  { name: "LASAP Iodized Rock Salt 250g", category: "Salt - Iodized", srp: 7.5 },
  { name: "LASAP Iodized Rock Salt 500g", category: "Salt - Iodized", srp: 13.5 },
  { name: "ENERGIZER MAX AA 4pcs/pack", category: "Battery", srp: 216.75 },
  { name: "EVEREADY Super Heavy Duty Black D 2pcs/pack", category: "Battery", srp: 81.75 },
  { name: "555 Beef Loaf 150g", category: "Canned Beef - Beef Loaf", srp: 19.5 },
  { name: "ARGENTINA Beef Loaf 150g", category: "Canned Beef - Beef Loaf", srp: 22 },
  { name: "ARGENTINA Beef Loaf 170g", category: "Canned Beef - Beef Loaf", srp: 25 },
  { name: "BINGO Beef Loaf 150g", category: "Canned Beef - Beef Loaf", srp: 19.5 },
  { name: "CDO Beef Loaf - Classic 150g", category: "Canned Beef - Beef Loaf", srp: 21.75 },
  { name: "EL RANCHO Beef Loaf 155g", category: "Canned Beef - Beef Loaf", srp: 19.5 },
  { name: "PUREFOODS Beef Loaf 150g", category: "Canned Beef - Beef Loaf", srp: 18.15 },
  { name: "PUREFOODS Superior Beef Loaf 200g", category: "Canned Beef - Beef Loaf", srp: 24.9 },
  { name: "ARGENTINA Corned Beef 150g", category: "Canned Beef - Corned Beef", srp: 36.75 },
  { name: "ARGENTINA Corned Beef 175g", category: "Canned Beef - Corned Beef", srp: 41.75 },
  { name: "BINGO Corned Beef 150g", category: "Canned Beef - Corned Beef", srp: 23 },
  { name: "EL RANCHO Corned Beef 150g", category: "Canned Beef - Corned Beef", srp: 31.25 },
  { name: "STAR Nutri-meats Corned Beef 150g", category: "Canned Beef - Corned Beef", srp: 34 },
  { name: "WINNER Corned Beef 150g", category: "Canned Beef - Corned Beef", srp: 33.75 },
  { name: "YOUNG'S TOWN Brand Corned Beef - Premium 150g", category: "Canned Beef - Corned Beef", srp: 34.25 },
  { name: "CDO Chinese Style Luncheon Meat 165g", category: "Canned Pork - Luncheon Meat", srp: 41 },
  { name: "PUREFOODS Chinese Luncheon Meat 165g", category: "Canned Pork - Luncheon Meat", srp: 40 },
  { name: "555 Meat Loaf 150g", category: "Canned Pork - Meat Loaf", srp: 19.5 },
  { name: "ARGENTINA Meat Loaf 150g", category: "Canned Pork - Meat Loaf", srp: 23.75 },
  { name: "ARGENTINA Meat Loaf 170g", category: "Canned Pork - Meat Loaf", srp: 25.25 },
  { name: "CDO Classic Meat Loaf 150g", category: "Canned Pork - Meat Loaf", srp: 21.75 },
  { name: "WINNER Meat Loaf 150g", category: "Canned Pork - Meat Loaf", srp: 18 },
  { name: "DATU PUTI Patis (GIN Bottle) - SMKT 350ml", category: "Condiments - Patis", srp: 28.5 },
  { name: "DATU PUTI Patis (PET Bottle) - SMKT 350ml", category: "Condiments - Patis", srp: 28.5 },
  { name: "LORINS Patis (BUDGET PACK) 350ml", category: "Condiments - Patis", srp: 23.75 },
  { name: "LORINS Patis (PET Bottle) 350ml", category: "Condiments - Patis", srp: 27.5 },
  { name: "LORINS (POUCH) 150ml", category: "Condiments - Patis", srp: 13.25 },
  { name: "NELICOM Special (GIN Bottle) - SMKT 350ml", category: "Condiments - Patis", srp: 32.75 },
  { name: "NELICOM Special (PET Bottle) - SMKT 350ml", category: "Condiments - Patis", srp: 32.75 },
  { name: "SILVER SWAN Special Patis (GIN Bottle) 350ml", category: "Condiments - Patis", srp: 26 },
  { name: "SILVER SWAN Special Patis (PET Bottle) 350ml", category: "Condiments - Patis", srp: 26 },
  { name: "DATU PUTI Soy Sauce (GIN Bottle) - SMKT 350ml", category: "Condiments - Soy Sauce", srp: 20.75 },
  { name: "DATU PUTI Soy Sauce (PET Bottle) - SMKT 350ml", category: "Condiments - Soy Sauce", srp: 20.75 },
  { name: "SILVER SWAN DOY PACK - SMKT 200ml", category: "Condiments - Soy Sauce", srp: 11.5 },
  { name: "SILVER SWAN Soy Sauce (GIN Bottle) - SMKT 350ml", category: "Condiments - Soy Sauce", srp: 22 },
  { name: "SILVER SWAN Soy Sauce (PET Bottle) - SMKT 350ml", category: "Condiments - Soy Sauce", srp: 22 },
  { name: "DATU PUTI White Vinegar (PET Bottle) - SMKT 350ml", category: "Condiments - Vinegar", srp: 19.25 },
  { name: "DATU PUTI White Vinegar (GIN Bottle) - SMKT 350ml", category: "Condiments - Vinegar", srp: 19.25 },
  { name: "SILVER SWAN Sukang Puti (PET Bottle) 350ml", category: "Condiments - Vinegar", srp: 19 },
  { name: "SILVER SWAN Sukang Puti (GIN Bottle) 350ml", category: "Condiments - Vinegar", srp: 19 },
  { name: "SILVER SWAN Sukang Puti DOY PACK - SMKT 200ml", category: "Condiments - Vinegar", srp: 8.75 },
  { name: "GREEN Cross Pure Care - WHITE 55g", category: "Toilet Soap", srp: 15 },
  { name: "GREEN Cross Pure Care - WHITE 85g", category: "Toilet Soap", srp: 25.75 },
  { name: "GREEN Cross Pure Care - WHITE 125g", category: "Toilet Soap", srp: 37.25 },
  { name: "PALMOLIVE Naturals – Energizing Glow (Blue/White) 55g", category: "Toilet Soap", srp: 17 },
  { name: "PALMOLIVE Naturals – Moisture Smooth (Green) 55g", category: "Toilet Soap", srp: 17 },
  { name: "PALMOLIVE Naturals Rosy Bloom (Pink) 55g", category: "Toilet Soap", srp: 17 },
  { name: "PALMOLIVE Naturals – Nourishing Radiance (Orange) 55g", category: "Toilet Soap", srp: 17 },
  { name: "SAFEGUARD Pure White Soap 55g", category: "Toilet Soap", srp: 22 },
  { name: "SAFEGUARD Pure White Soap 82g", category: "Toilet Soap", srp: 31.25 },
  { name: "SAFEGUARD Pure White Soap 119g", category: "Toilet Soap", srp: 49 },
];

// Same form, brands with no government-set SRP ("NO SRP" in the source
// sheet) — a representative sample across categories, seeded with no SRP row.
const DTI_COMMODITIES_NO_SRP: Array<{ name: string; category: string }> = [
  { name: "ABSOLUTE PURE Distilled Drinking Water 250ml", category: "Bottled Water - Distilled" },
  { name: "ABSOLUTE PURE Distilled Drinking Water 1.5L", category: "Bottled Water - Distilled" },
  { name: "ABSOLUTE PURE Distilled Drinking Water 8L", category: "Bottled Water - Distilled" },
  { name: "AQUA SPRING Distilled Water 6L", category: "Bottled Water - Distilled" },
  { name: "AQUALIZED Mineral Water 350ml", category: "Bottled Water - Mineral" },
  { name: "AQUALIZED Mineral Water 1L", category: "Bottled Water - Mineral" },
  { name: "AQUALIZED Mineral Water 6L", category: "Bottled Water - Mineral" },
  { name: "REFRESH Mineral Water 5L+675ml", category: "Bottled Water - Mineral" },
  { name: "AQUAFINA Purified Drinking Water 350ml", category: "Bottled Water - Purified" },
  { name: "AQUAFINA Purified Drinking Water 500ml", category: "Bottled Water - Purified" },
  { name: "AQUALIFE Purified Drinking Water 350ml", category: "Bottled Water - Purified" },
  { name: "AQUALIFE Purified Drinking Water 500ml", category: "Bottled Water - Purified" },
  { name: "ANGELINA Loaf Bread - Medium 450g", category: "Bread - Loaf" },
  { name: "ANGELINA Loaf Bread - Junior 350g", category: "Bread - Loaf" },
  { name: "ANGELINA Loaf Bread - Superloaf 640g", category: "Bread - Loaf" },
  { name: "BREAD WINNER Original White Bread 600g", category: "Bread - Loaf" },
  { name: "COCO Pinoy Pandesal (10pcs/pack) 250g", category: "Bread - Pandesal" },
  { name: "GARDENIA Soft Delight Pandesal (10pcs./pack) 300g", category: "Bread - Pandesal" },
  { name: "GARDENIA Premium Pandesal (8pcs/pack) 225g", category: "Bread - Pandesal" },
  { name: "LOCAL/COMMUNITY BAKERS - PANDESAL (piece) 10g", category: "Bread - Pandesal" },
  { name: "JOY Esperma Candles #5 White 20pcs./pack", category: "Candles" },
  { name: "JOY Esperma Candles #18 White 4pcs./pack", category: "Candles" },
  { name: "JOY Esperma Candles #19 White 4pcs./pack", category: "Candles" },
  { name: "JOY Esperma Candles #20 White 2pcs./pack", category: "Candles" },
  { name: "555 Canned Sardines - Easy Open Can (Green) 155g", category: "Canned Sardines in tomato sauce" },
  { name: "ASAHI Canned Sardines Easy Open Can (Green) 155g", category: "Canned Sardines in tomato sauce" },
  { name: "ASAHI Canned Sardines Regular Lid (Green) 155g", category: "Canned Sardines in tomato sauce" },
  { name: "BLUE BAY Sardines (Green) 155g", category: "Canned Sardines in tomato sauce" },
  { name: "GREAT TASTE Granules Strong (Concentrated Coffee Powder) 20g", category: "Coffee" },
  { name: "GREAT TASTE Granules Strong (Concentrated Coffee Powder) 40g", category: "Coffee" },
  { name: "GREAT TASTE Granules Strong (Concentrated Coffee Powder) 80g", category: "Coffee" },
  { name: "GREAT TASTE Premium Classic (Coffee Powder) 20g", category: "Coffee" },
  { name: "KOPI JUAN Black Coffee 3-in-1 25g", category: "Coffee 3-in-1" },
  { name: "KOPI JUAN Original Coffee 25g", category: "Coffee 3-in-1" },
  { name: "KOPIKO Black Coffee 3-in-1 Original 20g", category: "Coffee 3-in-1" },
  { name: "KOPIKO Black Coffee 3-in-1 Original (Twin Pack) 40g", category: "Coffee 3-in-1" },
  { name: "NESCAFE Classic 20g", category: "Coffee Refill" },
  { name: "NESCAFE Classic 40g", category: "Coffee Refill" },
  { name: "NESCAFE Classic 80g", category: "Coffee Refill" },
  { name: "LUCKY ME! Instant Noodles - Chicken Kasalo 100g", category: "Instant Noodles" },
  { name: "LUCKY ME! Instant Noodles - Beef Kasalo 100g", category: "Instant Noodles" },
  { name: "NISSIN RAMEN Instant Noodles - Chicken 55g", category: "Instant Noodles" },
  { name: "NISSIN RAMEN Instant Noodles - Beef 55g", category: "Instant Noodles" },
  { name: "ARIEL Super Bar (SINGLE CUT) 125g", category: "Laundry Soap" },
  { name: "BARETA Bar Blue - VizMin 360g", category: "Laundry Soap" },
  { name: "BARETA BAR FabCon - Viz Min 360g", category: "Laundry Soap" },
  { name: "BARETA Bar Kalamansi - VizMin 360g", category: "Laundry Soap" },
  { name: "ALASKA Condensada (Sweetened Condensed Creamer) 160ml (206g)", category: "Processed Milk" },
  { name: "ALASKA Condensada (Sweetened Condensed Creamer) 370g", category: "Processed Milk" },
  { name: "ALASKA Condensada (Sweetened Condensed Creamer) - Value Pack 545g", category: "Processed Milk" },
  { name: "ALASKA Condensada (Sweetened Condensed Creamer) - Sulit Litro Pack 1L", category: "Processed Milk" },
  { name: "ALLATIN Iodized Salt 250g", category: "Salt - Iodized" },
  { name: "FIDEL Coarse Salt (RED) 1kg 1kg", category: "Salt - Iodized" },
  { name: "FIDEL Refined Salt (BLUE) 1kg 1kg", category: "Salt - Iodized" },
  { name: "FIDEL Free Flowing Salt (GREEN) 1kg 1kg", category: "Salt - Iodized" },
  { name: "DURACELL AAA 2pcs/pack", category: "Battery" },
  { name: "EVEREADY BLACK AA 4pcs/pack", category: "Battery" },
  { name: "EVEREADY Super Heavy Duty BLACK AAA pack of 4", category: "Battery" },
  { name: "EVEREADY C Super Heavy Duty Black Shrink Wrap 1.5Voltz 2pcs/pack", category: "Battery" },
  { name: "ARGENTINA Beef Loaf 250g", category: "Canned Beef - Beef Loaf" },
  { name: "CDO Karne Norte Classic Guisado 150g", category: "Canned Beef - Beef Loaf" },
  { name: "LIBERTY Beef Loaf 200g", category: "Canned Beef - Beef Loaf" },
  { name: "HOLIDAY Beef Loaf 150g", category: "Canned Beef - Beef Loaf" },
  { name: "555 Carne Norte Guisado 100g", category: "Canned Beef - Corned Beef" },
  { name: "555 Carne Norte Guisado 150g", category: "Canned Beef - Corned Beef" },
  { name: "555 Carne Norte Guisado 175g", category: "Canned Beef - Corned Beef" },
  { name: "ARGENTINA Corned Beef 100g", category: "Canned Beef - Corned Beef" },
  { name: "CDO Chinese Style Luncheon Meat 150g", category: "Canned Pork - Luncheon Meat" },
  { name: "CDO Chinese Style Luncheon Meat 220g", category: "Canned Pork - Luncheon Meat" },
  { name: "CDO Chinese Style Luncheon Meat 350g", category: "Canned Pork - Luncheon Meat" },
  { name: "HIGHLANDS Luncheon Beef 165g", category: "Canned Pork - Luncheon Meat" },
  { name: "ARGENTINA Meat Loaf 100g", category: "Canned Pork - Meat Loaf" },
  { name: "ARGENTINA Meat Loaf 250g", category: "Canned Pork - Meat Loaf" },
  { name: "BINGO Meat Loaf 150g", category: "Canned Pork - Meat Loaf" },
  { name: "LIBERTY Brand Meat Loaf 200g", category: "Canned Pork - Meat Loaf" },
  { name: "DATU PUTI Patis - (POUCH) 100g", category: "Condiments - Patis" },
  { name: "DATU PUTI Patis (GIN Bottle) - WMKT 350ml", category: "Condiments - Patis" },
  { name: "DATU PUTI Patis (PET Bottle) - WMKT 350ml", category: "Condiments - Patis" },
  { name: "DATU PUTI Patis (PET Bottle) - SMKT 1L", category: "Condiments - Patis" },
  { name: "CARP Premium Soy Sauce (PET Bottle) 350ml", category: "Condiments - Soy Sauce" },
  { name: "CARP Naturally Brewed Soy Sauce (PET Bottle) 350ml", category: "Condiments - Soy Sauce" },
  { name: "COCONUT Brand Premium Soy Sauce (PET Bottle) 350ml", category: "Condiments - Soy Sauce" },
  { name: "COCONUT Brand Premium Soy Sauce (PET Bottle) 1L", category: "Condiments - Soy Sauce" },
  { name: "DATU PUTI Vinegar (POUCH) 100mL", category: "Condiments - Vinegar" },
  { name: "DATU PUTI Vinegar (POUCH) 200ml", category: "Condiments - Vinegar" },
  { name: "DATU PUTI Vinegar (POUCH) 350ml", category: "Condiments - Vinegar" },
  { name: "DATU PUTI White Vinegar (PET Bottle) - WMKT 350ml", category: "Condiments - Vinegar" },
  { name: "ANTABAX Antibacterial Soap - FRESH 75g", category: "Toilet Soap" },
  { name: "ANTABAX Antibacterial Soap - COOL 75g", category: "Toilet Soap" },
  { name: "ANTABAX Antibacterial Soap - GENTLE CARE 75g", category: "Toilet Soap" },
  { name: "ANTABAX Antibacterial Soap - NATURE 75g", category: "Toilet Soap" },
  { name: "ANGEL WHITE (PLASTIC BAG) 25kg/bag", category: "HARD FLOUR" },
  { name: "ANGEL WHITE (COTTON) 25kg/bag", category: "HARD FLOUR" },
  { name: "ASIAN GRAINS NAGA AZUL 25kg/bag", category: "HARD FLOUR" },
  { name: "ASIAN GRAINS NAGA ORO 25kg/bag", category: "HARD FLOUR" },
  { name: "AJUMA 25kg/bag", category: "SOFT FLOUR" },
  { name: "AMIGO GOLD (PLASTIC) 25kg/bag", category: "SOFT FLOUR" },
  { name: "ATLANTIC GRAINS BANAHAW 25kg/bag", category: "SOFT FLOUR" },
  { name: "BABY PANDA 25kg/bag", category: "SOFT FLOUR" },
  { name: "NATURE'S SPRING Distilled Water 2L", category: "Bottled Water - Distilled" },
];

// Of the 208 DTI commodities above, only these get simulated 90-day price
// history (like COMMODITIES does) — one per category, kept small so seeding
// stays fast; the rest get just a Commodity + SRP row.
//
// The first five are deliberately the five that sort FIRST alphabetically.
// Commodity lists are ordered `name: asc` everywhere (public list, Price
// Trends picker), so these are the items a visitor lands on without touching
// a filter — seeding them richly is what makes the charts non-empty on the
// first screen anyone sees. The remaining entries keep one sample per
// category so other parts of the catalogue are not uniformly flat.
const DTI_PRICE_HISTORY_SAMPLE = new Set([
  // --- the five that sort first by name ---
  "5-STAR Esperma (White) #14 4pcs./pack",
  "5-STAR Esperma (White) #22 2pcs./pack",
  "5-STAR Esperma (White) #3 20pcs./pack",
  "5-STAR Esperma (White) #6 25pcs./pack",
  "5-STAR Esperma (White) #8 5pcs./pack",
  // --- one per category, for breadth ---
  "ABSOLUTE PURE Distilled Drinking Water 350ml",
  "555 BONUS Pack Sardines (Green) 155g",
  "HO-MI Instant Mami Noodles - Beef Brisket 55g",
  "BARETA Bar Blue - VizMin 330g",
  "JERSEY Sweetened Condensed Creamer 390g",
  "FIDEL Coarse (RED) LUZON 500g",
  "BLEND 45 3-in-1 Coffee Mix 18g",
  "GREEN Cross Pure Care - WHITE 55g",
]);

const STORES = [
  { name: "ABC Supermarket", location: "San Andres, Virac" },
  { name: "Virac Public Market", location: "Poblacion, Virac" },
  { name: "SaveMore Virac", location: "San Roque, Virac" },
  { name: "Panganiban Talipapa", location: "Panganiban" },
  { name: "Bato Public Market", location: "Bato" },
];

const DAYS_OF_HISTORY = 90;

// The public Price Trends page clamps history to PUBLIC_HISTORY_WINDOW_DAYS
// (60) regardless of the range pill, so the most recent 60 days are the ones
// a visitor can actually see. History runs to 90 for the admin/officer side.
const DAYS_BETWEEN_VISITS = 2;

// Prices stay inside this band around each item's own SRP. Learned the hard
// way: an earlier demo dataset used ±20% plus unbounded outliers, which
// flattened every chart's y-axis and dragged the ARIMA forecast badly enough
// that a separate normalization script had to be written to undo it. Keeping
// generation inside the band means no clean-up pass is needed.
const PRICE_BAND = 0.1;

type PriceStatus = "COMPLIANT" | "OVERPRICE" | "UNDERPRICE";

function calculateStatus(price: number, srpPrice: number): PriceStatus {
  if (price > srpPrice) return "OVERPRICE";
  if (price < srpPrice) return "UNDERPRICE";
  return "COMPLIANT";
}

// Deterministic per (commodity, day) jitter. Re-running the seed reproduces
// the same series instead of inventing new noise, so a chart someone signed
// off on does not silently change shape on the next run.
function jitter(seed: number, index: number): number {
  const x = Math.sin(seed * 127.1 + index * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // -1..1
}

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) % 100000;
  }
  return h;
}

// Six distinct shapes, assigned per commodity, so the charts do not all look
// copy-pasted. Each returns a multiplier in roughly -1..1, scaled below by
// PRICE_BAND so every shape stays inside the band by construction.
//
// Every shape must CROSS zero, not just approach it. A shape that stays on one
// side of SRP for its whole window renders as permanently over- or
// under-priced, which misrepresents compliance — a dry run caught exactly that
// here (an uncentred dip sat below SRP on 111 of 115 records), and the same
// defect had to be fixed once before in the 2026-09-09 normalization pass.
const SHAPES: Array<(t: number) => number> = [
  (t) => -0.7 + 1.4 * t, // steady rise through SRP
  (t) => 0.7 - 1.4 * t, // decline through SRP
  (t) => Math.sin(t * Math.PI * 2) * 0.8, // full wave
  (t) => 0.45 - Math.sin(t * Math.PI) * 0.9, // dip and recover, centred on SRP
  (t) => Math.sin(t * Math.PI * 4) * 0.35, // near-flat ripple
  (t) => -0.5 + t * 1.0 + Math.sin(t * Math.PI * 3) * 0.3, // rise with wobble
];

// Shape and per-store noise are both scaled so that, added together, they
// cannot leave PRICE_BAND: the shapes peak at ~1.0 and the noise at
// NOISE_SHARE, so the trend gets the remainder.
const NOISE_SHARE = 0.2;

async function main() {
  const hashedPassword = await passwordUtils.hashPassword(SEED_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: "admin@presyoserbisyo.gov.ph" },
    create: {
      email: "admin@presyoserbisyo.gov.ph",
      password: hashedPassword,
      name: "DTI Admin",
      role: "ADMIN",
    },
    update: {},
  });

  const officer = await prisma.user.upsert({
    where: { email: "officer@presyoserbisyo.gov.ph" },
    create: {
      email: "officer@presyoserbisyo.gov.ph",
      password: hashedPassword,
      name: "Field Officer",
      role: "OFFICER",
    },
    update: {},
  });

  console.log(`Users ready: ${admin.email} / ${officer.email} (password: ${SEED_PASSWORD})`);

  // Category is a real reference table as of Phase 7.6 — upsert by name so
  // re-running the seed against a DB that already has some categories doesn't
  // duplicate them, then resolve every spec's category string to its id.
  const categoryIdByName = new Map<string, string>();
  const resolveCategoryId = async (name: string) => {
    const cached = categoryIdByName.get(name);
    if (cached) return cached;

    const category = await prisma.category.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    categoryIdByName.set(name, category.id);
    return category.id;
  };

  const srpEffectiveDate = new Date();
  srpEffectiveDate.setDate(srpEffectiveDate.getDate() - (DAYS_OF_HISTORY + 10));

  const commodities = [];
  for (const spec of COMMODITIES) {
    const categoryId = await resolveCategoryId(spec.category);
    const commodity = await prisma.commodity.create({
      data: { name: spec.name, categoryId, status: "Active" },
    });
    await prisma.sRP.create({
      data: {
        commodityId: commodity.id,
        price: spec.srp,
        effectiveDate: srpEffectiveDate,
      },
    });
    commodities.push({ ...commodity, srp: spec.srp });
  }
  console.log(`Created ${commodities.length} commodities with SRPs.`);

  let dtiWithSrpCount = 0;
  const dtiHistorySample = [];
  for (const spec of DTI_COMMODITIES_WITH_SRP) {
    const categoryId = await resolveCategoryId(spec.category);
    const commodity = await prisma.commodity.create({
      data: { name: spec.name, categoryId, status: "Active" },
    });
    await prisma.sRP.create({
      data: {
        commodityId: commodity.id,
        price: spec.srp,
        effectiveDate: srpEffectiveDate,
      },
    });
    dtiWithSrpCount += 1;
    if (DTI_PRICE_HISTORY_SAMPLE.has(spec.name)) {
      dtiHistorySample.push({ ...commodity, srp: spec.srp });
    }
  }
  console.log(`Created ${dtiWithSrpCount} DTI commodities with SRPs (from FM-PSM-02v01).`);

  let dtiNoSrpCount = 0;
  for (const spec of DTI_COMMODITIES_NO_SRP) {
    const categoryId = await resolveCategoryId(spec.category);
    await prisma.commodity.create({
      data: { name: spec.name, categoryId, status: "Active" },
    });
    dtiNoSrpCount += 1;
  }
  console.log(`Created ${dtiNoSrpCount} DTI commodities with no SRP.`);

  commodities.push(...dtiHistorySample);

  const stores = [];
  for (const spec of STORES) {
    const store = await prisma.store.create({
      data: { name: spec.name, location: spec.location, userId: officer.id },
    });
    stores.push(store);
  }
  console.log(`Created ${stores.length} stores.`);

  // Price history. Each commodity gets one of six shapes so the charts are
  // visibly different from each other, with every point held inside
  // ±PRICE_BAND of that item's OWN SRP — a commodity priced at ₱12 and one at
  // ₱320 therefore move by proportionate amounts, not by the same pesos.
  //
  // Officers visit every other day rather than daily, which is both closer to
  // real field monitoring and what makes the chart's "days with no records are
  // skipped" behaviour visible. Several stores are recorded per visit so
  // Store Compliance has more than one store to compare.
  const rows: Array<{
    commodityId: string;
    storeId: string;
    userId: string;
    price: number;
    dateAndTime: Date;
    status: PriceStatus;
  }> = [];

  for (const commodity of commodities) {
    const seed = hashName(commodity.name);
    const shape = SHAPES[seed % SHAPES.length];
    // Rotate the starting store per commodity so the same shop is not always
    // the first one recorded.
    const storeOffset = seed % stores.length;

    for (let dayOffset = DAYS_OF_HISTORY; dayOffset >= 0; dayOffset -= DAYS_BETWEEN_VISITS) {
      const step = (DAYS_OF_HISTORY - dayOffset) / DAYS_BETWEEN_VISITS;
      const t = (DAYS_OF_HISTORY - dayOffset) / DAYS_OF_HISTORY; // 0 -> 1 over the window

      // 2-3 stores per visit, varying by day so the counts are not suspiciously uniform.
      const storesToday = 2 + (step % 2);

      for (let s = 0; s < storesToday; s += 1) {
        const store = stores[(storeOffset + s) % stores.length];

        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        // Field visits happen during working hours, not at midnight.
        date.setHours(8 + ((step + s) % 8), (seed + s * 17) % 60, 0, 0);

        // Shape drives the trend; jitter adds small per-store disagreement so
        // the same commodity is not identically priced in every shop.
        const trend = shape(t) * PRICE_BAND * (1 - NOISE_SHARE);
        const storeNoise = jitter(seed + s * 991, step) * PRICE_BAND * NOISE_SHARE;
        const raw = commodity.srp * (1 + trend + storeNoise);
        const price = Math.max(0.5, Number(raw.toFixed(2)));

        rows.push({
          commodityId: commodity.id,
          storeId: store.id,
          userId: officer.id,
          price,
          dateAndTime: date,
          status: calculateStatus(price, commodity.srp),
        });
      }
    }
  }

  // createMany in chunks — one insert per row is slow enough to matter at this
  // volume, and a single oversized insert risks the driver's parameter limit.
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.priceRecord.createMany({ data: rows.slice(i, i + CHUNK) });
  }
  console.log(
    `Created ${rows.length} price records for ${commodities.length} commodities ` +
      `across ${DAYS_OF_HISTORY} days (every ${DAYS_BETWEEN_VISITS} days, multiple stores per visit).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
