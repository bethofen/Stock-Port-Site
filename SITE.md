# Dashboard site data flow

The home route decrypts the existing Stock Port payload and `copytrade/site-data.json.enc` in the browser with the same passphrase. The Copy Quant detail route uses the same passphrase. Neither route stores it in browser storage.

## Copy Quant publishing

The `publish-copyquant-site-data` workflow in Copytrade-Quant runs after daily snapshots or reports change. It builds an allowlisted payload from the newest snapshot, encrypts it with PBKDF2-SHA256 (200,000 iterations) and AES-256-GCM, then pushes only ciphertext and metadata to this repository. The plaintext is not written into the site checkout.

Configure these **repository secrets in Copytrade-Quant**:

- `STOCK_PORT_SITE_TOKEN`: a GitHub token with Contents write access to `bethofen/Stock-Port-Site`.
- `STOCK_PORT_SITE_PASSWORD`: exactly the passphrase already used by the encrypted Stock Port report.

Use workflow dispatch to publish the latest existing snapshot after setting the secrets. Publishing is local code only until the user configures these secrets and pushes the workflow.

## Combined total and return

The dashboard converts balances to THB with the daily FX reference rate bundled into the encrypted Copy Quant feed. USDT uses the USD reference rate as an explicitly approximate peg. The combined asset value appears only when both sources and the FX date are fresh and all source currencies can be converted. Otherwise it remains unavailable.

Overall portfolio return is not inferred from lead ROI or balance changes. The current Copy Quant snapshot has no owner-level realized/unrealized PnL or complete cash-flow-adjusted return basis. The combined return therefore remains unavailable until both systems publish comparable owner-level PnL and cash-flow data.

The consolidated value includes only reported Stock Port balances plus the Copy Trading wallet. It excludes copier positions that Binance does not expose. The dashboard considers a source fresh for 48 hours. The existing stock report content and Telegram Mini App remain separate routes.
