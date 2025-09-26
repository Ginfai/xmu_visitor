# 搜索框UI组件 - 使用说明

## 概述

这是Insta360虚拟旅游项目的搜索和路线规划功能UI组件。提供了现代化的搜索界面，支持智能搜索建议、自动补全、路线规划等功能。

## 文件结构

```
route_planning/
├── demo.html                 # 演示页面
├── search-panel.html         # 搜索面板组件
├── css/
│   ├── route-panel.css       # 面板基础样式
│   └── search-components.css # 搜索组件样式
└── js/
    ├── search-engine.js      # 搜索引擎
    ├── search-ui.js         # 搜索UI控制器
    └── route-ui.js          # 路线UI控制器
```

## 功能特性

### 🔍 智能搜索
- **实时搜索建议**：输入时显示相关场景建议
- **自动补全**：支持键盘导航和选择
- **防抖优化**：避免频繁搜索请求
- **高亮显示**：搜索关键词高亮显示

### 🎨 用户界面
- **响应式设计**：适配桌面、平板、手机
- **现代化UI**：毛玻璃效果、渐变按钮、动画过渡
- **直观操作**：清晰的视觉层次和交互反馈
- **无障碍支持**：键盘导航和屏幕阅读器友好

### 🗺️ 路线规划
- **路径计算**：基于场景坐标的最短路径算法
- **步骤导航**：详细的路线步骤和场景信息
- **统计信息**：距离、时间、场景数量统计
- **快速操作**：交换起终点、设为当前位置

## 使用方法

### 1. 基本集成

```html
<!-- 引入样式文件 -->
<link rel="stylesheet" href="css/route-panel.css">
<link rel="stylesheet" href="css/search-components.css">

<!-- 引入脚本文件 -->
<script src="js/search-engine.js"></script>
<script src="js/search-ui.js"></script>
<script src="js/route-ui.js"></script>
```

### 2. HTML结构

```html
<!-- 搜索面板 -->
<div id="route-planning-panel" class="route-panel collapsed">
    <div class="panel-header">
        <button id="panel-toggle" class="toggle-btn">
            <span class="toggle-icon">📍</span>
            <span class="toggle-text">路线规划</span>
        </button>
    </div>
    
    <div class="panel-content">
        <!-- 搜索区域 -->
        <div class="search-section">
            <!-- 起点和终点输入框 -->
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-section">
            <!-- 规划路线和清除按钮 -->
        </div>
        
        <!-- 路线结果 -->
        <div id="route-result" class="route-result">
            <!-- 路线信息和步骤 -->
        </div>
    </div>
</div>
```

### 3. JavaScript API

#### 搜索引擎API

```javascript
// 搜索场景
const results = window.searchEngine.search('入口', 5);

// 获取建议
const suggestions = window.searchEngine.getSuggestions('大');

// 获取场景详情
const scene = window.searchEngine.getSceneById('scene_001');

// 计算距离
const distance = window.searchEngine.calculateDistance('scene_001', 'scene_002');
```

#### 搜索UI API

```javascript
// 选择场景
window.searchUI.selectScene(scene, 'start');

// 清除输入
window.searchUI.clearInput('start');

// 显示/隐藏加载状态
window.searchUI.showLoading();
window.searchUI.hideLoading();
```

#### 路线UI API

```javascript
// 规划路线
window.routeUI.planRoute('scene_001', 'scene_002');

// 清除路线
window.routeUI.clearRoute();

// 导航到场景
window.routeUI.navigateToScene('scene_001');

// 导出路线
const routeData = window.routeUI.exportRoute();
```

## 自定义配置

### 1. 场景数据配置

在 `search-engine.js` 中修改 `initSceneData()` 方法：

```javascript
this.scenes = [
    {
        id: 'scene_001',
        name: '场景名称',
        description: '场景描述',
        keywords: ['关键词1', '关键词2'],
        category: '类别',
        mapPosition: { x: 100, y: 200 },
        importance: 5,
        estimatedVisitTime: 5
    }
    // 更多场景...
];
```

### 2. 样式自定义

在 `search-components.css` 中修改CSS变量：

```css
:root {
    --primary-color: #3498db;
    --secondary-color: #2c3e50;
    --success-color: #27ae60;
    --warning-color: #f39c12;
    --danger-color: #e74c3c;
}
```

### 3. 搜索配置

```javascript
// 修改防抖延迟
this.debounceDelay = 300; // 毫秒

// 修改搜索结果数量限制
const results = this.search(query, 5); // 最多5个结果
```

## 键盘快捷键

- **方向键 ↑↓**：在建议列表中导航
- **Enter**：选择当前建议项
- **Escape**：关闭建议列表
- **Tab**：在输入框间切换

## 响应式断点

- **桌面**：> 768px
- **平板**：768px - 480px
- **手机**：< 480px

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 演示页面

访问 `demo.html` 查看完整的UI演示和交互效果。

## 集成到krpano

### 1. 在tour.xml中包含组件

```xml
<include url="route_planning/search-panel.html" />
```

### 2. 添加krpano事件

```xml
<events onnewpano="updateCurrentScene();" />
```

### 3. 实现krpano集成函数

```javascript
function updateCurrentScene() {
    const currentScene = krpano.get('xml.scene');
    window.searchUI.setCurrentScene(currentScene);
}

function navigateToScene(sceneId) {
    krpano.call(`loadscene(${sceneId})`);
}
```

## 故障排除

### 常见问题

1. **搜索建议不显示**
   - 检查搜索引擎是否正确初始化
   - 确认场景数据是否加载

2. **样式显示异常**
   - 检查CSS文件是否正确引入
   - 确认没有CSS冲突

3. **路线规划失败**
   - 检查起点和终点是否有效
   - 确认路径算法是否正确实现

### 调试模式

```javascript
// 启用调试模式
window.searchEngine.debug = true;
window.searchUI.debug = true;
window.routeUI.debug = true;
```

## 更新日志

### v1.0.0 (2024-01-XX)
- 初始版本发布
- 基础搜索和路线规划功能
- 响应式UI设计
- 键盘导航支持

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

MIT License