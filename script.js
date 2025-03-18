// 配置
let API_KEY = localStorage.getItem('apiKey') || '';
const API_URL = 'http://localhost:3000/api/analyze';

// DOM 元素
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const cameraBtn = document.getElementById('camera-btn');
const previewArea = document.getElementById('preview-area');
const previewImage = document.getElementById('preview-image');
const analyzeBtn = document.getElementById('analyze-btn');
const resultArea = document.getElementById('result-area');
const analysisResult = document.getElementById('analysis-result');
const historyList = document.getElementById('history-list');
const dateFilter = document.getElementById('date-filter');
const foodTypeChart = document.getElementById('food-type-chart');
const nutritionChart = document.getElementById('nutrition-chart');
const aiSuggestions = document.getElementById('ai-suggestions');
const apiKeyInput = document.getElementById('apiKey');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const apiKeyReminder = document.getElementById('apiKeyReminder');
const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));

// 分页相关变量
let currentPage = 1;
const pageSize = document.getElementById('page-size');
const totalItems = document.getElementById('total-items');
const pagination = document.getElementById('pagination');

// 检查API Key
function checkApiKey() {
    API_KEY = localStorage.getItem('apiKey') || '';
    if (!API_KEY) {
        apiKeyReminder.style.display = 'block';
        analyzeBtn.disabled = true;
    } else {
        apiKeyReminder.style.display = 'none';
        analyzeBtn.disabled = false;
        if (apiKeyInput) {
            apiKeyInput.value = API_KEY;
        }
    }
}

// 页面加载时检查API Key
document.addEventListener('DOMContentLoaded', checkApiKey);

