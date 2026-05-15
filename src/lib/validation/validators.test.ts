/*
  Unit tests for lib/validation/validators.ts
  Run with: npx ts-node lib/validation/validators.test.ts
*/
import assert from "node:assert/strict";
import { validateTimeRange, validatePhone, digitsOnly, formatPhoneDisplay, VALIDATION_ERRORS, LIMITS } from "./validators";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
    failed++;
  }
}

// ─── validateTimeRange ────────────────────────────────────────────────────────

console.log("\nvalidateTimeRange:");

test("valid range returns null", () => {
  assert.equal(validateTimeRange("09:00", "10:00"), null);
});

test("same time returns error", () => {
  assert.equal(validateTimeRange("10:00", "10:00"), VALIDATION_ERRORS.TIME_RANGE);
});

test("end before start returns error", () => {
  assert.equal(validateTimeRange("14:00", "09:00"), VALIDATION_ERRORS.TIME_RANGE);
});

test("midnight edge — 23:00 to 00:00 is invalid (end < start)", () => {
  // 00:00 < 23:00 lexicographically → should fail
  assert.equal(validateTimeRange("23:00", "00:00"), VALIDATION_ERRORS.TIME_RANGE);
});

test("empty start returns null (not-yet-filled)", () => {
  assert.equal(validateTimeRange("", "10:00"), null);
});

test("empty end returns null (not-yet-filled)", () => {
  assert.equal(validateTimeRange("09:00", ""), null);
});

test("one minute difference is valid", () => {
  assert.equal(validateTimeRange("09:00", "09:01"), null);
});

test("large range is valid", () => {
  assert.equal(validateTimeRange("08:00", "22:00"), null);
});

// ─── validatePhone ────────────────────────────────────────────────────────────

console.log("\nvalidatePhone:");

test("exactly 10 digits returns null", () => {
  assert.equal(validatePhone("0532422215"), null);
});

test("formatted 053-2422215 also returns null (digits stripped)", () => {
  assert.equal(validatePhone("053-2422215"), null);
});

test("9 digits returns error", () => {
  assert.notEqual(validatePhone("053242221"), null);
});

test("11 digits returns error", () => {
  assert.notEqual(validatePhone("05324222150"), null);
});

test("undefined returns null (optional field)", () => {
  assert.equal(validatePhone(undefined), null);
});

test("empty string returns null (optional field)", () => {
  assert.equal(validatePhone(""), null);
});

// ─── digitsOnly ───────────────────────────────────────────────────────────────

console.log("\ndigitsOnly:");

test("strips non-digits", () => {
  assert.equal(digitsOnly("053-242-2215", 10), "0532422215");
});

test("caps to maxDigits", () => {
  assert.equal(digitsOnly("12345678901", 10), "1234567890");
});

test("letters are stripped", () => {
  assert.equal(digitsOnly("abc123def", 9), "123");
});

test("already pure digits is unchanged", () => {
  assert.equal(digitsOnly("0532422215", 10), "0532422215");
});

// ─── formatPhoneDisplay ───────────────────────────────────────────────────────

console.log("\nformatPhoneDisplay:");

test("10 digits → 053-2422215", () => {
  assert.equal(formatPhoneDisplay("0532422215"), "053-2422215");
});

test("already formatted → same result", () => {
  assert.equal(formatPhoneDisplay("053-2422215"), "053-2422215");
});

test("less than 10 digits → returned as-is digits", () => {
  assert.equal(formatPhoneDisplay("05324"), "05324");
});

// ─── LIMITS sanity ───────────────────────────────────────────────────────────

console.log("\nLIMITS sanity:");

test("NAME is 50", () => assert.equal(LIMITS.NAME, 50));
test("NOTES is 300", () => assert.equal(LIMITS.NOTES, 300));
test("PHONE is 10", () => assert.equal(LIMITS.PHONE, 10));
test("ISRAELI_ID is 9", () => assert.equal(LIMITS.ISRAELI_ID, 9));
test("ISRAELI_CHESS_ID is 6", () => assert.equal(LIMITS.ISRAELI_CHESS_ID, 6));
test("FIDE_ID is 9", () => assert.equal(LIMITS.FIDE_ID, 9));
test("EMAIL is 40", () => assert.equal(LIMITS.EMAIL, 40));
test("AGE_MAX is 120", () => assert.equal(LIMITS.AGE_MAX, 120));

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
