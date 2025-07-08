// 全局变量
let salesData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 50;
let sortAscending = true;
let charts = {};

// 错误显示函数
function showError(message) {
    console.error('错误:', message);
    
    // 创建错误提示元素
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        max-width: 400px;
        font-size: 14px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// 页面加载完成后初始化
function initializeApp() {
    loadData();
    initializeEventListeners();
}

// 等待页面和资源完全加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // 如果页面已经加载完成，直接初始化
    initializeApp();
}

// 加载数据
async function loadData() {
    try {
        console.log('开始加载数据...');
        
        // 加载销售数据
        const response = await fetch('sales_data.json');
        if (!response.ok) {
            throw new Error(`销售数据加载失败: ${response.status}`);
        }
        salesData = await response.json();
        console.log('销售数据加载成功，记录数:', salesData.length);
        
        // 加载统计数据
        const statsResponse = await fetch('stats.json');
        if (!statsResponse.ok) {
            throw new Error(`统计数据加载失败: ${statsResponse.status}`);
        }
        const stats = await statsResponse.json();
        console.log('统计数据加载成功');
        
        // 更新指标卡片
        updateMetrics(stats);
        
        // 初始化筛选器
        initializeFilters();
        
        // 设置初始过滤数据
        filteredData = [...salesData];
        
        // 创建AI分析
        console.log('开始创建AI分析...');
        createAIAnalysis();
        
        // 渲染表格
        console.log('开始渲染表格...');
        renderTable();
        
        console.log('数据加载和初始化完成');
        
    } catch (error) {
        console.error('数据加载失败:', error);
        showError(`数据加载失败: ${error.message}`);
    }
}

// 更新指标卡片
function updateMetrics(stats) {
    console.log('更新指标卡片，数据:', stats);
    
    // 检查DOM元素是否存在
    const totalRecordsEl = document.getElementById('total-records');
    const totalStoresEl = document.getElementById('total-stores');
    const actualSalesEl = document.getElementById('actual-sales');
    const predictedSalesEl = document.getElementById('predicted-sales');
    
    if (totalRecordsEl) totalRecordsEl.textContent = stats.total_records.toLocaleString();
    if (totalStoresEl) totalStoresEl.textContent = stats.unique_stores;
    if (actualSalesEl) actualSalesEl.textContent = stats.total_actual_sales;
    if (predictedSalesEl) predictedSalesEl.textContent = stats.total_predicted_sales.toFixed(2);
}

// 初始化筛选器
function initializeFilters() {
    const dateFilter = document.getElementById('dateFilter');
    const storeFilter = document.getElementById('storeFilter');
    
    // 获取唯一日期
    const uniqueDates = [...new Set(salesData.map(item => item['成交日期']))].sort();
    uniqueDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        dateFilter.appendChild(option);
    });
    
    // 获取唯一门店
    const uniqueStores = [...new Set(salesData.map(item => item['门店']))].sort();
    uniqueStores.forEach(store => {
        const option = document.createElement('option');
        option.value = store;
        option.textContent = store;
        storeFilter.appendChild(option);
    });
}

// 创建AI分析
function createAIAnalysis() {
    try {
        updatePredictionAnalysis();
        updateComparisonAnalysis();
        updateTimeAnalysis();
        updateStoreAnalysis();
        updatePriceAnalysis();
        updateModelInsights();
        updateBusinessInsights();
    } catch (error) {
        console.error('AI分析创建失败:', error);
        showError('AI分析加载失败，请刷新页面重试');
    }
}