// 切换API Key显示/隐藏
if (toggleApiKeyBtn) {
    toggleApiKeyBtn.addEventListener('click', () => {
        const type = apiKeyInput.type;
        apiKeyInput.type = type === 'password' ? 'text' : 'password';
        toggleApiKeyBtn.innerHTML = `<i class="fas fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
    });
}

// 保存API Key
if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            alert('请输入API Key');
            return;
        }

        // 保存到localStorage
        localStorage.setItem('apiKey', apiKey);
        API_KEY = apiKey;
        
        // 更新UI状态
        checkApiKey();
        
        // 关闭模态框
        settingsModal.hide();
        
        // 显示成功消息
        alert('API Key 已保存');
    });
}

// 页面切换
document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = e.currentTarget.getAttribute('data-page');
        if (!targetPage) return;

        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('d-none');
        });
        const targetElement = document.getElementById(`${targetPage}-page`);
        if (targetElement) {
            targetElement.classList.remove('d-none');
        }

        // 更新导航栏激活状态
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        e.currentTarget.classList.add('active');

        if (targetPage === 'history') {
            loadHistory();
        } else if (targetPage === 'overview') {
            loadOverview();
        }
    });
});

// 文件上传
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleFileSelect);

cameraBtn.addEventListener('click', () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                video.onloadeddata = () => {
                    canvas.getContext('2d').drawImage(video, 0, 0);
                    stream.getTracks().forEach(track => track.stop());
                    
                    canvas.toBlob(blob => {
                        const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' });
                        handleFile(file);
                    }, 'image/jpeg');
                };
            })
            .catch(err => {
                alert('无法访问摄像头：' + err.message);
            });
    } else {
        alert('您的浏览器不支持摄像头功能');
    }
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewArea.classList.remove('d-none');
        resultArea.classList.add('d-none');
    };
    reader.readAsDataURL(file);
}

// 图片分析
analyzeBtn.addEventListener('click', async () => {
    const loading = document.createElement('div');
    loading.className = 'loading';
    analyzeBtn.appendChild(loading);
    analyzeBtn.disabled = true;

    try {
        // 获取base64图片数据
        const base64Image = previewImage.src.split(',')[1];
        if (!base64Image) {
            throw new Error('无法获取图片数据');
        }

        console.log('准备发送图片数据，长度:', base64Image.length);
        const response = await analyzeImage(base64Image);
        
        // 保存到本地存储
        saveToHistory(response);
        
        // 显示结果
        displayAnalysisResult(response);
        resultArea.classList.remove('d-none');
    } catch (error) {
        console.error('分析错误:', error);
        alert('分析失败：' + error.message);
    } finally {
        analyzeBtn.removeChild(loading);
        analyzeBtn.disabled = false;
    }
});

async function analyzeImage(base64Image) {
    const apiKey = localStorage.getItem('apiKey');
    
    if (!apiKey) {
        throw new Error('请先设置API Key');
    }

    try {
        // 第一步：使用qwen-vl-max-latest分析图片
        const imageAnalysisResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                apiKey: apiKey,
                data: {
                    model: 'qwen-vl-max-latest',
                    input: {
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        image: base64Image
                                    },
                                    {
                                        text: '请分析这张食物图片，提供以下信息：1. 食物名称 2. 主要营养成分 3. 卡路里含量（估算）4. 健康建议'
                                    }
                                ]
                            }
                        ]
                    }
                }
            })
        });

        if (!imageAnalysisResponse.ok) {
            const errorText = await imageAnalysisResponse.text();
            console.error('图片分析API响应:', errorText);
            throw new Error(`图片分析API请求失败: ${imageAnalysisResponse.status}`);
        }

        let imageData;
        try {
            imageData = await imageAnalysisResponse.json();
        } catch (error) {
            console.error('解析图片分析响应错误:', error);
            throw new Error('无法解析服务器响应');
        }

        if (!imageData?.output?.text) {
            throw new Error('服务器返回的数据格式不正确');
        }

        const imageAnalysisText = imageData.output.text;

        // 第二步：使用qwen-max进行结构化处理
        const structuredResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                apiKey: apiKey,
                data: {
                    model: 'qwen-max',
                    input: {
                        messages: [
                            {
                                role: 'system',
                                content: `将食物分析结果转换为JSON格式，包含以下字段：
                                {
                                    "food": {
                                        "name": "食物名称",
                                        "nutrition": "主要营养成分",
                                        "calories": "卡路里含量",
                                        "advice": "健康建议"
                                    }
                                }`
                            },
                            {
                                role: 'user',
                                content: imageAnalysisText
                            }
                        ],
                        response_format: {
                            type: "json_object"
                        }
                    }
                }
            })
        });

        if (!structuredResponse.ok) {
            const errorText = await structuredResponse.text();
            console.error('结构化处理API响应:', errorText);
            throw new Error(`结构化处理API请求失败: ${structuredResponse.status}`);
        }

        let structuredData;
        try {
            structuredData = await structuredResponse.json();
            if (!structuredData?.output?.text) {
                throw new Error('服务器返回的数据格式不正确');
            }
            return JSON.parse(structuredData.output.text);
        } catch (error) {
            console.error('解析结构化响应错误:', error);
            throw new Error('无法解析服务器响应');
        }
    } catch (error) {
        console.error('API调用错误:', error);
        throw error;
    }
}

// 本地存储
function saveToHistory(analysis) {
    const history = JSON.parse(localStorage.getItem('foodHistory') || '[]');
    history.push({
        date: new Date().toISOString(),
        analysis: analysis
    });
    localStorage.setItem('foodHistory', JSON.stringify(history));
}

// 配置marked
marked.setOptions({
    highlight: function(code, lang) {
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

// 显示分析结果
function displayAnalysisResult(result) {
    if (!result || !result.food) {
        analysisResult.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> 无法解析分析结果
            </div>
        `;
        return;
    }

    const foodData = result.food;
    
    // 将结果格式化为Markdown
    const markdownResult = `
## 分析结果

### 🍽️ 食物名称
${foodData.name || '未识别'}

### 🥗 主要营养成分
${foodData.nutrition || '未识别'}

### 🔥 卡路里含量
${foodData.calories || '未识别'}

### ❤️ 健康建议
${foodData.advice || '未提供建议'}
`;

    analysisResult.innerHTML = marked.parse(markdownResult);
}

// 加载历史记录
function loadHistory() {
    if (!historyList) return;

    const history = JSON.parse(localStorage.getItem('foodHistory') || '[]');
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> 暂无历史记录
            </div>
        `;
        totalItems.textContent = '0';
        pagination.innerHTML = '';
        return;
    }

    // 获取当前选中的时间范围
    const activePeriod = document.querySelector('.btn-group .active')?.dataset.period || 'day';
    const filterDate = dateFilter ? dateFilter.value : '';
    
    // 根据时间范围过滤数据
    let filteredHistory = filterHistoryByPeriod(history, activePeriod, filterDate);
    
    // 按日期分组
    const groupedHistory = groupHistoryByDate(filteredHistory);
    
    // 显示历史记录
    displayGroupedHistory(groupedHistory);
}

// 根据时间范围过滤历史记录
function filterHistoryByPeriod(history, period, filterDate) {
    if (filterDate) {
        return history.filter(item => item.date.startsWith(filterDate));
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
        case 'day':
            return history.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= today;
            });
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return history.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= weekStart;
            });
        case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return history.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= monthStart;
            });
        case 'all':
        default:
            return history;
    }
}

// 按日期分组历史记录
function groupHistoryByDate(history) {
    const groups = {};
    history.forEach(item => {
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        
        if (!groups[dateStr]) {
            groups[dateStr] = [];
        }
        groups[dateStr].push(item);
    });
    
    return groups;
}

// 显示分组后的历史记录
function displayGroupedHistory(groups) {
    if (Object.keys(groups).length === 0) {
        historyList.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> 所选时间范围内暂无记录
            </div>
        `;
        totalItems.textContent = '0';
        pagination.innerHTML = '';
        return;
    }

    // 将分组数据转换为数组并排序
    const sortedGroups = Object.entries(groups)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));

    // 计算分页
    const pageCount = Math.ceil(sortedGroups.length / parseInt(pageSize.value));
    const start = (currentPage - 1) * parseInt(pageSize.value);
    const end = start + parseInt(pageSize.value);
    const currentGroups = sortedGroups.slice(start, end);

    // 显示当前页的记录
    historyList.innerHTML = currentGroups
        .map(([date, items]) => `
            <div class="card mb-4">
                <div class="card-header bg-light">
                    <h6 class="mb-0">
                        <i class="fas fa-calendar-day"></i> ${date}
                    </h6>
                </div>
                <div class="card-body">
                    ${items.map(item => formatHistoryItem(item)).join('')}
                </div>
            </div>
        `).join('');

    // 更新总记录数
    totalItems.textContent = sortedGroups.length;

    // 生成分页按钮
    generatePagination(pageCount);

    // 添加删除事件监听
    document.querySelectorAll('.delete-history').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const date = e.currentTarget.dataset.date;
            if (date) {
                deleteHistoryItem(date);
            }
        });
    });
}

