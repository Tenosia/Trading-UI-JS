import { AsyncDataEvent } from "./DataEvent";
import { OrderAck, OrderStatus, Fill } from './Order';

class OrderBook {
    constructor(symbol, msSend) {
        this.symbol = symbol;
        this.msSend = msSend;
        this.sendBookEvent = new AsyncDataEvent();
        this.sendTradeEvent = new AsyncDataEvent();
        this.new_event = new AsyncDataEvent();
        this.modify_event = new AsyncDataEvent();
        this.cancel_event = new AsyncDataEvent();
        this.bids = {};
        this.asks = {};
        this.ordersById = {};
        this.running = true;

        // Bind methods
        this.newOrder = this.newOrder.bind(this);
        this.modifyOrder = this.modifyOrder.bind(this);
        this.cancelOrder = this.cancelOrder.bind(this);
        this.sendBook = this.sendBook.bind(this);
        this.sendTrade = this.sendTrade.bind(this);
    }

    async start() {
        this.waitNewPromise = this.waitNew(this.new_event);
        this.waitModifyPromise = this.waitModify(this.modify_event);
        this.waitCancelPromise = this.waitCancel(this.cancel_event);
        this.waitSendBookPromise = this.waitSendBook(this.sendBookEvent);
        this.waitSendTradePromise = this.waitSendTrade(this.sendTradeEvent);
    }

    stop() {
        this.running = false;
    }

    toJson(msgType) {
        const bids = Object.keys(this.bids)
            .sort((a, b) => b - a)
            .flatMap(lvl => this.bids[lvl]);
        const asks = Object.keys(this.asks)
            .sort((a, b) => a - b)
            .flatMap(lvl => this.asks[lvl]);

        const fix42 = { 35: 'W', 52: new Date().toISOString(), 55: this.symbol, 268: [] };

        if (msgType === 'W') {
            // Aggregate quantities by price level
            const bidsByPx = new Map();
            const asksByPx = new Map();

            bids.forEach(o => {
                bidsByPx.set(o.px, (bidsByPx.get(o.px) || 0) + o.qty);
            });
            asks.forEach(o => {
                asksByPx.set(o.px, (asksByPx.get(o.px) || 0) + o.qty);
            });

            [...bidsByPx.entries()].sort((a, b) => b[0] - a[0]).forEach(([px, qty]) => {
                fix42[268].push({ 269: 0, 270: px, 271: qty });
            });
            [...asksByPx.entries()].sort((a, b) => a[0] - b[0]).forEach(([px, qty]) => {
                fix42[268].push({ 269: 1, 270: px, 271: qty });
            });
        }

        return fix42;
    }

    async waitNew(event) {
        while (this.running) {
            await event.waitRun(this.newOrder);
        }
    }

    async newOrder(order) {
        order.status = OrderStatus.NEW;
        this.ordersById[order.id] = order;
        const side = order.side === 'Buy' ? this.bids : this.asks;

        if (!side[order.px]) {
            side[order.px] = [];
        }
        side[order.px].push(order);

        if (order.ackEvent) {
            try {
                order.ackEvent.set(new OrderAck(order, OrderStatus.NEW));
            } catch (ex) {
                console.error('OrderBook newOrder ack error:', ex);
            }
        }
        this.match(order);
        this.sendBookEvent.set();
    }

    async waitModify(event) {
        while (this.running) {
            await event.waitRun(this.modifyOrder);
        }
    }

    async modifyOrder(data) {
        try {
            let [orderId, px, qty] = data;
            if (!this.ordersById[orderId]) return;

            const order = this.ordersById[orderId];
            if (qty === null) qty = order.qty;

            const side = order.side === 'Buy' ? this.bids : this.asks;
            const backOfTheLine = px !== order.px || qty > order.qty;

            if (backOfTheLine && order.px in side) {
                side[order.px] = side[order.px].filter(o => o !== order);
                if (side[order.px].length === 0) {
                    delete side[order.px];
                }
            }

            order.px = px;
            order.qty = qty;
            order.status = OrderStatus.MODIFIED;

            if (backOfTheLine && order.id in this.ordersById) {
                if (!(order.px in side)) {
                    side[order.px] = [];
                }
                side[order.px].push(order);
            }

            if (order.ackEvent) {
                order.ackEvent.set(new OrderAck(order, OrderStatus.MODIFIED));
            }
            this.match(order);
            this.sendBookEvent.set();
        } catch (ex) {
            console.error('OrderBook modifyOrder error:', ex);
        }
    }

    async waitCancel(event) {
        while (this.running) {
            await event.waitRun(this.cancelOrder);
        }
    }

    async cancelOrder(orderId) {
        const order = this.ordersById[orderId];
        if (!order) return;

        order.status = OrderStatus.CANCELLED;
        delete this.ordersById[order.id];

        const side = order.side === 'Buy' ? this.bids : this.asks;
        if (side[order.px]) {
            side[order.px] = side[order.px].filter(o => o !== order);
            if (side[order.px].length === 0) {
                delete side[order.px];
            }
        }

        if (order.ackEvent) {
            order.ackEvent.set(new OrderAck(order, OrderStatus.CANCELLED));
        }
        this.sendBookEvent.set();
    }

    fill(order, sz) {
        const execTime = new Date();
        const side = order.side === 'Buy' ? this.bids : this.asks;

        order.qty -= sz;
        order.filled_qty += sz;

        if (order.qty === 0) {
            order.status = OrderStatus.FULLY_FILLED;
            delete this.ordersById[order.id];

            if (side[order.px]) {
                side[order.px] = side[order.px].filter(o => o !== order);
                if (side[order.px].length === 0) {
                    delete side[order.px];
                }
            }

            if (order.ackEvent) {
                order.ackEvent.set(new OrderAck(order, OrderStatus.FULLY_FILLED));
            }
        } else {
            order.status = OrderStatus.PARTIALLY_FILLED;
            if (order.ackEvent) {
                order.ackEvent.set(new OrderAck(order, OrderStatus.PARTIALLY_FILLED));
            }
        }

        this.sendTradeEvent.set(new Fill(execTime, order.id, order.id, order.clientId, order.side, sz, order.px, order.qty === 0));
        this.sendBookEvent.set();
    }

    match(order) {
        const otherSide = order.side === 'Buy' ? this.asks : this.bids;
        const matchingOrders = order.side === 'Buy'
            ? Object.keys(otherSide).filter(k => parseFloat(k) <= order.px).flatMap(k => otherSide[k])
            : Object.keys(otherSide).filter(k => parseFloat(k) >= order.px).flatMap(k => otherSide[k]);

        let i = 0;
        while (order.qty > 0 && i < matchingOrders.length) {
            const matchingOrder = matchingOrders[i];
            const sz = Math.min(order.qty, matchingOrder.qty);
            this.fill(order, sz);
            const fullFillMo = matchingOrder.qty - sz === 0;
            this.fill(matchingOrder, sz);
            if (fullFillMo) {
                i++;
            }
        }
    }

    async waitSendBook(event) {
        while (this.running) {
            try {
                await event.waitRun(this.sendBook);
            } catch (ex) {
                console.error('OrderBook waitSendBook error:', ex);
            }
        }
    }

    async sendBook() {
        const msg = this.toJson('W');
        this.msSend(msg);
    }

    async waitSendTrade(event) {
        while (this.running) {
            await event.waitRun(this.sendTrade);
        }
    }

    async sendTrade() {
        // Trade dissemination can be implemented here
    }

    toString() {
        return `bids: ${JSON.stringify(this.bids)}\nasks: ${JSON.stringify(this.asks)}`;
    }
}

export default OrderBook;