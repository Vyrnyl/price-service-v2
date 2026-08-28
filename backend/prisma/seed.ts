import { prisma } from "../src/prisma";
import { passwordUtils } from "../src/shared/utils/password.utils";

const SEED_PASSWORD = "Password123!";

const COMMODITIES: Array<{ name: string; category: string; srp: number }> = [
  { name: "Well-milled Rice", category: "Grain", srp: 45 },
  { name: "Refined Sugar", category: "Sugar", srp: 90 },
  { name: "Cooking Oil (1L)", category: "Oil", srp: 95 },
  { name: "Red Onion", category: "Vegetable", srp: 120 },
  { name: "Garlic", category: "Vegetable", srp: 150 },
  { name: "Chicken Egg (per piece)", category: "Poultry", srp: 8 },
  { name: "Pork Belly", category: "Meat", srp: 320 },
  { name: "Dressed Chicken", category: "Poultry", srp: 190 },
  { name: "Galunggong (Round Scad)", category: "Fish", srp: 220 },
  { name: "Canned Sardines", category: "Canned Goods", srp: 25 },
];

const STORES = [
  { name: "ABC Supermarket", location: "San Andres, Virac" },
  { name: "Virac Public Market", location: "Poblacion, Virac" },
  { name: "SaveMore Virac", location: "San Roque, Virac" },
  { name: "Panganiban Talipapa", location: "Panganiban" },
  { name: "Bato Public Market", location: "Bato" },
];

const DAYS_OF_HISTORY = 90;

type PriceStatus = "COMPLIANT" | "OVERPRICE" | "UNDERPRICE";

function calculateStatus(price: number, srpPrice: number): PriceStatus {
  if (price > srpPrice) return "OVERPRICE";
  if (price < srpPrice) return "UNDERPRICE";
  return "COMPLIANT";
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

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

  const srpEffectiveDate = new Date();
  srpEffectiveDate.setDate(srpEffectiveDate.getDate() - (DAYS_OF_HISTORY + 10));

  const commodities = [];
  for (const spec of COMMODITIES) {
    const commodity = await prisma.commodity.create({
      data: { name: spec.name, category: spec.category, status: "Active" },
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

  const stores = [];
  for (const spec of STORES) {
    const store = await prisma.store.create({
      data: { name: spec.name, location: spec.location, userId: officer.id },
    });
    stores.push(store);
  }
  console.log(`Created ${stores.length} stores.`);

  let recordCount = 0;
  for (const commodity of commodities) {
    // Mild upward drift over the window so ARIMA sees a real trend, plus
    // day-to-day noise and an occasional over/under-price outlier.
    for (let dayOffset = DAYS_OF_HISTORY; dayOffset >= 0; dayOffset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);

      const drift = ((DAYS_OF_HISTORY - dayOffset) / DAYS_OF_HISTORY) * (commodity.srp * 0.06);
      const noise = randomBetween(-commodity.srp * 0.03, commodity.srp * 0.03);
      const price = Math.max(1, Number((commodity.srp + drift + noise).toFixed(2)));
      const store = stores[Math.floor(Math.random() * stores.length)];

      await prisma.priceRecord.create({
        data: {
          commodityId: commodity.id,
          storeId: store.id,
          userId: officer.id,
          price,
          dateAndTime: date,
          status: calculateStatus(price, commodity.srp),
        },
      });
      recordCount += 1;
    }
  }
  console.log(`Created ${recordCount} price records across ${DAYS_OF_HISTORY + 1} days.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
