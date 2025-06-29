class TechnicalAnalysis {
    constructor() {
        this.indicators = new Map();
        this.patterns = new PatternDetector();
    }

    async analyzeData(data) {
        const analysis = {
            indicators: await this.calculateAllIndicators(data),
            patterns: await this.patterns.detectPatterns(data),
            signals: this.generateSignals(data),
            supportResistance: this.calculateSupportResistance(data.prices)
        };

        return analysis;
    }

    async calculateAllIndicators(data) {
        const { prices, volumes } = data;
        
        return {
            rsi: this.calculateRSI(prices),
            macd: this.calculateMACD(prices),
            bollingerBands: this.calculateBollingerBands(prices),
            stochastic: this.calculateStochastic(prices),
            williams: this.calculateWilliamsR(prices),
            cci: this.calculateCCI(prices),
            atr: this.calculateATR(prices),
            obv: this.calculateOBV(prices, volumes),
            vwap: this.calculateVWAP(prices, volumes),
            ichimoku: this.calculateIchimoku(prices),
            fibonacci: this.calculateFibonacci(prices)
        };
    }

    calculateRSI(prices, period = 14) {
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }
        
        const rsiValues = [];
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        for (let i = period; i < gains.length; i++) {
            const rs = avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));
            rsiValues.push(rsi);
            
            // Update averages using Wilder's smoothing
            avgGain = (avgGain * (period - 1) + gains[i]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        }
        
        return rsiValues;
    }

    calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const fastEMA = this.calculateEMA(prices, fastPeriod);
        const slowEMA = this.calculateEMA(prices, slowPeriod);
        
        const macdLine = [];
        for (let i = slowPeriod - 1; i < fastEMA.length; i++) {
            macdLine.push(fastEMA[i] - slowEMA[i - slowPeriod + fastPeriod]);
        }
        
        const signalLine = this.calculateEMA(macdLine, signalPeriod);
        const histogram = [];
        
        for (let i = signalPeriod - 1; i < macdLine.length; i++) {
            histogram.push(macdLine[i] - signalLine[i - signalPeriod + 1]);
        }
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram: histogram
        };
    }

    calculateEMA(prices, period) {
        const multiplier = 2 / (period + 1);
        const ema = [prices[0]];
        
        for (let i = 1; i < prices.length; i++) {
            ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
        }
        
        return ema;
    }

    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        const sma = this.calculateSMA(prices, period);
        const bands = [];
        
        for (let i = period - 1; i < prices.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            const mean = slice.reduce((a, b) => a + b, 0) / period;
            const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
            const std = Math.sqrt(variance);
            
            bands.push({
                upper: sma[i - period + 1] + (std * stdDev),
                middle: sma[i - period + 1],
                lower: sma[i - period + 1] - (std * stdDev),
                bandwidth: (std * stdDev * 2) / sma[i - period + 1]
            });
        }
        
        return bands;
    }

    calculateSMA(prices, period) {
        const sma = [];
        for (let i = period - 1; i < prices.length; i++) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
        return sma;
    }

    calculateStochastic(prices, period = 14, kSmooth = 3, dSmooth = 3) {
        const stochastic = [];
        
        for (let i = period - 1; i < prices.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            const high = Math.max(...slice);
            const low = Math.min(...slice);
            const current = prices[i];
            
            const k = ((current - low) / (high - low)) * 100;
            stochastic.push({ k, high, low });
        }
        
        // Smooth %K
        const smoothedK = this.calculateSMA(stochastic.map(s => s.k), kSmooth);
        
        // Calculate %D
        const smoothedD = this.calculateSMA(smoothedK, dSmooth);
        
        return {
            k: smoothedK,
            d: smoothedD
        };
    }

    calculateWilliamsR(prices, period = 14) {
        const williamsR = [];
        
        for (let i = period - 1; i < prices.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            const high = Math.max(...slice);
            const low = Math.min(...slice);
            const current = prices[i];
            
            const wr = ((high - current) / (high - low)) * -100;
            williamsR.push(wr);
        }
        
        return williamsR;
    }

    calculateCCI(prices, period = 20) {
        const typicalPrices = prices; // Simplified - would use (H+L+C)/3 with full OHLC data
        const sma = this.calculateSMA(typicalPrices, period);
        const cci = [];
        
        for (let i = period - 1; i < typicalPrices.length; i++) {
            const slice = typicalPrices.slice(i - period + 1, i + 1);
            const mean = sma[i - period + 1];
            const meanDeviation = slice.reduce((sum, price) => sum + Math.abs(price - mean), 0) / period;
            
            const cciValue = (typicalPrices[i] - mean) / (0.015 * meanDeviation);
            cci.push(cciValue);
        }
        
        return cci;
    }

    calculateATR(prices, period = 14) {
        // Simplified ATR calculation using price changes
        const trueRanges = [];
        
        for (let i = 1; i < prices.length; i++) {
            const tr = Math.abs(prices[i] - prices[i - 1]);
            trueRanges.push(tr);
        }
        
        return this.calculateEMA(trueRanges, period);
    }

    calculateOBV(prices, volumes) {
        const obv = [volumes[0]];
        
        for (let i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) {
                obv.push(obv[i - 1] + volumes[i]);
            } else if (prices[i] < prices[i - 1]) {
                obv.push(obv[i - 1] - volumes[i]);
            } else {
                obv.push(obv[i - 1]);
            }
        }
        
        return obv;
    }

    calculateVWAP(prices, volumes) {
        const vwap = [];
        let cumulativeVolume = 0;
        let cumulativePriceVolume = 0;
        
        for (let i = 0; i < prices.length; i++) {
            cumulativeVolume += volumes[i];
            cumulativePriceVolume += prices[i] * volumes[i];
            vwap.push(cumulativePriceVolume / cumulativeVolume);
        }
        
        return vwap;
    }

    calculateIchimoku(prices, tenkanPeriod = 9, kijunPeriod = 26, senkouPeriod = 52) {
        const ichimoku = {
            tenkanSen: [],
            kijunSen: [],
            chikouSpan: [],
            senkouSpanA: [],
            senkouSpanB: []
        };
        
        // Tenkan-sen (Conversion Line)
        for (let i = tenkanPeriod - 1; i < prices.length; i++) {
            const slice = prices.slice(i - tenkanPeriod + 1, i + 1);
            const high = Math.max(...slice);
            const low = Math.min(...slice);
            ichimoku.tenkanSen.push((high + low) / 2);
        }
        
        // Kijun-sen (Base Line)
        for (let i = kijunPeriod - 1; i < prices.length; i++) {
            const slice = prices.slice(i - kijunPeriod + 1, i + 1);
            const high = Math.max(...slice);
            const low = Math.min(...slice);
            ichimoku.kijunSen.push((high + low) / 2);
        }
        
        // Senkou Span A (Leading Span A)
        for (let i = 0; i < ichimoku.tenkanSen.length && i < ichimoku.kijunSen.length; i++) {
            ichimoku.senkouSpanA.push((ichimoku.tenkanSen[i] + ichimoku.kijunSen[i]) / 2);
        }
        
        // Senkou Span B (Leading Span B)
        for (let i = senkouPeriod - 1; i < prices.length; i++) {
            const slice = prices.slice(i - senkouPeriod + 1, i + 1);
            const high = Math.max(...slice);
            const low = Math.min(...slice);
            ichimoku.senkouSpanB.push((high + low) / 2);
        }
        
        // Chikou Span (Lagging Span) - current price shifted back
        ichimoku.chikouSpan = prices.slice(0, -kijunPeriod);
        
        return ichimoku;
    }

    calculateFibonacci(prices) {
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const range = high - low;
        
        return {
            level0: high,
            level236: high - (range * 0.236),
            level382: high - (range * 0.382),
            level50: high - (range * 0.5),
            level618: high - (range * 0.618),
            level786: high - (range * 0.786),
            level100: low,
            level1618: low - (range * 0.618),
            level2618: low - (range * 1.618)
        };
    }

    calculateSupportResistance(prices, period = 20) {
        const levels = [];
        
        for (let i = period; i < prices.length - period; i++) {
            const slice = prices.slice(i - period, i + period + 1);
            const currentPrice = prices[i];
            
            // Check if current price is a local maximum or minimum
            const isMaximum = slice.every(price => price <= currentPrice);
            const isMinimum = slice.every(price => price >= currentPrice);
            
            if (isMaximum) {
                levels.push({ price: currentPrice, type: 'resistance', strength: this.calculateLevelStrength(prices, currentPrice, i) });
            } else if (isMinimum) {
                levels.push({ price: currentPrice, type: 'support', strength: this.calculateLevelStrength(prices, currentPrice, i) });
            }
        }
        
        // Filter and sort by strength
        return levels
            .filter(level => level.strength > 2)
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 10);
    }

    calculateLevelStrength(prices, level, index) {
        let strength = 0;
        const tolerance = level * 0.001; // 0.1% tolerance
        
        for (let i = 0; i < prices.length; i++) {
            if (Math.abs(prices[i] - level) <= tolerance) {
                strength++;
            }
        }
        
        return strength;
    }

    generateSignals(data) {
        const signals = [];
        const indicators = this.calculateAllIndicators(data);
        
        // RSI signals
        if (indicators.rsi.length > 0) {
            const currentRSI = indicators.rsi[indicators.rsi.length - 1];
            if (currentRSI < 30) {
                signals.push({ type: 'BUY', indicator: 'RSI', strength: 'STRONG', reason: 'Oversold condition' });
            } else if (currentRSI > 70) {
                signals.push({ type: 'SELL', indicator: 'RSI', strength: 'STRONG', reason: 'Overbought condition' });
            }
        }
        
        // MACD signals
        if (indicators.macd.histogram.length > 1) {
            const currentHist = indicators.macd.histogram[indicators.macd.histogram.length - 1];
            const prevHist = indicators.macd.histogram[indicators.macd.histogram.length - 2];
            
            if (currentHist > 0 && prevHist <= 0) {
                signals.push({ type: 'BUY', indicator: 'MACD', strength: 'MEDIUM', reason: 'Bullish crossover' });
            } else if (currentHist < 0 && prevHist >= 0) {
                signals.push({ type: 'SELL', indicator: 'MACD', strength: 'MEDIUM', reason: 'Bearish crossover' });
            }
        }
        
        // Bollinger Bands signals
        if (indicators.bollingerBands.length > 0) {
            const currentBB = indicators.bollingerBands[indicators.bollingerBands.length - 1];
            const currentPrice = data.prices[data.prices.length - 1];
            
            if (currentPrice <= currentBB.lower) {
                signals.push({ type: 'BUY', indicator: 'Bollinger Bands', strength: 'MEDIUM', reason: 'Price at lower band' });
            } else if (currentPrice >= currentBB.upper) {
                signals.push({ type: 'SELL', indicator: 'Bollinger Bands', strength: 'MEDIUM', reason: 'Price at upper band' });
            }
        }
        
        return signals;
    }
}