// 更新预测分析
function updatePredictionAnalysis() {
    // 计算准确性数据
    const actualSalesData = salesData.filter(item => item['成交量'] > 0);
    const accuracyData = actualSalesData.map(item => {
        const actual = item['成交量'];
        const predicted = item['预测成交量'];
        const accuracy = Math.max(0, 100 - Math.abs(actual - predicted) / actual * 100);
        return Math.min(100, accuracy);
    });
    
    const highAccuracy = accuracyData.filter(acc => acc >= 80).length;
    const mediumAccuracy = accuracyData.filter(acc => acc >= 60 && acc < 80).length;
    const lowAccuracy = accuracyData.filter(acc => acc < 60).length;
    const avgAccuracy = accuracyData.reduce((sum, acc) => sum + acc, 0) / accuracyData.length;
    
    // 更新DOM元素
    updateElement('high-accuracy-count', `${highAccuracy}条`);
    updateElement('medium-accuracy-count', `${mediumAccuracy}条`);
    updateElement('low-accuracy-count', `${lowAccuracy}条`);
    updateElement('avg-accuracy', `${avgAccuracy.toFixed(1)}%`);
    
    // 生成洞察
    let insight = '';
    if (avgAccuracy >= 80) {
        insight = '🎯 AI预测模型表现优异，平均准确度超过80%，说明算法能够很好地捕捉销量规律。';
    } else if (avgAccuracy >= 60) {
        insight = '📊 AI预测模型表现良好，平均准确度在60-80%之间，建议继续优化特征工程。';
    } else {
        insight = '⚠️ AI预测模型需要优化，建议增加更多特征变量或调整算法参数。';
    }
    
    updateElement('accuracy-insight', insight);
}

// 更新对比分析
function updateComparisonAnalysis() {
    const totalActual = salesData.reduce((sum, item) => sum + item['成交量'], 0);
    const totalPredicted = salesData.reduce((sum, item) => sum + item['预测成交量'], 0);
    const actualRecords = salesData.filter(item => item['成交量'] > 0).length;
    const totalRecords = salesData.length;
    const coverage = (actualRecords / totalRecords * 100).toFixed(1);
    const bias = ((totalPredicted - totalActual) / totalActual * 100).toFixed(1);
    
    updateElement('actual-total', totalActual);
    updateElement('predicted-total', totalPredicted.toFixed(2));
    updateElement('prediction-coverage', `${coverage}%`);
    updateElement('prediction-bias', `${bias}%`);
    
    let insight = '';
    if (Math.abs(bias) < 10) {
        insight = '✅ 预测总量与实际总量偏差较小，模型整体预测能力良好。';
    } else if (bias > 0) {
        insight = '📈 预测总量偏高，模型可能过于乐观，建议调整预测参数。';
    } else {
        insight = '📉 预测总量偏低，模型可能过于保守，建议增加预测敏感度。';
    }
    
    updateElement('comparison-insight', insight);
}

// 工具函数：安全更新DOM元素
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// 时间维度分析
function updateTimeAnalysis() {
    // 按日期聚合数据
    const dailyData = {};
    salesData.forEach(item => {
        const date = item['成交日期'];
        if (!dailyData[date]) {
            dailyData[date] = { actual: 0, predicted: 0 };
        }
        dailyData[date].actual += item['成交量'];
        dailyData[date].predicted += item['预测成交量'];
    });
    
    const dates = Object.keys(dailyData).sort();
    const dailySales = dates.map(date => dailyData[date].actual);
    const peakSalesIndex = dailySales.indexOf(Math.max(...dailySales));
    const peakDate = dates[peakSalesIndex];
    const avgDailySales = (dailySales.reduce((sum, sales) => sum + sales, 0) / dates.length).toFixed(1);
    
    // 计算周末销量提升
    const weekendSales = [];
    const weekdaySales = [];
    
    dates.forEach(date => {
        const dayOfWeek = new Date(date).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // 周末
            weekendSales.push(dailyData[date].actual);
        } else {
            weekdaySales.push(dailyData[date].actual);
        }
    });
    
    const avgWeekendSales = weekendSales.reduce((sum, sales) => sum + sales, 0) / weekendSales.length;
    const avgWeekdaySales = weekdaySales.reduce((sum, sales) => sum + sales, 0) / weekdaySales.length;
    const weekendBoost = ((avgWeekendSales - avgWeekdaySales) / avgWeekdaySales * 100).toFixed(1);
    
    updateElement('peak-sales-date', peakDate);
    updateElement('avg-daily-sales', avgDailySales);
    updateElement('weekend-boost', `${weekendBoost}%`);
    
    let insight = '';
    if (weekendBoost > 20) {
        insight = '🎉 周末销量显著提升，建议在周末加大营销力度和库存准备。';
    } else if (weekendBoost > 0) {
        insight = '📅 周末销量略有提升，可考虑周末促销活动。';
    } else {
        insight = '💼 工作日销量更佳，建议重点关注工作日的销售策略。';
    }
    
    updateElement('time-insight', insight);
}

