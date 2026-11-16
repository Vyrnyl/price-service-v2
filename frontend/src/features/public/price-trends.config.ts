/**
 * Price Trends (public /price-analysis, officer and admin /price-trends)
 * switches, added 2026-11-16 after the weekly 3-store import. Set a flag to
 * `false` to restore the previous behaviour.
 */

/**
 * One chart point per date: the average of every store's price recorded that
 * day (Manila calendar day), instead of one point per store record. The
 * tooltip and the Selected point card show how many stores and their range.
 * The change cards compare those daily averages, read from the full history.
 * `false`: one point per record, change cards compare raw records from the
 * recent (60-day) payload.
 */
export const PRICE_TRENDS_STORE_AVERAGE_ENABLED = true;

/**
 * The Week / Month / 3M / 6M / 1Y windows count back from the newest recorded
 * price instead of from today, so a commodity whose latest prices are weeks
 * old still draws a chart. The panel says which date it counted back from.
 * `false`: windows count back from today.
 */
export const PRICE_TRENDS_ANCHOR_ON_LATEST_ENABLED = false; // rolled back 2026-11-16 (user)
