class OnChainMetrics {
    constructor() {
        this.metrics = new Map();
        this.updateInterval = 5 * 60 * 1000; // 5 minutes
        this.lastUpdate = 0;
    }

    async getMetrics(crypto) {
        const now = Date.now();
        const cacheKey = `${crypto}-metrics`;
        
        if (this.metrics.has(cacheKey) && (now - this.lastUpdate) < this.updateInterval) {
            return this.metrics.get(cacheKey);
        }

        let metrics = {};
        
        try {
            if (crypto === 'BTC') {
                metrics = await this.getBitcoinMetrics();
            } else if (crypto === 'ETH') {
                metrics = await this.getEthereumMetrics();
            }
            
            this.metrics.set(cacheKey, metrics);
            this.lastUpdate = now;
            
            return metrics;
        } catch (error) {
            console.error('Error fetching on-chain metrics:', error);
            return this.getSimulatedMetrics(crypto);
        }
    }

    async getBitcoinMetrics() {
        // In a real implementation, these would call actual blockchain APIs
        return {
            sopr: await this.calculateSOPR(),
            nupl: await this.calculateNUPL(),
            mvrv: await this.calculateMVRV(),
            activeAddresses: await this.getActiveAddresses('BTC'),
            transactionCount: await this.getTransactionCount('BTC'),
            hashRate: await this.getHashRate(),
            difficulty: await this.getDifficulty(),
            exchangeInflow: await this.getExchangeFlow('BTC', 'inflow'),
            exchangeOutflow: await this.getExchangeFlow('BTC', 'outflow'),
            hodlWaves: await this.getHODLWaves(),
            longTermHolders: await this.getLongTermHolders(),
            shortTermHolders: await this.getShortTermHolders(),
            coinDaysDestroyed: await this.getCoinDaysDestroyed(),
            dormancy: await this.getDormancy(),
            puellMultiple: await this.getPuellMultiple(),
            nvt: await this.getNVT(),
            stockToFlow: await this.getStockToFlow(),
            addresses: await this.getAddressMetrics('BTC')
        };
    }

    async getEthereumMetrics() {
        return {
            gasPrice: await this.getGasPrice(),
            gasPriceGwei: await this.getGasPriceGwei(),
            gasUsed: await this.getGasUsed(),
            blockSize: await this.getBlockSize(),
            networkUtilization: await this.getNetworkUtilization(),
            activeAddresses: await this.getActiveAddresses('ETH'),
            transactionCount: await this.getTransactionCount('ETH'),
            exchangeInflow: await this.getExchangeFlow('ETH', 'inflow'),
            exchangeOutflow: await this.getExchangeFlow('ETH', 'outflow'),
            totalSupply: await this.getTotalSupply('ETH'),
            burnedETH: await this.getBurnedETH(),
            stakingRatio: await this.getStakingRatio(),
            defiTVL: await this.getDeFiTVL(),
            nvt: await this.getNVT('ETH'),
            addresses: await this.getAddressMetrics('ETH'),
            eip1559: await this.getEIP1559Metrics()
        };
    }

    // Bitcoin-specific metrics
    async calculateSOPR() {
        // Spent Output Profit Ratio - simulated calculation
        const baseSOPR = 1.0;
        const volatility = 0.05;
        const trend = (Math.random() - 0.5) * 0.02;
        return baseSOPR + trend + (Math.random() - 0.5) * volatility;
    }

    async calculateNUPL() {
        // Net Unrealized Profit/Loss - simulated
        return (Math.random() - 0.3) * 0.8; // Slightly biased toward positive
    }

    async calculateMVRV() {
        // Market Value to Realized Value - simulated
        return 1 + (Math.random() - 0.3) * 2; // Range roughly 0.4 to 2.7
    }

    async getHashRate() {
        // Bitcoin hash rate in EH/s - simulated
        return 350 + (Math.random() - 0.5) * 50;
    }

    async getDifficulty() {
        // Bitcoin difficulty - simulated
        return 50000000000000 + (Math.random() - 0.5) * 5000000000000;
    }

    async getHODLWaves() {
        // Distribution of coins by age - simulated
        return {
            '1d-1w': 0.05 + Math.random() * 0.02,
            '1w-1m': 0.08 + Math.random() * 0.02,
            '1m-3m': 0.12 + Math.random() * 0.03,
            '3m-6m': 0.15 + Math.random() * 0.03,
            '6m-1y': 0.18 + Math.random() * 0.03,
            '1y-2y': 0.20 + Math.random() * 0.03,
            '2y+': 0.22 + Math.random() * 0.05
        };
    }

    async getLongTermHolders() {
        // Percentage of supply held by long-term holders
        return 0.65 + (Math.random() - 0.5) * 0.1;
    }

    async getShortTermHolders() {
        // Percentage of supply held by short-term holders
        return 0.35 + (Math.random() - 0.5) * 0.1;
    }

    async getCoinDaysDestroyed() {
        // Coin Days Destroyed - simulated
        return 1000000 + (Math.random() - 0.5) * 500000;
    }

    async getDormancy() {
        // Average dormancy of spent outputs
        return 100 + (Math.random() - 0.5) * 50;
    }

    async getPuellMultiple() {
        // Bitcoin Puell Multiple
        return 0.5 + Math.random() * 2;
    }

    async getStockToFlow() {
        // Bitcoin Stock-to-Flow ratio
        return 50 + (Math.random() - 0.5) * 10;
    }

    // Ethereum-specific metrics
    async getGasPrice() {
        // Average gas price in wei - simulated
        return 20000000000 + (Math.random() - 0.5) * 50000000000;
    }

