# 路线规划功能实现计划 (简化版)

## 功能范围调整

### ✅ 保留功能
- 场景搜索和自动补全
- 路径规划和计算
- 地图上的路径可视化显示
- 路径信息展示
- 场景直接跳转

### ❌ 移除功能
- 自动导航功能 (暂不实现)
- 复杂的导航控制
- 自动播放和时间控制

## 快速开始指南

### 第一步：创建文件结构
```bash
# 在 integration/vtour/ 目录下创建
mkdir -p route_planning/{css,js,data}
```

### 第二步：核心文件清单
1. `route_planning/css/route-panel.css` - 搜索面板样式
2. `route_planning/js/route-controller.js` - 主控制器
3. `route_planning/js/scene-data.js` - 场景数据
4. `route_planning/js/path-finder.js` - 路径算法
5. `route_planning/js/search-engine.js` - 搜索功能
6. 修改 `tour.html` - 集成UI
7. 扩展 `custom_map_system.xml` - 路径显示

## 实现步骤

### 步骤1：基础UI界面

#### HTML结构 (添加到 tour.html)
```html
<!-- 路线规划面板 -->
<div id="route-planning-panel" class="route-panel collapsed">
    <div class="panel-header">
        <button id="route-toggle" class="toggle-btn">
            <span class="icon">🗺️</span>
            <span class="text">路线规划</span>
        </button>
    </div>
    <div class="panel-content">
        <!-- 搜索区域 -->
        <div class="search-section">
            <div class="input-group">
                <label>起点</label>
                <input type="text" id="start-input" placeholder="请选择起点...">
                <div id="start-suggestions" class="suggestions"></div>
            </div>
            <div class="input-group">
                <label>终点</label>
                <input type="text" id="end-input" placeholder="请选择终点...">
                <div id="end-suggestions" class="suggestions"></div>
            </div>
            <button id="plan-route-btn" class="plan-btn" disabled>规划路线</button>
        </div>
        
        <!-- 结果区域 -->
        <div class="result-section" id="route-results" style="display: none;">
            <div class="route-summary">
                <h4>推荐路线</h4>
                <div class="stats">
                    <span>总站点: <strong id="total-stops">0</strong></span>
                    <span>预计时间: <strong id="estimated-time">0分钟</strong></span>
                </div>
            </div>
            <div class="route-steps" id="route-steps"></div>
            <button id="clear-route-btn" class="clear-btn">清除路线</button>
        </div>
    </div>
</div>
```

#### CSS样式设计要点
```css
/* 面板基础样式 */
.route-panel {
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 320px;
    background: rgba(45, 62, 80, 0.95);
    border-radius: 8px;
    transition: all 0.3s ease;
}

.route-panel.collapsed .panel-content {
    display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .route-panel {
        position: fixed;
        bottom: 0;
        right: 0;
        left: 0;
        top: auto;
        width: 100%;
        transform: none;
    }
}
```

### 步骤2：场景数据管理

#### 场景数据结构
```javascript
// route_planning/js/scene-data.js
const SCENE_DATA = {
    // 从现有tour.xml提取的场景数据
    scenes: [
        {
            id: "scene_img_20250829_210831_00_629",
            name: "展区入口",
            keywords: ["入口", "开始", "起点"],
            mapPos: { x: 18, y: 71 },
            estimatedTime: 2
        },
        {
            id: "scene_IMG_20250829_172737_00_322", 
            name: "主展厅",
            keywords: ["展厅", "主要", "中心"],
            mapPos: { x: 350, y: 182 },
            estimatedTime: 5
        }
        // ... 更多场景
    ],
    
    // 场景连接关系
    connections: [
        { from: "scene_img_20250829_210831_00_629", to: "scene_IMG_20250829_172737_00_322", weight: 1 }
        // ... 更多连接
    ]
};
```

### 步骤3：核心算法实现

