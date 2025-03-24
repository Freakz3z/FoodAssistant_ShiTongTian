const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// 启用CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// 辅助函数：格式化对象或数组为字符串
function formatValue(value) {
    if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
            return value.map(formatValue).join('、');
        } else {
            return Object.values(value).map(formatValue).join('、');
        }
    }
    return String(value);
}

// 代理API请求
app.post('/api/analyze', async (req, res) => {
    try {
        // 安全地检查请求内容
        const hasImage = req.body && 
                        req.body.data && 
                        req.body.data.input && 
                        req.body.data.input.messages && 
                        req.body.data.input.messages[0] && 
                        req.body.data.input.messages[0].content && 
                        req.body.data.input.messages[0].content[0] && 
                        req.body.data.input.messages[0].content[0].image;

        console.log('收到请求:', {
            model: req.body.data.model,
            hasImage: hasImage,
            apiKey: req.body.apiKey ? '已提供' : '未提供'
        });

        // 检查API密钥
        if (!req.body.apiKey) {
            throw new Error('未提供API密钥');
        }

        let requestBody;
        const model = req.body.data.model;

        if (model === 'qwen-vl-max-latest') {
            // 检查图片数据
            if (!hasImage) {
                throw new Error('未提供图片数据');
            }
            const imageData = req.body.data.input.messages[0].content[0].image;

            // 构建图片分析请求
            requestBody = {
                model: "qwen-vl-max-latest",
                messages: [
                    {
                        role: "system",
                        content: [
                            {
                                type: "text",
                                text: "你是一个专业的食物分析助手，请帮助用户分析食物图片并提供相关信息。"
                            }
                        ]
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageData}`
                                }
                            },
                            {
                                type: "text",
                                text: "请分析这张食物图片，提供以下信息：1. 食物名称 2. 主要营养成分 3. 卡路里含量（估算）4. 健康建议"
                            }
                        ]
                    }
                ]
            };
        } else if (model === 'qwen-max') {
            // 构建文本分析请求
            requestBody = {
                model: "qwen-max",
                messages: [
                    {
                        role: "system",
                        content: `你是一个专业的营养师，请基于用户的饮食记录数据进行分析，并提供专业的建议。
                        分析时请考虑：
                        1. 饮食多样性（基于不同食物种类的数量）
                        2. 营养均衡性（基于营养类型的分布）
                        3. 热量摄入情况（基于每日平均热量）
                        4. 改进建议（针对不足的方面提供具体建议）
                        
                        请用markdown格式输出分析结果，包含以下部分：
                        ### 饮食分析
                        ### 营养评估
                        ### 热量分析
                        ### 改进建议`
                    },
                    ...req.body.data.input.messages.slice(1)
                ]
            };
        } else {
            throw new Error(`不支持的模型类型: ${model}`);
        }

        console.log('发送到API的请求体:', JSON.stringify(requestBody, null, 2));

        // 调用API
        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${req.body.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('API响应:', data);

        let responseText = data.choices[0].message.content;
        
        // 如果是JSON字符串，尝试解析并格式化
        try {
            const jsonData = JSON.parse(responseText);
            if (typeof jsonData === 'object' && jsonData !== null) {
                // 遍历对象的每个属性并格式化
                if (jsonData.food) {
                    Object.keys(jsonData.food).forEach(key => {
                        jsonData.food[key] = formatValue(jsonData.food[key]);
                    });
                    responseText = JSON.stringify(jsonData);
                }
            }
        } catch (e) {
            // 如果不是JSON字符串，保持原样
            console.log('响应不是JSON格式，保持原样');
        }

        // 返回结果
        res.json({
            output: {
                text: responseText
            }
        });
    } catch (error) {
        console.error('服务器错误:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.stack,
            timestamp: new Date().toISOString()
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 