// 格式化历史记录项
function formatHistoryItem(item) {
    if (!item || !item.analysis || !item.analysis.food) {
        return '';
    }

    const food = item.analysis.food;
    const time = new Date(item.date).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        <div class="card mb-2 history-item">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <h6 class="card-title mb-1">
                        <i class="fas fa-utensils"></i> ${food.name || '未知食物'}
                    </h6>
                    <div>
                        <small class="text-muted me-2">
                            <i class="fas fa-clock"></i> ${time}
                        </small>
                        <button class="btn btn-sm btn-outline-danger delete-history" data-date="${item.date}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-text">
                    <p class="mb-1"><strong>营养成分：</strong>${food.nutrition || '未识别'}</p>
                    <p class="mb-1"><strong>卡路里：</strong>${food.calories || '未识别'}</p>
                    <p class="mb-0"><strong>健康建议：</strong>${food.advice || '未提供建议'}</p>
                </div>
            </div>
        </div>
    `;
}

// 初始化时间范围按钮事件
document.querySelectorAll('.btn-group .btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // 更新按钮状态
        document.querySelectorAll('.btn-group .btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 重新加载历史记录
        loadHistory();
    });
});

function deleteHistoryItem(date) {
    const history = JSON.parse(localStorage.getItem('foodHistory') || '[]');
    const newHistory = history.filter(item => item.date !== date);
    localStorage.setItem('foodHistory', JSON.stringify(newHistory));
    loadHistory();
}

// 生成分页按钮
function generatePagination(pageCount) {
    if (pageCount <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHtml = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;

    for (let i = 1; i <= pageCount; i++) {
        if (
            i === 1 || // 第一页
            i === pageCount || // 最后一页
            (i >= currentPage - 1 && i <= currentPage + 1) // 当前页的前后一页
        ) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        } else if (
            i === currentPage - 2 || // 当前页的前两页
            i === currentPage + 2 // 当前页的后两页
        ) {
            paginationHtml += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }

    paginationHtml += `
        <li class="page-item ${currentPage === pageCount ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    pagination.innerHTML = paginationHtml;

    // 添加分页事件监听
    document.querySelectorAll('.page-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const newPage = parseInt(e.currentTarget.dataset.page);
            if (newPage >= 1 && newPage <= pageCount) {
                currentPage = newPage;
                loadHistory();
            }
        });
    });
}

// 每页显示数量变化时重新加载
pageSize.addEventListener('change', () => {
    currentPage = 1; // 重置到第一页
    loadHistory();
});

