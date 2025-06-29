class DataFetcher {
    constructor() {
        this.apis = {
            coinGecko: 'https://api.coingecko.com/api/v3',
            coinMarketCap: '', // Requires API key
            binance: 'https://api.binance.com/api/v3',
            alternative: 'https://api.alternative.me',
            blockchain: 'https://api.blockchain.info'
        };
        
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.rateLimiter = new RateLimiter();
    }

    async getCryptoData(symbol, timeframe = '1d', limit = 100) {
        const cacheKey = `${symbol}-${timeframe}-${limit}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const data = await this.fetchFromMultipleSources(symbol, timeframe, limit);
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error fetching crypto data:', error);
            throw error;
        }
    }

    async fetchFromMultipleSources(symbol, timeframe, limit) {
        const promises = [];
        
        // Primary source: CoinGecko
        promises.push(this.fetchFromCoinGecko(symbol, timeframe, limit));
        
        // Secondary source: Binance
        if (symbol === 'BTC' || symbol === 'ETH') {
            promises.push(this.fetchFromBinance(symbol, timeframe, limit));
        }
        
        try {
            const results = await Promise.allSettled(promises);
            const successfulResult = results.find(result => result.status === 'fulfilled');
            
            if (successfulResult) {
                return successfulResult.value;
            } else {
                throw new Error('All data sources failed');
            }
        } catch (error) {
            console.error('Error in fetchFromMultipleSources:', error);
            throw error;
        }
    }

    async fetchFromCoinGecko(symbol, timeframe, limit) {
        await this.rateLimiter.wait();
        
        const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' : 'ethereum';
        const days = this.getTimeframeDays(timeframe, limit);
        
        const url = `${this.apis.coinGecko}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${timeframe}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return this.formatCoinGeckoData(data, symbol);
    }

    async fetchFromBinance(symbol, timeframe, limit) {
        await this.rateLimiter.wait();
        
        const pair = `${symbol}USDT`;
        const interval = this.getBinanceInterval(timeframe);
        
        const url = `${this.apis.binance}/klines?symbol=${pair}&interval=${interval}&limit=${limit}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return this.formatBinanceData(data, symbol);
    }

    formatCoinGeckoData(data, symbol) {
        const prices = data.prices.map(item => item[1]);
        const volumes = data.total_volumes.map(item => item[1]);
        const timestamps = data.prices.map(item => item[0]);
        
        return {
            symbol,
            prices,
            volumes,
            timestamps,
            source: 'coingecko'
        };
    }

    formatBinanceData(data, symbol) {
        const prices = data.map(item => parseFloat(item[4])); // Close prices
        const volumes = data.map(item => parseFloat(item[5]));
        const timestamps = data.map(item => item[0]);
        
        return {
            symbol,
            prices,
            volumes,
            timestamps,
            source: 'binance'
        };
    }

    async getOnChainMetrics(symbol) {
        if (symbol !== 'BTC' && symbol !== 'ETH') {
            return {};
        }

        try {
            const metrics = {};
            
            // Fetch various on-chain metrics
            if (symbol === 'BTC') {
                metrics.activeAddresses = await this.getBitcoinActiveAddresses();
                metrics.transactionVolume = await this.getBitcoinTransactionVolume();
                metrics.exchangeFlow = await this.getBitcoinExchangeFlow();
                metrics.sopr = await this.getBitcoinSOPR();
            } else if (symbol === 'ETH') {
                metrics.activeAddresses = await this.getEthereumActiveAddresses();
                metrics.gasPrice = await this.getEthereumGasPrice();
                metrics.totalSupply = await this.getEthereumTotalSupply();
            }
            
            return metrics;
        } catch (error) {
            console.error('Error fetching on-chain metrics:', error);
            return {};
        }
    }

    async getFearGreedIndex() {
        try {
            await this.rateLimiter.wait();
            
            const response = await fetch(`${this.apis.alternative}/fng/?limit=30`);
            if (!response.ok) {
                throw new Error(`Fear & Greed API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.data.map(item => ({
                value: parseInt(item.value),
                timestamp: item.timestamp * 1000,
                classification: item.value_classification
            }));
        } catch (error) {
            console.error('Error fetching Fear & Greed index:', error);
            return [];
        }
    }

    async getSocialSentiment(symbol) {
        // This would integrate with social media APIs
        // For demo purposes, returning simulated data
        return this.generateSimulatedSentiment();
    }

    generateSimulatedSentiment() {
        const sentiment = [];
        const now = Date.now();
        
        for (let i = 30; i >= 0; i--) {
            sentiment.push({
                timestamp: now - (i * 24 * 60 * 60 * 1000),
                score: (Math.random() - 0.5) * 2, // -1 to 1
                volume: Math.random() * 1000,
                sources: ['twitter', 'reddit', 'news']
            });
        }
        
        return sentiment;
    }

    // Bitcoin-specific on-chain metrics
    async getBitcoinActiveAddresses() {
        // Simulated data - in reality, would use blockchain APIs
        return this.generateTimeSeriesData(30, 800000, 1200000);
    }

    async getBitcoinTransactionVolume() {
        return this.generateTimeSeriesData(30, 200000, 400000);
    }

    async getBitcoinExchangeFlow() {
        return this.generateTimeSeriesData(30, -5000, 5000);
    }

    async getBitcoinSOPR() {
        return this.generateTimeSeriesData(30, 0.95, 1.15);
    }

    // Ethereum-specific on-chain metrics
    async getEthereumActiveAddresses() {
        return this.generateTimeSeriesData(30, 400000, 600000);
    }

    async getEthereumGasPrice() {
        return this.generateTimeSeriesData(30, 20, 100);
    }

    async getEthereumTotalSupply() {
        return this.generateTimeSeriesData(30, 120000000, 120100000);
    }

    generateTimeSeriesData(days, min, max) {
        const data = [];
        const now = Date.now();
        
        for (let i = days; i >= 0; i--) {
            data.push({
                timestamp: now - (i * 24 * 60 * 60 * 1000),
                value: min + Math.random() * (max - min)
            });
        }
        
        return data;
    }

    getTimeframeDays(timeframe, limit) {
        const multipliers = {
            '1h': limit / 24,
            '4h': limit / 6,
            '1d': limit,
            '1w': limit * 7
        };
        
        return Math.ceil(multipliers[timeframe] || limit);
    }

    getBinanceInterval(timeframe) {
        const intervals = {
            '1h': '1h',
            '4h': '4h',
            '1d': '1d',
            '1w': '1w'
        };
        
        return intervals[timeframe] || '1d';
    }

    async getCurrentPrices() {
        try {
            const response = await fetch(`${this.apis.coinGecko}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            return {
                BTC: {
                    price: data.bitcoin.usd,
                    change24h: data.bitcoin.usd_24h_change,
                    marketCap: data.bitcoin.usd_market_cap,
                    volume24h: data.bitcoin.usd_24h_vol
                },
                ETH: {
                    price: data.ethereum.usd,
                    change24h: data.ethereum.usd_24h_change,
                    marketCap: data.ethereum.usd_market_cap,
                    volume24h: data.ethereum.usd_24h_vol
                }
            };
        } catch (error) {
            console.error('Error fetching current prices:', error);
            return null;
        }
    }
}

class RateLimiter {
    constructor(requestsPerMinute = 50) {
        this.requests = [];
        this.limit = requestsPerMinute;
        this.window = 60000; // 1 minute
    }

    async wait() {
        const now = Date.now();
        
        // Remove old requests outside the window
        this.requests = this.requests.filter(time => now - time < this.window);
        
        if (this.requests.length >= this.limit) {
            const oldestRequest = Math.min(...this.requests);
            const waitTime = this.window - (now - oldestRequest);
            
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        this.requests.push(now);
    }
}

// Export for use in main application
window.DataFetcher = DataFetcher;
