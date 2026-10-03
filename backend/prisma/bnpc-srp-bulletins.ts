// DTI "Suggested Retail Prices — Basic Necessities and Prime Commodities"
// bulletins, transcribed by hand from the two PDFs at the repo root:
//
//   BNPC-SRP-BULLETIN-02-FEB-30-APR-2026.002-1.pdf     effective 02 Feb 2026
//   BNPC-SRP-BULLETIN.11-MAY-2026.0010.PSU-CLEAN-A3-final.pdf  effective 11 May 2026
//
// The catalogue is the MAY bulletin (the SRPs in force now). `feb` is the same
// product's SRP in the February bulletin, when it had one, and becomes the
// earlier point in the SRP history; February-only items are left out, since
// seeding them would show a lapsed SRP as current.
//
// Scope rules applied while transcribing:
// - Catanduanes is in Luzon, so "Visayas / Mindanao" and "NCR" rows are
//   omitted and "Luzon" rows kept.
// - February split some condiments into supermarket (SMKT) and wet-market
//   (WMKT) SRPs; May lists one SRP. The three monitored stores are
//   supermarkets, so the SMKT figure is used as the February point.
// - February's "Saba Phil. Sardines - Luzon/Viz/Min" is May's "Saba
//   Philippines Sardines" (same product, renamed). February's "Surf with
//   ActivClean Technology" bars are NOT linked to May's "Surf Detergent Bar
//   Active Clean Power Bula Power Puti" — likely a rebrand, but the bulletin
//   does not say so.
// - Names follow the bulletin's wording, with the product type added where
//   the bulletin relied on its section heading ("Bingo 150g" is both a corned
//   beef and a beef loaf), because names appear without their category in
//   pickers and price records. Brand + size are folded into the name since
//   Commodity has no unit field.

export const BNPC_BULLETIN_DATES = {
  feb: "2026-02-02",
  may: "2026-05-11",
} as const;

export interface BnpcItem {
  name: string;
  category: string;
  may: number;
  feb?: number;
}

const SARDINES = "Canned Sardines in Tomato Sauce";
const CONDENSED = "Condensed Milk";
const EVAPORATED = "Evaporated Milk";
const POWDERED = "Powdered Milk";
const COFFEE = "Coffee 3-in-1 Original";
const BREAD = "Bread";
const NOODLES = "Instant Mami Noodles";
const ROCK_SALT = "Iodized Rock Salt";
const IODIZED_SALT = "Iodized Salt";
const DISTILLED = "Distilled Water";
const PURIFIED = "Purified Water";
const MINERALIZED = "Mineralized Water";
const LAUNDRY = "Detergent / Laundry Soap";
const CANDLES = "Candles";
const LUNCHEON = "Luncheon Meat";
const MEAT_LOAF = "Meat Loaf";
const CORNED_BEEF = "Corned Beef";
const BEEF_LOAF = "Beef Loaf";
const VINEGAR = "Vinegar";
const PATIS = "Patis";
const SOY_SAUCE = "Soy Sauce";
const TOILET_SOAP = "Toilet Soap";
const BATTERIES = "Batteries";

