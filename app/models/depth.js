const sequelize = require('../DB/sequelize_client');

const {
    DataTypes,
    Model
} = require('sequelize');

/**
 * @version 1.0.0
 * @description Depth class model.
 */
class Depth extends Model {}

Depth.init({
    symbol: DataTypes.STRING,
    side: DataTypes.STRING,
    price: DataTypes.DOUBLE,
    quantity: DataTypes.DOUBLE,
    eventTime: DataTypes.BIGINT,
}, {
    sequelize,
    tableName: 'depth',
    indexes: [{
        unique: true,
        fields: [
            'symbol',
            'price',
        ]
    }]
});

module.exports = Depth;