// 门店维度分析
function updateStoreAnalysis() {
    // 按门店聚合数据
    const storeData = {};
    salesData.forEach(item => {
        const store = item['门店'];
        if (!storeData[store]) {
            storeData[store] = { actual: 0, predicted: 0, count: 0 };
        }
        storeData[store].actual += item['成交量'];
        storeData[store].predicted += item['预测成交量'];
        storeData[store].count += 1;
    });
    
    // 找出最佳表现门店
    const storePerformance = Object.entries(storeData).map(([store, data]) => ({
        store,
        totalSales: data.actual,
        avgSales: data.actual / data.count
    })).sort((a, b) => b.totalSales - a.totalSales);
    
    const topStore = storePerformance[0].store;
    
    // 计算万达和吾悦门店平均销量（仅实际成交量）
    const wandaStores = Object.entries(storeData).filter(([store]) => store.includes('万达'));
    const wuyueStores = Object.entries(storeData).filter(([store]) => store.includes('吾悦'));
    
    const wandaAvg = wandaStores.length > 0 ? 
        (wandaStores.reduce((sum, [, data]) => sum + data.actual, 0) / wandaStores.length).toFixed(1) : '0';
    const wuyueAvg = wuyueStores.length > 0 ? 
        (wuyueStores.reduce((sum, [, data]) => sum + data.actual, 0) / wuyueStores.length).toFixed(1) : '0';
    
    console.log('万达门店:', wandaStores.map(([store, data]) => `${store}: ${data.actual}件`));
    console.log('吾悦门店:', wuyueStores.map(([store, data]) => `${store}: ${data.actual}件`));
    console.log('万达平均:', wandaAvg, '吾悦平均:', wuyueAvg);
    
    updateElement('top-performing-store', topStore);
    updateElement('wanda-avg-sales', wandaAvg);
    updateElement('wuyue-avg-sales', wuyueAvg);
    
    let insight = '';
    const topStoreInfo = topStore.includes('万达') ? '万达' : topStore.includes('吾悦') ? '吾悦' : '其他';
    
    if (parseFloat(wandaAvg) > parseFloat(wuyueAvg)) {
        insight = `🏢 万达门店平均表现更佳(${wandaAvg}件)，建议优先在万达商场开设新店。最佳单店${topStore}属于${topStoreInfo}商场类型。`;
    } else if (parseFloat(wuyueAvg) > parseFloat(wandaAvg)) {
        insight = `🏪 吾悦门店平均表现更佳(${wuyueAvg}件)，建议重点关注吾悦商场的运营策略。最佳单店${topStore}属于${topStoreInfo}商场类型。`;
    } else {
        insight = `⚖️ 万达和吾悦门店平均表现相当，建议针对不同商场制定差异化策略。最佳单店${topStore}属于${topStoreInfo}商场类型。`;
    }
    
    updateElement('store-insight', insight);
}

// 价格维度分析
function updatePriceAnalysis() {
    // 按价格区间分析
    const priceRanges = {
        '低价位(≤200)': { sales: 0, count: 0 },
        '中价位(200-300)': { sales: 0, count: 0 },
        '高价位(≥300)': { sales: 0, count: 0 }
    };
    
    salesData.forEach(item => {
        const price = item['成交单价'];
        const sales = item['成交量'];
        
        if (price <= 200) {
            priceRanges['低价位(≤200)'].sales += sales;
            priceRanges['低价位(≤200)'].count += 1;
        } else if (price <= 300) {
            priceRanges['中价位(200-300)'].sales += sales;
            priceRanges['中价位(200-300)'].count += 1;
        } else {
            priceRanges['高价位(≥300)'].sales += sales;
            priceRanges['高价位(≥300)'].count += 1;
        }
    });
    
    // 找出最优价格区间
    const bestRange = Object.entries(priceRanges).reduce((best, [range, data]) => 
        data.sales > best.sales ? { range, sales: data.sales } : best, 
        { range: '', sales: 0 }
    );
    
    // 计算价格敏感度
    const actualSalesData = salesData.filter(item => item['成交量'] > 0);
    const highPriceItems = actualSalesData.filter(item => item['成交单价'] >= 300);
    const highPriceRate = (highPriceItems.length / actualSalesData.length * 100).toFixed(1);
    
    updateElement('optimal-price-range', bestRange.range);
    updateElement('price-sensitivity', '中等');
    updateElement('high-price-rate', `${highPriceRate}%`);
    
    let insight = '';
    if (bestRange.range === '高价位(≥300)') {
        insight = '💎 高价位商品销量最佳，建议推出更多高端产品线。';
    } else if (bestRange.range === '中价位(200-300)') {
        insight = '🎯 中价位商品最受欢迎，建议保持主力产品价格区间。';
    } else {
        insight = '💰 低价位商品销量领先，建议关注性价比策略。';
    }
    
    updateElement('price-insight', insight);
}

