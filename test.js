const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const SCRIPT = path.join(__dirname, "index.js");

function run(args) {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], { encoding: "utf8" });
    return { code: 0, stdout, stderr: "" };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ? e.stdout.toString() : "", stderr: e.stderr ? e.stderr.toString() : "" };
  }
}

// Parity checks cross-referenced against the Python implementation
// (kleogeos/freelance-currency-cli, currency.py) run side by side.

function test_manual_rate_basic() {
  const r = run(["--amount", "100", "--from", "USDT", "--to", "RUB", "--rate", "83.5", "--json"]);
  assert.strictEqual(r.code, 0, r.stderr);
  const data = JSON.parse(r.stdout);
  assert.strictEqual(data.converted, 8350.0);
  assert.strictEqual(data.rate_source, "manual");
  assert.strictEqual(data.rate_updated_utc, null);
}

function test_manual_rate_rounding() {
  const r = run(["--amount", "33.333", "--from", "USD", "--to", "EUR", "--rate", "0.9", "--json"]);
  assert.strictEqual(r.code, 0, r.stderr);
  const data = JSON.parse(r.stdout);
  assert.strictEqual(data.converted, Math.round(33.333 * 0.9 * 100) / 100);
}

function test_human_readable_output_has_both_amounts() {
  const r = run(["--amount", "100", "--from", "USD", "--to", "RUB", "--rate", "80"]);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.ok(r.stdout.includes("100.00 USD"));
  assert.ok(r.stdout.includes("8,000.00 RUB"));
  assert.ok(r.stdout.includes("(manual, --rate)"));
}

function test_bad_currency_without_manual_rate_fails_cleanly() {
  // No --rate given: must fail either via network error or "ZZZ" not being a
  // real currency -- works offline or online, same design as the Python test.
  const r = run(["--amount", "100", "--from", "USD", "--to", "ZZZ"]);
  assert.strictEqual(r.code, 1);
  assert.ok(r.stderr.includes("error:"));
}

function test_missing_required_arg_fails() {
  const r = run(["--amount", "100", "--from", "USD"]);
  assert.notStrictEqual(r.code, 0);
}

function test_zero_amount() {
  const r = run(["--amount", "0", "--from", "USD", "--to", "RUB", "--rate", "80", "--json"]);
  assert.strictEqual(r.code, 0, r.stderr);
  const data = JSON.parse(r.stdout);
  assert.strictEqual(data.converted, 0.0);
}

function test_negative_amount() {
  const r = run(["--amount", "-50", "--from", "USD", "--to", "RUB", "--rate", "80", "--json"]);
  assert.strictEqual(r.code, 0, r.stderr);
  const data = JSON.parse(r.stdout);
  assert.strictEqual(data.converted, -4000.0);
}

function test_json_whole_numbers_keep_decimal_point() {
  // Python's argparse type=float always yields a float, so JSON output keeps
  // "100.0" / "80.0" rather than collapsing to "100" / "80" -- the same
  // float-formatting parity bug class caught in freelance-late-fee-js.
  const r = run(["--amount", "100", "--from", "USD", "--to", "RUB", "--rate", "80", "--json"]);
  assert.strictEqual(r.code, 0, r.stderr);
  assert.ok(r.stdout.includes('"amount": 100.0'), r.stdout);
  assert.ok(r.stdout.includes('"rate": 80.0'), r.stdout);
  assert.ok(r.stdout.includes('"converted": 8000.0'), r.stdout);
}

const tests = { test_manual_rate_basic, test_manual_rate_rounding, test_human_readable_output_has_both_amounts, test_bad_currency_without_manual_rate_fails_cleanly, test_missing_required_arg_fails, test_zero_amount, test_negative_amount, test_json_whole_numbers_keep_decimal_point };

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL: ${name}: ${e.message}`);
  }
}
console.log(`\n${Object.keys(tests).length - failed}/${Object.keys(tests).length} passed`);
process.exit(failed ? 1 : 0);
