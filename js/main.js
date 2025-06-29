class CryptoTradingApp {
    constructor() {
        this.dataFetcher = new DataFetcher();
        this.predictionEngine = new PredictionEngine();
        this.technicalAnalysis = new TechnicalAnalysis();
        this.onChainMetrics = new OnChainMetrics();
        this.portfolioManager = new PortfolioManager();
        
        this.currentCrypto = 'BTC';
        this.currentTimeframe = '1d';
        this.currentModel = 'hybrid-tft';
        this.updateInterval = 30000; // 30 seconds
        this.charts = new Map();
        
        this.config = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            // Show loading overlay
            this.showLoading();
            
            // Load configuration
            await this.loadConfig();
            
            // Initialize all modules
            await this.initializeModules();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize charts
            this.initializeCharts();
            
            // Start real-time updates
            this.startRealTimeUpdates();
            
            // Initial data load
            await this.loadInitialData();
            
            this.isInitialized = true;
            this.hideLoading();
            
            console.log('CryptoTrade Pro initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('./data/config.json');
            this.config = await response.json();
        } catch (error) {
            console.warn('Could not load config, using defaults');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            ui: { updateInterval: 30000, defaultTimeframe: '1d', defaultCrypto: 'BTC' },
            prediction: { defaultModel: 'hybrid-tft', confidenceThreshold: 0.6 },
            trading: { defaultCommission: 0.001 }
        };
    }

    async initializeModules() {
        await this.predictionEngine.initializeModels();
        this.onChainMetrics.startRealTimeUpdates();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
                this.updateActiveNavLink(link);
            });
        });

        // Mobile menu toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Crypto selector
        document.querySelectorAll('.crypto-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentCrypto = btn.dataset.crypto;
                this.updateActiveCryptoBtn(btn);
                this.loadCryptoData();
            });
        });

        // Timeframe selector
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTimeframe = btn.dataset.timeframe;
                this.updateActiveTimeframeBtn(btn);
                this.loadCryptoData();
            });
        });

        // Model tabs
        document.querySelectorAll('.model-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentModel = tab.dataset.model;
                this.updateActiveModelTab(tab);
                this.updatePredictionModel();
            });
        });

        // Research tabs
        document.querySelectorAll('.research-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.showResearchPanel(tab.dataset.tab);
                this.updateActiveResearchTab(tab);
            });
        });

        // Backtest controls
        const runBacktestBtn = document.getElementById('run-backtest');
        if (runBacktestBtn) {
            runBacktestBtn.addEventListener('click', () => {
                this.runBacktest();
            });
        }

        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCharts();
        });

        // On-chain metrics updates
        window.addEventListener('onChainMetricsUpdate', (event) => {
            this.handleOnChainMetricsUpdate(event.detail);
        });
    }

    initializeCharts() {
        // Initialize Chart.js charts
        this.charts.set('btc-mini', this.createMiniChart('btc-mini-chart'));
        this.charts.set('eth-mini', this.createMiniChart('eth-mini-chart'));
        this.charts.set('prediction', this.createPredictionChart('prediction-chart'));
        this.charts.set('features', this.createFeaturesChart('features-chart'));
        this.charts.set('candlestick', this.createCandlestickChart('candlestick-chart'));
        this.charts.set('allocation', this.createAllocationChart('allocation-chart'));
        this.charts.set('correlation', this.createCorrelationChart('correlation-chart'));
        this.charts.set('sentiment', this.createSentimentChart('sentiment-chart'));
        this.charts.set('backtest', this.createBacktestChart('backtest-chart'));
        this.charts.set('risk', this.createRiskChart('risk-chart'));
    }

    createMiniChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                elements: { point: { radius: 0 } }
            }
        });
    }

    createPredictionChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Actual Price',
                        data: [],
                        borderColor: '#ffffff',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: 'Predicted Price',
                        data: [],
                        borderColor: '#00d25b',
                        backgroundColor: 'rgba(0, 210, 91, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                    },
                    {
                        label: 'Confidence Band',
                        data: [],
                        backgroundColor: 'rgba(0, 210, 91, 0.2)',
                        borderWidth: 0,
                        fill: '+1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    },
                    y: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    }
                }
            }
        });
    }

    createFeaturesChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Price Action', 'Volume', 'Technical', 'On-Chain', 'Sentiment', 'Correlation'],
                datasets: [{
                    label: 'Feature Importance',
                    data: [0.25, 0.18, 0.22, 0.15, 0.12, 0.08],
                    backgroundColor: [
                        '#0066cc', '#00d25b', '#ff4757', '#ffa726', 
                        '#9c27b0', '#00bcd4'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { 
                        grid: { display: false },
                        ticks: { color: '#b8bcc8' }
                    },
                    y: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    }
                }
            }
        });
    }

    createCandlestickChart(canvasId) {
        // Simplified candlestick chart using line chart
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Price',
                    data: [],
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    },
                    y: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    }
                }
            }
        });
    }

    createAllocationChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['BTC', 'ETH', 'Cash'],
                datasets: [{
                    data: [45, 35, 20],
                    backgroundColor: ['#f7931a', '#627eea', '#6c757d'],
                    borderWidth: 2,
                    borderColor: '#1a1a2e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });
    }

    createCorrelationChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'BTC-ETH Correlation',
                    data: [],
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    },
                    y: { 
                        min: -1,
                        max: 1,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    }
                }
            }
        });
    }

    createSentimentChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Twitter',
                        data: [],
                        borderColor: '#1da1f2',
                        backgroundColor: 'rgba(29, 161, 242, 0.1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Reddit',
                        data: [],
                        borderColor: '#ff4500',
                        backgroundColor: 'rgba(255, 69, 0, 0.1)',
                        borderWidth: 2
                    },
                    {
                        label: 'News',
                        data: [],
                        borderColor: '#00d25b',
                        backgroundColor: 'rgba(0, 210, 91, 0.1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    },
                    y: { 
                        min: -1,
                        max: 1,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    }
                }
            }
        });
    }

    createBacktestChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Strategy Returns',
                        data: [],
                        borderColor: '#00d25b',
                        backgroundColor: 'rgba(0, 210, 91, 0.1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Benchmark',
                        data: [],
                        borderColor: '#ff4757',
                        backgroundColor: 'rgba(255, 71, 87, 0.1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    },
                    y: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    }
                }
            }
        });
    }

    createRiskChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [],
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    },
                    y: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#b8bcc8' }
                    }
                }
            }
        });
    }

    async loadInitialData() {
        await Promise.all([
            this.loadMarketData(),
            this.loadCryptoData(),
            this.updatePortfolio(),
            this.loadResearchData()
        ]);
    }

    async loadMarketData() {
        try {
            const prices = await this.dataFetcher.getCurrentPrices();
            if (prices) {
                this.updateMarketOverview(prices);
            }
        } catch (error) {
            console.error('Error loading market data:', error);
        }
    }

    async loadCryptoData() {
        try {
            const data = await this.dataFetcher.getCryptoData(this.currentCrypto, this.currentTimeframe);
            
            // Update charts
            this.updateMiniChart(data);
            this.updateCandlestickChart(data);
            
            // Get technical analysis
            const technicalData = await this.technicalAnalysis.analyzeData(data);
            this.updateTechnicalIndicators(technicalData);
            this.updatePatterns(technicalData.patterns);
            
            // Get on-chain metrics
            const onChainData = await this.onChainMetrics.getMetrics(this.currentCrypto);
            this.updateOnChainMetrics(onChainData);
            
            // Get predictions
            await this.updatePredictions(data);
            
        } catch (error) {
            console.error('Error loading crypto data:', error);
        }
    }

    async updatePredictions(data) {
        try {
            const prediction = await this.predictionEngine.predict(
                this.currentCrypto, 
                this.currentTimeframe, 
                data
            );
            
            this.updatePredictionDisplay(prediction);
            this.updatePredictionChart(data, prediction);
            
        } catch (error) {
            console.error('Error updating predictions:', error);
        }
    }

    updateMarketOverview(prices) {
        // Update BTC
        if (prices.BTC) {
            document.getElementById('btc-price').textContent = `$${prices.BTC.price.toLocaleString()}`;
            const changeElement = document.getElementById('btc-change');
            changeElement.textContent = `${prices.BTC.change24h >= 0 ? '+' : ''}${prices.BTC.change24h.toFixed(2)}%`;
            changeElement.className = `crypto-change ${prices.BTC.change24h >= 0 ? 'positive' : 'negative'}`;
            
            document.getElementById('btc-marketcap').textContent = this.formatNumber(prices.BTC.marketCap);
            document.getElementById('btc-volume').textContent = this.formatNumber(prices.BTC.volume24h);
        }
        
        // Update ETH
        if (prices.ETH) {
            document.getElementById('eth-price').textContent = `$${prices.ETH.price.toLocaleString()}`;
            const changeElement = document.getElementById('eth-change');
            changeElement.textContent = `${prices.ETH.change24h >= 0 ? '+' : ''}${prices.ETH.change24h.toFixed(2)}%`;
            changeElement.className = `crypto-change ${prices.ETH.change24h >= 0 ? 'positive' : 'negative'}`;
            
            document.getElementById('eth-marketcap').textContent = this.formatNumber(prices.ETH.marketCap);
            document.getElementById('eth-volume').textContent = this.formatNumber(prices.ETH.volume24h);
        }
    }

    updatePredictionDisplay(prediction) {
        const directionElement = document.getElementById(`${this.currentCrypto.toLowerCase()}-direction`);
        const confidenceElement = document.getElementById(`${this.currentCrypto.toLowerCase()}-confidence`);
        const targetElement = document.getElementById(`${this.currentCrypto.toLowerCase()}-target`);
        
        if (directionElement) {
            directionElement.textContent = prediction.direction;
            directionElement.className = `prediction-direction ${prediction.direction.toLowerCase()}`;
        }
        
        if (confidenceElement) {
            confidenceElement.textContent = `${(prediction.confidence * 100).toFixed(1)}%`;
        }
        
        if (targetElement) {
            targetElement.textContent = `$${prediction.target.toLocaleString()}`;
        }
        
        // Update model performance metrics
        const performance = this.predictionEngine.getModelPerformance(this.currentModel);
        if (performance) {
            document.getElementById('model-accuracy').textContent = `${(performance.accuracy * 100).toFixed(1)}%`;
            document.getElementById('model-mape').textContent = performance.mape.toFixed(3);
            document.getElementById('model-sharpe').textContent = performance.sharpeRatio.toFixed(2);
        }
    }

    updateMiniChart(data) {
        const chartKey = `${this.currentCrypto.toLowerCase()}-mini`;
        const chart = this.charts.get(chartKey);
        
        if (chart && data.prices) {
            const recentPrices = data.prices.slice(-20);
            const labels = recentPrices.map((_, i) => i);
            
            chart.data.labels = labels;
            chart.data.datasets[0].data = recentPrices;
            chart.update('none');
        }
    }

    updatePredictionChart(data, prediction) {
        const chart = this.charts.get('prediction');
        if (!chart) return;
        
        const prices = data.prices.slice(-30);
        const labels = prices.map((_, i) => i);
        
        // Generate prediction data
        const predictionData = [...prices];
        for (let i = 0; i < 7; i++) {
            const trend = prediction.direction === 'BULLISH' ? 1.002 : 0.998;
            predictionData.push(predictionData[predictionData.length - 1] * trend);
        }
        
        chart.data.labels = [...labels, ...Array(7).fill(0).map((_, i) => labels.length + i)];
        chart.data.datasets[0].data = prices;
        chart.data.datasets[1].data = predictionData.slice(-37);
        chart.update();
    }

    updateTechnicalIndicators(technicalData) {
        if (technicalData.indicators.rsi && technicalData.indicators.rsi.length > 0) {
            const rsi = technicalData.indicators.rsi[technicalData.indicators.rsi.length - 1];
            document.getElementById('rsi-value').textContent = rsi.toFixed(1);
            
            let signal = 'NEUTRAL';
            if (rsi < 30) signal = 'BULLISH';
            else if (rsi > 70) signal = 'BEARISH';
            
            const signalElement = document.getElementById('rsi-signal');
            signalElement.textContent = signal;
            signalElement.className = `indicator-signal ${signal.toLowerCase()}`;
        }
        
        if (technicalData.indicators.macd) {
            const macd = technicalData.indicators.macd;
            if (macd.histogram && macd.histogram.length > 0) {
                const hist = macd.histogram[macd.histogram.length - 1];
                document.getElementById('macd-value').textContent = hist > 0 ? `+${hist.toFixed(1)}` : hist.toFixed(1);
                
                const signal = hist > 0 ? 'BULLISH' : 'BEARISH';
                const signalElement = document.getElementById('macd-signal');
                signalElement.textContent = signal;
                signalElement.className = `indicator-signal ${signal.toLowerCase()}`;
            }
        }
    }

    updatePatterns(patterns) {
        const patternsContainer = document.getElementById('patterns-list');
        if (!patternsContainer) return;
        
        patternsContainer.innerHTML = '';
        
        patterns.forEach(pattern => {
            const patternElement = document.createElement('div');
            patternElement.className = 'pattern-item';
            patternElement.innerHTML = `
                <span class="pattern-name">${pattern.name}</span>
                <span class="pattern-confidence">${(pattern.confidence * 100).toFixed(1)}%</span>
            `;
            patternsContainer.appendChild(patternElement);
        });
    }

    updateOnChainMetrics(metrics) {
        const formatted = this.onChainMetrics.formatMetrics(metrics);
        
        // Update displayed metrics based on crypto
        if (this.currentCrypto === 'BTC') {
            if (formatted.sopr) {
                document.getElementById('sopr-value').textContent = formatted.sopr;
            }
            if (formatted.activeAddresses) {
                document.getElementById('active-addresses').textContent = formatted.activeAddresses;
            }
            if (formatted.exchangeFlow) {
                document.getElementById('exchange-flow').textContent = formatted.exchangeFlow;
            }
            if (formatted.longTermHolders) {
                document.getElementById('hodl-waves').textContent = formatted.longTermHolders;
            }
        } else if (this.currentCrypto === 'ETH') {
            if (formatted.gasPriceGwei) {
                document.getElementById('eth-gas').textContent = `${formatted.gasPriceGwei} Gwei`;
            }
        }
    }

    async updatePortfolio() {
        try {
            const prices = await this.dataFetcher.getCurrentPrices();
            if (prices) {
                const portfolio = await this.portfolioManager.updatePortfolioValue(prices);
                this.updatePortfolioDisplay(portfolio);
                this.updateAllocationChart(portfolio);
                this.updateTradingSignals();
            }
        } catch (error) {
            console.error('Error updating portfolio:', error);
        }
    }

    updatePortfolioDisplay(portfolio) {
        // Update portfolio stats (implementation would go here)
        console.log('Portfolio updated:', portfolio);
    }

    updateAllocationChart(portfolio) {
        const chart = this.charts.get('allocation');
        if (!chart) return;
        
        const allocation = this.portfolioManager.getPortfolioAllocation();
        
        chart.data.labels = allocation.map(item => item.symbol);
        chart.data.datasets[0].data = allocation.map(item => item.percentage);
        chart.data.datasets[0].backgroundColor = allocation.map(item => item.color);
        chart.update();
    }

    async updateTradingSignals() {
        // This would generate and display trading signals
        const signals = [
            {
                symbol: 'BTC',
                type: 'BUY',
                confidence: 94.2,
                entry: '65000',
                target: '67500',
                stopLoss: '63000',
                riskReward: '1.25'
            },
            {
                symbol: 'ETH',
                type: 'BUY',
                confidence: 91.8,
                entry: '3300',
                target: '3420',
                stopLoss: '3200',
                riskReward: '1.20'
            }
        ];
        
        this.updateSignalsTable(signals);
    }

    updateSignalsTable(signals) {
        const tbody = document.getElementById('signals-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        signals.forEach(signal => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${signal.symbol}</strong></td>
                <td><span class="signal-${signal.type.toLowerCase()}">${signal.type}</span></td>
                <td>${signal.confidence}%</td>
                <td>$${signal.entry}</td>
                <td>$${signal.target}</td>
                <td>$${signal.stopLoss}</td>
                <td>${signal.riskReward}</td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadResearchData() {
        // Load correlation data
        this.updateCorrelationChart();
        
        // Load sentiment data
        this.updateSentimentChart();
    }

    updateCorrelationChart() {
        const chart = this.charts.get('correlation');
        if (!chart) return;
        
        // Generate sample correlation data
        const labels = Array.from({length: 30}, (_, i) => i);
        const correlationData = labels.map(() => 0.7 + (Math.random() - 0.5) * 0.4);
        
        chart.data.labels = labels;
        chart.data.datasets[0].data = correlationData;
        chart.update();
    }

    updateSentimentChart() {
        const chart = this.charts.get('sentiment');
        if (!chart) return;
        
        // Generate sample sentiment data
        const labels = Array.from({length: 30}, (_, i) => i);
        const twitterData = labels.map(() => (Math.random() - 0.5) * 1.5);
        const redditData = labels.map(() => (Math.random() - 0.5) * 1.2);
        const newsData = labels.map(() => (Math.random() - 0.5) * 1.0);
        
        chart.data.labels = labels;
        chart.data.datasets[0].data = twitterData;
        chart.data.datasets[1].data = redditData;
        chart.data.datasets[2].data = newsData;
        chart.update();
    }

    startRealTimeUpdates() {
        setInterval(async () => {
            if (this.isInitialized) {
                await this.loadMarketData();
                await this.updatePortfolio();
            }
        }, this.updateInterval);
    }

    // UI Helper Methods
    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    updateActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    updateActiveCryptoBtn(activeBtn) {
        document.querySelectorAll('.crypto-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    updateActiveTimeframeBtn(activeBtn) {
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    updateActiveModelTab(activeTab) {
        document.querySelectorAll('.model-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }

    updateActiveResearchTab(activeTab) {
        document.querySelectorAll('.research-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }

    showResearchPanel(panelId) {
        document.querySelectorAll('.research-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const targetPanel = document.getElementById(`${panelId}-panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    }

    updatePredictionModel() {
        this.predictionEngine.setModel(this.currentModel);
        this.loadCryptoData(); // Refresh predictions with new model
    }

    async runBacktest() {
        const strategy = document.getElementById('strategy-select').value;
        const period = document.getElementById('period-select').value;
        
        // Simulate backtest results
        const results = {
            totalReturn: 247.3,
            maxDrawdown: -12.8,
            winRate: 73.2,
            sharpeRatio: 2.84
        };
        
        // Update backtest metrics
        document.querySelector('.backtest-metrics .metric:nth-child(1) .metric-value').textContent = `+${results.totalReturn}%`;
        document.querySelector('.backtest-metrics .metric:nth-child(2) .metric-value').textContent = `${results.maxDrawdown}%`;
        document.querySelector('.backtest-metrics .metric:nth-child(3) .metric-value').textContent = `${results.winRate}%`;
        
        // Update backtest chart
        this.updateBacktestChart(results);
    }

    updateBacktestChart(results) {
        const chart = this.charts.get('backtest');
        if (!chart) return;
        
        // Generate sample backtest data
        const labels = Array.from({length: 100}, (_, i) => i);
        const strategyReturns = labels.map((_, i) => 10000 * (1 + (results.totalReturn / 100) * (i / 100)));
        const benchmarkReturns = labels.map((_, i) => 10000 * (1 + 0.5 * (i / 100)));
        
        chart.data.labels = labels;
        chart.data.datasets[0].data = strategyReturns;
        chart.data.datasets[1].data = benchmarkReturns;
        chart.update();
    }

    resizeCharts() {
        this.charts.forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }

    handleOnChainMetricsUpdate(data) {
        this.updateOnChainMetrics(data.metrics);
    }

    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(message) {
        console.error(message);
        // Could implement a toast notification system here
    }

    formatNumber(num) {
        if (num >= 1e12) {
            return `$${(num / 1e12).toFixed(2)}T`;
        } else if (num >= 1e9) {
            return `$${(num / 1e9).toFixed(2)}B`;
        } else if (num >= 1e6) {
            return `$${(num / 1e6).toFixed(2)}M`;
        } else {
            return `$${num.toLocaleString()}`;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CryptoTradingApp();
});

// Export for potential module usage
window.CryptoTradingApp = CryptoTradingApp;
