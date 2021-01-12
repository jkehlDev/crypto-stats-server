const WebSocket = require('ws');
const { Depth, DepthStats } = require('./models');


/**
 * @class CryptoThread Make a new thread listening depth book
 * for a target symbol.
 * @version 1.0.0
 */
class CryptoThread {
    socketEndPoint = 'wss://stream.binance.com:9443/ws/';

    /**
     * @constructor CryptoThread constructore give a symbol
     * @param {String} symbol BTCUSDT, BNBBTC, ...
     */
    constructor(symbol) {
        this.symbol = symbol.toLowerCase();
        this.pingCount = 0;
        this.isStart = false;
    }

    /**
     * @method start Start thread listening deph book 
     * for target symbol
     */
    start() {
        // Erase previus database depth book for target symbol
        Depth.destroy({
                where: {
                    symbol: this.symbol
                }
            })
            // Start listening depth book change for target symbol
            .then(() => {
                this.socket = new WebSocket(`${this.socketEndPoint}${this.symbol}@depth@1000ms`);
                this.socket.on('open', () => {
                    this.isStart = true;
                    console.log(`Streaming Depth book update ${this.symbol} start.`);
                    this.interval = setInterval(() => { this.updateState(); }, 1000 * 60);
                });
                this.socket.on('ping', (data) => {
                    this.pingCount++;
                    this.socket.pong(data);
                });
                this.socket.on('message', (data) => {
                    this.upsertDepth(JSON.parse(data));
                });
            })
            // In case of error, close websocket and log error
            .catch((error) => {
                console.error(error);
                this.stop()
            });
    }

    /**
     * @method stop Stop thread listening deph book 
     * for target symbol
     */
    async stop() {
        if (this.isStart) {
            this.isStart = false;
            clearInterval(this.interval);
            this.socket.send(JSON.stringify({
                "method": "UNSUBSCRIBE",
                "params": [
                    `${this.symbol}@depth`
                ],
                "id": Date.now()
            }));
            this.socket.close();
            console.log(`Streaming Depth book update ${this.symbol} stop.`);
        }
    }

    /**
     * @method upsertData Perform upsert request into database 
     * depth book for target symbol.
     * @param {All} data Depth book update data from websocket to upsert.
     */
    upsertDepth(data) {
        if (data.e && data.e === 'depthUpdate') {
            const { b: bids, a: asks, E: eventTime } = data;
            const bidsBulk = bids.map(bid => ({
                symbol: this.symbol,
                side: 'bid',
                price: parseFloat(bid[0]),
                quantity: parseFloat(bid[1]),
                eventTime: parseInt(eventTime, 10)
            }));
            const asksBulk = asks.map(ask => ({
                symbol: this.symbol,
                side: 'ask',
                price: parseFloat(ask[0]),
                quantity: parseFloat(ask[1]),
                eventTime: parseInt(eventTime, 10)
            }));
            const dataBulk = [...bidsBulk, ...asksBulk];
            const dataBulkUpsert = dataBulk.filter(data => data.quantity !== 0);
            const dataBulkDestroy = dataBulk.filter(data => data.quantity === 0);

            for (const data of dataBulkUpsert) {
                Depth.upsert(data);
            }
            for (const data of dataBulkDestroy) {
                Depth.destroy({
                    where: {
                        symbol: this.symbol,
                        price: data.price
                    }
                });
            }
        }
    }

    async updateState() {
        const response = await Depth.findAll();
        const bids = response.filter(position => position.side === 'bid');

        let posAverage = bids.map(position => ({
                multiply: position.quantity * position.price,
                quantity: position.quantity
            }))
            .reduce((pos1, pos2) => ({
                multiply: pos1.multiply + pos2.multiply,
                quantity: pos1.quantity + pos2.quantity
            }));

        const bidsAvg = {
            value: posAverage.multiply / posAverage.quantity,
            weight: [posAverage.quantity][0]
        };
        const firstBid = Math.max(...bids.map(position => position.price));


        const asks = response.filter(position => position.side === 'ask');
        posAverage = asks.map(position => ({
                multiply: position.quantity * position.price,
                quantity: position.quantity
            }))
            .reduce((pos1, pos2) => ({
                multiply: pos1.multiply + pos2.multiply,
                quantity: pos1.quantity + pos2.quantity
            }));

        const asksAvg = {
            value: posAverage.multiply / posAverage.quantity,
            weight: [posAverage.quantity][0]
        };
        const firstAsk = Math.min(...asks.map(position => position.price));

        const bookAvg = (bidsAvg.value * bidsAvg.weight + asksAvg.value * asksAvg.weight) / (bidsAvg.weight + asksAvg.weight);
        const bookMid = (bidsAvg.value + asksAvg.value) / 2;
        const bookOffset = Math.abs(bidsAvg.value - asksAvg.value) / 2;

        const stats = {
            symbol: this.symbol,
            bookMid,
            bookOffset: bookOffset * 2,
            bookAvg,
            bookAvgNorm: Math.round(((bookAvg - bookMid) / bookOffset + Number.EPSILON) * 100) / 100,
            bidsAvg: bidsAvg.value,
            firstBid,
            firstBidNorm: Math.round(((firstBid - bookMid) / bookOffset + Number.EPSILON) * 1000) / 1000,
            asksAvg: asksAvg.value,
            firstAsk,
            firstAskNorm: Math.round(((firstAsk - bookMid) / bookOffset + Number.EPSILON) * 1000) / 1000,
        };
        console.log(stats);
        DepthStats.create(stats);
    }
}
module.exports = CryptoThread;