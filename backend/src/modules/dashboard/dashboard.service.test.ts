import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCommodityComparison, buildPriceTrend, type PriceRecordForAnalytics } from './dashboard.service';

function record(
  commodityId: string,
  commodityName: string,
  price: number,
  dateAndTime: string,
): PriceRecordForAnalytics {
  return {
    commodityId,
    commodity: { name: commodityName },
    price: { toNumber: () => price } as PriceRecordForAnalytics['price'],
    dateAndTime: new Date(dateAndTime),
  };
}

test('buildPriceTrend averages prices per day and sorts chronologically', () => {
  const records = [
    record('c1', 'Rice', 50, '2026-08-02T08:00:00.000Z'),
    record('c1', 'Rice', 45, '2026-08-01T08:00:00.000Z'),
    record('c2', 'Sugar', 90, '2026-08-01T09:00:00.000Z'),
  ];

  const trend = buildPriceTrend(records);

  assert.equal(trend.length, 2);
  assert.equal(trend[0].date, '2026-08-01');
  assert.equal(trend[0].averagePrice, 67.5);
  assert.equal(trend[1].date, '2026-08-02');
  assert.equal(trend[1].averagePrice, 50);
});

test('buildPriceTrend returns an empty array when there are no records', () => {
  assert.deepEqual(buildPriceTrend([]), []);
});

test('buildCommodityComparison averages prices per commodity, highest first', () => {
  const records = [
    record('c1', 'Rice', 40, '2026-08-01T08:00:00.000Z'),
    record('c1', 'Rice', 50, '2026-08-02T08:00:00.000Z'),
    record('c2', 'Sugar', 90, '2026-08-01T09:00:00.000Z'),
  ];

  const comparison = buildCommodityComparison(records);

  assert.equal(comparison.length, 2);
  assert.equal(comparison[0].commodityId, 'c2');
  assert.equal(comparison[0].averagePrice, 90);
  assert.equal(comparison[1].commodityId, 'c1');
  assert.equal(comparison[1].averagePrice, 45);
});
