# 虚拟漫游路线规划功能设计方案 (简化版)

## 1. 项目概述

为现有的krpano虚拟漫游系统添加纯前端的搜索和路线规划功能，用户可以通过输入起点和终点，系统自动计算最短浏览路径并在地图上高亮显示。

**核心功能范围：**
- ✅ 场景搜索和自动补全
- ✅ 路径规划和计算
- ✅ 地图上的路径可视化显示
- ✅ 路径信息展示

## 2. 技术架构

### 2.1 整体架构
```
HTML层 (UI界面)
    ↓
JavaScript层 (路径算法 + 数据管理)
    ↓
krpano XML层 (地图显示 + 场景控制)
    ↓
krpano引擎 (渲染和交互)
```

### 2.2 核心技术栈
- **前端框架**: 原生JavaScript + HTML5 + CSS3
- **路径算法**: Dijkstra算法 / A*算法
- **数据结构**: 图结构存储场景连接关系
- **UI组件**: 自定义搜索面板和路径显示
- **集成方式**: krpano JavaScript API

## 3. 功能模块设计

### 3.1 数据层 (Data Layer)
```javascript
// 场景图数据结构
const sceneGraph = {
    nodes: [
        { id: 'scene1', name: '入口大厅', x: 100, y: 200, keywords: ['大厅', '入口', '前台'] },
        { id: 'scene2', name: '展览区A', x: 200, y: 150, keywords: ['展览', '艺术', '画廊'] },
        // ...更多场景
    ],
    edges: [
        { from: 'scene1', to: 'scene2', weight: 1 },
        { from: 'scene2', to: 'scene3', weight: 1.5 },
        // ...场景连接关系
    ]
};
```

### 3.2 算法层 (Algorithm Layer)
- **路径搜索算法**: Dijkstra最短路径算法
- **搜索匹配算法**: 模糊搜索 + 关键词匹配
- **路径优化**: 考虑场景重要性和用户偏好

### 3.3 UI层 (User Interface Layer)
- **搜索面板**: 可展开/收起的侧边栏
- **输入组件**: 带自动补全的搜索框
- **路径显示**: 地图上的路径高亮和步骤列表
- **交互控制**: 一键导航和路径预览

## 4. 文件结构

```
integration/vtour/
├── route_planning/
│   ├── css/
│   │   ├── route-panel.css          # 搜索面板样式
│   │   ├── route-display.css        # 路径显示样式
│   │   └── responsive.css           # 响应式设计
│   ├── js/
│   │   ├── scene-graph.js           # 场景图数据
│   │   ├── path-algorithm.js        # 路径算法
│   │   ├── search-engine.js         # 搜索引擎
│   │   ├── route-ui.js              # UI控制器
│   │   └── krpano-integration.js    # krpano集成
│   ├── data/
│   │   ├── scenes.json              # 场景数据
│   │   └── connections.json         # 连接关系
│   └── route-planning.xml           # krpano路径显示组件
├── tour.html                        # 主页面 (需要修改)
├── tour.xml                         # krpano配置 (需要修改)
└── custom_map_system.xml            # 地图系统 (需要扩展)
```

## 5. 核心功能实现

### 5.1 搜索面板UI设计
```html
<!-- 搜索面板结构 -->
<div id="route-planning-panel" class="route-panel collapsed">
    <div class="panel-header">
        <h3>路线规划</h3>
        <button id="panel-toggle">📍</button>
    </div>
    <div class="panel-content">
        <div class="search-group">
            <label>起点</label>
            <input type="text" id="start-point" placeholder="请输入起点..." />
            <div id="start-suggestions" class="suggestions"></div>
        </div>
        <div class="search-group">
            <label>终点</label>
            <input type="text" id="end-point" placeholder="请输入终点..." />
            <div id="end-suggestions" class="suggestions"></div>
        </div>
        <button id="plan-route" class="plan-button">规划路线</button>
        <div id="route-result" class="route-result"></div>
    </div>
</div>
```

### 5.2 路径算法核心
```javascript
class PathFinder {
    constructor(sceneGraph) {
        this.graph = sceneGraph;
    }
    
    // Dijkstra最短路径算法
    findShortestPath(startId, endId) {
        const distances = {};
        const previous = {};
        const unvisited = new Set();
        
        // 初始化距离
        this.graph.nodes.forEach(node => {
            distances[node.id] = node.id === startId ? 0 : Infinity;
            unvisited.add(node.id);
        });
        
        while (unvisited.size > 0) {
            // 找到未访问节点中距离最小的
            const current = this.getMinDistanceNode(distances, unvisited);
            unvisited.delete(current);
            
            if (current === endId) break;
            
            // 更新邻居节点距离
            this.updateNeighborDistances(current, distances, previous);
        }
        
        return this.reconstructPath(previous, startId, endId);
    }
    
    // 重构路径
    reconstructPath(previous, start, end) {
        const path = [];
        let current = end;
        
        while (current !== undefined) {
            path.unshift(current);
            current = previous[current];
        }
        
        return path[0] === start ? path : [];
    }
}
```

### 5.3 搜索引擎
```javascript
class SearchEngine {
    constructor(scenes) {
        this.scenes = scenes;
        this.buildSearchIndex();
    }
    
    // 构建搜索索引
    buildSearchIndex() {
        this.searchIndex = this.scenes.map(scene => ({
            id: scene.id,
            name: scene.name,
            keywords: scene.keywords,
            searchText: [scene.name, ...scene.keywords].join(' ').toLowerCase()
        }));
    }
    
    // 模糊搜索
    search(query) {
        if (!query.trim()) return [];
        
        const queryLower = query.toLowerCase();
        return this.searchIndex
            .filter(item => item.searchText.includes(queryLower))
            .sort((a, b) => {
                // 优先显示名称匹配的结果
                const aNameMatch = a.name.toLowerCase().includes(queryLower);
                const bNameMatch = b.name.toLowerCase().includes(queryLower);
                if (aNameMatch && !bNameMatch) return -1;
                if (!aNameMatch && bNameMatch) return 1;
                return 0;
            })
            .slice(0, 5); // 限制建议数量
    }
}
```

