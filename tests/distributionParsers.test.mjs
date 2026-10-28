import test from 'node:test';
import assert from 'node:assert/strict';
import { parseYahooDividends, parseRoundhillDistributions } from '../src/lib/distributionParsers.ts';

test('Yahoo events: newest first, preserving ex date and payout', () => {
  const result = parseYahooDividends([
    { date: new Date('2026-10-14T00:00:00Z'), amount: 0.113456 },
    { date: new Date('2026-10-21T00:00:00Z'), amount: 0.145 },
  ]);
  assert.deepEqual(result.map((row) => row.exDate), ['2026-10-21', '2026-10-14']);
  assert.equal(result[0].amountPaid, '$0.145000');
  assert.equal(result[1].amountPaid, '$0.113456');
  assert.equal(result[0].payDate, ''); // Yahoo supplies ex date, not payment date.
});

test('Yahoo events: discard invalid payouts and dates', () => {
  assert.equal(parseYahooDividends([
    { date: new Date('invalid'), amount: 0.1 },
    { date: new Date('2026-10-14T00:00:00Z'), amount: 0 },
    { date: new Date('2026-10-14T00:00:00Z'), amount: Infinity },
  ]).length, 0);
});

test('Roundhill: normalize dollar values, reject empty rows, sort latest first', () => {
  const rows = [
    ['10/7/2026', '10/8/2026', '10/8/2026', '10/9/2026', '0.123456'],
    ['10/14/2026', '10/15/2026', '10/15/2026', '10/16/2026', '$0.22'],
    ['10/21/2026', '10/22/2026', '10/22/2026', '10/23/2026', ''],
  ];
  const result = parseRoundhillDistributions(rows);
  assert.deepEqual(result.map((row) => row.amountPaid), ['$0.22', '$0.123456']);
  assert.equal(result[0].payDate, '10/16/2026');
});