#### 路径查找算法
```javascript
// route_planning/js/path-finder.js
class PathFinder {
    constructor(sceneData) {
        this.scenes = new Map();
        this.connections = new Map();
        this.buildGraph(sceneData);
    }
    
    buildGraph(data) {
        // 构建图结构
        data.scenes.forEach(scene => {
            this.scenes.set(scene.id, scene);
        });
        
        data.connections.forEach(conn => {
            if (!this.connections.has(conn.from)) {
                this.connections.set(conn.from, []);
            }
            this.connections.get(conn.from).push({
                to: conn.to,
                weight: conn.weight || 1
            });
        });
    }
    
    findShortestPath(startId, endId) {
        // 简化的Dijkstra算法
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();
        
        // 初始化
        for (let sceneId of this.scenes.keys()) {
            distances.set(sceneId, sceneId === startId ? 0 : Infinity);
            unvisited.add(sceneId);
        }
        
        while (unvisited.size > 0) {
            // 找到距离最小的未访问节点
            let current = null;
            let minDistance = Infinity;
            for (let node of unvisited) {
                if (distances.get(node) < minDistance) {
                    minDistance = distances.get(node);
                    current = node;
                }
            }
            
            if (current === null || current === endId) break;
            
            unvisited.delete(current);
            
            // 更新邻居距离
            const neighbors = this.connections.get(current) || [];
            for (let neighbor of neighbors) {
                const alt = distances.get(current) + neighbor.weight;
                if (alt < distances.get(neighbor.to)) {
                    distances.set(neighbor.to, alt);
                    previous.set(neighbor.to, current);
                }
            }
        }
        
        // 重构路径
        return this.reconstructPath(previous, startId, endId);
    }
    
    reconstructPath(previous, start, end) {
        const path = [];
        let current = end;
        
        while (current !== undefined) {
            path.unshift(current);
            current = previous.get(current);
        }
        
        return path[0] === start ? path : [];
    }
}
```

#### 搜索引擎
```javascript
// route_planning/js/search-engine.js
class SearchEngine {
    constructor(scenes) {
        this.scenes = scenes;
        this.buildSearchIndex();
    }
    
    buildSearchIndex() {
        this.searchIndex = this.scenes.map(scene => ({
            id: scene.id,
            name: scene.name,
            keywords: scene.keywords || [],
            searchText: [scene.name, ...(scene.keywords || [])].join(' ').toLowerCase()
        }));
    }
    
    search(query, limit = 5) {
        if (!query.trim()) return [];
        
        const queryLower = query.toLowerCase();
        return this.searchIndex
            .filter(item => item.searchText.includes(queryLower))
            .sort((a, b) => {
                // 名称匹配优先
                const aNameMatch = a.name.toLowerCase().includes(queryLower);
                const bNameMatch = b.name.toLowerCase().includes(queryLower);
                if (aNameMatch && !bNameMatch) return -1;
                if (!aNameMatch && bNameMatch) return 1;
                return 0;
            })
            .slice(0, limit);
    }
}
```

### 步骤4：主控制器

