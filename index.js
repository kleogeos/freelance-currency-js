#!/usr/bin/env node
"use strict";

const https = require("https");

const API_HOST = "open.er-api.com";

function fetchRate(base, quote) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      { hostname: API_HOST, path: `/v6/latest/${encodeURIComponent(base.toUpperCase())}`, timeout: 10000 },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          let data;
          try {
            data = JSON.parse(body);
          } catch (e) {
            reject(new Error(`rate lookup failed: could not parse response`));
            return;
          }
          if (data.result !== "success") {
            reject(new Error(`rate lookup failed: ${data["error-type"] || "unknown error"}`));
            return;
          }
          const rates = data.rates || {};
          const q = quote.toUpperCase();
          if (!(q in rates)) {
            reject(new Error(`currency '${quote}' not found (base was '${base}')`));
            return;
          }
          resolve([rates[q], data.time_last_update_utc]);
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("rate lookup failed: timed out")));
    req.on("error", (e) => reject(new Error(`rate lookup failed: ${e.message}`)));
  });
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// mirrors Python's repr() of a float: integers keep a trailing ".0",
// everything else prints as the shortest round-trip decimal (JS's default
// Number->String already does this for the ranges this tool deals with).
function asFloat(n) {
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

function fmt2(n) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseArgs(argv) {
  const out = { amount: null, base: null, quote: null, rate: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--amount") out.amount = Number(argv[++i]);
    else if (a === "--from") out.base = argv[++i];
    else if (a === "--to") out.quote = argv[++i];
    else if (a === "--rate") out.rate = Number(argv[++i]);
    else if (a === "--json") out.json = true;
  }
  return out;
}

function printHelp() {
  console.log(`freelance-currency-js - convert an invoice amount between currencies

Usage:
  freelance-currency --amount N --from CODE --to CODE [--rate N] [--json]

Makes a network call to open.er-api.com (free, no API key) for a live rate
unless --rate is given. No dependencies beyond Node's standard library.

Run without installing:
  npx github:kleogeos/freelance-currency-js --amount 1000 --from USD --to RUB
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    printHelp();
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const args = parseArgs(argv);
  if (args.amount === null || !args.base || !args.quote) {
    printHelp();
    process.exit(1);
  }

  let rate = args.rate;
  let updated = null;
  if (rate === null) {
    try {
      [rate, updated] = await fetchRate(args.base, args.quote);
    } catch (e) {
      console.error(`error: ${e.message}`);
      process.exit(1);
    }
  }

  const converted = round2(args.amount * rate);

  if (args.json) {
    const parts = [
      `"amount": ${asFloat(args.amount)}`,
      `"from": "${args.base.toUpperCase()}"`,
      `"to": "${args.quote.toUpperCase()}"`,
      `"rate": ${asFloat(rate)}`,
      `"converted": ${asFloat(converted)}`,
      `"rate_source": "${args.rate !== null ? "manual" : "open.er-api.com"}"`,
      `"rate_updated_utc": ${updated ? `"${updated}"` : "null"}`,
    ];
    console.log(`{\n  ${parts.join(",\n  ")}\n}`);
    return;
  }

  console.log(`${fmt2(args.amount)} ${args.base.toUpperCase()} = ${fmt2(converted)} ${args.quote.toUpperCase()}`);
  const suffix = args.rate !== null ? " (manual, --rate)" : ` (open.er-api.com, updated ${updated})`;
  console.log(`Rate used: 1 ${args.base.toUpperCase()} = ${asFloat(rate)} ${args.quote.toUpperCase()}${suffix}`);
}

if (require.main === module) {
  main();
}

module.exports = { round2, asFloat, fmt2 };