// AI模型洞察
function updateModelInsights() {
    // 计算模型置信度
    const actualSalesData = salesData.filter(item => item['成交量'] > 0);
    const accuracyData = actualSalesData.map(item => {
        const actual = item['成交量'];
        const predicted = item['预测成交量'];
        const accuracy = Math.max(0, 100 - Math.abs(actual - predicted) / actual * 100);
        return Math.min(100, accuracy);
    });
    
    const avgAccuracy = accuracyData.reduce((sum, acc) => sum + acc, 0) / accuracyData.length;
    const confidence = (avgAccuracy / 100 * 95).toFixed(1); // 转换为置信度
    
    // 异常检测
    const anomalies = salesData.filter(item => {
        if (item['成交量'] === 0) return false;
        const ratio = item['预测成交量'] / item['成交量'];
        return ratio > 3 || ratio < 0.3; // 预测值与实际值差异过大
    });
    
    updateElement('model-confidence', `${confidence}%`);
    updateElement('anomaly-detection', `${anomalies.length}个`);
    updateElement('prediction-stability', '良好');
    
    let insight = '';
    if (confidence > 85) {
        insight = '🚀 AI模型表现优异，预测结果高度可信，可用于重要决策支持。';
    } else if (confidence > 70) {
        insight = '📊 AI模型表现良好，预测结果可作为参考，建议持续优化。';
    } else {
        insight = '🔧 AI模型需要改进，建议增加训练数据或调整算法参数。';
    }
    
    updateElement('model-insight', insight);
}

// 商业洞察
function updateBusinessInsights() {
    // 增长机会分析
    const totalPredicted = salesData.reduce((sum, item) => sum + item['预测成交量'], 0);
    const totalActual = salesData.reduce((sum, item) => sum + item['成交量'], 0);
    const growthPotential = totalPredicted - totalActual;
    
    let growthOpportunity = '';
    if (growthPotential > 200) {
        growthOpportunity = '预测显示还有很大增长空间，建议加大营销投入和库存准备。';
    } else if (growthPotential > 100) {
        growthOpportunity = '存在适度增长机会，建议优化产品组合和销售策略。';
    } else {
        growthOpportunity = '当前销量接近预测上限，建议开拓新市场或推出新产品。';
    }
    
    // 风险预警
    const zeroSalesRate = (salesData.filter(item => item['成交量'] === 0).length / salesData.length * 100).toFixed(1);
    let riskWarning = '';
    if (zeroSalesRate > 80) {
        riskWarning = '大量商品零销量，需要重新评估产品定位和市场策略。';
    } else if (zeroSalesRate > 60) {
        riskWarning = '部分商品销量不佳，建议调整库存结构和促销策略。';
    } else {
        riskWarning = '整体销售状况良好，继续保持现有策略。';
    }
    
    // 优化建议
    const optimizationSuggestion = '建议重点关注周末营销、优化门店布局、完善价格策略。';
    
    updateElement('growth-opportunity', growthOpportunity);
    updateElement('risk-warning', riskWarning);
    updateElement('optimization-suggestion', optimizationSuggestion);
}



