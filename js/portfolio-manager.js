class PortfolioManager {
    constructor() {
        this.portfolio = this.loadPortfolio();
        this.trades = this.loadTrades();
        this.watchlist = this.loadWatchlist();
        this.riskManager = new RiskManager();
        this.performanceTracker = new PerformanceTracker();
    }

    loadPortfolio() {
        const saved = localStorage.getItem('crypto-portfolio');
        return saved ? JSON.parse(saved) : {
            cash: 10000,
            positions: {},
            totalValue: 10000,
            totalPnL: 0,
            totalPnLPercent: 0,
            lastUpdated: Date.now()
        };
    }

    savePortfolio() {
        localStorage.setItem('crypto-portfolio', JSON.stringify(this.portfolio));
    }

    loadTrades() {
        const saved = localStorage.getItem('crypto-trades');
        return saved ? JSON.parse(saved) : [];
    }

    saveTrades() {
        localStorage.setItem('crypto-trades', JSON.stringify(this.trades));
    }

    loadWatchlist() {
        const saved = localStorage.getItem('crypto-watchlist');
        return saved ? JSON.parse(saved) : ['BTC', 'ETH'];
    }

    saveWatchlist() {
        localStorage.setItem('crypto-watchlist', JSON.stringify(this.watchlist));
    }

    async updatePortfolioValue(prices) {
        let totalValue = this.portfolio.cash;
        
        for (const [symbol, position] of Object.entries(this.portfolio.positions)) {
            if (prices[symbol]) {
                const currentValue = position.quantity * prices[symbol].price;
                position.currentValue = currentValue;
                position.unrealizedPnL = currentValue - position.costBasis;
                position.unrealizedPnLPercent = (position.unrealizedPnL / position.costBasis) * 100;
                position.currentPrice = prices[symbol].price;
                
                totalValue += currentValue;
            }
        }
        
        this.portfolio.totalValue = totalValue;
        this.portfolio.totalPnL = totalValue - 10000; // Assuming initial capital of $10,000
        this.portfolio.totalPnLPercent = (this.portfolio.totalPnL / 10000) * 100;
        this.portfolio.lastUpdated = Date.now();
        
        this.savePortfolio();
        
        return this.portfolio;
    }

    executeTrade(trade) {
        const { symbol, type, quantity, price, timestamp = Date.now() } = trade;
        
        // Validate trade
        if (!this.validateTrade(trade)) {
            throw new Error('Invalid trade parameters');
        }
        
        // Check risk limits
        if (!this.riskManager.checkRiskLimits(trade, this.portfolio)) {
            throw new Error('Trade exceeds risk limits');
        }
        
        const totalCost = quantity * price;
        const commission = totalCost * 0.001; // 0.1% commission
        
        if (type === 'BUY') {
            // Check if enough cash
            if (this.portfolio.cash < totalCost + commission) {
                throw new Error('Insufficient cash for purchase');
            }
            
            // Update cash
            this.portfolio.cash -= (totalCost + commission);
            
            // Update position
            if (!this.portfolio.positions[symbol]) {
                this.portfolio.positions[symbol] = {
                    symbol,
                    quantity: 0,
                    costBasis: 0,
                    averagePrice: 0,
                    currentValue: 0,
                    unrealizedPnL: 0,
                    unrealizedPnLPercent: 0,
                    currentPrice: price
                };
            }
            
            const position = this.portfolio.positions[symbol];
            const newQuantity = position.quantity + quantity;
            const newCostBasis = position.costBasis + totalCost;
            
            position.quantity = newQuantity;
            position.costBasis = newCostBasis;
            position.averagePrice = newCostBasis / newQuantity;
            
        } else if (type === 'SELL') {
            // Check if enough quantity
            if (!this.portfolio.positions[symbol] || this.portfolio.positions[symbol].quantity < quantity) {
                throw new Error('Insufficient quantity for sale');
            }
            
            const position = this.portfolio.positions[symbol];
            const sellValue = quantity * price;
            const costOfSold = (quantity / position.quantity) * position.costBasis;
            const realizedPnL = sellValue - costOfSold - commission;
            
            // Update cash
            this.portfolio.cash += sellValue - commission;
            
            // Update position
            position.quantity -= quantity;
            position.costBasis -= costOfSold;
            
            if (position.quantity === 0) {
                delete this.portfolio.positions[symbol];
            } else {
                position.averagePrice = position.costBasis / position.quantity;
            }
            
            // Record realized PnL
            trade.realizedPnL = realizedPnL;
        }
        
        // Record trade
        const tradeRecord = {
            id: Date.now().toString(),
            ...trade,
            commission,
            timestamp,
            status: 'EXECUTED'
        };
        
        this.trades.push(tradeRecord);
        this.saveTrades();
        this.savePortfolio();
        
        // Update performance metrics
        this.performanceTracker.recordTrade(tradeRecord);
        
        return tradeRecord;
    }

    validateTrade(trade) {
        const { symbol, type, quantity, price } = trade;
        
        if (!symbol || !type || !quantity || !price) {
            return false;
        }
        
        if (quantity <= 0 || price <= 0) {
            return false;
        }
        
        if (!['BUY', 'SELL'].includes(type)) {
            return false;
        }
        
        return true;
    }

    getPortfolioAllocation() {
        const allocation = [];
        const totalValue = this.portfolio.totalValue;
        
        // Cash allocation
        if (this.portfolio.cash > 0) {
            allocation.push({
                symbol: 'CASH',
                value: this.portfolio.cash,
                percentage: (this.portfolio.cash / totalValue) * 100,
                color: '#6c757d'
            });
        }
        
        // Asset allocations
        for (const [symbol, position] of Object.entries(this.portfolio.positions)) {
            if (position.quantity > 0) {
                const percentage = (position.currentValue / totalValue) * 100;
                allocation.push({
                    symbol,
                    value: position.currentValue,
                    percentage,
                    quantity: position.quantity,
                    averagePrice: position.averagePrice,
                    currentPrice: position.currentPrice,
                    unrealizedPnL: position.unrealizedPnL,
                    color: symbol === 'BTC' ? '#f7931a' : '#627eea'
                });
            }
        }
        
        return allocation.sort((a, b) => b.percentage - a.percentage);
    }

    getTradingSignals(predictions, technicalAnalysis) {
        const signals = [];
        
        for (const [symbol, prediction] of Object.entries(predictions)) {
            const signal = this.generateTradingSignal(symbol, prediction, technicalAnalysis[symbol]);
            if (signal) {
                signals.push(signal);
            }
        }
        
        return signals.sort((a, b) => b.confidence - a.confidence);
    }

    generateTradingSignal(symbol, prediction, technical) {
        const currentPrice = prediction.currentPrice;
        const targetPrice = prediction.target;
        const confidence = prediction.confidence;
        
        // Determine signal type
        let signalType = 'HOLD';
        let entry = currentPrice;
        let target = targetPrice;
        let stopLoss = currentPrice;
        
        if (prediction.direction === 'BULLISH' && confidence > 0.7) {
            signalType = 'BUY';
            target = currentPrice * 1.05; // 5% target
            stopLoss = currentPrice * 0.97; // 3% stop loss
        } else if (prediction.direction === 'BEARISH' && confidence > 0.7) {
            signalType = 'SELL';
            target = currentPrice * 0.95; // 5% target
            stopLoss = currentPrice * 1.03; // 3% stop loss
        }
        
        // Calculate risk/reward ratio
        const riskReward = signalType === 'BUY' 
            ? (target - entry) / (entry - stopLoss)
            : (entry - target) / (stopLoss - entry);
        
        // Only return signals with good risk/reward ratio
        if (riskReward >= 1.5) {
            return {
                symbol,
                type: signalType,
                confidence: confidence * 100,
                entry: entry.toFixed(2),
                target: target.toFixed(2),
                stopLoss: stopLoss.toFixed(2),
                riskReward: riskReward.toFixed(2),
                reasoning: this.getSignalReasoning(prediction, technical)
            };
        }
        
        return null;
    }

    getSignalReasoning(prediction, technical) {
        const reasons = [];
        
        if (prediction.confidence > 0.8) {
            reasons.push(`High AI confidence (${(prediction.confidence * 100).toFixed(1)}%)`);
        }
        
        if (technical && technical.rsi) {
            const rsi = technical.rsi[technical.rsi.length - 1];
            if (rsi < 30) {
                reasons.push('RSI oversold');
            } else if (rsi > 70) {
                reasons.push('RSI overbought');
            }
        }
        
        if (technical && technical.macd) {
            const macd = technical.macd;
            const currentHist = macd.histogram[macd.histogram.length - 1];
            const prevHist = macd.histogram[macd.histogram.length - 2];
            
            if (currentHist > 0 && prevHist <= 0) {
                reasons.push('MACD bullish crossover');
            } else if (currentHist < 0 && prevHist >= 0) {
                reasons.push('MACD bearish crossover');
            }
        }
        
        return reasons.join(', ') || 'AI model prediction';
    }

    getPerformanceMetrics() {
        return this.performanceTracker.getMetrics();
    }

    getTradeHistory(limit = 50) {
        return this.trades
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // Watchlist management
    addToWatchlist(symbol) {
        if (!this.watchlist.includes(symbol)) {
            this.watchlist.push(symbol);
            this.saveWatchlist();
        }
    }

    removeFromWatchlist(symbol) {
        const index = this.watchlist.indexOf(symbol);
        if (index > -1) {
            this.watchlist.splice(index, 1);
            this.saveWatchlist();
        }
    }

    getWatchlist() {
        return this.watchlist;
    }
}

class RiskManager {
    constructor() {
        this.maxPositionSize = 0.25; // 25% of portfolio
        this.maxDailyLoss = 0.05; // 5% daily loss limit
        this.maxDrawdown = 0.20; // 20% max drawdown
        this.maxLeverage = 1.0; // No leverage by default
    }

    checkRiskLimits(trade, portfolio) {
        // Check position size limit
        if (!this.checkPositionSize(trade, portfolio)) {
            return false;
        }
        
        // Check daily loss limit
        if (!this.checkDailyLoss(portfolio)) {
            return false;
        }
        
        // Check maximum drawdown
        if (!this.checkMaxDrawdown(portfolio)) {
            return false;
        }
        
        return true;
    }

    checkPositionSize(trade, portfolio) {
        if (trade.type === 'SELL') return true;
        
        const tradeValue = trade.quantity * trade.price;
        const maxPositionValue = portfolio.totalValue * this.maxPositionSize;
        
        const currentPositionValue = portfolio.positions[trade.symbol]?.currentValue || 0;
        const newPositionValue = currentPositionValue + tradeValue;
        
        return newPositionValue <= maxPositionValue;
    }

    checkDailyLoss(portfolio) {
        // This would check daily P&L - simplified for demo
        return portfolio.totalPnLPercent > -this.maxDailyLoss * 100;
    }

    checkMaxDrawdown(portfolio) {
        // This would check maximum drawdown from peak - simplified for demo
        return portfolio.totalPnLPercent > -this.maxDrawdown * 100;
    }

    calculatePositionSize(signal, portfolio, riskPercent = 0.02) {
        const accountValue = portfolio.totalValue;
        const riskAmount = accountValue * riskPercent;
        const entryPrice = signal.entry;
        const stopLoss = signal.stopLoss;
        const riskPerShare = Math.abs(entryPrice - stopLoss);
        
        const positionSize = riskAmount / riskPerShare;
        const maxPositionValue = accountValue * this.maxPositionSize;
        const maxShares = maxPositionValue / entryPrice;
        
        return Math.min(positionSize, maxShares);
    }
}

class PerformanceTracker {
    constructor() {
        this.metrics = {
            totalReturn: 0,
            totalReturnPercent: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            winRate: 0,
            profitFactor: 0,
            averageWin: 0,
            averageLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0
        };
    }

    recordTrade(trade) {
        if (trade.realizedPnL !== undefined) {
            this.updateMetrics(trade);
        }
    }

    updateMetrics(trade) {
        const pnl = trade.realizedPnL;
        
        this.metrics.totalTrades++;
        
        if (pnl > 0) {
            this.metrics.winningTrades++;
            this.metrics.largestWin = Math.max(this.metrics.largestWin, pnl);
        } else if (pnl < 0) {
            this.metrics.losingTrades++;
            this.metrics.largestLoss = Math.min(this.metrics.largestLoss, pnl);
        }
        
        this.metrics.winRate = (this.metrics.winningTrades / this.metrics.totalTrades) * 100;
        
        // Calculate averages
        const totalWinAmount = this.getTotalWinAmount();
        const totalLossAmount = this.getTotalLossAmount();
        
        this.metrics.averageWin = this.metrics.winningTrades > 0 ? totalWinAmount / this.metrics.winningTrades : 0;
        this.metrics.averageLoss = this.metrics.losingTrades > 0 ? totalLossAmount / this.metrics.losingTrades : 0;
        
        // Profit factor
        this.metrics.profitFactor = totalLossAmount !== 0 ? Math.abs(totalWinAmount / totalLossAmount) : 0;
    }

    getTotalWinAmount() {
        // This would sum all winning trades - simplified for demo
        return this.metrics.winningTrades * 100; // Placeholder
    }

    getTotalLossAmount() {
        // This would sum all losing trades - simplified for demo
        return this.metrics.losingTrades * -80; // Placeholder
    }

    getMetrics() {
        return { ...this.metrics };
    }

    calculateSharpeRatio(returns, riskFreeRate = 0.02) {
        if (returns.length < 2) return 0;
        
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        
        return stdDev !== 0 ? (avgReturn - riskFreeRate) / stdDev : 0;
    }

    calculateMaxDrawdown(portfolioHistory) {
        if (portfolioHistory.length < 2) return 0;
        
        let maxDrawdown = 0;
        let peak = portfolioHistory[0];
        
        for (let i = 1; i < portfolioHistory.length; i++) {
            if (portfolioHistory[i] > peak) {
                peak = portfolioHistory[i];
            } else {
                const drawdown = (peak - portfolioHistory[i]) / peak;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
        }
        
        return maxDrawdown * 100;
    }
}

// Export for use in main application
window.PortfolioManager = PortfolioManager;
