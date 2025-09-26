/**
 * 路线UI控制器 - 处理路线显示和交互
 */
class RouteUIController {
    constructor() {
        this.currentRoute = null;
        this.routeSteps = [];
        this.routeResult = null;
        
        this.init();
    }

    /**
     * 初始化路线UI
     */
    init() {
        this.bindElements();
        this.bindEvents();
    }

    /**
     * 绑定DOM元素
     */
    bindElements() {
        this.routeResult = document.getElementById('route-result');
        this.routeSteps = document.getElementById('route-steps');
        this.routeDistance = document.getElementById('route-distance');
        this.routeTime = document.getElementById('route-time');
        this.routeScenes = document.getElementById('route-scenes');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 路线步骤点击事件
        this.routeSteps.addEventListener('click', (e) => {
            const stepElement = e.target.closest('.route-step');
            if (stepElement) {
                this.handleStepClick(stepElement);
            }
        });
    }

    /**
     * 规划路线
     * @param {string} startSceneId - 起点场景ID
     * @param {string} endSceneId - 终点场景ID
     */
    planRoute(startSceneId, endSceneId) {
        console.log('Planning route from', startSceneId, 'to', endSceneId);
        
        // 显示加载状态
        window.searchUI.showLoading();
        
        // 模拟路径规划算法
        setTimeout(() => {
            const route = this.calculateRoute(startSceneId, endSceneId);
            this.displayRoute(route);
            window.searchUI.hideLoading();
        }, 1000);
    }

    /**
     * 计算路线（模拟算法）
     * @param {string} startSceneId - 起点场景ID
     * @param {string} endSceneId - 终点场景ID
     * @returns {Object} 路线对象
     */
    calculateRoute(startSceneId, endSceneId) {
        // 这里应该调用实际的路径规划算法
        // 现在使用模拟数据
        
        const startScene = window.searchEngine.getSceneById(startSceneId);
        const endScene = window.searchEngine.getSceneById(endSceneId);
        
        if (!startScene || !endScene) {
            return null;
        }

        // 模拟路径计算
        const allScenes = window.searchEngine.getAllScenes();
        const path = this.findShortestPath(startSceneId, endSceneId, allScenes);
        
        return {
            start: startScene,
            end: endScene,
            path: path,
            distance: this.calculateTotalDistance(path),
            estimatedTime: this.calculateEstimatedTime(path),
            steps: this.generateRouteSteps(path)
        };
    }

    /**
     * 查找最短路径（简化的Dijkstra算法）
     * @param {string} startId - 起点ID
     * @param {string} endId - 终点ID
     * @param {Array} scenes - 场景列表
     * @returns {Array} 路径数组
     */
    findShortestPath(startId, endId, scenes) {
        // 简化的路径查找算法
        // 实际实现应该使用完整的图算法
        
        const startScene = scenes.find(s => s.id === startId);
        const endScene = scenes.find(s => s.id === endId);
        
        if (!startScene || !endScene) {
            return [];
        }

        // 简单的直线路径（实际应该考虑场景连接关系）
        const path = [startId];
        
        // 添加中间场景（简化处理）
        const middleScenes = scenes.filter(s => 
            s.id !== startId && s.id !== endId
        ).slice(0, 2); // 最多添加2个中间场景
        
        middleScenes.forEach(scene => {
            path.push(scene.id);
        });
        
        path.push(endId);
        
        return path;
    }

    /**
     * 计算总距离
     * @param {Array} path - 路径数组
     * @returns {number} 总距离
     */
    calculateTotalDistance(path) {
        let totalDistance = 0;
        
        for (let i = 0; i < path.length - 1; i++) {
            const distance = window.searchEngine.calculateDistance(path[i], path[i + 1]);
            totalDistance += distance;
        }
        
        return Math.round(totalDistance);
    }

    /**
     * 计算预估时间
     * @param {Array} path - 路径数组
     * @returns {number} 预估时间（分钟）
     */
    calculateEstimatedTime(path) {
        let totalTime = 0;
        
        for (let i = 0; i < path.length; i++) {
            const scene = window.searchEngine.getSceneById(path[i]);
            if (scene) {
                totalTime += scene.estimatedVisitTime || 5;
            }
        }
        
        return totalTime;
    }

    /**
     * 生成路线步骤
     * @param {Array} path - 路径数组
     * @returns {Array} 步骤数组
     */
    generateRouteSteps(path) {
        return path.map((sceneId, index) => {
            const scene = window.searchEngine.getSceneById(sceneId);
            const nextScene = index < path.length - 1 ? 
                window.searchEngine.getSceneById(path[index + 1]) : null;
            
            let distance = 0;
            if (nextScene) {
                distance = window.searchEngine.calculateDistance(sceneId, path[index + 1]);
            }
            
            return {
                stepNumber: index + 1,
                sceneId: sceneId,
                sceneName: scene.name,
                sceneDescription: scene.description,
                sceneCategory: scene.category,
                distance: Math.round(distance),
                isLast: index === path.length - 1
            };
        });
    }