// 初始化事件监听器
function initializeEventListeners() {
    // 筛选器事件
    document.getElementById('dateFilter').addEventListener('change', applyFilters);
    document.getElementById('storeFilter').addEventListener('change', applyFilters);
    document.getElementById('salesFilter').addEventListener('change', applyFilters);
    
    // 搜索事件
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    
    // 排序事件
    document.getElementById('sortBy').addEventListener('change', applySorting);
    document.getElementById('sortOrder').addEventListener('click', toggleSortOrder);
    
    // 分页事件
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
    
    // 导航平滑滚动
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// 应用筛选器
function applyFilters() {
    const dateFilter = document.getElementById('dateFilter').value;
    const storeFilter = document.getElementById('storeFilter').value;
    const salesFilter = document.getElementById('salesFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredData = salesData.filter(item => {
        // 日期筛选
        if (dateFilter !== 'all' && item['成交日期'] !== dateFilter) {
            return false;
        }
        
        // 门店筛选
        if (storeFilter !== 'all' && item['门店'] !== storeFilter) {
            return false;
        }
        
        // 成交量筛选
        if (salesFilter === 'actual' && item['成交量'] === 0) {
            return false;
        }
        if (salesFilter === 'predicted' && item['成交量'] > 0) {
            return false;
        }
        
        // 搜索筛选
        if (searchTerm && !item['门店'].toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        return true;
    });
    
    currentPage = 1;
    applySorting();
    renderTable();
    updateAIAnalysis();
}

// 应用排序
function applySorting() {
    const sortBy = document.getElementById('sortBy').value;
    
    filteredData.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortBy) {
            case 'date':
                valueA = a['成交日期'];
                valueB = b['成交日期'];
                break;
            case 'store':
                valueA = a['门店'];
                valueB = b['门店'];
                break;
            case 'actual':
                valueA = a['成交量'];
                valueB = b['成交量'];
                break;
            case 'predicted':
                valueA = a['预测成交量'];
                valueB = b['预测成交量'];
                break;
            case 'price':
                valueA = a['成交单价'];
                valueB = b['成交单价'];
                break;
            default:
                return 0;
        }
        
        if (typeof valueA === 'string') {
            return sortAscending ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        } else {
            return sortAscending ? valueA - valueB : valueB - valueA;
        }
    });
    
    renderTable();
}

// 切换排序顺序
function toggleSortOrder() {
    sortAscending = !sortAscending;
    const icon = document.querySelector('#sortOrder i');
    icon.className = sortAscending ? 'fas fa-sort-amount-down' : 'fas fa-sort-amount-up';
    applySorting();
}

// 渲染表格
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    tableBody.innerHTML = '';
    
    pageData.forEach(item => {
        const row = document.createElement('tr');
        
        // 计算预测准确度
        let accuracy = '-';
        let accuracyClass = '';
        if (item['成交量'] > 0) {
            const acc = Math.max(0, 100 - Math.abs(item['成交量'] - item['预测成交量']) / item['成交量'] * 100);
            accuracy = `${Math.min(100, acc).toFixed(1)}%`;
            if (acc >= 80) accuracyClass = 'accuracy-high';
            else if (acc >= 60) accuracyClass = 'accuracy-medium';
            else accuracyClass = 'accuracy-low';
        }
        
        // 状态标识
        const status = item['成交量'] > 0 ? 
            '<span class="status-badge status-actual">实际成交</span>' : 
            '<span class="status-badge status-predicted">仅预测</span>';
        
        row.innerHTML = `
            <td>${item['成交日期']}</td>
            <td>${item['门店']}</td>
            <td>¥${item['成交单价'].toFixed(2)}</td>
            <td>${item['成交量']}</td>
            <td>${item['预测成交量'].toFixed(2)}</td>
            <td class="${accuracyClass}">${accuracy}</td>
            <td>${status}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    updatePagination();
}

// 更新分页
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// 切换页面
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTable();
    }
}

// 更新AI分析
function updateAIAnalysis() {
    // 重新计算并更新AI分析
    updateTimeAnalysis();
    updateStoreAnalysis();
    updatePriceAnalysis();
    updateModelInsights();
    updateBusinessInsights();
}

