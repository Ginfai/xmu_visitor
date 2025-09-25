# 路线规划功能实现计划

## 快速开始指南

### 第一步：创建基础文件结构
```bash
# 在 integration/vtour/ 目录下创建以下结构
mkdir -p route_planning/{css,js,data}
```

### 第二步：核心文件清单

#### 必需创建的文件：
1. `route_planning/css/route-panel.css` - 搜索面板样式
2. `route_planning/css/route-display.css` - 路径显示样式
3. `route_planning/js/route-controller.js` - 主控制器
4. `route_planning/js/scene-data.js` - 场景数据管理
5. `route_planning/js/path-finder.js` - 路径算法
6. `route_planning/js/search-engine.js` - 搜索引擎
7. `route_planning/data/scenes.json` - 场景数据
8. 修改 `tour.html` - 集成路线规划UI
9. 扩展 `custom_map_system.xml` - 添加路径显示

#### 功能范围 (简化版)：
- ✅ 场景搜索和自动补全
- ✅ 路径规划和可视化
- ✅ 路径信息展示
- ✅ 场景直接跳转
- ❌ 自动导航功能 (暂不实现)

### 第三步：数据准备

基于现有场景创建场景图数据：
```javascript
// 从现有 tour.xml 中提取的场景数据示例
const sceneData = {
    "scene_img_20250829_210831_00_629": {
        name:置的 **像素坐标 (X, Y)**。建议在一个文本文件中清晰地记下，格式如下，以便后续使用：
        ```
        # 格式: 场景名称, X坐标, Y坐标
        scene_IMG_20250829_194216_00_481, 150, 230
        scene_IMG_20250829_194245_00_482, 185, 310
        # ...为所有场景记录坐标
        ```

---

#### **第二步：修改 `tour.xml` - 添加地图和位置标记**

需要打开 `integration/vtour/tour.xml` 文件，并在 `<krpano>` 标签内（通常建议放在现有 `<layer>` 元素的末尾）添加以下XML代码来创建地图界面。

```xml
<!-- 自定义地图系统 -->
<layer name="map_container" keep="true" type="container" align="leftbottom" x="20" y="20" width="300" height="250" bgcolor="0x000000" bgalpha="0.5" border="1,0xFFFFFF,0.5">

    <!-- 加载您的地图图片 -->
    <!-- 注意: url中的路径要与您第一步中放置的文件名一致 -->
    <layer name="map_image" url="skin/mymap.png" align="lefttop" />

    <!-- 添加位置标记 (这里使用krpano自带的红色圆点图标) -->
    <layer name="map_spot" url="skin/vtourskin_mapspot.png" align="lefttop" parent="map_container" x="0" y="0" visible="false" />

</layer>
```
*   **`map_container`**: 这是地图的容器。您可以根据需要调整 `align`, `x`, `y` (位置), `width`, `height` (大小), `bgcolor` (背景色), `bgalpha` (背景透明度) 和 `border` (边框) 等属性。
*   **`map_image`**: 这里会加载您在第一步中准备的 `mymap.png` 文件。
*   **`map_spot`**: 这是位置标记，初始时 `visible="false"` 将其隐藏，直到场景加载完成。

---

#### **第三步：修改 `tour.xml` - 为每个场景添加坐标数据**

将第一步中记录的坐标数据添加到 `tour.xml` 中对应的 `<scene>` 标签里。您需要为 **每一个** 希望在地图上定位的场景添加 `map_x` 和 `map_y` 这两个自定义属性。

**示例:**
```xml
<!-- 修改前的场景定义 -->
<scene name="scene_IMG_20250829_194216_00_481" title="地点A" ...>
    ...
</scene>

<!-- 修改后的场景定义 (添加了自定义坐标属性) -->
<scene name="scene_IMG_20250829_194216_00_481" title="地点A" ... map_x="150" map_y="230">
    ...
</scene>
```

---

#### **第四步：修改 `tour.xml` - 创建自动更新的逻辑**

这是最关键的一步，用于实现位置标记的自动化更新。在 `tour.xml` 文件的 `<krpano>` 标签内（通常建议放在所有 `<scene>` 定义之后），添加或修改 `<events>` 和 `<action>` 标签。

```xml
<!-- 定义一个全局事件，在每次加载新场景(pano)时，都调用我们的更新动作 -->
<events onnewpano="update_map_spot_position();" />

<!-- 定义更新动作的具体逻辑 -->
<action name="update_map_spot_position">
    <!--
      检查当前加载的场景(xml.scene)是否定义了 'map_x' 属性。
      这是一个 if...then...else 结构。
    -->
    if(scene[get(xml.scene)].map_x,

        <!-- 条件为真 (定义了坐标): -->
        <!-- 1. 获取坐标值并更新 'map_spot' 图层的位置 -->
        set(layer[map_spot].x, get(scene[get(xml.scene)].map_x));
        set(layer[map_spot].y, get(scene[get(xml.scene)].map_y));

        <!-- 2. 让 'map_spot' 图层变得可见 -->
        set(layer[map_spot].visible, true);
      ,
        <!-- 条件为假 (没有定义坐标): -->
        <!-- 隐藏 'map_spot' 图层 -->
        set(layer[map_spot].visible, false);
    );