    async getGasPriceGwei() {
        // Gas price in Gwei - simulated
        return 20 + (Math.random() - 0.5) * 30;
    }

    async getGasUsed() {
        // Gas used per block - simulated
        return 15000000 + (Math.random() - 0.5) * 5000000;
    }

    async getBlockSize() {
        // Average block size - simulated
        return 30000 + (Math.random() - 0.5) * 10000;
    }

    async getNetworkUtilization() {
        // Network utilization percentage
        return 0.7 + (Math.random() - 0.5) * 0.3;
    }

    async getTotalSupply(crypto) {
        if (crypto === 'ETH') {
            return 120000000 + Math.random() * 1000000;
        }
        return 19000000 + Math.random() * 100000; // BTC
    }

    async getBurnedETH() {
        // ETH burned through EIP-1559
        return 3000000 + Math.random() * 100000;
    }

    async getStakingRatio() {
        // Percentage of ETH staked
        return 0.13 + (Math.random() - 0.5) * 0.02;
    }

    async getDeFiTVL() {
        // DeFi Total Value Locked in ETH
        return 25000000 + (Math.random() - 0.5) * 5000000;
    }

    async getEIP1559Metrics() {
        return {
            baseFee: 20 + (Math.random() - 0.5) * 10,
            burnRate: 2.5 + (Math.random() - 0.5) * 1,
            priorityFee: 2 + Math.random() * 3
        };
    }

    // Common metrics
    async getActiveAddresses(crypto) {
        const baseAddresses = crypto === 'BTC' ? 1000000 : 500000;
        return baseAddresses + (Math.random() - 0.5) * 200000;
    }

    async getTransactionCount(crypto) {
        const baseTxCount = crypto === 'BTC' ? 300000 : 1200000;
        return baseTxCount + (Math.random() - 0.5) * 100000;
    }

    async getExchangeFlow(crypto, direction) {
        const baseFlow = (Math.random() - 0.5) * 10000;
        return direction === 'inflow' ? Math.max(0, baseFlow) : Math.max(0, -baseFlow);
    }

    async getNVT(crypto = 'BTC') {
        // Network Value to Transactions ratio
        return 50 + (Math.random() - 0.5) * 100;
    }

    async getAddressMetrics(crypto) {
        return {
            total: await this.getTotalAddresses(crypto),
            active: await this.getActiveAddresses(crypto),
            new: await this.getNewAddresses(crypto),
            withBalance: await this.getAddressesWithBalance(crypto)
        };
    }

    async getTotalAddresses(crypto) {
        const baseTotal = crypto === 'BTC' ? 40000000 : 200000000;
        return baseTotal + Math.random() * 1000000;
    }

    async getNewAddresses(crypto) {
        return 50000 + (Math.random() - 0.5) * 20000;
    }

    async getAddressesWithBalance(crypto) {
        const baseWithBalance = crypto === 'BTC' ? 35000000 : 80000000;
        return baseWithBalance + Math.random() * 500000;
    }

    getSimulatedMetrics(crypto) {
        // Fallback simulated metrics when APIs are unavailable
        const baseMetrics = {
            activeAddresses: 800000 + Math.random() * 400000,
            transactionCount: 300000 + Math.random() * 200000,
            exchangeInflow: Math.random() * 5000,
            exchangeOutflow: Math.random() * 5000,
            lastUpdated: Date.now()
        };

        if (crypto === 'BTC') {
            return {
                ...baseMetrics,
                sopr: 1.0 + (Math.random() - 0.5) * 0.1,
                mvrv: 1.5 + (Math.random() - 0.5) * 0.5,
                hashRate: 350 + (Math.random() - 0.5) * 50,
                longTermHolders: 0.65 + (Math.random() - 0.5) * 0.1
            };
        } else {
            return {
                ...baseMetrics,
                gasPriceGwei: 25 + (Math.random() - 0.5) * 20,
                networkUtilization: 0.75 + (Math.random() - 0.5) * 0.2,
                stakingRatio: 0.13 + (Math.random() - 0.5) * 0.02,
                burnRate: 2.5 + (Math.random() - 0.5) * 1
            };
        }
    }

    formatMetrics(metrics) {
        const formatted = {};
        
        for (const [key, value] of Object.entries(metrics)) {
            if (typeof value === 'number') {
                if (key.includes('Address') || key.includes('Count') || key.includes('Supply')) {
                    formatted[key] = this.formatNumber(value);
                } else if (key.includes('Ratio') || key.includes('Percent')) {
                    formatted[key] = (value * 100).toFixed(2) + '%';
                } else if (key.includes('Price') || key.includes('Fee')) {
                    formatted[key] = value.toFixed(2);
                } else {
                    formatted[key] = value.toFixed(4);
                }
            } else {
                formatted[key] = value;
            }
        }
        
        return formatted;
    }

    formatNumber(num) {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        } else {
            return num.toFixed(0);
        }
    }

    // Real-time metric updates
    startRealTimeUpdates() {
        setInterval(async () => {
            try {
                const btcMetrics = await this.getBitcoinMetrics();
                const ethMetrics = await this.getEthereumMetrics();
                
                // Emit events for UI updates
                this.emitMetricUpdate('BTC', btcMetrics);
                this.emitMetricUpdate('ETH', ethMetrics);
            } catch (error) {
                console.error('Error updating metrics:', error);
            }
        }, this.updateInterval);
    }

    emitMetricUpdate(crypto, metrics) {
        const event = new CustomEvent('onChainMetricsUpdate', {
            detail: { crypto, metrics }
        });
        window.dispatchEvent(event);
    }
}

// Export for use in main application
window.OnChainMetrics = OnChainMetrics;
