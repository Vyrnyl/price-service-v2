import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveComplianceStatus,
  resolveComplianceStatusFromRange,
  buildPerStorePrices,
  computePriceRange,
  buildPublicCommodityDto,
  buildSrpHistoryDto,
} from './public.service';

test('resolveComplianceStatus: price above SRP', () => {
  assert.equal(resolveComplianceStatus(60, 50), 'Above SRP');
});

test('resolveComplianceStatus: price below SRP', () => {
  assert.equal(resolveComplianceStatus(40, 50), 'Below SRP');
});

test('resolveComplianceStatus: price equal to SRP', () => {
  assert.equal(resolveComplianceStatus(50, 50), 'Compliant');
});

test('resolveComplianceStatus: missing price or SRP is Unknown', () => {
  assert.equal(resolveComplianceStatus(null, 50), 'Unknown');
  assert.equal(resolveComplianceStatus(50, null), 'Unknown');
  assert.equal(resolveComplianceStatus(null, null), 'Unknown');
});

test('resolveComplianceStatusFromRange: any store above SRP makes it non-compliant, even with a cheaper store', () => {
  assert.equal(resolveComplianceStatusFromRange([{ price: 60 }, { price: 40 }], 50), 'Above SRP');
});

test('resolveComplianceStatusFromRange: all stores below SRP', () => {
  assert.equal(resolveComplianceStatusFromRange([{ price: 40 }, { price: 45 }], 50), 'Below SRP');
});

test('resolveComplianceStatusFromRange: all stores exactly at SRP', () => {
  assert.equal(resolveComplianceStatusFromRange([{ price: 50 }, { price: 50 }], 50), 'Compliant');
});

test('resolveComplianceStatusFromRange: no stores or no SRP is Unknown', () => {
  assert.equal(resolveComplianceStatusFromRange([], 50), 'Unknown');
  assert.equal(resolveComplianceStatusFromRange([{ price: 50 }], null), 'Unknown');
});

test('buildPerStorePrices: dedupes to the latest record per store, keeps unattributed records distinct', () => {
  const prices = [
    { id: 'p1', price: 100, dateAndTime: new Date('2026-01-05'), createdAt: new Date('2026-01-05'), status: 'OVERPRICE', storeId: 'store-a', store: { name: 'Store A', location: 'Virac' } },
    { id: 'p2', price: 80, dateAndTime: new Date('2026-01-03'), createdAt: new Date('2026-01-03'), status: 'COMPLIANT', storeId: 'store-a', store: { name: 'Store A', location: 'Virac' } },
    { id: 'p3', price: 60, dateAndTime: new Date('2026-01-04'), createdAt: new Date('2026-01-04'), status: 'UNDERPRICE', storeId: null, store: null },
  ];

  const perStorePrices = buildPerStorePrices(prices);

  assert.equal(perStorePrices.length, 2);
  assert.equal(perStorePrices[0]!.storeId, 'store-a');
  assert.equal(perStorePrices[0]!.price, 100);
  assert.equal(perStorePrices[1]!.storeName, null);
  assert.equal(perStorePrices[1]!.price, 60);
});

test('computePriceRange: finds min/max and attributes each to its store', () => {
  const range = computePriceRange([
    { storeId: 'a', storeName: 'Store A', storeLocation: 'Virac', price: 100, dateAndTime: new Date() },
    { storeId: 'b', storeName: 'Store B', storeLocation: 'Bato', price: 60, dateAndTime: new Date() },
  ]);

  assert.deepEqual(range, { min: 60, max: 100, minStoreName: 'Store B', maxStoreName: 'Store A' });
});

test('computePriceRange: empty input returns null', () => {
  assert.equal(computePriceRange([]), null);
});

test('buildPublicCommodityDto: one compliant store and one overpricing store reads as non-compliant with both prices visible', () => {
  const commodity = {
    id: 'commodity-1',
    name: 'Rice',
    category: { name: 'Grains' },
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    srps: [{ price: 50, effectiveDate: new Date('2026-01-01'), createdAt: new Date('2026-01-01') }],
    prices: [
      {
        id: 'price-2',
        price: 60,
        dateAndTime: new Date('2026-01-03'),
        createdAt: new Date('2026-01-03'),
        status: 'OVERPRICE',
        storeId: 'store-b',
        store: { name: 'Store B', location: 'Virac' },
      },
      {
        id: 'price-1',
        price: 40,
        dateAndTime: new Date('2026-01-02'),
        createdAt: new Date('2026-01-02'),
        status: 'UNDERPRICE',
        storeId: null,
        store: null,
      },
    ],
  };

  const dto = buildPublicCommodityDto(commodity);

  assert.equal(dto.srpPrice, 50);
  assert.equal(dto.currentPrice, 50);
  assert.equal(dto.complianceStatus, 'Above SRP');
  assert.equal(dto.lastUpdatedAt.getTime(), commodity.prices[0]!.dateAndTime.getTime());
  assert.equal(dto.storeName, 'Store B');
  assert.deepEqual(dto.priceRange, { min: 40, max: 60, minStoreName: null, maxStoreName: 'Store B' });
  assert.equal(dto.perStorePrices.length, 2);
  assert.equal(dto.priceRecords.length, 2);
  assert.equal(dto.priceRecords[0]!.complianceStatus, 'Above SRP');
  assert.equal(dto.priceRecords[1]!.complianceStatus, 'Below SRP');
  assert.equal(dto.priceRecords[1]!.storeName, null);
});

