import MarketMaker from './MarketMaker';
import OrderBook from './OrderBook';
import { AsyncDataEvent } from './DataEvent';
import { OrderStatus } from './Order';

export const MSEvent = (msg) => ({
    data: msg
});

class MarketSimulator {
    constructor(onopenCb, onerrorCb, oncloseCb, onmessageCb, handleDataMessage) {
        if (MarketSimulator.instance) {
            return MarketSimulator.instance;
        }

        this.symbol = null;
        this.tickSz = null;
        this.openingPx = null;
        this.currency = null;
        this.nextClientId = 0;

        this.onopenCb = onopenCb;
        this.onerrorCb = onerrorCb;
        this.oncloseCb = oncloseCb;
        this.onmessageCb = onmessageCb;
        this.handleDataMessage = handleDataMessage;

        this.mms = {};
        this.numAutoMMs = 1;
        this.ob = null;
        this.running = true;

        this.ackEvent = new AsyncDataEvent();
        
        // Bind methods
        this.handleAck = this.handleAck.bind(this);
        this.send = this.send.bind(this);
        
        this.waitAck(this.ackEvent);

        this.readyState = WebSocket.OPEN;

        MarketSimulator.instance = this;
    }

    getNextClientId() {
        const id = this.nextClientId;
        this.nextClientId += 1;
        return id;
    }

    async waitAck(event) {
        while (this.running) {
            await event.waitRun(this.handleAck);
        }
    }

    async handleAck(ack) {
        try {
            if (ack.order.id < 0) { // Manual MM
                const timestamp = new Date().toISOString();
                const baseAck = {
                    35: 8,
                    56: ack.order.clientId,
                    11: ack.order.id,
                    54: ack.order.side === "Buy" ? 1 : 2,
                    44: ack.order.px,
                    52: timestamp
                };

                let ackMsg;
                switch (ack.status) {
                    case OrderStatus.NEW:
                        ackMsg = { ...baseAck, 39: 0, 38: ack.order.qty };
                        break;
                    case OrderStatus.CANCELLED:
                        ackMsg = { ...baseAck, 39: 4, 38: ack.order.qty };
                        break;
                    case OrderStatus.MODIFIED:
                        ackMsg = { ...baseAck, 39: 5, 38: ack.order.qty };
                        break;
                    case OrderStatus.FULLY_FILLED:
                        ackMsg = { ...baseAck, 39: 2, 38: ack.order.filled_qty };
                        break;
                    case OrderStatus.PARTIALLY_FILLED:
                        ackMsg = { ...baseAck, 39: 1, 38: ack.order.filled_qty };
                        break;
                    default:
                        return;
                }
                await this.send(ackMsg);
            }
        } catch (ex) {
            console.error('MarketSimulator handleAck error:', ex);
        }
    }

    async send(msg) {
        let reply;

        switch (msg[35]) {
            case 'd': // Security Definition
                reply = msg;
                this.symbol = msg[55];
                this.tickSz = msg[969];
                this.openingPx = msg[44];
                this.currency = msg[15];
                this.ob = new OrderBook(this.symbol, this.send);
                this.ob.start();

                for (let i = 0; i < this.numAutoMMs; i++) {
                    const clientId = this.getNextClientId();
                    this.mms[clientId] = new MarketMaker(this.ob, this.symbol, clientId, null, this.openingPx, 10 + i + 1, 4);
                    this.mms[clientId].start();
                }
                this.onmessageCb(MSEvent(JSON.stringify(reply)));
                break;

            case 'A': // Logon
                if (msg['49'] === -1) {
                    try {
                        const clientId = this.getNextClientId();
                        this.mms[clientId] = new MarketMaker(this.ob, this.symbol, clientId, this.ackEvent, this.openingPx, 10, 4);
                        reply = { 35: "A", 55: this.symbol, 56: clientId, 44: this.mms[clientId].px };
                        this.mms[clientId].start();
                        this.onmessageCb(MSEvent(JSON.stringify(reply)));
                    } catch (ex) {
                        console.error('MarketSimulator logon error:', ex);
                    }
                }
                break;

            case 'D': // New Order
                try {
                    const mm = this.mms[msg['49']];
                    if (mm) {
                        mm.placeNewOrder(msg['38'] > 0 ? 'Buy' : 'Sell', msg['44'], Math.abs(msg['38']));
                    }
                } catch (ex) {
                    console.error('MarketSimulator new order error:', ex);
                }
                break;

            case 'F': // Cancel
                try {
                    const mm = this.mms[msg['49']];
                    if (mm) {
                        mm.cancelOrder(msg['11']);
                    }
                } catch (ex) {
                    console.error('MarketSimulator cancel error:', ex);
                }
                break;

            case 'G': // Modify
                try {
                    const mm = this.mms[msg['49']];
                    if (mm) {
                        mm.modifyOrder(msg['11'], msg['44']);
                    }
                } catch (ex) {
                    console.error('MarketSimulator modify error:', ex);
                }
                break;

            default:
                this.handleDataMessage(msg);
        }
    }

    close() {
        this.running = false;
        if (this.ob) {
            this.ob.stop();
        }
        Object.values(this.mms).forEach(mm => mm.stop());
    }
}

export default MarketSimulator;