# Renko Trading System - Feature Documentation

**Language-Agnostic Feature Specification**

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Features](#core-features)
3. [Renko Strategy](#renko-strategy)
4. [Execution Modes](#execution-modes)
5. [Data Management](#data-management)
6. [Risk Management](#risk-management)
7. [Visualization](#visualization)
8. [Data Structures](#data-structures)

---

## System Overview

### Purpose
A cryptocurrency trading system focused on the **Renko chart pattern** strategy. The system supports multiple execution modes (backtest, paper trading, production) and provides comprehensive data visualization and risk management.

### Key Principles
- **Signal-Driven**: All trading decisions are triggered by detected patterns
- **Risk-First**: Risk management checks precede all trade execution
- **Event-Sourced**: All trades and signals are immutable records
- **Reproducible**: Identical parameters yield identical backtest results
- **Multi-Exchange**: Extensible broker abstraction for multiple exchanges

---

## Core Features

### 1. Data Ingestion
**What**: Accept OHLCV (Open, High, Low, Close, Volume) candle data
**From**: Multiple sources - Kafka streams, REST APIs, Files, WebHooks
**Processing**:
- Validate data completeness (partial vs final bars)
- Transform to standardized format
- Timestamp normalization (millisecond precision)

**Input Schema**:
```
{
  mts: Int64,           # Timestamp (milliseconds)
  symbol: String,       # Trading pair (e.g., "BTC/USD")
  open: Decimal,        # Opening price
  high: Decimal,        # Highest price
  low: Decimal,         # Lowest price
  close: Decimal,       # Closing price
  volume: Decimal,      # Trading volume
  bar_type: Keyword     # :ohlcv, :renko, :tv (TradingView)
}
```

### 2. Renko Brick Generation
**What**: Transform OHLCV candles into Renko bricks
**Why**: Renko charts filter out noise and focus on price movement
**Process**:
1. Accept OHLCV candle
2. Calculate price difference from last brick close
3. Generate zero or more bricks based on brick size
4. Classify brick type (initial, forward_single, backward_double, etc.)
5. Assign direction (+1 for up, -1 for down)

**Output**: Array of bricks with metadata
```
{
  mts: Int64,           # Timestamp
  open: Decimal,        # Brick open
  high: Decimal,        # Brick high
  low: Decimal,         # Brick low
  close: Decimal,       # Brick close (price level)
  direction: Int,       # +1 (up) or -1 (down)
  brick_size: Decimal,  # Size of this brick
  brick_type: String    # Type classification
}
```

### 3. Brick Type Classification
Bricks are classified by their pattern relative to previous brick:

**Forward Movement** (continuing trend):
- `forward_single` - 1 brick in trend direction
- `forward_double_first` / `forward_double_last` - 2 bricks
- `forward_multiple_first/middle/last` - 3+ bricks

**Backward Movement** (trend reversal, requires 2x brick size):
- `backward_single` - 1 brick reversal
- `backward_double_first` / `backward_double_last` - 2 bricks reversal
- `backward_multiple_first/middle/last` - 3+ bricks reversal

**Initial** - First brick (alignment brick)

### 4. Signal Detection
**What**: Identify trading patterns in brick sequence
**When**: After each new brick is generated
**How**: Match brick patterns against configured rules

**Pattern Window**: Last 3 bricks analyzed for patterns

### 5. Trade Lifecycle Management
**States**:
- `no_position` - No active trade
- `long_position` - Holding long (bought)
- `short_position` - Holding short (sold)
- `trailing_stop` - Position with trailing take-profit

**Events**:
- `trade_started` - New position opened
- `trade_closed` - Position closed, P&L calculated
- `trailing_activated` - Trailing stop triggered
- `trade_halted` - Position force-closed (risk limit hit)

### 6. Trade Execution
**Entry**:
- Signal triggered → Order created → Position opened
- Record: Entry price, amount, side, timestamp, fees

**Exit**:
- Signal triggered OR Risk limit hit → Order created → Position closed
- Record: Exit price, P&L, fees, execution time

**Production**: Real orders via broker API
**Backtest/Paper**: Simulated with slippage and fees

---

## Renko Strategy

### Strategy Components

#### 1. One-Brick Signals
**Pattern**: Single brick reversal (direction changes from previous brick)
**Long Signal**: Bricks trend down then up [-1, +1]
**Short Signal**: Bricks trend up then down [+1, -1]

**Actions**:
- `one_brick_start_[long/short]` - Open new position
- `one_brick_reverse_[long/short]` - Close and reverse position

**Configuration**:
- `one_brick_enabled: Boolean` - Feature on/off
- `one_brick_start_enabled: Boolean` - Allow opening new positions
- `one_brick_reverse_enabled: Boolean` - Allow reversals

#### 2. Double-Brick Signals
**Pattern**: Two bricks in trend direction, then reversal
**Long Signal**: Pattern [+1, +1, -1] (bullish reversal)
**Short Signal**: Pattern [-1, -1, +1] (bearish reversal)

**Actions**:
- `double_brick_start_[long/short]` - Open new position
- `double_brick_reverse_[long/short]` - Close and reverse position

**Configuration**:
- `double_brick_enabled: Boolean`
- `double_brick_start_enabled: Boolean`
- `double_brick_reverse_enabled: Boolean`

#### 3. Multi-Brick Signals
**Pattern**: Three or more consecutive bricks in same direction
**Long Signal**: Three consecutive up bricks [+1, +1, +1]
**Short Signal**: Three consecutive down bricks [-1, -1, -1]

**Actions**:
- `multi_brick_start_[long/short]` - Open position on strong trend
- `multi_brick_reverse_[long/short]` - Reverse on trend collapse

**Configuration**:
- `multi_brick_enabled: Boolean`
- `multi_brick_start_enabled: Boolean`
- `multi_brick_reverse_enabled: Boolean`

#### 4. DEMA Confirmation Filter (Optional)
**What**: Double Exponential Moving Average confirmation
**Why**: Reduce false signals by requiring price above/below DEMA
**How**:
- Calculate DEMA on brick closes
- For LONG signals: Require current price > DEMA
- For SHORT signals: Require current price < DEMA

**Configuration**:
- `DEMA_confirmation_enabled: Boolean`
- `DEMA_periods: Int` (default: 1, typically 1-14)

### Strategy Configuration Schema
```
{
  symbol: String,                    # e.g., "BTC/USD"
  brick_size: Decimal,               # e.g., 100 (USD)

  # Brick signals
  one_brick_enabled: Boolean,
  one_brick_start_enabled: Boolean,
  one_brick_reverse_enabled: Boolean,

  double_brick_enabled: Boolean,
  double_brick_start_enabled: Boolean,
  double_brick_reverse_enabled: Boolean,

  multi_brick_enabled: Boolean,
  multi_brick_start_enabled: Boolean,
  multi_brick_reverse_enabled: Boolean,

  # DEMA confirmation
  DEMA_confirmation_enabled: Boolean,
  DEMA_periods: Int,
}
```

---

## Execution Modes

### 1. Backtest Mode
**Purpose**: Validate strategy on historical data
**Characteristics**:
- Deterministic (identical inputs → identical results)
- Fast (batch processing)
- Includes simulated slippage and fees
- Provides P&L metrics

**Process**:
1. Load historical OHLCV data
2. Filter to date range [start_mts, end_mts]
3. Process each candle in sequence
4. Generate bricks, detect signals, execute trades
5. Close any open positions at end
6. Calculate performance metrics

**Inputs**:
- Historical OHLCV data (Kafka topic or file)
- Strategy configuration
- Date range (initial_mts, end_mts)
- Slippage percentage
- Fee percentage

**Outputs**:
- Sequence of trades (entry, exit, P&L)
- Signals detected
- Performance summary (win rate, total P&L, etc.)

### 2. Paper Trading Mode
**Purpose**: Simulate live trading on real data
**Characteristics**:
- Real-time data processing
- No real money at risk
- Same execution logic as production
- Helps validate signal quality before live trading

**Process**:
1. Consume live OHLCV data from stream
2. Generate bricks and detect signals
3. Execute simulated orders
4. Track open positions
5. Catch up on missed messages (lag recovery)

**Differences from Production**:
- No actual order submission to exchange
- Simulated slippage and fees
- Can stop/restart without consequences

### 3. Production Mode
**Purpose**: Real trading on live market
**Characteristics**:
- Real money at risk
- Live exchange API integration
- Immediate order execution
- Position tracking from exchange

**Process**:
1. Consume live OHLCV data from stream
2. Generate bricks and detect signals
3. Submit real orders via broker API
4. Track positions from exchange feedback
5. Handle network failures and retries
6. Catch up on missed messages

**Safety Features**:
- Position size limits
- Risk management (stop loss, take profit)
- Order validation before submission
- Exchange position reconciliation

---

## Data Management

### 1. Event Store
**What**: Immutable record of all trades and signals
**Why**: Audit trail, reproducibility, analysis

**Collections/Tables**:

#### Signals
```
{
  id: UUID,
  mts: Int64,                # When signal occurred
  symbol: String,            # Trading pair
  signal_type: Keyword,      # :renko, :crossing, :risk, :tv
  signal_action: String,     # e.g., "one_brick_start_long"
  side: Keyword,             # :long or :short
  price: Decimal,            # Price at signal
  confirmed: Boolean,        # DEMA/other confirmation
}
```

#### Trades
```
{
  id: UUID,
  symbol: String,
  entry_signal_id: UUID,     # Triggering signal
  entry_price: Decimal,
  entry_amount: Decimal,
  entry_timestamp: Int64,
  entry_fees: Decimal,
  side: Keyword,             # :long or :short

  exit_signal_id: UUID,      # Closing signal (if closed)
  exit_price: Decimal,
  exit_timestamp: Int64,
  exit_fees: Decimal,

  status: Keyword,           # :open, :closed, :halted
  pnl: Decimal,              # Profit/loss
  pnl_percent: Decimal,      # P&L as percentage
}
```

### 2. Historical Data Storage
**What**: Persist OHLCV and brick data
**Why**: Backtest, analysis, training

**Data Types**:
- OHLCV candles (raw market data)
- Renko bricks (processed, signal-ready)
- Moving averages (for plotting)

---

## Risk Management

### 1. Stop Loss
**What**: Mandatory exit when loss exceeds threshold
**Why**: Limit maximum loss per trade

**Configuration**:
```
{
  stop_loss_enabled: Boolean,
  stop_loss_percent: Decimal,  # e.g., -0.02 for 2% loss
}
```

**Trigger**: `P&L <= stop_loss_percent`
**Action**: Close position immediately

### 2. Take Profit / Trailing Stop
**What**: Dynamically trail profit targets as position gains
**Why**: Lock in gains while allowing growth

**Configuration**:
```
{
  take_profit_enabled: Boolean,
  trailing_ranges: [
    {
      trailing_start: Decimal,   # e.g., 0.01 (1% profit)
      trailing_limit: Decimal,   # e.g., 0.005 (0.5% trail)
    },
    {
      trailing_start: Decimal,   # e.g., 0.02 (2% profit)
      trailing_limit: Decimal,   # e.g., 0.01 (1% trail)
    },
  ]
}
```

**Logic**:
1. When P&L >= first trailing_start → Activate trailing
2. Track max_profit reached
3. If P&L falls to (max_profit - trailing_limit) → Take profit (close)

### 3. Position Size Limits
**What**: Maximum amount to risk per trade
**Why**: Prevent over-leverage

**Configuration**:
```
{
  order_size_stable: Decimal,   # e.g., 100 USD
  order_type: String,           # "market" or "limit"
}
```

**Calculation**: `amount = order_size_stable / entry_price`

---

## Visualization

### 1. Price Chart with Bricks
**What**: Plot raw OHLCV candles and Renko bricks
**How**:
- X-axis: Time or brick sequence number
- Y-axis: Price
- OHLCV as candlesticks or lines
- Renko bricks as colored blocks (up=green, down=red)

### 2. Signals Overlay
**What**: Mark trade entry/exit points
**How**:
- Entry signals: Bullish marker (e.g., triangle up for long)
- Exit signals: Bearish marker (e.g., triangle down for short)
- Annotations with signal type and P&L

### 3. P&L Curve
**What**: Cumulative profit/loss over time
**How**:
- X-axis: Trade sequence or time
- Y-axis: Cumulative P&L
- Line chart with area fill
- Benchmarks (e.g., hold strategy)

### 4. Performance Metrics Display
**What**: Summary statistics
**Metrics**:
- Total trades
- Win rate (% of profitable trades)
- Average win / Average loss
- Profit factor (gross profit / gross loss)
- Max drawdown
- Return on Investment (ROI)

---

## Data Structures

### Core Types

#### Bar
```
{
  mts: Int64,
  symbol: String,
  open: Decimal,
  high: Decimal,
  low: Decimal,
  close: Decimal,
  volume: Decimal,
  bar_type: Keyword,        # :ohlcv, :renko, :tv
  brick_set: [Brick],       # Generated bricks (if renko bar)
  signal: Signal,           # Detected signal (if signaled bar)
}
```

#### Brick
```
{
  mts: Int64,
  open: Decimal,
  high: Decimal,
  low: Decimal,
  close: Decimal,
  direction: Int,           # +1 or -1
  brick_size: Decimal,
  brick_type: String,       # forward_single, backward_double, etc.
}
```

#### Signal
```
{
  signal_type: Keyword,     # :renko, :risk, :crossing
  signal_action: String,    # "one_brick_start_long", "stop_loss", etc.
  side: Keyword,            # :long or :short
  is_trailing: Boolean,     # For risk signals
  max_trailing_profit: Decimal,  # For trailing stops
}
```

#### Trade
```
{
  id: UUID,
  symbol: String,
  side: Keyword,
  entry: {
    price: Decimal,
    amount: Decimal,
    timestamp: Int64,
    fees: Decimal,
  },
  exit: {
    price: Decimal,
    timestamp: Int64,
    fees: Decimal,
  },
  status: Keyword,          # :open, :closed, :halted
  pnl: Decimal,
  pnl_percent: Decimal,
}
```

#### StrategyState
```
{
  symbol: String,
  bars: [Bar],              # Historical bars
  active_trade: Trade,      # Current position (null if none)
  signals: [Signal],        # Detected signals
  trades: [Trade],          # Closed and open trades
}
```

---

## Integration Points

### Exchange Brokers
**Interface**:
- Submit order (symbol, side, amount, price)
- Get active positions (symbol)
- Get trade details (order_id)
- Handle errors and retries

**Implementations**:
- Bitfinex REST API
- Binance (CCXT)
- Extensible for other exchanges

### Data Sources
- **Kafka**: Real-time OHLCV streams
- **REST APIs**: CCXT, exchange APIs
- **Files**: CSV, Parquet for backtest
- **WebHooks**: TradingView alerts

### Monitoring & Observability
- Logging: All trades, signals, errors
- Metrics: Win rate, P&L, signal frequency
- Alerting: Position opened/closed, error conditions

---

## Summary

This specification defines a **language-agnostic** Renko trading system with:
- ✅ Multiple brick pattern signals (1/2/multi-brick)
- ✅ Three execution modes (backtest, paper, production)
- ✅ Risk management (stop loss, trailing profits)
- ✅ Event sourcing (immutable trade/signal records)
- ✅ Visualization (charts, signals, metrics)
- ✅ Extensible architecture (exchanges, data sources)

The system is suitable for:
- Trading professionals validating strategies
- Educators teaching algorithmic trading
- Developers learning real-world system design

---

## EPIC-OPTIONS: Options Trading Extension

### Overview

EPIC-OPTIONS extends the trading system to support **options contracts** (calls and puts), integrating with MetaTrader 5 via Python SDK and introducing a novel **Renko-based options strategy**.

For complete architecture and implementation details, see [EPIC_OPTIONS.md](./EPIC_OPTIONS.md).

### Options Concepts

#### Call Option
- **Right to BUY** at strike price
- Buyer profits when underlying rises above strike + premium
- Maximum loss = premium paid

#### Put Option
- **Right to SELL** at strike price
- Buyer profits when underlying falls below strike - premium
- Maximum loss = premium paid

#### Strike Price
The predetermined price at which the option can be exercised.

#### Premium
The price paid to acquire the option contract.

#### Expiration
The date when the option contract expires and becomes worthless if not exercised.

### The Greeks

Sensitivity measures for options pricing:

| Greek | Measures | Range |
|-------|----------|-------|
| **Delta (Δ)** | Price change per $1 underlying move | Calls: 0 to +1, Puts: -1 to 0 |
| **Gamma (Γ)** | Rate of change of delta | Always positive |
| **Theta (Θ)** | Daily time decay | Usually negative for buyers |
| **Vega (ν)** | Sensitivity to volatility | Always positive |
| **Rho (ρ)** | Sensitivity to interest rates | Calls: positive, Puts: negative |

### Options Data Structures

#### Option Contract
```
{
  id: UUID,
  symbol: String,              # e.g., "PETRA35"
  underlying_symbol: String,   # e.g., "PETR4"
  type: Keyword,               # :call or :put
  strike: Decimal,             # Strike price
  expiration: Instant,         # Expiration date
  premium: Decimal,            # Current premium
  bid: Decimal,                # Best bid
  ask: Decimal,                # Best ask

  # The Greeks
  delta: Decimal,
  gamma: Decimal,
  theta: Decimal,
  vega: Decimal,
  rho: Decimal,

  # Calculated
  intrinsic_value: Decimal,
  extrinsic_value: Decimal,
  moneyness: Keyword,          # :itm, :atm, :otm
  days_to_expiry: Long,
  iv_percentile: Decimal,      # 0.0-1.0
}
```

#### Option Trade
```
{
  id: UUID,
  option: Ref,                 # Reference to option contract
  action: Keyword,             # :buy-to-open, :sell-to-open, etc.
  quantity: Long,              # Number of contracts
  premium_paid: Decimal,       # Premium per contract
  total_cost: Decimal,         # Total cost
  timestamp: Long,             # Execution time
  underlying_price: Decimal,   # Underlying at trade time
  status: Keyword,             # :open, :closed, :exercised, :expired
  pnl: Decimal,                # Realized P&L
  pnl_percent: Decimal,        # P&L percentage
}
```

### Renko Options Swing Strategy

A novel strategy combining Renko charts with options trading:

#### Entry Signals

**For CALL Options (Bullish)**:
- Pattern: `[-1, -1, +1]` (double-brick bearish reversal)
- Delta: 0.40-0.60 (ATM zone)
- DTE: 5-15 days
- IV Percentile: < 80%

**For PUT Options (Bearish)**:
- Pattern: `[+1, +1, -1]` (double-brick bullish reversal)
- Delta: 0.40-0.60 (ATM zone)
- DTE: 5-15 days
- IV Percentile: < 80%

#### Exit Signals

1. **Profit Target**: Close at 50% gain on premium
2. **Stop Loss**: Close at 30% loss on premium
3. **Time Exit**: Close at 3 DTE remaining
4. **Pattern Reversal**: Close on 2-brick reversal against position

#### Configuration
```
{
  min_delta: 0.40,
  max_delta: 0.60,
  max_iv_percentile: 0.80,
  min_dte: 5,
  max_dte: 15,
  profit_target_pct: 0.50,
  stop_loss_pct: -0.30,
  time_exit_dte: 3,
  brick_size_mode: :atr,
  atr_multiplier: 0.5,         # 0.5 for weekly, 0.75 for bi-weekly
}
```

### MetaTrader 5 Integration

#### Architecture
```
Clojure Core ←HTTP→ Python Bridge ←IPC→ MT5 Terminal
```

#### MQL5 Data Mapping

| MQL5 Property | Datomic Attribute |
|---------------|-------------------|
| SYMBOL_NAME | :symbol/name |
| SYMBOL_OPTION_STRIKE | :option/strike |
| SYMBOL_OPTION_RIGHT | :option/type |
| POSITION_TICKET | :position/ticket |
| POSITION_VOLUME | :position/volume |
| DEAL_PROFIT | :deal/profit |

#### Operations Supported
- Symbol info retrieval
- OHLCV bars fetching
- Order placement (market, limit, stop)
- Position management
- Account info
- Trade history

### Options Strategy Variants

#### Weekly Options (5-7 DTE)
- Brick size: ATR(14) × 0.5
- Faster decay, tighter stops
- More frequent trading

#### Bi-Weekly Options (10-14 DTE)
- Brick size: ATR(14) × 0.75
- Balanced decay/movement
- Moderate frequency

#### Monthly Options (21-35 DTE)
- Brick size: ATR(14) × 1.0
- Slower decay, wider stops
- Fewer trades, larger moves

---

## Summary (Extended)

This specification defines a comprehensive trading system with:
- ✅ Multiple brick pattern signals (1/2/multi-brick)
- ✅ Three execution modes (backtest, paper, production)
- ✅ Risk management (stop loss, trailing profits)
- ✅ Event sourcing (immutable trade/signal records)
- ✅ Visualization (charts, signals, metrics)
- ✅ Extensible architecture (exchanges, data sources)
- ✅ **EPIC-OPTIONS**: Options trading with calls/puts
- ✅ **Greeks Calculation**: Delta, Gamma, Theta, Vega, Rho
- ✅ **Renko Options Strategy**: Novel swing trading approach
- ✅ **MetaTrader 5 Integration**: Via Python SDK bridge
- ✅ **MQL5 Taxonomy**: Industry-standard naming conventions
- ✅ **Deribit API Integration**: Crypto derivatives with Ed25519 auth
- ✅ **Clara Rules Engine**: Forward-chaining rules for strategy logic
- ✅ **Convex Volatility Strategy**: BTC options with regime detection
- ✅ **Strategy Editor UI**: Visual strategy builder with multi-signal aggregation
- ✅ **Backtest Metrics**: Sharpe, Sortino, Max DD, Calmar calculations