// 数据概览
function loadOverview() {
    const history = JSON.parse(localStorage.getItem('foodHistory') || '[]');
    if (history.length === 0) {
        document.querySelectorAll('#overview-page canvas').forEach(canvas => {
            canvas.style.display = 'none';
            canvas.parentElement.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> 暂无数据
                </div>
            `;
        });
        return;
    }

    // 更新统计数据
    updateStats(history);
}

// 更新统计数据
function updateStats(history) {
    // 总记录数
    document.getElementById('total-records').textContent = history.length;

    // 计算平均热量
    const caloriesRegex = /(\d+)\s*[千k]?[卡c]路里/i;
    const calories = history.map(item => {
        try {
            if (!item?.analysis?.food?.calories) return 0;
            const match = item.analysis.food.calories.match(caloriesRegex);
            return match ? parseInt(match[1]) : 0;
        } catch (error) {
            console.error('解析热量数据错误:', error);
            return 0;
        }
    }).filter(cal => cal > 0);
    
    const avgCalories = calories.length > 0 
        ? Math.round(calories.reduce((a, b) => a + b, 0) / calories.length)
        : 0;
    document.getElementById('avg-calories').textContent = avgCalories;

    // 记录天数（不重复的日期数量）
    const uniqueDays = new Set(
        history.map(item => {
            try {
                return new Date(item.date).toLocaleDateString();
            } catch (error) {
                console.error('解析日期错误:', error);
                return null;
            }
        }).filter(Boolean)
    );
    document.getElementById('active-days').textContent = uniqueDays.size;
}

// 绘制食物类型分布图
function drawFoodTypeChart(history) {
    const foodTypes = {};
    history.forEach(item => {
        const foodName = item.analysis.food.name || '未知食物';
        foodTypes[foodName] = (foodTypes[foodName] || 0) + 1;
    });

    // 获取前8个最常见的食物类型
    const sortedTypes = Object.entries(foodTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    new Chart(foodTypeChart, {
        type: 'doughnut',
        data: {
            labels: sortedTypes.map(([name]) => name),
            datasets: [{
                data: sortedTypes.map(([, count]) => count),
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// 绘制热量趋势图
function drawCaloriesTrendChart(history) {
    const caloriesRegex = /(\d+)\s*[千k]?[卡c]路里/i;
    const caloriesData = history.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        calories: parseInt(item.analysis.food.calories.match(caloriesRegex)?.[1] || '0')
    })).filter(item => item.calories > 0);

    // 按日期分组并计算每日总热量
    const dailyCalories = {};
    caloriesData.forEach(item => {
        dailyCalories[item.date] = (dailyCalories[item.date] || 0) + item.calories;
    });

    const sortedDates = Object.keys(dailyCalories).sort();

    new Chart(document.getElementById('calories-trend-chart'), {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: '每日摄入热量',
                data: sortedDates.map(date => dailyCalories[date]),
                borderColor: '#36A2EB',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '热量 (kcal)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// 绘制营养成分分布图
function drawNutritionChart(history) {
    // 提取常见营养成分
    const nutritionKeywords = {
        '蛋白质': /(蛋白质|蛋白)/,
        '碳水化合物': /(碳水化合物|碳水|糖)/,
        '脂肪': /(脂肪|油脂)/,
        '维生素': /维生素/,
        '膳食纤维': /(膳食纤维|纤维)/,
        '矿物质': /(矿物质|钙|铁|钾|镁)/
    };

    const nutritionCount = {};
    Object.keys(nutritionKeywords).forEach(key => {
        nutritionCount[key] = 0;
    });

    history.forEach(item => {
        const nutrition = item.analysis.food.nutrition;
        Object.entries(nutritionKeywords).forEach(([key, regex]) => {
            if (regex.test(nutrition)) {
                nutritionCount[key]++;
            }
        });
    });

    new Chart(nutritionChart, {
        type: 'bar',
        data: {
            labels: Object.keys(nutritionCount),
            datasets: [{
                data: Object.values(nutritionCount),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56',
                    '#4BC0C0', '#9966FF', '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '出现次数'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// 显示AI建议
async function getAISuggestions(history) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apiKey: API_KEY,
                data: {
                    model: 'qwen-max',
                    input: {
                        messages: [
                            {
                                role: 'user',
                                content: `基于以下饮食历史记录，请提供健康建议和营养均衡建议：${JSON.stringify(history)}`
                            }
                        ]
                    }
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API请求失败: ${response.status}`);
        }

        const data = await response.json();
        // 将AI建议渲染为Markdown
        aiSuggestions.innerHTML = marked.parse(data.output.text);
    } catch (error) {
        console.error('API调用错误:', error);
        aiSuggestions.innerHTML = marked.parse(`
### ❌ 获取AI建议失败

错误信息：${error.message}

请稍后重试。
`);
    }
}

// 初始化
dateFilter.addEventListener('change', loadHistory); 