#### 核心控制逻辑
```javascript
// route_planning/js/route-controller.js
class RouteController {
    constructor() {
        this.pathFinder = new PathFinder(SCENE_DATA);
        this.searchEngine = new SearchEngine(SCENE_DATA.scenes);
        this.currentRoute = null;
        
        this.initUI();
        this.setupEvents();
    }
    
    initUI() {
        this.panel = document.getElementById('route-planning-panel');
        this.startInput = document.getElementById('start-input');
        this.endInput = document.getElementById('end-input');
        this.planBtn = document.getElementById('plan-route-btn');
        this.resultsDiv = document.getElementById('route-results');
        
        // 初始化自动补全
        this.setupAutoComplete(this.startInput, 'start-suggestions');
        this.setupAutoComplete(this.endInput, 'end-suggestions');
    }
    
    setupEvents() {
        // 面板切换
        document.getElementById('route-toggle').addEventListener('click', () => {
            this.panel.classList.toggle('collapsed');
        });
        
        // 规划路线
        this.planBtn.addEventListener('click', () => {
            this.planRoute();
        });
        
        // 清除路线
        document.getElementById('clear-route-btn').addEventListener('click', () => {
            this.clearRoute();
        });
        
        // 输入验证
        [this.startInput, this.endInput].forEach(input => {
            input.addEventListener('input', () => {
                this.validateInputs();
            });
        });
    }
    
    setupAutoComplete(input, suggestionsId) {
        const suggestionsDiv = document.getElementById(suggestionsId);
        
        input.addEventListener('input', (e) => {
            const query = e.target.value;
            const suggestions = this.searchEngine.search(query);
            
            if (suggestions.length > 0 && query.length > 0) {
                suggestionsDiv.innerHTML = suggestions.map(item => 
                    `<div class="suggestion-item" data-id="${item.id}">${item.name}</div>`
                ).join('');
                suggestionsDiv.style.display = 'block';
            } else {
                suggestionsDiv.style.display = 'none';
            }
        });
        
        // 点击建议项
        suggestionsDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-item')) {
                input.value = e.target.textContent;
                input.dataset.sceneId = e.target.dataset.id;
                suggestionsDiv.style.display = 'none';
                this.validateInputs();
            }
        });
    }
    
    validateInputs() {
        const hasStart = this.startInput.value && this.startInput.dataset.sceneId;
        const hasEnd = this.endInput.value && this.endInput.dataset.sceneId;
        this.planBtn.disabled = !(hasStart && hasEnd);
    }
    
    planRoute() {
        const startId = this.startInput.dataset.sceneId;
        const endId = this.endInput.dataset.sceneId;
        
        if (startId === endId) {
            alert('起点和终点不能相同');
            return;
        }
        
        const path = this.pathFinder.findShortestPath(startId, endId);
        
        if (path.length === 0) {
            alert('无法找到连接路径');
            return;
        }
        
        this.displayRoute(path);
        this.showRouteOnMap(path);
    }
    
    displayRoute(path) {
        const scenes = path.map(id => this.pathFinder.scenes.get(id));
        const totalTime = scenes.reduce((sum, scene) => sum + (scene.estimatedTime || 0), 0);
        
        // 更新统计
        document.getElementById('total-stops').textContent = scenes.length;
        document.getElementById('estimated-time').textContent = totalTime;
        
        // 显示步骤
        const stepsDiv = document.getElementById('route-steps');
        stepsDiv.innerHTML = scenes.map((scene, index) => `
            <div class="route-step">
                <span class="step-number">${index + 1}</span>
                <div class="step-info">
                    <div class="step-name">${scene.name}</div>
                    <div class="step-time">${scene.estimatedTime || 0}分钟</div>
                </div>
                <button class="goto-btn" onclick="routeController.jumpToScene('${scene.id}')">前往</button>
            </div>
        `).join('');
        
        this.resultsDiv.style.display = 'block';
        this.currentRoute = path;
    }
    
    showRouteOnMap(path) {
        // 调用krpano显示路径
        if (window.krpano) {
            const pathData = path.map(id => {
                const scene = this.pathFinder.scenes.get(id);
                return {
                    id: scene.id,
                    x: scene.mapPos.x,
                    y: scene.mapPos.y,
                    name: scene.name
                };
            });
            
            // 调用krpano动作显示路径
            window.krpano.call(`display_route_path(${JSON.stringify(pathData)})`);
        }
    }
    
    jumpToScene(sceneId) {
        if (window.krpano) {
            window.krpano.call(`loadscene(${sceneId}, null, MERGE)`);
        }
    }
    
    clearRoute() {
        this.currentRoute = null;
        this.resultsDiv.style.display = 'none';
        this.startInput.value = '';
        this.endInput.value = '';
        delete this.startInput.dataset.sceneId;
        delete this.endInput.dataset.sceneId;
        this.planBtn.disabled = true;
        
        // 清除地图显示
        if (window.krpano) {
            window.krpano.call('clear_route_display()');
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.routeController = new RouteController();
});
```

### 步骤5：krpano集成

#### 扩展地图系统 (添加到 custom_map_system.xml)
```xml
<!-- 路径显示容器 -->
<layer name="route_display" parent="map_container" visible="false">
    <!-- 路径线条 -->
    <layer name="route_line" />
    <!-- 起点标记 -->
    <layer name="route_start" url="skin/route_start.png" scale="0.8" />
    <!-- 终点标记 -->
    <layer name="route_end" url="skin/route_end.png" scale="0.8" />
    <!-- 路径节点 -->
    <layer name="route_nodes" />
</layer>

<!-- 显示路径动作 -->
<action name="display_route_path">
    <!-- 接收路径数据参数 -->
    set(route_data, %1);
    
    <!-- 显示路径容器 -->
    set(layer[route_display].visible, true);
    
    <!-- 绘制路径线条和标记 -->
    <!-- 这里需要根据具体的路径数据绘制 -->
    
    <!-- 设置起点和终点标记 -->
    <!-- ... 具体实现 -->
</action>

<!-- 清除路径显示 -->
<action name="clear_route_display">
    set(layer[route_display].visible, false);
    <!-- 清除所有路径元素 -->
</action>
```

## 开发时间安排 (简化版)

### 第一周：基础功能
- [ ] 创建文件结构和基础UI
- [ ] 实现场景数据管理
- [ ] 开发搜索和自动补全

### 第二周：核心功能
- [ ] 实现路径算法
- [ ] 开发路径显示功能
- [ ] krpano集成和测试

### 第三周：优化完善
- [ ] UI/UX优化
- [ ] 响应式设计
- [ ] 性能优化和测试

## 集成到现有系统

### 修改 tour.html
在 `<head>` 中添加：
```html
<link rel="stylesheet" href="route_planning/css/route-panel.css">
```

在 `</body>` 前添加：
```html
<script src="route_planning/js/scene-data.js"></script>
<script src="route_planning/js/path-finder.js"></script>
<script src="route_planning/js/search-engine.js"></script>
<script src="route_planning/js/route-controller.js"></script>
```

这个简化版方案专注于核心的搜索和路径规划功能，移除了复杂的导航控制，更容易实现和维护。