const sequelize = require('../DB/sequelize_client');

const {
    DataTypes,
    Model
} = require('sequelize');

/**
 * @version 1.0.0
 * @description DepthStats class model.
 */
class DepthStats extends Model {}

DepthStats.init({
    symbol: DataTypes.STRING,
    bookMid: DataTypes.DOUBLE,
    bookOffset: DataTypes.DOUBLE,
    bookAvg: DataTypes.DOUBLE,
    bookAvgNorm: DataTypes.DOUBLE,
    bidsAvg: DataTypes.DOUBLE,
    firstBid: DataTypes.DOUBLE,
    firstBidNorm: DataTypes.DOUBLE,
    asksAvg: DataTypes.DOUBLE,
    firstAsk: DataTypes.DOUBLE,
    firstAskNorm: DataTypes.DOUBLE,
}, {
    sequelize,
    tableName: 'depthstats',
});

module.exports = DepthStats;