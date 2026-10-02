import test from 'node:test';
import assert from 'node:assert/strict';
import AppError from '../../shared/utils/AppError';
import { commodityRepository } from './commodity.repository';
import { commodityService } from './commodity.service';
import { SRP_PROJECTION_HORIZON_DAYS, buildSrpProjection } from './srp-projection';

const NOW = new Date('2026-10-01T00:00:00.000Z');
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

test('buildSrpProjection: fewer than 3 SRPs in force gives no projection', () => {
  assert.equal(buildSrpProjection([], NOW), null);
  assert.equal(
    buildSrpProjection(
      [
        { price: 40, effectiveDate: day('2026-01-01') },
        { price: 42, effectiveDate: day('2026-06-01') },
      ],
      NOW,
    ),
    null,
  );
});

test('buildSrpProjection: a steady rise is carried forward per day from the current SRP', () => {
  // +₱1 every 100 days → +₱0.30 over the 30-day horizon.
  const projection = buildSrpProjection(
    [
      { price: 40, effectiveDate: day('2026-01-01') },
      { price: 41, effectiveDate: new Date(day('2026-01-01').getTime() + 100 * 86_400_000) },
      { price: 42, effectiveDate: new Date(day('2026-01-01').getTime() + 200 * 86_400_000) },
    ],
    NOW,
  );

  assert.ok(projection);
  assert.equal(projection.currentPrice, 42);
  assert.equal(projection.projectedPrice, 42.3);
  assert.equal(projection.horizonDays, SRP_PROJECTION_HORIZON_DAYS);
  assert.equal(projection.basedOn, 3);
  assert.equal(
    projection.projectedDate.toISOString(),
    new Date(NOW.getTime() + SRP_PROJECTION_HORIZON_DAYS * 86_400_000).toISOString(),
  );
  assert.ok(projection.confidence >= 0.2 && projection.confidence <= 0.99);
});

test('buildSrpProjection: an unchanged SRP projects no change', () => {
  const projection = buildSrpProjection(
    [
      { price: 50, effectiveDate: day('2025-01-01') },
      { price: 50, effectiveDate: day('2025-06-01') },
      { price: 50, effectiveDate: day('2026-01-01') },
    ],
    NOW,
  );

  assert.equal(projection?.projectedPrice, 50);
});

test('buildSrpProjection: a scheduled SRP is not counted as in force', () => {
  const projection = buildSrpProjection(
    [
      { price: 40, effectiveDate: day('2026-01-01') },
      { price: 41, effectiveDate: day('2026-04-01') },
      { price: 99, effectiveDate: day('2026-10-05') },
    ],
    NOW,
  );

  assert.equal(projection, null);
});

test('buildSrpProjection: the projection starts from the current SRP, not the fitted line', () => {
  // Rises then drops: the fit still slopes up, but the estimate starts at today's ₱44.
  const projection = buildSrpProjection(
    [
      { price: 40, effectiveDate: day('2026-01-01') },
      { price: 48, effectiveDate: day('2026-04-01') },
      { price: 44, effectiveDate: day('2026-07-01') },
    ],
    NOW,
  );

  assert.equal(projection?.currentPrice, 44);
  assert.ok(projection && Math.abs(projection.projectedPrice - 44) < 2);
});

test('getSrpProjection: an unknown commodity is a 404', async (t) => {
  t.mock.method(commodityRepository, 'findSrpRevisions', async () => null);

  await assert.rejects(
    () => commodityService.getSrpProjection('00000000-0000-0000-0000-000000000000', NOW),
    (error: unknown) => error instanceof AppError && error.statusCode === 404,
  );
});

test('getSrpProjection: rows sharing an effective date count once, last saved wins', async (t) => {
  t.mock.method(commodityRepository, 'findSrpRevisions', async () => ({
    id: 'commodity-1',
    srps: [
      { price: 40, effectiveDate: day('2026-01-01'), createdAt: day('2026-01-01') },
      { price: 42, effectiveDate: day('2026-04-01'), createdAt: day('2026-04-01') },
      // An officer corrected the 2026-04-01 SRP the next day — still one change.
      { price: 43, effectiveDate: day('2026-04-01'), createdAt: day('2026-04-02') },
    ],
  }));

  const result = await commodityService.getSrpProjection('commodity-1', NOW);

  // Only two distinct dates → below the minimum, even though there are three rows.
  assert.deepEqual(result, { commodityId: 'commodity-1', projection: null });
});