## 6. krpano集成方案

### 6.1 扩展地图系统
在 `custom_map_system.xml` 中添加路径显示功能：

```xml
<!-- 路径显示图层 -->
<layer name="route_path_container" parent="map_container" visible="false">
    <!-- 路径线条 -->
    <layer name="route_line" />
    <!-- 路径节点 -->
    <layer name="route_nodes" />
    <!-- 起点标记 -->
    <layer name="start_marker" url="skin/start_icon.png" />
    <!-- 终点标记 -->
    <layer name="end_marker" url="skin/end_icon.png" />
</layer>

<!-- 显示路径的动作 -->
<action name="show_route_path">
    <!-- 接收JavaScript传递的路径数据 -->
    <!-- 在地图上绘制路径线条和标记 -->
</action>
```

### 6.2 JavaScript与krpano通信
```javascript
class KrpanoIntegration {
    constructor() {
        this.krpano = null;
    }
    
    // 初始化krpano连接
    init() {
        this.krpano = document.getElementById('krpanoSWFObject');
    }
    
    // 显示路径在地图上
    showRouteOnMap(path) {
        if (!this.krpano) return;
        
        // 调用krpano动作显示路径
        this.krpano.call(`show_route_path(${JSON.stringify(path)})`);
    }
    
    // 导航到指定场景
    navigateToScene(sceneId) {
        if (!this.krpano) return;
        
        this.krpano.call(`loadscene(${sceneId}, null, MERGE)`);
    }
}
```

## 7. 用户体验设计

### 7.1 交互流程
1. **面板展开**: 用户点击地图上的路线规划按钮
2. **输入搜索**: 用户在起点/终点输入框中输入关键词
3. **自动补全**: 系统实时显示匹配的场景建议
4. **选择场景**: 用户点击建议项或手动输入完整名称
5. **路径计算**: 点击"规划路线"按钮，系统计算最短路径
6. **结果显示**: 在地图上高亮显示路径，并显示步骤列表
7. **场景跳转**: 用户可以点击路径中的任意场景直接跳转

### 7.2 响应式设计
- **桌面端**: 侧边栏面板，宽度300px
- **平板端**: 底部抽屉面板，高度40%
- **移动端**: 全屏覆盖面板，带滑动手势

### 7.3 视觉设计
- **配色方案**: 与现有地图系统保持一致
- **动画效果**: 平滑的展开/收起动画，路径绘制动画
- **图标设计**: 清晰的起点、终点、路径节点图标

## 8. 性能优化

### 8.1 算法优化
- **预计算**: 预先计算常用路径，存储在缓存中
- **增量更新**: 只重新计算变化的部分
- **异步处理**: 使用Web Workers进行路径计算

### 8.2 UI优化
- **虚拟滚动**: 搜索建议列表使用虚拟滚动
- **防抖处理**: 输入框搜索使用防抖，减少计算频率
- **懒加载**: 路径详情按需加载

## 9. 数据管理

### 9.1 场景数据结构
```json
{
    "scenes": [
        {
            "id": "scene_001",
            "name": "入口大厅",
            "description": "博物馆主入口，设有咨询台和导览服务",
            "keywords": ["入口", "大厅", "前台", "咨询", "导览"],
            "category": "公共区域",
            "mapPosition": { "x": 100, "y": 200 },
            "importance": 5,
            "estimatedVisitTime": 5
        }
    ],
    "connections": [
        {
            "from": "scene_001",
            "to": "scene_002",
            "weight": 1.0,
            "walkTime": 30,
            "description": "通过主走廊前往"
        }
    ]
}
```

### 9.2 路径权重计算
- **基础权重**: 场景间的物理距离
- **时间权重**: 预估的移动时间
- **重要性权重**: 场景的重要程度
- **用户偏好**: 基于历史访问记录的个性化权重

## 11. 实施计划

### 阶段一：基础功能 (1-2周)
- [ ] 搭建基础UI框架
- [ ] 实现场景数据管理
- [ ] 开发基础搜索功能
- [ ] 集成krpano显示

### 阶段二：核心算法 (2-3周)
- [ ] 实现Dijkstra路径算法
- [ ] 开发路径显示功能
- [ ] 添加自动补全功能
- [ ] 优化用户交互体验

### 阶段三：高级功能 (2-3周)
- [ ] 添加路径动画效果
- [ ] 开发响应式设计
- [ ] 性能优化和测试

## 12. 技术风险和解决方案

### 12.1 主要风险
1. **krpano集成复杂性**: krpano API学习成本高
2. **性能问题**: 大量场景数据的处理性能
3. **兼容性问题**: 不同设备和浏览器的兼容性

### 12.2 解决方案
1. **分步集成**: 先实现基础功能，再逐步深度集成
2. **数据分片**: 大数据集分片加载，按需处理
3. **渐进增强**: 基础功能优先，高级功能作为增强

## 13. 总结

这个路线规划功能将为虚拟漫游系统带来显著的用户体验提升，通过智能的路径计算和直观的可视化显示，帮助用户更高效地探索虚拟空间。整个方案采用模块化设计，便于维护和扩展，同时保持了与现有系统的良好兼容性。

实施建议按阶段进行，先完成核心功能，再逐步添加高级特性，确保项目的可控性和成功率。