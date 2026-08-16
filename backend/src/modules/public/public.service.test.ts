import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveComplianceStatus, buildPublicCommodityDto } from './public.service';

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

test('buildPublicCommodityDto averages multiple price records and flags each individually', () => {
  const commodity = {
    id: 'commodity-1',
    name: 'Rice',
    category: 'Grains',
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
        store: { name: 'Store B', location: 'Virac' },
      },
      {
        id: 'price-1',
        price: 40,
        dateAndTime: new Date('2026-01-02'),
        createdAt: new Date('2026-01-02'),
        status: 'UNDERPRICE',
        store: null,
      },
    ],
  };

  const dto = buildPublicCommodityDto(commodity);

  assert.equal(dto.srpPrice, 50);
  assert.equal(dto.currentPrice, 50);
  assert.equal(dto.complianceStatus, 'Compliant');
  assert.equal(dto.lastUpdatedAt.getTime(), commodity.prices[0]!.dateAndTime.getTime());
  assert.equal(dto.storeName, 'Store B');
  assert.equal(dto.priceRecords.length, 2);
  assert.equal(dto.priceRecords[0]!.complianceStatus, 'Above SRP');
  assert.equal(dto.priceRecords[1]!.complianceStatus, 'Below SRP');
  assert.equal(dto.priceRecords[1]!.storeName, null);
});

test('buildPublicCommodityDto handles a commodity with no price history yet', () => {
  const commodity = {
    id: 'commodity-2',
    name: 'Sugar',
    category: 'Staples',
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
  assert.equal(dto.priceRecords.length, 0);
});
