# 食通天 - 智能食物分析助手

食通天是一个基于阿里云百炼大模型的智能食物分析应用，可以帮助用户快速识别和分析食物图片，提供详细的营养成分信息和健康建议。

## 🌟 主要功能

- 📸 图片上传与拍照
  - 支持从相册选择图片
  - 支持实时拍照分析
  - 自动优化图片大小和格式

- 🔍 智能分析
  - 食物名称识别
  - 营养成分分析
  - 卡路里估算
  - 健康建议生成

- 📊 数据管理
  - 历史记录查看
  - 按时间范围筛选
  - 数据统计概览
  - 支持删除记录

- ⚙️ 个性化设置
  - API Key 管理
  - 界面主题定制
  - 移动端适配

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0
- 现代浏览器（支持 ES6+）

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/Freakz3z/FoodAssistant_ShiTongTian.git
cd FoodAssistant_ShiTongTian
```

2. 安装依赖
```bash
npm install
```

3. 启动服务器
```bash
node server.js
```

4. 访问应用
打开浏览器访问 `http://localhost:3000`

### 配置 API Key

1. 访问 [阿里云百炼控制台](https://dashscope.console.aliyun.com/)
2. 登录您的阿里云账号
3. 在控制台中找到 API Key 管理
4. 创建或复制现有的 API Key
5. 在应用设置中填入您的 API Key

## 💡 使用说明

1. **上传图片**
   - 点击"选择图片"按钮从相册选择
   - 或点击"拍照"按钮使用摄像头拍摄

2. **分析图片**
   - 预览图片无误后点击"分析图片"
   - 等待分析结果生成

3. **查看结果**
   - 查看食物名称、营养成分等信息
   - 获取健康建议

4. **管理历史**
   - 在"历史记录"页面查看所有分析记录
   - 使用时间范围筛选器快速查找
   - 支持删除不需要的记录

5. **数据概览**
   - 查看总体统计信息
   - 了解饮食趋势

## 🔧 技术栈

- 前端：HTML5, CSS3, JavaScript
- UI框架：Bootstrap 5
- 图表库：Chart.js
- 图标：Font Awesome
- 后端：Node.js
- API：阿里云百炼大模型

## 📱 移动端支持

- 响应式设计
- 触摸友好的界面
- 优化的图片处理
- 适配各种屏幕尺寸

## 🔒 安全说明

- API Key 仅存储在本地浏览器中
- 所有数据传输使用 HTTPS
- 图片数据经过优化处理
- 定期清理本地存储数据

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

<p align="center">Made with ❤️ by Freak</p> 