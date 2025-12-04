import { AsyncDataEvent } from './DataEvent';
import { Order, OrderStatus } from './Order';
import { roundTo } from '../utils/utils';

class MarketMaker {
    constructor(ob, symbol, clientId, msAckEvent = null, px = null, defaultQty = null, width = 4) {
        this.symbol = symbol;
        this.clientId = clientId;
        this.defaultQty = defaultQty;
        this.px = px;
        this.qty = defaultQty;
        this.width = width;
        this.tickSz = 0.01;
        this.obNewEvent = ob.new_event;
        this.obModifyEvent = ob.modify_event;
        this.obCancelEvent = ob.cancel_event;
        this.msAckEvent = msAckEvent;
        this.ackEvent = new AsyncDataEvent();
        this.isAuto = !msAckEvent;
        this.bid = null;
        this.ask = null;
        this.running = true;

        // Bind methods
        this.handleAck = this.handleAck.bind(this);
    }

    async start() {
        this.waitAckPromise = this.waitAck(this.ackEvent);
        if (this.isAuto) {
            this.manageOrdersPromise = this.manageOrdersLoop();
        }
    }

    stop() {
        this.running = false;
    }

    placeNewOrder(side, px, qty) {
        const order = new Order(side, px, qty, this.clientId, this.ackEvent, !this.isAuto);
        order.status = OrderStatus.PENDING;
        if (side === 'Buy') {
            this.bid = order;
        } else {
            this.ask = order;
        }
        this.obNewEvent.set(order);
    }

    // Legacy method names for compatibility
    place_new_order(side, px, qty) {
        return this.placeNewOrder(side, px, qty);
    }

    modifyOrder(orderId, newPx, newQty = null) {
        this.obModifyEvent.set([orderId, newPx, newQty]);
    }

    modify_order(orderId, newPx, newQty = null) {
        return this.modifyOrder(orderId, newPx, newQty);
    }

    cancelOrder(orderId) {
        this.obCancelEvent.set(orderId);
    }

    cancel_order(orderId) {
        return this.cancelOrder(orderId);
    }

    async waitAck(event) {
        while (this.running) {
            await event.waitRun(this.handleAck);
        }
    }

    async handleAck(ack) {
        try {
            ack.order.status = ack.status;
            switch (ack.status) {
                case OrderStatus.NEW:
                case OrderStatus.MODIFIED:
                case OrderStatus.PARTIALLY_FILLED:
                    if (ack.order.side === 'Buy') {
                        this.bid = ack.order;
                    } else {
                        this.ask = ack.order;
                    }
                    break;
                case OrderStatus.CANCELLED:
                case OrderStatus.FULLY_FILLED:
                    if (ack.order.side === 'Buy') {
                        this.bid = null;
                    } else {
                        this.ask = null;
                    }
                    break;
                default:
                    break;
            }
            if (this.msAckEvent) {
                this.msAckEvent.set(ack);
            }
        } catch (ex) {
            console.error('MarketMaker handleAck error:', ex);
        }
    }

    async manageOrdersLoop() {
        while (this.running) {
            await this.manageOrders();
        }
    }

    async manageOrders() {
        try {
            const min = this.width / 2 - 1;
            const max = this.width / 2 + 1;
            const bidTicks = Math.floor(Math.random() * ((max - min) + 1)) + min;
            const bidPx = roundTo(this.px - (bidTicks * this.tickSz), 2);
            const askPx = roundTo(bidPx + (this.width * this.tickSz), 2);
            this.px = (bidPx + askPx) / 2;

            if (!this.bid) {
                this.placeNewOrder('Buy', bidPx, this.qty);
            } else if (this.bid.status !== OrderStatus.PENDING) {
                this.modifyOrder(this.bid.id, bidPx, this.bid.qty);
            }

            if (!this.ask) {
                this.placeNewOrder('Sell', askPx, this.qty);
            } else if (this.ask.status !== OrderStatus.PENDING) {
                this.modifyOrder(this.ask.id, askPx, this.ask.qty);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (ex) {
            console.error('MarketMaker manageOrders error:', ex);
        }
    }
}

export default MarketMaker;