</action>
```

*   **`<events onnewpano="...">`**: `onnewpano` 是krpano的一个核心内置事件，每次成功加载并切换到一个新场景后，它就会被触发。
*   **`<action name="...">`**: 这里定义了我们的核心自动化逻辑。它会智能地检查新场景是否有坐标，如果有，就移动标记并显示它；如果这个场景没有设置坐标，标记就会被自动隐藏。

---

### **总结**

按照以上四个步骤操作，您就可以成功地为您的krpano全景漫游添加一个功能完善、可实时同步位置的平面小地图。
法
- [ ] 开发krpano集成功能
- [ ] 实现路径在地图上的显示
- [ ] 添加自动补全功能

### 第三周：高级功能
- [ ] 实现自动导航功能
- [ ] 添加路径动画效果
- [ ] 优化用户体验
- [ ] 响应式设计适配

### 第四周：测试和优化
- [ ] 功能测试和bug修复
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 文档完善

## 关键技术决策

### 1. 路径算法选择
**推荐：Dijkstra算法**
- 优点：实现简单，结果准确
- 适用场景：场景数量中等（<100个）
- 备选：A*算法（如果需要更高性能）

### 2. 数据存储方案
**推荐：内存中的图结构 + JSON配置**
- 场景数据存储在JSON文件中
- 运行时构建图结构存储在内存
- 支持动态更新和扩展

### 3. UI框架选择
**推荐：原生JavaScript + CSS3**
- 避免引入额外依赖
- 更好的性能和兼容性
- 与现有krpano系统集成更简单

### 4. 搜索算法
**推荐：模糊匹配 + 关键词索引**
- 支持中文拼音搜索
- 关键词权重排序
- 实时搜索建议

## 具体实现代码示例

### 场景数据结构示例
```javascript
// route_planning/js/scene-data.js
const SCENE_DATA = {
    nodes: [
        {
            id: "scene_img_20250829_210831_00_629",
            name: "展区入口",
            description: "博物馆主要入口区域",
            keywords: ["入口", "开始", "起点", "大门"],
            category: "入口区域",
            mapPosition: { x: 18, y: 71 },
            importance: 5,
            estimatedTime: 2
        },
        {
            id: "scene_IMG_20250829_172737_00_322", 
            name: "主展厅",
            description: "主要展览区域",
            keywords: ["展厅", "主要", "展览", "中心"],
            category: "展览区域",
            mapPosition: { x: 350, y: 182 },
            importance: 4,
            estimatedTime: 10
        }
        // ... 更多场景数据
    ],
    connections: [
        {
            from: "scene_img_20250829_210831_00_629",
            to: "scene_IMG_20250829_172737_00_322",
            weight: 1.0,
            walkTime: 30,
            description: "通过主通道"
        }
        // ... 更多连接关系
    ]
};
```

### 主控制器示例
```javascript
// route_planning/js/route-controller.js
class RouteController {
    constructor() {
        this.sceneGraph = new SceneGraph(SCENE_DATA);
        this.pathFinder = new PathFinder();
        this.searchEngine = new SearchEngine(this.sceneGraph);
        this.krpanoIntegration = new KrpanoRouteIntegration();
        
        this.currentRoute = null;
        this.isNavigating = false;
        
        this.initializeUI();
        this.setupEventListeners();
    }
    
    initializeUI() {
        // 初始化UI组件
        this.startInput = document.getElementById('start-input');
        this.endInput = document.getElementById('end-input');
        this.planButton = document.getElementById('plan-route-btn');
        this.resultsContainer = document.getElementById('route-results');
        
        // 初始化自动补全
        this.startAutoComplete = new AutoComplete(this.startInput, this.searchEngine);
        this.endAutoComplete = new AutoComplete(this.endInput, this.searchEngine);
    }
    
    setupEventListeners() {
        // 规划路线按钮
        this.planButton.addEventListener('click', () => {
            this.planRoute();
        });
        
        // 开始导航按钮
        document.getElementById('start-navigation').addEventListener('click', () => {
            this.startNavigation();
        });
        
        // 清除路线按钮
        document.getElementById('clear-route').addEventListener('click', () => {
            this.clearRoute();
        });
        
        // 面板切换
        document.getElementById('route-toggle').addEventListener('click', () => {
            this.togglePanel();
        });
    }
    
    planRoute() {
        const startScene = this.getSelectedScene(this.startInput.value);
        const endScene = this.getSelectedScene(this.endInput.value);
        
        if (!startScene || !endScene) {
            this.showError('请选择有效的起点和终点');
            return;
        }
        
        if (startScene.id === endScene.id) {
            this.showError('起点和终点不能相同');
            return;
        }
        
        // 计算路径
        const routePath = this.pathFinder.findShortestPath(
            this.sceneGraph, 
            startScene.id, 
            endScene.id
        );
        
        if (routePath.length === 0) {
            this.showError('无法找到连接这两个场景的路径');
            return;
        }
        
        // 显示路径结果
        this.displayRouteResult(routePath);
        
        // 在地图上显示路径
        this.krpanoIntegration.displayRoute(routePath);
        
        this.currentRoute = routePath;
    }
    