export const BNPC_ITEMS: BnpcItem[] = [
  // --- Canned sardines in tomato sauce ---
  { name: "Saba Philippines Sardines 155g", category: SARDINES, may: 21.5, feb: 17.5 },
  { name: "Atami Sardines Regular Lid 155g", category: SARDINES, may: 22.5, feb: 20.5 },
  { name: "Mikado Sardines Regular Lid 155g", category: SARDINES, may: 22.5, feb: 20.5 },
  { name: "King Cup Sardines Regular Lid 155g", category: SARDINES, may: 18, feb: 18 },
  { name: "Mariko Sardines Regular Lid 155g", category: SARDINES, may: 23.75, feb: 19.75 },
  { name: "Sallenas Sardines Regular Lid 155g", category: SARDINES, may: 24.75, feb: 18.5 },
  { name: "Atami Sardines EOC 155g", category: SARDINES, may: 23.25, feb: 21.25 },
  { name: "Mikado Sardines EOC 155g", category: SARDINES, may: 23.25, feb: 21.25 },
  { name: "555 Bonus Pack Sardines 155g", category: SARDINES, may: 20.5, feb: 19.65 },
  { name: "Lucky 7 Sardines 155g", category: SARDINES, may: 20.5, feb: 19.65 },
  { name: "Toyo Bonus Green Sardines EOC 155g", category: SARDINES, may: 20, feb: 19.5 },

  // --- Processed milk ---
  { name: "Jersey Sweetened Condensed Creamer 390g", category: CONDENSED, may: 44.5, feb: 44.5 },
  { name: "Angel Filled Milk 370mL", category: EVAPORATED, may: 48, feb: 48 },
  { name: "Bear Brand Powdered Milk 135g", category: POWDERED, may: 50, feb: 50 },
  { name: "Birch Tree Full Cream Milk 150g", category: POWDERED, may: 70.75, feb: 70.75 },
  { name: "Jersey Fortified Instant Powdered Milk Drink 300g", category: POWDERED, may: 96.25, feb: 96.25 },

  // --- Coffee 3-in-1 original ---
  { name: "Café Puro 3-in-1 17g", category: COFFEE, may: 4.7, feb: 4.7 },
  { name: "Blend 45 3-in-1 Original 18g", category: COFFEE, may: 5.5, feb: 5.5 },
  { name: "San Mig Coffee 3-in-1 Original 20g", category: COFFEE, may: 7.5, feb: 7 },
  { name: "Nescafe Original 3-in-1 20g", category: COFFEE, may: 7.75, feb: 7.75 },
  { name: "Kopiko Black 3-in-1 30g", category: COFFEE, may: 8.5, feb: 8.5 },
  { name: "Great Taste Original 3-in-1 Twin Pack 33g", category: COFFEE, may: 10, feb: 10 },

  // --- Bread ---
  { name: "Pinoy Pandesal (10pcs./pack) 250g", category: BREAD, may: 27.25, feb: 27.25 },
  { name: "Pinoy Tasty 450g", category: BREAD, may: 44, feb: 44 },

  // --- Instant mami noodles, chicken & beef flavor ---
  { name: "Payless Instant Mami (Chicken Espesyal and Beef Paborito) 55g", category: NOODLES, may: 7.5, feb: 7.5 },
  { name: "Quick Chow Instant Mami (Beef and Chicken) 55g", category: NOODLES, may: 7.75, feb: 7.75 },
  { name: "Ho-Mi Instant Mami (Chicken & Garlic, Beef Brisket) 55g", category: NOODLES, may: 9, feb: 8.5 },
  { name: "Lucky Me! Instant Mami (Chicken na Chicken, Beef na Beef) 55g", category: NOODLES, may: 9, feb: 8.75 },

  // --- Salt: iodized rock salt ---
  { name: "Lasap Rock Salt 250g", category: ROCK_SALT, may: 7.5, feb: 7.5 },
  { name: "Fidel Coarse (Red) - Luzon 250g", category: ROCK_SALT, may: 11, feb: 11 },
  { name: "Lasap Rock Salt 500g", category: ROCK_SALT, may: 13.5, feb: 13.5 },
  { name: "Fidel Coarse (Red) - Luzon 500g", category: ROCK_SALT, may: 21.25, feb: 21.25 },
  { name: "Lasap Rock Salt 1kg", category: ROCK_SALT, may: 25, feb: 25 },

  // --- Salt: iodized salt ---
  { name: "Lasap Iodized Salt 100g", category: IODIZED_SALT, may: 4.75, feb: 4.75 },
  { name: "Lasap Iodized Salt 250g", category: IODIZED_SALT, may: 9.75, feb: 9.75 },
  { name: "Fidel Refined (Blue) - Luzon 250g", category: IODIZED_SALT, may: 11.75, feb: 11.75 },
  { name: "Fidel Free Flowing (Green) - Luzon 250g", category: IODIZED_SALT, may: 12.75, feb: 12.75 },
  { name: "Lasap Iodized Salt 500g", category: IODIZED_SALT, may: 17.25, feb: 17.25 },
  { name: "Fidel Refined (Blue) - Luzon 500g", category: IODIZED_SALT, may: 23, feb: 23 },
  { name: "Fidel Free Flowing (Green) - Luzon 500g", category: IODIZED_SALT, may: 25, feb: 25 },
  { name: "Lasap Iodized Salt 1kg", category: IODIZED_SALT, may: 31.5, feb: 31.5 },

  // --- Bottled water: distilled ---
  { name: "SM Bonus Distilled Water 325mL", category: DISTILLED, may: 6.5, feb: 6.5 },
  { name: "Wilkins Distilled Water 330mL", category: DISTILLED, may: 12, feb: 12 },
  { name: "Absolute Distilled Water 350mL", category: DISTILLED, may: 12, feb: 12 },
  { name: "SM Bonus Distilled Water 500mL", category: DISTILLED, may: 8.5, feb: 8.5 },
  { name: "Absolute Distilled Water 500mL", category: DISTILLED, may: 16.75, feb: 16.25 },
  { name: "Wilkins Distilled Water 500mL", category: DISTILLED, may: 17, feb: 17 },
  { name: "Wilkins Distilled Water 1L", category: DISTILLED, may: 25, feb: 25 },
  { name: "Absolute Distilled Water 1L", category: DISTILLED, may: 25, feb: 25 },
  { name: "Absolute Distilled Water 6L", category: DISTILLED, may: 83, feb: 82 },
  { name: "SM Bonus Distilled Water 6.6L", category: DISTILLED, may: 54.5, feb: 54.5 },
  { name: "Wilkins Distilled Water 7L", category: DISTILLED, may: 90, feb: 88 },

  // --- Bottled water: purified ---
  { name: "SM Bonus Purified Water 300mL", category: PURIFIED, may: 5, feb: 5 },
  { name: "Magnolia Pure Purified Water 355mL", category: PURIFIED, may: 8.5, feb: 8.5 },
  { name: "Refresh Purified Water 500mL", category: PURIFIED, may: 6.75, feb: 6.75 },
  { name: "Natures Spring Purified Water 500mL", category: PURIFIED, may: 10.5, feb: 10.5 },
  { name: "Magnolia Pure Purified Water 500mL", category: PURIFIED, may: 10.5, feb: 10.5 },
  { name: "Wilkins Pure Purified Water 500mL", category: PURIFIED, may: 11, feb: 11 },
  { name: "Natures Spring Purified Water 1L", category: PURIFIED, may: 16.5, feb: 16.5 },
  { name: "Wilkins Pure Purified Water 1L", category: PURIFIED, may: 18, feb: 18 },
  { name: "Magnolia Pure Purified Water 1L", category: PURIFIED, may: 19.5, feb: 19.5 },

  // --- Bottled water: mineralized ---
  { name: "Supersavers Nature's Pure Mineralized Water 330mL", category: MINERALIZED, may: 7.15, feb: 7.15 },
  { name: "Hidden Spring Mineralized Water 330mL", category: MINERALIZED, may: 8.8, feb: 8.8 },
  { name: "Viva Mineralized Water 330mL", category: MINERALIZED, may: 10, feb: 10 },
  { name: "Refresh Mineralized Water 350mL", category: MINERALIZED, may: 6.6, feb: 6.6 },
  { name: "Summit Mineralized Water 350mL", category: MINERALIZED, may: 10, feb: 10 },
  { name: "Refresh Mineralized Water 500mL", category: MINERALIZED, may: 9.15, feb: 9.15 },
  { name: "Supersavers Nature's Pure Mineralized Water 500mL", category: MINERALIZED, may: 8.7, feb: 8.7 },
  { name: "Robinsons Mall Mineralized Water 500mL", category: MINERALIZED, may: 10.45, feb: 10.45 },
  { name: "Hidden Spring Mineralized Water 500mL", category: MINERALIZED, may: 12.1, feb: 12.1 },
  { name: "Viva Mineralized Water 500mL", category: MINERALIZED, may: 13, feb: 13 },
  { name: "Summit Mineralized Water 500mL", category: MINERALIZED, may: 12, feb: 12 },
  { name: "Viva Mineralized Water 1L", category: MINERALIZED, may: 19, feb: 19 },
  { name: "Summit Mineralized Water 1L", category: MINERALIZED, may: 19.5, feb: 19.5 },
  { name: "Summit Mineralized Water 6L", category: MINERALIZED, may: 75, feb: 75 },

  // --- Detergent soap / laundry soap ---
  {
    name: "Budget Bar (White Anti Bac, Fabcon, Kalamansi, Power Blue, Speckled Blue) - Luzon 330g",
    category: LAUNDRY,
    may: 21,
    feb: 21,
  },
  { name: "Speed Long Bar (White, Blue, Speckled Blue, Kalamansi) 370g", category: LAUNDRY, may: 25.75 },
  { name: "Surf Detergent Bar Active Clean Power Bula Power Puti - Blue 360g", category: LAUNDRY, may: 23.25 },
  {
    name: "Surf Detergent Bar Active Clean Power Bula Power Puti (Kalamansi, Tawas) 360g",
    category: LAUNDRY,
    may: 24.5,
  },
  { name: "Champion Bar (Supra Clean, Citrus Fresh) 370g", category: LAUNDRY, may: 25, feb: 23 },
  { name: "Bonux Bar (Flower Fiesta, Kalamansi Zest) 380g", category: LAUNDRY, may: 21, feb: 21 },
  { name: "Tide Bar Original Scent 380g", category: LAUNDRY, may: 24, feb: 24 },

  // --- Candles ---
  { name: "Export Vigil Candles White/Yellow #01 (12pcs./pack)", category: CANDLES, may: 60.5, feb: 60.5 },
  { name: "Manila Wax Votive White/Yellow #01 (6pcs./pack)", category: CANDLES, may: 82.76, feb: 82.76 },
  { name: "Manila Wax Sperma White #02 (10pcs./pack)", category: CANDLES, may: 54.11, feb: 54.11 },
  { name: "Manila Wax Votive White/Yellow #02 (6pcs./pack)", category: CANDLES, may: 71.09, feb: 71.09 },
  { name: "Export Candles White #03 (20pcs./pack)", category: CANDLES, may: 39, feb: 39 },
  { name: "5-Star Esperma White #03 (20pcs./pack)", category: CANDLES, may: 54.25, feb: 54.25 },
  { name: "Manila Wax Votive White/Yellow #03 (6pcs./pack)", category: CANDLES, may: 59.41, feb: 59.41 },
  { name: "Manila Wax Sperma White #03 (20pcs./pack)", category: CANDLES, may: 64.72, feb: 64.72 },
  { name: "Liwanag Esperma Candle White #03 (20pcs./pack)", category: CANDLES, may: 81, feb: 65.78 },
  { name: "Manila Wax Sperma White #04 (20pcs./pack)", category: CANDLES, may: 47.74, feb: 47.74 },
  { name: "Export Candles White #05 (20pcs./pack)", category: CANDLES, may: 60.5, feb: 60.5 },
  { name: "Liwanag Esperma Candle White #05 (20pcs./pack)", category: CANDLES, may: 109.75, feb: 88.05 },
  { name: "Export Candles White #06 (20pcs./pack)", category: CANDLES, may: 85, feb: 85 },
  { name: "5-Star Esperma White #06 (25pcs./pack)", category: CANDLES, may: 115.5, feb: 115.5 },
  { name: "Export Candles White #08 (12pcs./pack)", category: CANDLES, may: 60.5, feb: 60.5 },
  { name: "5-Star Esperma White #08 (5pcs./pack)", category: CANDLES, may: 150.25, feb: 150.25 },
  { name: "Export Candles White #10 (10pcs./pack)", category: CANDLES, may: 72.75, feb: 72.75 },
  { name: "Export Candles White #12 (10pcs./pack)", category: CANDLES, may: 72.75, feb: 72.75 },
  { name: "5-Star Esperma White #14 (4pcs./pack)", category: CANDLES, may: 36.25, feb: 36.25 },
  { name: "Manila Wax Sperma White #14 (4pcs./pack)", category: CANDLES, may: 54.1, feb: 54.1 },
  { name: "Export Candles White #14 (8pcs./pack)", category: CANDLES, may: 72.75, feb: 72.75 },
  { name: "Export Candles White #16 (4pcs./pack)", category: CANDLES, may: 36.25, feb: 36.25 },
  { name: "Liwanag Esperma Candle White #16 (4pcs./pack)", category: CANDLES, may: 57.75, feb: 46.42 },
  { name: "Manila Wax Sperma White #16 (2pcs./pack)", category: CANDLES, may: 59.41, feb: 59.41 },
  { name: "Export Candles White #18 (4pcs./pack)", category: CANDLES, may: 48.5, feb: 48.5 },
  { name: "Liwanag Esperma Candle White #18 (4pcs./pack)", category: CANDLES, may: 94.75, feb: 76.13 },
  { name: "Export Candles White #19 (4pcs./pack)", category: CANDLES, may: 97, feb: 97 },
  { name: "Export Candles White #20x2 (2pcs./pack)", category: CANDLES, may: 66.75, feb: 66.75 },
  { name: "Export Candles White #20x4 (4pcs./pack)", category: CANDLES, may: 121.5, feb: 121.5 },
  { name: "5-Star Esperma White #22 (2pcs./pack)", category: CANDLES, may: 117.75, feb: 117.75 },
  { name: "Liwanag Esperma Candle White #24 (2pcs./pack)", category: CANDLES, may: 220, feb: 177.71 },
  { name: "Export Vigil Candles White/Yellow #2x4 (4pcs./pack)", category: CANDLES, may: 54.5, feb: 54.5 },
  { name: "Export Vigil Candles White/Yellow #2x6 (6pcs./pack)", category: CANDLES, may: 85, feb: 85 },

  // --- Prime commodities: luncheon meat ---
  { name: "Purefoods Chinese Style Luncheon Meat 165g", category: LUNCHEON, may: 40, feb: 40 },
  { name: "CDO Chinese Style Luncheon Meat 165g", category: LUNCHEON, may: 41, feb: 41 },

  // --- Meat loaf ---
  { name: "Winner Meat Loaf - SMKT 150g", category: MEAT_LOAF, may: 18, feb: 18 },
  { name: "555 Meat Loaf 150g", category: MEAT_LOAF, may: 19.5, feb: 19.5 },
  { name: "CDO Meat Loaf 150g", category: MEAT_LOAF, may: 21.75, feb: 21.75 },
  { name: "Argentina Meat Loaf 150g", category: MEAT_LOAF, may: 23.75, feb: 23.75 },
  { name: "Argentina Meat Loaf 170g", category: MEAT_LOAF, may: 25.25, feb: 25.25 },

  // --- Corned beef ---
  { name: "Bingo Corned Beef 150g", category: CORNED_BEEF, may: 23, feb: 23 },
  { name: "El Rancho Corned Beef - SMKT 150g", category: CORNED_BEEF, may: 31.25, feb: 31.25 },
  { name: "Winner Corned Beef - SMKT 150g", category: CORNED_BEEF, may: 33.75, feb: 33.75 },
  { name: "Star Corned Beef 150g", category: CORNED_BEEF, may: 34, feb: 34 },
  { name: "Young's Town Premium Corned Beef 150g", category: CORNED_BEEF, may: 34.25, feb: 34.25 },
  { name: "Argentina Corned Beef 150g", category: CORNED_BEEF, may: 36.75, feb: 36.75 },
  { name: "Argentina Corned Beef 175g", category: CORNED_BEEF, may: 41.75, feb: 41.75 },

  // --- Beef loaf ---
  { name: "Purefoods Beef Loaf 150g", category: BEEF_LOAF, may: 18.15, feb: 18.15 },
  { name: "Bingo Beef Loaf 150g", category: BEEF_LOAF, may: 19.5, feb: 19.5 },
  { name: "555 Beef Loaf 150g", category: BEEF_LOAF, may: 19.5, feb: 19.5 },
  { name: "CDO Beef Loaf 150g", category: BEEF_LOAF, may: 21.75, feb: 21.75 },
  { name: "Argentina Beef Loaf 150g", category: BEEF_LOAF, may: 22, feb: 22 },
  { name: "El Rancho Beef Loaf - SMKT 155g", category: BEEF_LOAF, may: 19.5, feb: 19.5 },
  { name: "Argentina Beef Loaf 170g", category: BEEF_LOAF, may: 25, feb: 25 },
  { name: "Purefoods Beef Loaf 200g", category: BEEF_LOAF, may: 24.9, feb: 24.9 },

  // --- Condiments: vinegar (February point = SMKT) ---
  { name: "Datu Puti White Vinegar 350mL", category: VINEGAR, may: 19.25, feb: 18 },
  { name: "Silver Swan Sukang Puti 350mL", category: VINEGAR, may: 19, feb: 18 },
  { name: "Silver Swan Sukang Puti Doy Pack 200mL", category: VINEGAR, may: 8.75, feb: 8.25 },

  // --- Condiments: patis (February point = SMKT) ---
  { name: "Lorins Patis PET Bottle 350mL", category: PATIS, may: 27.5, feb: 25 },
  { name: "Silver Swan Special Patis 350mL", category: PATIS, may: 26, feb: 24.5 },
  { name: "Datu Puti Patis 350mL", category: PATIS, may: 28.5, feb: 27 },
  { name: "Nelicom Special Patis 350mL", category: PATIS, may: 32.75, feb: 30.5 },
  { name: "Lorins Patis Pouch 150mL", category: PATIS, may: 13.25, feb: 12.5 },
  { name: "Lorins Patis Budget Pouch 350mL", category: PATIS, may: 23.75, feb: 22.5 },

  // --- Condiments: soy sauce (February point = SMKT) ---
  { name: "Datu Puti Soy Sauce 350mL", category: SOY_SAUCE, may: 20.75, feb: 19.75 },
  { name: "Silver Swan Soy Sauce 350mL", category: SOY_SAUCE, may: 22, feb: 20.75 },
  { name: "Silver Swan Soy Sauce Doy Pack 200mL", category: SOY_SAUCE, may: 11.5, feb: 11 },

  // --- Toilet soap ---
  { name: "Green Cross (Pure Care) Soap 55g", category: TOILET_SOAP, may: 15, feb: 15 },
  {
    name: "Palmolive Naturals Soap (Pinkish Glow, Hydrating Glow, White with Papaya, White with Milk) 55g",
    category: TOILET_SOAP,
    may: 17,
    feb: 17,
  },
  { name: "Safeguard Pure White Soap 55g", category: TOILET_SOAP, may: 22, feb: 22 },
  { name: "Green Cross (Pure Care) Soap 85g", category: TOILET_SOAP, may: 25.75, feb: 25.75 },
  { name: "Safeguard Pure White Soap 82g", category: TOILET_SOAP, may: 31.25, feb: 31.25 },
  { name: "Green Cross (Pure Care) Soap 125g", category: TOILET_SOAP, may: 37.25, feb: 37.25 },
  { name: "Safeguard Pure White Soap 119g", category: TOILET_SOAP, may: 49, feb: 49 },

  // --- Batteries ---
  { name: "Energizer Max AA - Blister Pack of 4", category: BATTERIES, may: 216.75, feb: 206.25 },
  { name: "Eveready Super Heavy Duty Black D - Blister Pack of 2", category: BATTERIES, may: 81.75, feb: 77.75 },
];