class PatternDetector {
    constructor() {
        this.patterns = [
            'Head and Shoulders',
            'Double Top',
            'Double Bottom',
            'Triangle',
            'Flag',
            'Pennant',
            'Cup and Handle',
            'Falling Wedge',
            'Rising Wedge'
        ];
    }

    async detectPatterns(data) {
        const detectedPatterns = [];
        
        // Simplified pattern detection - in reality would use more sophisticated algorithms
        const prices = data.prices;
        
        // Head and Shoulders detection
        const headShoulders = this.detectHeadAndShoulders(prices);
        if (headShoulders) {
            detectedPatterns.push({
                name: 'Head and Shoulders',
                confidence: headShoulders.confidence,
                direction: 'BEARISH',
                target: headShoulders.target
            });
        }
        
        // Double Top/Bottom detection
        const doublePattern = this.detectDoubleTopBottom(prices);
        if (doublePattern) {
            detectedPatterns.push(doublePattern);
        }
        
        // Triangle pattern detection
        const triangle = this.detectTriangle(prices);
        if (triangle) {
            detectedPatterns.push(triangle);
        }
        
        return detectedPatterns;
    }

    detectHeadAndShoulders(prices) {
        // Simplified head and shoulders detection
        if (prices.length < 20) return null;
        
        const recentPrices = prices.slice(-20);
        const peaks = this.findPeaks(recentPrices);
        
        if (peaks.length >= 3) {
            const [leftShoulder, head, rightShoulder] = peaks.slice(-3);
            
            // Check if head is higher than shoulders
            if (head.value > leftShoulder.value && head.value > rightShoulder.value) {
                // Check if shoulders are approximately equal
                const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value) / leftShoulder.value;
                
                if (shoulderDiff < 0.02) { // 2% tolerance
                    return {
                        confidence: 0.75,
                        target: Math.min(leftShoulder.value, rightShoulder.value)
                    };
                }
            }
        }
        