test('buildPublicCommodityDto: a store reporting twice only counts once toward the average and range', () => {
  const commodity = {
    id: 'commodity-2',
    name: 'Galunggong',
    category: { name: 'Fish' },
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    srps: [{ price: 90, effectiveDate: new Date('2026-01-01'), createdAt: new Date('2026-01-01') }],
    prices: [
      { id: 'p1', price: 100, dateAndTime: new Date('2026-01-05'), createdAt: new Date('2026-01-05'), status: 'OVERPRICE', storeId: 'store-a', store: { name: 'Store A', location: 'Virac' } },
      { id: 'p2', price: 130, dateAndTime: new Date('2026-01-03'), createdAt: new Date('2026-01-03'), status: 'OVERPRICE', storeId: 'store-a', store: { name: 'Store A', location: 'Virac' } },
      { id: 'p3', price: 80, dateAndTime: new Date('2026-01-04'), createdAt: new Date('2026-01-04'), status: 'UNDERPRICE', storeId: 'store-b', store: { name: 'Store B', location: 'Bato' } },
    ],
  };

  const dto = buildPublicCommodityDto(commodity);

  assert.equal(dto.perStorePrices.length, 2);
  assert.equal(dto.currentPrice, 90);
  assert.deepEqual(dto.priceRange, { min: 80, max: 100, minStoreName: 'Store B', maxStoreName: 'Store A' });
  assert.equal(dto.complianceStatus, 'Above SRP');
});

test('buildPublicCommodityDto handles a commodity with no price history yet', () => {
  const commodity = {
    id: 'commodity-3',
    name: 'Sugar',
    category: { name: 'Staples' },
    status: 'ACTIVE',
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    srps: [],
    prices: [],
  };

  const dto = buildPublicCommodityDto(commodity);

  assert.equal(dto.currentPrice, null);
  assert.equal(dto.srpPrice, null);
  assert.equal(dto.complianceStatus, 'Unknown');
  assert.equal(dto.lastUpdatedAt.getTime(), commodity.createdAt.getTime());
  assert.equal(dto.storeName, null);
  assert.equal(dto.priceRange, null);
  assert.equal(dto.perStorePrices.length, 0);
  assert.equal(dto.priceRecords.length, 0);
});

function srpRow(id: string, price: string, effectiveDate: string, createdAt: string) {
  return { id, price, effectiveDate: new Date(effectiveDate), createdAt: new Date(createdAt) };
}

const srpHistoryCommodity = {
  id: 'commodity-1',
  name: 'Rice',
  category: { name: 'Grains' },
};

test('buildSrpHistoryDto: returns every SRP oldest first with numeric prices', () => {
  const dto = buildSrpHistoryDto({
    ...srpHistoryCommodity,
    srps: [
      srpRow('b', '45.2500', '2025-06-01T00:00:00Z', '2025-06-01T00:00:00Z'),
      srpRow('a', '42.0000', '2024-11-04T00:00:00Z', '2024-11-04T00:00:00Z'),
      srpRow('c', '47.0000', '2026-06-09T00:00:00Z', '2026-06-09T00:00:00Z'),
    ],
  });

  assert.equal(dto.commodityId, 'commodity-1');
  assert.equal(dto.category, 'Grains');
  assert.deepEqual(dto.entries.map((entry) => entry.id), ['a', 'b', 'c']);
  assert.deepEqual(dto.entries.map((entry) => entry.price), [42, 45.25, 47]);
});

test('buildSrpHistoryDto: same effective date keeps only the last one saved, in its date position', () => {
  const dto = buildSrpHistoryDto({
    ...srpHistoryCommodity,
    srps: [
      srpRow('first', '40', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
      srpRow('typo', '4500', '2025-06-01T00:00:00Z', '2025-06-01T08:00:00Z'),
      srpRow('fixed', '45', '2025-06-01T00:00:00Z', '2025-06-01T09:00:00Z'),
      srpRow('latest', '47', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    ],
  });

  assert.deepEqual(dto.entries.map((entry) => entry.id), ['first', 'fixed', 'latest']);
  assert.equal(dto.entries[1].price, 45);
});

test('buildSrpHistoryDto: a commodity with no SRP returns an empty history', () => {
  const dto = buildSrpHistoryDto({ ...srpHistoryCommodity, srps: [] });

  assert.deepEqual(dto.entries, []);
});
