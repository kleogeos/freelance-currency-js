# freelance-currency-js

[![test](https://github.com/kleogeos/freelance-currency-js/actions/workflows/test.yml/badge.svg)](https://github.com/kleogeos/freelance-currency-js/actions/workflows/test.yml)

Convert an invoice amount between currencies — USD, EUR, RUB, and 160+
others. Zero dependencies — a direct Node.js port of
[freelance-currency-cli](https://github.com/kleogeos/freelance-currency-cli)
(Python), for people who reach for `npx` instead of `pip`.

The one tool in this suite that makes a network call: it fetches a live
rate from [open.er-api.com](https://www.exchangerate-api.com/docs/free)
(free, no API key, rates updated daily) unless you pass `--rate` yourself
for an offline or manual conversion.

Output is cross-checked byte-for-byte against the Python version (same
input → identical text and JSON, including the live network path) — see
`test.js`.

## Run without installing

```bash
npx github:kleogeos/freelance-currency-js --amount 1000 --from USD --to RUB
```

No npm account, no registry publish, no global install — `npx` clones the
repo and runs it directly.

```
1,000.00 USD = 83,719.24 RUB
Rate used: 1 USD = 83.71924 RUB (open.er-api.com, updated Sun, 18 Oct 2026 00:02:31 +0000)
```

```bash
# Manual rate, no network call -- e.g. pricing an invoice in USDT at a fixed 1:1 USD peg
npx github:kleogeos/freelance-currency-js --amount 500 --from USDT --to RUB --rate 83.5 --json
```

```json
{
  "amount": 500.0,
  "from": "USDT",
  "to": "RUB",
  "rate": 83.5,
  "converted": 41750.0,
  "rate_source": "manual",
  "rate_updated_utc": null
}
```

## Install locally (optional)

```bash
git clone https://github.com/kleogeos/freelance-currency-js.git
cd freelance-currency-js
npm link   # makes `freelance-currency` available globally
```

### Flags

| Flag | What it does |
|---|---|
| `--amount N` | Amount to convert (required) |
| `--from CODE` | Source currency code, e.g. `USD` (required) |
| `--to CODE` | Target currency code, e.g. `RUB` (required) |
| `--rate N` | Skip the network lookup and use this exchange rate directly (1 unit of `--from` equals this many units of `--to`) |
| `--json` | Output as JSON |

## Tests

```bash
npm test
```

## Why the network call

The other tools in this suite are deliberately offline — nothing leaves
your machine. Currency conversion is the one exception: there's no honest
way to get a live exchange rate without a network call. `--rate` is the
escape hatch when you don't want it — offline, behind a restrictive
firewall, or pricing at a specific rate your client already quoted (e.g. a
stablecoin peg).

RUB is included (unlike some ECB-direct feeds, which have excluded it since
2022) — this was the reason this specific free API was chosen. Not tax or
financial advice — for the rate used on a specific date for tax reporting,
check your country's official source.

## Where this fits

Prefer Python, or need it as a library import? [freelance-currency-cli](https://github.com/kleogeos/freelance-currency-cli) has the same logic. Other `npx`-runnable ports: [freelance-rate-js](https://github.com/kleogeos/freelance-rate-js) · [freelance-invoice-js](https://github.com/kleogeos/freelance-invoice-js) · [contract-checklist-js](https://github.com/kleogeos/contract-checklist-js) · [freelance-late-fee-js](https://github.com/kleogeos/freelance-late-fee-js).

Free and will stay free. If it saved you time: [tip with crypto](https://kleogeos.github.io/freelancer-tools/donate.html).

## License

MIT — do whatever you want with it.