    /**
     * 显示路线
     * @param {Object} route - 路线对象
     */
    displayRoute(route) {
        if (!route) {
            this.showError('无法计算路线，请检查起点和终点');
            return;
        }

        this.currentRoute = route;
        
        // 更新路线信息
        this.updateRouteInfo(route);
        
        // 显示路线步骤
        this.displayRouteSteps(route.steps);
        
        // 显示路线结果面板
        this.routeResult.classList.add('show');
        
        // 在地图上显示路径
        this.showRouteOnMap(route);
        
        // 启用清除按钮
        document.getElementById('clear-route').disabled = false;
    }

    /**
     * 更新路线信息
     * @param {Object} route - 路线对象
     */
    updateRouteInfo(route) {
        this.routeDistance.textContent = `${route.distance} 单位`;
        this.routeTime.textContent = `${route.estimatedTime} 分钟`;
        this.routeScenes.textContent = `${route.steps.length} 个场景`;
    }

    /**
     * 显示路线步骤
     * @param {Array} steps - 步骤数组
     */
    displayRouteSteps(steps) {
        const html = steps.map(step => `
            <div class="route-step" data-scene-id="${step.sceneId}">
                <div class="step-number">${step.stepNumber}</div>
                <div class="step-content">
                    <div class="step-name">${step.sceneName}</div>
                    <div class="step-description">${step.sceneDescription}</div>
                </div>
                ${!step.isLast ? `<div class="step-distance">${step.distance}单位</div>` : ''}
            </div>
        `).join('');

        this.routeSteps.innerHTML = html;
    }

    /**
     * 在地图上显示路径
     * @param {Object} route - 路线对象
     */
    showRouteOnMap(route) {
        // 这里需要与krpano集成，在地图上显示路径
        console.log('Showing route on map:', route);
        
        // 模拟地图显示
        this.highlightScenesOnMap(route.path);
    }

    /**
     * 在地图上高亮场景
     * @param {Array} sceneIds - 场景ID数组
     */
    highlightScenesOnMap(sceneIds) {
        console.log('Highlighting scenes on map:', sceneIds);
        
        // 这里需要调用krpano API来高亮场景
        // 例如：krpano.call(`highlight_scenes(${JSON.stringify(sceneIds)})`);
    }

    /**
     * 处理步骤点击
     * @param {HTMLElement} stepElement - 步骤元素
     */
    handleStepClick(stepElement) {
        const sceneId = stepElement.dataset.sceneId;
        const scene = window.searchEngine.getSceneById(sceneId);
        
        if (scene) {
            this.navigateToScene(sceneId);
        }
    }

    /**
     * 导航到指定场景
     * @param {string} sceneId - 场景ID
     */
    navigateToScene(sceneId) {
        console.log('Navigating to scene:', sceneId);
        
        // 这里需要与krpano集成，跳转到指定场景
        // 例如：krpano.call(`loadscene(${sceneId})`);
        
        // 更新当前步骤的高亮状态
        this.updateActiveStep(sceneId);
    }

    /**
     * 更新活动步骤
     * @param {string} sceneId - 场景ID
     */
    updateActiveStep(sceneId) {
        // 移除所有活动状态
        this.routeSteps.querySelectorAll('.route-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // 添加当前活动状态
        const activeStep = this.routeSteps.querySelector(`[data-scene-id="${sceneId}"]`);
        if (activeStep) {
            activeStep.classList.add('active');
        }
    }

    /**
     * 清除路线
     */
    clearRoute() {
        this.currentRoute = null;
        
        // 隐藏路线结果面板
        this.routeResult.classList.remove('show');
        
        // 清除路线步骤
        this.routeSteps.innerHTML = '';
        
        // 清除地图上的路径显示
        this.clearRouteOnMap();
        
        // 禁用清除按钮
        document.getElementById('clear-route').disabled = true;
        
        console.log('Route cleared');
    }

    /**
     * 清除地图上的路径显示
     */
    clearRouteOnMap() {
        console.log('Clearing route on map');
        
        // 这里需要调用krpano API来清除路径显示
        // 例如：krpano.call('clear_route_display()');
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    showError(message) {
        console.error('Route planning error:', message);
        
        // 这里可以显示用户友好的错误提示
        alert(message);
    }

    /**
     * 获取当前路线
     * @returns {Object|null} 当前路线
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * 检查是否有活动路线
     * @returns {boolean} 是否有活动路线
     */
    hasActiveRoute() {
        return this.currentRoute !== null;
    }

    /**
     * 导出路线
     * @returns {Object|null} 路线数据
     */
    exportRoute() {
        if (!this.currentRoute) {
            return null;
        }

        return {
            start: this.currentRoute.start,
            end: this.currentRoute.end,
            path: this.currentRoute.path,
            distance: this.currentRoute.distance,
            estimatedTime: this.currentRoute.estimatedTime,
            steps: this.currentRoute.steps,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 导入路线
     * @param {Object} routeData - 路线数据
     */
    importRoute(routeData) {
        if (!routeData || !routeData.path) {
            this.showError('无效的路线数据');
            return;
        }

        this.displayRoute(routeData);
    }
}

// 创建全局路线UI控制器实例
window.routeUI = new RouteUIController();