    displayRouteResult(routePath) {
        const routeData = this.buildRouteData(routePath);
        
        // 更新统计信息
        document.getElementById('total-stops').textContent = routeData.totalStops;
        document.getElementById('estimated-time').textContent = routeData.estimatedTime + '分钟';
        
        // 显示路径步骤
        const stepsList = document.getElementById('route-steps-list');
        stepsList.innerHTML = '';
        
        routeData.steps.forEach((step, index) => {
            const stepElement = this.createStepElement(step, index);
            stepsList.appendChild(stepElement);
        });
        
        // 显示结果区域
        this.resultsContainer.style.display = 'block';
        
        // 滚动到结果区域
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    createStepElement(step, index) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'route-step';
        stepDiv.innerHTML = `
            <div class="step-number">${index + 1}</div>
            <div class="step-content">
                <div class="step-title">${step.name}</div>
                <div class="step-description">${step.description}</div>
                <div class="step-time">预计停留: ${step.estimatedTime}分钟</div>
            </div>
            <button class="step-goto" data-scene-id="${step.id}">前往</button>
        `;
        
        // 添加点击事件 - 直接跳转到场景
        stepDiv.querySelector('.step-goto').addEventListener('click', (e) => {
            const sceneId = e.target.dataset.sceneId;
            this.krpanoIntegration.jumpToScene(sceneId);
        });
        
        return stepDiv;
    }
    
    clearRoute() {
        this.currentRoute = null;
        this.isNavigating = false;
        
        // 清除UI
        this.resultsContainer.style.display = 'none';
        this.startInput.value = '';
        this.endInput.value = '';
        this.planButton.disabled = true;
        
        // 清除地图显示
        this.krpanoIntegration.clearRoute();
    }
    
    togglePanel() {
        const panel = document.getElementById('route-planning-panel');
        panel.classList.toggle('expanded');
    }
    
    getSelectedScene(inputValue) {
        // 根据输入值查找对应的场景
        return this.sceneGraph.findSceneByName(inputValue);
    }
    
    buildRouteData(routePath) {
        const scenes = routePath.map(sceneId => this.sceneGraph.getNode(sceneId));
        const totalTime = scenes.reduce((sum, scene) => sum + scene.estimatedTime, 0);
        
        return {
            totalStops: scenes.length,
            estimatedTime: totalTime,
            steps: scenes.map(scene => ({
                id: scene.id,
                name: scene.name,
                description: scene.description,
                estimatedTime: scene.estimatedTime
            }))
        };
    }
    
    showError(message) {
        // 显示错误提示
        console.error(message);
        // 可以添加更友好的错误提示UI
    }
}

// 初始化路线规划功能
document.addEventListener('DOMContentLoaded', () => {
    window.routeController = new RouteController();
});
```

## 集成到现有系统

### 修改 tour.html
在 `<head>` 部分添加：
```html
<!-- 路线规划功能样式 -->
<link rel="stylesheet" href="route_planning/css/route-panel.css">
<link rel="stylesheet" href="route_planning/css/route-display.css">
<link rel="stylesheet" href="route_planning/css/responsive.css">
```

在 `<body>` 结束前添加：
```html
<!-- 路线规划功能脚本 -->
<script src="route_planning/js/scene-data.js"></script>
<script src="route_planning/js/path-finder.js"></script>
<script src="route_planning/js/search-engine.js"></script>
<script src="route_planning/js/auto-complete.js"></script>
<script src="route_planning/js/krpano-integration.js"></script>
<script src="route_planning/js/route-controller.js"></script>
```

### 扩展 custom_map_system.xml
添加路径显示相关的图层和动作，与现有地图系统无缝集成。

## 测试计划

### 功能测试
1. **搜索功能测试**
   - 关键词搜索准确性
   - 自动补全响应速度
   - 模糊匹配效果

2. **路径规划测试**
   - 最短路径算法正确性
   - 复杂路径场景测试
   - 边界情况处理

3. **UI交互测试**
   - 面板展开/收起动画
   - 响应式设计适配
   - 触摸设备兼容性

### 性能测试
1. **算法性能**
   - 大量场景数据的处理速度
   - 内存使用情况
   - 搜索响应时间

2. **UI性能**
   - 动画流畅度
   - 大量搜索结果的渲染性能
   - 移动设备性能表现

## 部署和维护

### 部署步骤
1. 将所有新文件上传到服务器
2. 修改现有的 tour.html 和相关配置文件
3. 测试所有功能是否正常工作
4. 监控性能和用户反馈

### 维护要点
1. **数据更新**：当添加新场景时，需要更新场景数据文件
2. **性能监控**：定期检查算法性能和用户体验
3. **功能扩展**：根据用户反馈添加新功能
4. **兼容性维护**：确保与krpano版本更新的兼容性

这个实现方案提供了完整的路线规划功能，从基础的UI设计到复杂的算法实现，都有详细的规划和代码示例。可以根据实际需求调整优先级和功能范围。