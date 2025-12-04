# Trading UI

A real-time trading simulation application featuring an interactive order book ladder, market making algorithms, and live price visualization. Built with React and featuring a Python WebSocket backend for market simulation.

## Features

- **Interactive Order Book Ladder** - Visual representation of market depth with bid/ask levels
- **Real-time Price Updates** - Live mid-price calculation and sparkline visualization
- **Order Management** - Place, modify, and cancel orders via click and drag-and-drop
- **Market Making Simulation** - Automated market makers that continuously quote bid/ask prices
- **Order Matching Engine** - Full order book with price-time priority matching
- **Event Log** - Real-time display of trading events (fills, new orders, cancels, modifies)
- **FIX Protocol Messages** - Communication using FIX 4.2-style message format

## Architecture

### Frontend (React)
- **DataManager** - Central state management using React's `useReducer`, handles WebSocket messages
- **InstrumentLevelView** - Order book ladder display with scrollable price levels
- **InstrumentLevel** - Individual price level row with bid/ask quantities and user orders
- **InstrumentOnDay** - Displays instrument summary (symbol, mid price, daily change)
- **Sparkline** - Mini price chart showing recent price movement
- **EventLog** - Trading event history display
- **WebSocketManager** - WebSocket connection handler with local/remote mode support

### Backend (JavaScript/Python)
- **MarketSimulator** - Singleton that orchestrates the simulation, can run locally in-browser
- **OrderBook** - Central limit order book with bid/ask management and order matching
- **MarketMaker** - Automated trading agent that maintains two-sided quotes
- **Order** - Order representation with status tracking and acknowledgment events

### Communication Flow
```
UI Components <-> DataManager <-> WebSocketManager <-> MarketSimulator <-> OrderBook
                                                              |
                                                       MarketMaker(s)
```

## Project Structure

```
trading_ui/
├── src/
│   ├── App.js                    # Main application component
│   ├── App.css                   # Global styles
│   ├── index.js                  # Application entry point
│   ├── components/
│   │   ├── DataManager.js        # State management and WebSocket integration
│   │   ├── WebSocketManager.js   # WebSocket connection handling
│   │   ├── MarketSimulator.js    # Market simulation engine (JS)
│   │   ├── OrderBook.js          # Order book implementation
│   │   ├── MarketMaker.js        # Automated market maker
│   │   ├── Order.js              # Order and order status definitions
│   │   ├── DataEvent.js          # Async event handling utilities
│   │   ├── InstrumentLevelView.js # Order book ladder container
│   │   ├── InstrumentLevel.js    # Individual price level row
│   │   ├── InstrumentOnDay.js    # Instrument summary display
│   │   ├── InstrumentContext.js  # React context for instrument data
│   │   ├── EventLog.js           # Trading event log display
│   │   ├── sparkline.js          # Price sparkline chart
│   │   ├── SplitContainer.js     # Resizable split panel component
│   │   └── ...
│   ├── utils/
│   │   └── utils.js              # Utility functions (rounding, formatting)
│   └── python/
│       ├── MarketSimulator.py    # Python WebSocket server
│       ├── OrderBook.py          # Python order book implementation
│       ├── MarketMaker.py        # Python market maker
│       ├── Order.py              # Python order classes
│       └── DataEvent.py          # Python async event utilities
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v16 or higher recommended)
- npm or yarn
- Python 3.8+ (optional, for Python backend)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/johnson-brad-15/trading_ui.git
cd trading_ui
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) For Python backend, install Python dependencies:
```bash
pip install websockets asyncio
```

## Usage

### Running with Local Simulation (Default)

The application runs a complete market simulation in the browser:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Running with Python WebSocket Server

1. Start the Python WebSocket server:
```bash
cd src/python
python MarketSimulator.py
```

2. Modify `WebSocketManager.js` to connect to the remote server:
```javascript
webSocketManagerRef.current.connect(false); // Set to false for remote connection
```

3. Start the React application:
```bash
npm start
```

## Interacting with the UI

### Order Book Ladder
- **Click on Bid column** - Place a buy order at that price level
- **Click on Ask column** - Place a sell order at that price level
- **Drag orders** - Drag your orders (MyBids/MyAsks columns) to modify price
- **Right-click orders** - Cancel orders at that price level

### Price Levels
- **Green highlight** - Last traded price
- **Volume bar** - Shows traded volume at each price level

## Technologies

- **React 19** - UI framework
- **React Financial Charts** - Charting library
- **React Sparklines** - Sparkline visualization
- **Flexlayout React** - Layout management
- **Dockview** - Docking panel support
- **WebSocket** - Real-time communication
- **Python websockets** - Python WebSocket server

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run deploy` | Deploy to GitHub Pages |

## Message Protocol

The application uses a FIX 4.2-inspired message format:

| Tag | Description |
|-----|-------------|
| 35 | MsgType (d=SecDef, A=Logon, D=NewOrder, F=Cancel, G=Modify, W=MDSnapshot, 8=ExecRpt) |
| 49 | SenderCompID (Client ID) |
| 55 | Symbol |
| 44 | Price |
| 38 | OrderQty |
| 54 | Side (1=Buy, 2=Sell) |
| 39 | OrdStatus (0=New, 1=PartialFill, 2=Filled, 4=Canceled, 5=Replaced) |
| 11 | ClOrdID (Order ID) |
| 52 | SendingTime |

## License

This project is private.

## Author

[johnson-brad-15](https://github.com/johnson-brad-15)
