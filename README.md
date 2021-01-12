# CRYPTO APP - Statistics depth book calculator

This app connect to the binance websocket endpoint : 
```
wss://stream.binance.com:9443/ws/
``` 

And with collected data, make and store statistic on market trend into postgresqul _<depthstats>_ relation entity.

## How to use it 
1. Have operationnal postgresql user and database
2. configure environnement parameter
3. configure application parameter

### Environnement parameter

At project root directory in a ```.env``` file :

```
# POSTGRESQL 
PG_URL=postgres://[USER]:[PASSWORD]@[DOMAIN]:[PORT]/[DATABASE]
```
### Application parameter
At project root directory in a ```app.json``` file :

```
{
    "symbols": [
        "btcusdt"
    ]
}
```

### Start project
At project root directory, execute command : 
```
$ node server.js
```