        return null;
    }

    detectDoubleTopBottom(prices) {
        const peaks = this.findPeaks(prices.slice(-30));
        const troughs = this.findTroughs(prices.slice(-30));
        
        // Double Top
        if (peaks.length >= 2) {
            const [peak1, peak2] = peaks.slice(-2);
            const priceDiff = Math.abs(peak1.value - peak2.value) / peak1.value;
            
            if (priceDiff < 0.02) { // 2% tolerance
                return {
                    name: 'Double Top',
                    confidence: 0.65,
                    direction: 'BEARISH',
                    target: Math.min(peak1.value, peak2.value) * 0.95
                };
            }
        }
        
        // Double Bottom
        if (troughs.length >= 2) {
            const [trough1, trough2] = troughs.slice(-2);
            const priceDiff = Math.abs(trough1.value - trough2.value) / trough1.value;
            
            if (priceDiff < 0.02) { // 2% tolerance
                return {
                    name: 'Double Bottom',
                    confidence: 0.65,
                    direction: 'BULLISH',
                    target: Math.max(trough1.value, trough2.value) * 1.05
                };
            }
        }
        
        return null;
    }

    detectTriangle(prices) {
        if (prices.length < 15) return null;
        
        const recentPrices = prices.slice(-15);
        const peaks = this.findPeaks(recentPrices);
        const troughs = this.findTroughs(recentPrices);
        
        if (peaks.length >= 2 && troughs.length >= 2) {
            // Check for converging trendlines
            const peakSlope = (peaks[peaks.length - 1].value - peaks[0].value) / (peaks[peaks.length - 1].index - peaks[0].index);
            const troughSlope = (troughs[troughs.length - 1].value - troughs[0].value) / (troughs[troughs.length - 1].index - troughs[0].index);
            
            // Ascending triangle
            if (Math.abs(peakSlope) < 0.1 && troughSlope > 0.1) {
                return {
                    name: 'Ascending Triangle',
                    confidence: 0.7,
                    direction: 'BULLISH',
                    target: peaks[0].value * 1.05
                };
            }
            
            // Descending triangle
            if (Math.abs(troughSlope) < 0.1 && peakSlope < -0.1) {
                return {
                    name: 'Descending Triangle',
                    confidence: 0.7,
                    direction: 'BEARISH',
                    target: troughs[0].value * 0.95
                };
            }
            
            // Symmetrical triangle
            if (peakSlope < -0.05 && troughSlope > 0.05) {
                return {
                    name: 'Symmetrical Triangle',
                    confidence: 0.6,
                    direction: 'NEUTRAL',
                    target: (peaks[0].value + troughs[0].value) / 2
                };
            }
        }
        
        return null;
    }

    findPeaks(prices, minDistance = 3) {
        const peaks = [];
        
        for (let i = minDistance; i < prices.length - minDistance; i++) {
            let isPeak = true;
            
            for (let j = i - minDistance; j <= i + minDistance; j++) {
                if (j !== i && prices[j] >= prices[i]) {
                    isPeak = false;
                    break;
                }
            }
            
            if (isPeak) {
                peaks.push({ index: i, value: prices[i] });
            }
        }
        
        return peaks;
    }

    findTroughs(prices, minDistance = 3) {
        const troughs = [];
        
        for (let i = minDistance; i < prices.length - minDistance; i++) {
            let isTrough = true;
            
            for (let j = i - minDistance; j <= i + minDistance; j++) {
                if (j !== i && prices[j] <= prices[i]) {
                    isTrough = false;
                    break;
                }
            }
            
            if (isTrough) {
                troughs.push({ index: i, value: prices[i] });
            }
        }
        
        return troughs;
    }
}

// Export for use in main application
window.TechnicalAnalysis = TechnicalAnalysis;
