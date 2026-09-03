import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCommodityComparison,
  buildPriceTrend,
  buildSrpVsActual,
  DASHBOARD_CHART_LIMIT,
  type PriceRecordForAnalytics,
} from './dashboard.service';
import type { CommodityComparisonPoint } from './dashboard.types';

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

function point(commodityId: string, averagePrice: number): CommodityComparisonPoint {
  return { commodityId, commodityName: commodityId.toUpperCase(), averagePrice };
}

test('buildSrpVsActual ranks by overage above SRP, worst offender first', () => {
  // c2 is the most expensive in absolute terms but sits below SRP; c3 is cheap
  // yet the furthest above its SRP, so it must outrank both.
  const comparison = [point('c2', 100), point('c1', 60), point('c3', 30)];
  const srps = new Map([
    ['c1', 50],
    ['c2', 120],
    ['c3', 10],
  ]);

  const result = buildSrpVsActual(comparison, srps);

  assert.deepEqual(
    result.map((entry) => entry.commodityId),
    ['c3', 'c1', 'c2'],
  );
  assert.equal(result[0].srp, 10);
  assert.equal(result[0].actualAverage, 30);
});

test('buildSrpVsActual drops commodities with no SRP on record', () => {
  const result = buildSrpVsActual([point('c1', 60), point('c2', 80)], new Map([['c1', 50]]));

  assert.equal(result.length, 1);
  assert.equal(result[0].commodityId, 'c1');
});

test('buildSrpVsActual still returns compliant commodities when none are in violation', () => {
  const result = buildSrpVsActual(
    [point('c1', 40), point('c2', 30)],
    new Map([
      ['c1', 50],
      ['c2', 100],
    ]),
  );

  // Closest to its SRP ranks first; a fully compliant dataset must not render empty.
  assert.deepEqual(
    result.map((entry) => entry.commodityId),
    ['c1', 'c2'],
  );
});

test('buildSrpVsActual ranks across the whole set before any cap is applied', () => {
  // The worst offender is deliberately last by average price, so a naive
  // "slice then sort" would drop it from the top N entirely.
  const comparison = Array.from({ length: 40 }, (_, index) => point(`c${index}`, 100 - index));
  const srps = new Map(comparison.map((entry) => [entry.commodityId, entry.averagePrice - 1]));
  srps.set('c39', 1); // c39 averages 61 against an SRP of 1 — by far the largest overage.

  const ranked = buildSrpVsActual(comparison, srps);

  assert.equal(ranked[0].commodityId, 'c39');
  assert.equal(ranked.slice(0, DASHBOARD_CHART_LIMIT).length, DASHBOARD_CHART_LIMIT);
});
