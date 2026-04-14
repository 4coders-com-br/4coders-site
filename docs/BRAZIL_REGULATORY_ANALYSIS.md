# Crypto Derivatives Exchanges & Brazil Regulatory Analysis

## Research Date: December 2025

---

## 1. Crypto Futures & Options Exchanges Comparison

### 1.1 Options-Focused Exchanges (For Convex Strategy)

| Exchange | BTC Options Market Share | Open Interest | Fee Structure | KYC Required | Brazil Access |
|----------|-------------------------|---------------|---------------|--------------|---------------|
| **Deribit** | ~85% | $42.5B (May 2025) | 0.03% maker/taker | Yes | ✅ Allowed |
| **Bybit** | Growing | Substantial | 0.03% maker/taker | Optional (<20k USDT/day) | ✅ Allowed |
| **OKX** | Moderate | Large | 0.03% max | Yes | ✅ Allowed |
| **Binance** | Moderate | Highest volume | 0.03% | Yes | ⚠️ Derivatives BANNED by CVM |
| **Delta Exchange** | Niche | Growing | Competitive | Yes | ✅ Allowed |

### 1.2 Deribit - Primary Recommendation

**Why Deribit for BTC Convex Strategy:**
- **85% market share** in crypto options
- **Deepest liquidity** - handles 75%+ of all BTC options traded
- **$743B** in options volume (2024)
- **Testnet available** - practice without risk
- **Greeks/IV surface** - full professional tooling
- **Expiries**: Daily, weekly, monthly, quarterly (up to 12 months)
- **Settlement**: USDC or coin-margined
- **Leverage**: Up to 50x on futures
- **Brazil**: **NOT RESTRICTED** - Brazilians can use Deribit with KYC

**Deribit Fees:**
```
Trading Fee: 0.03% of underlying
Settlement Fee: 0.02% (delivery) / 0.015% (exercise)
Index Fee: None
Funding: 8-hourly for perpetuals
```

### 1.3 Alternatives Comparison

#### Bybit Options
- **Pros**: Low fees, no KYC up to 20k USDT/day, USDT settlement
- **Cons**: Less liquidity than Deribit, fewer expiries
- **Best for**: Privacy-conscious traders, smaller positions

#### OKX Options
- **Pros**: Wide strike range ($50k-$280k for 12mo), portfolio margin
- **Cons**: Complex interface, more institutional focus
- **Best for**: Multi-leg strategies, cross-product margin

#### Binance Options
- **Pros**: Easy mode for beginners, good UI
- **Cons**: **BANNED in Brazil by CVM for derivatives**
- **Risk**: Using VPN to access = regulatory risk

### 1.4 Futures-Only Exchanges (If Options Unavailable)

| Exchange | Leverage | Pairs | Fees | Notes |
|----------|----------|-------|------|-------|
| Binance Futures | 125x | 500+ | 0.02%/0.04% | **Banned for BR residents** |
| Bybit Futures | 100x | 300+ | 0.02%/0.055% | Brazil allowed |
| OKX Futures | 100x | 400+ | 0.02%/0.05% | Brazil allowed |
| Bitget | 125x | 200+ | 0.02%/0.06% | Brazil allowed |

---

## 2. Brazil Regulatory Framework

### 2.1 Legal Status

**Crypto is LEGAL in Brazil** under:
- **Law 14,478/2022** - Virtual Assets Framework
- **Decree 11,563/2023** - Implementation details

### 2.2 Regulatory Bodies

| Regulator | Jurisdiction | Scope |
|-----------|--------------|-------|
| **BCB** (Banco Central) | VASPs, Custody | Non-security crypto services |
| **CVM** (Securities Commission) | Securities, Derivatives | Security tokens, regulated markets |
| **Receita Federal** | Taxation | All crypto gains |

### 2.3 Derivatives-Specific Regulations

#### CVM Position on Crypto Derivatives

1. **Binance Derivatives Ban (2020)**
   - CVM issued Declaratory Act 17,961/20
   - Binance had no CVM registration for derivatives
   - Prohibited from offering futures to Brazilian residents
   - **Does NOT apply to other exchanges**

2. **Foreign Regulated Markets**
   - CVM Circular Letter 11/2018
   - Brazilian **investment funds** CAN invest in:
     - Crypto derivatives on foreign regulated exchanges
     - Requires: Exchange regulated by foreign authority
   - **Individual retail access**: Not explicitly banned but gray area

3. **Offshore Access**
   - CFDs: Not authorized locally but accessible offshore
   - Derivatives on foreign exchanges: Tolerated for individuals
   - CVM has issued warnings but no blanket ban

### 2.4 New VASP Rules (Effective Feb 2026)

From BCB November 2025 resolutions:
- All VASPs (including offshore serving Brazil) need authorization
- Minimum capital: BRL 10.8M - 37.2M ($2M - $6.9M)
- Foreign firms must partner with local entity OR establish presence
- **Impact**: May affect access to Deribit/Bybit in future

---

## 3. Brazil Crypto Taxation

### 3.1 Major 2025 Tax Changes

| Aspect | Old Rules | New Rules (2025) |
|--------|-----------|------------------|
| **Tax Rate** | 15-22.5% progressive | **17.5% flat** |
| **Exemption** | R$35,000/month tax-free | **Removed** |
| **Foreign Holdings** | Often unreported | Fully taxable |
| **Self-Custody** | Gray area | Taxable |
| **DeFi** | Unaddressed | Now reportable |

### 3.2 How Derivatives Might Be Taxed

**Important**: Receita Federal has not issued specific guidance on crypto derivatives. Based on general principles:

```
Category: Likely treated as "Ganhos de Capital" (Capital Gains)
Rate: 17.5% on net profits
Calculation: Exit value - Entry cost - Fees
Losses: Offset within 5 quarters
Reporting: Via DeCripto system (from July 2025)
```

**Derivatives-Specific Considerations:**
- **Options Premium**: Cost basis when sold/expired
- **Futures PnL**: Realized at position close
- **Settlement**: Both cash and physical delivery taxable
- **Foreign Exchange**: BRL conversion at transaction date

### 3.3 Reporting Requirements (DeCripto)

From July 2025:
- Threshold: R$33,400/month (~$6,560)
- Must report: Swaps, staking, airdrops, wallet transfers
- Categories: Crypto-fiat, crypto-crypto, retail payments >$50k
- Offshore holdings: Must be declared

### 3.4 Penalties

| Violation | Penalty |
|-----------|---------|
| Under-reporting | 75% of unpaid tax |
| Fraud | 150% of unpaid tax |
| Plus | Selic interest until payment |

---

## 4. Practical Recommendations

### 4.1 Exchange Selection for Brazilian Resident

**Primary (Options Strategy):**
```
1. Deribit (Recommended)
   - Not restricted for Brazil
   - Best BTC options liquidity
   - Full KYC required
   - Testnet for practice
```

**Secondary (Futures Fallback):**
```
2. Bybit
   - Brazil accessible
   - No KYC up to 20k USDT/day
   - Good liquidity

3. OKX
   - Brazil accessible
   - Full KYC
   - Cross-margin efficiency
```

**AVOID:**
```
❌ Binance Futures - Explicitly banned by CVM
❌ Any exchange with Brazil in restricted list
```

### 4.2 Tax Compliance Strategy

1. **Keep Detailed Records**
   - Every trade with timestamp, amounts, prices
   - BRL conversion at transaction date
   - Fees paid

2. **Track PnL Per Position**
   - Options: Premium paid → Realized value
   - Include expired worthless as losses

3. **Report via DeCripto** (July 2025+)
   - Monthly if >R$33,400 in transactions
   - Include offshore exchange activity

4. **Consult Tax Professional**
   - Derivatives taxation is ambiguous
   - Get professional opinion for your situation

### 4.3 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Exchange access revoked | Diversify across 2-3 exchanges |
| BCB 2026 rules | Monitor for Deribit compliance |
| Tax ambiguity | Conservative interpretation, keep records |
| CVM enforcement | Avoid Binance derivatives specifically |

---

## 5. Summary for Your Convex Strategy

### Can You Execute This Strategy from Brazil?

| Aspect | Status | Notes |
|--------|--------|-------|
| **Legal to trade crypto** | ✅ Yes | Law 14,478/2022 |
| **Deribit access** | ✅ Yes | Not restricted |
| **BTC options available** | ✅ Yes | 3-6 month expiries exist |
| **Taxation defined** | ⚠️ Partially | Derivatives not explicitly addressed |
| **Future regulation risk** | ⚠️ Medium | BCB 2026 rules may change landscape |

### Recommended Approach

1. **Use Deribit** for BTC options (primary)
2. **Complete KYC** - required for trading
3. **Start with testnet** - validate strategy
4. **Keep meticulous records** for tax
5. **Apply 17.5% tax** on net gains conservatively
6. **Report via DeCripto** when active
7. **Monitor BCB 2026 rules** for any changes

---

## Sources

### Exchanges
- [CoinMarketCap Derivatives Rankings](https://coinmarketcap.com/rankings/exchanges/derivatives/)
- [Koinly - Best Crypto Futures Platforms 2025](https://koinly.io/blog/best-crypto-futures-platforms/)
- [DataWallet - Best Crypto Options Exchanges](https://www.datawallet.com/crypto/best-crypto-options-exchanges)
- [Deribit Support - Restricted Jurisdictions](https://support.deribit.com/hc/en-us/articles/25944487427741-Restricted-Jurisdictions)
- [FXEmpire - Best Options Platforms](https://www.fxempire.com/exchanges/best/options)

### Brazil Regulations
- [Global Legal Insights - Brazil Crypto Laws 2026](https://www.globallegalinsights.com/practice-areas/blockchain-cryptocurrency-laws-and-regulations/brazil/)
- [Chainalysis - Brazil's New Crypto Framework](https://www.chainalysis.com/blog/brazil-crypto-asset-regulatory-framework-2025/)
- [CoinDesk - Brazil Stablecoins & Tax](https://www.coindesk.com/policy/2025/11/30/stablecoins-drive-90-of-brazil-s-crypto-volume-tax-authority-data-shows/)
- [BitcoinDynamic - CVM Binance Ban](https://bitcoindynamic.com/news/cvm-prohibits-binance-from-offering-derivatives-in-brazil-and-threatens-with-fine/)
- [Lightspark - Is Crypto Legal in Brazil](https://www.lightspark.com/knowledge/is-crypto-legal-in-brazil)

### Taxation
- [Kraken - Brazil Crypto Tax Guide 2025](https://www.kraken.com/learn/brazil-crypto-tax-guide)
- [CoinLedger - Brazil Crypto Tax](https://coinledger.io/blog/brazil-crypto-tax)
- [CoinDesk - Brazil 17.5% Flat Tax](https://www.coindesk.com/markets/2025/06/14/brazil-sets-flat-175-tax-on-crypto-profits-ending-exemption-for-smaller-investors)
- [KoinX - Brazil Capital Gains Update](https://www.koinx.com/tax-guides/capital-gains-tax-on-cryptocurrencies-brazil-update)
