/**
 * 搜索UI控制器 - 处理搜索界面的交互逻辑
 */
class SearchUIController {
    constructor() {
        this.startInput = null;
        this.endInput = null;
        this.startSuggestions = null;
        this.endSuggestions = null;
        this.currentActiveInput = null;
        this.selectedStartScene = null;
        this.selectedEndScene = null;
        
        this.init();
    }

    /**
     * 初始化搜索UI
     */
    init() {
        this.bindElements();
        this.bindEvents();
        this.setupKeyboardNavigation();
    }

    /**
     * 绑定DOM元素
     */
    bindElements() {
        this.startInput = document.getElementById('start-point');
        this.endInput = document.getElementById('end-point');
        this.startSuggestions = document.getElementById('start-suggestions');
        this.endSuggestions = document.getElementById('end-suggestions');
        this.startClear = document.getElementById('start-clear');
        this.endClear = document.getElementById('end-clear');
        this.planButton = document.getElementById('plan-route');
        this.clearButton = document.getElementById('clear-route');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 输入框事件
        this.startInput.addEventListener('input', (e) => this.handleInput(e, 'start'));
        this.endInput.addEventListener('input', (e) => this.handleInput(e, 'end'));
        
        this.startInput.addEventListener('focus', (e) => this.handleFocus(e, 'start'));
        this.endInput.addEventListener('focus', (e) => this.handleFocus(e, 'end'));
        
        this.startInput.addEventListener('blur', (e) => this.handleBlur(e, 'start'));
        this.endInput.addEventListener('blur', (e) => this.handleBlur(e, 'end'));

        // 清除按钮事件
        this.startClear.addEventListener('click', (e) => this.clearInput('start'));
        this.endClear.addEventListener('click', (e) => this.clearInput('end'));

        // 建议项点击事件
        this.startSuggestions.addEventListener('click', (e) => this.handleSuggestionClick(e, 'start'));
        this.endSuggestions.addEventListener('click', (e) => this.handleSuggestionClick(e, 'end'));

        // 操作按钮事件
        this.planButton.addEventListener('click', () => this.handlePlanRoute());
        this.clearButton.addEventListener('click', () => this.handleClearRoute());

        // 快速操作事件
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAction(e));
        });

        // 面板切换事件
        document.getElementById('panel-toggle').addEventListener('click', () => {
            this.togglePanel();
        });
    }

    /**
     * 设置键盘导航
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.currentActiveInput) {
                this.handleKeyboardNavigation(e);
            }
        });
    }

    /**
     * 处理输入事件
     * @param {Event} e - 输入事件
     * @param {string} type - 输入类型 ('start' 或 'end')
     */
    handleInput(e, type) {
        const query = e.target.value.trim();
        const suggestionsContainer = type === 'start' ? this.startSuggestions : this.endSuggestions;
        
        if (query.length === 0) {
            this.hideSuggestions(type);
            this.clearSelection(type);
            return;
        }

        if (query.length < 2) {
            this.hideSuggestions(type);
            return;
        }

        // 防抖搜索
        window.searchEngine.debouncedSearch(query, (results) => {
            this.showSuggestions(results, type);
        });
    }

    /**
     * 处理焦点事件
     * @param {Event} e - 焦点事件
     * @param {string} type - 输入类型
     */
    handleFocus(e, type) {
        this.currentActiveInput = type;
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
            const results = window.searchEngine.search(query);
            this.showSuggestions(results, type);
        }
    }

    /**
     * 处理失焦事件
     * @param {Event} e - 失焦事件
     * @param {string} type - 输入类型
     */
    handleBlur(e, type) {
        // 延迟隐藏建议，允许点击建议项
        setTimeout(() => {
            this.hideSuggestions(type);
            this.currentActiveInput = null;
        }, 200);
    }

    /**
     * 显示搜索建议
     * @param {Array} results - 搜索结果
     * @param {string} type - 输入类型
     */
    showSuggestions(results, type) {
        const suggestionsContainer = type === 'start' ? this.startSuggestions : this.endSuggestions;
        
        if (results.length === 0) {
            this.hideSuggestions(type);
            return;
        }

        const html = results.map((result, index) => `
            <div class="suggestion-item" data-scene-id="${result.id}" data-index="${index}">
                <span class="suggestion-icon">${this.getCategoryIcon(result.category)}</span>
                <div class="suggestion-content">
                    <div class="suggestion-name">${window.searchEngine.highlightQuery(result.name, this.getCurrentQuery(type))}</div>
                    <div class="suggestion-description">${result.description}</div>
                </div>
                <div class="suggestion-distance">${result.category}</div>
            </div>
        `).join('');

        suggestionsContainer.innerHTML = html;
        suggestionsContainer.classList.add('show');
    }

    /**
     * 隐藏搜索建议
     * @param {string} type - 输入类型
     */
    hideSuggestions(type) {
        const suggestionsContainer = type === 'start' ? this.startSuggestions : this.endSuggestions;
        suggestionsContainer.classList.remove('show');
    }

    /**
     * 处理建议项点击
     * @param {Event} e - 点击事件
     * @param {string} type - 输入类型
     */
    handleSuggestionClick(e, type) {
        const suggestionItem = e.target.closest('.suggestion-item');
        if (!suggestionItem) return;

        const sceneId = suggestionItem.dataset.sceneId;
        const scene = window.searchEngine.getSceneById(sceneId);
        
        if (scene) {
            this.selectScene(scene, type);
            this.hideSuggestions(type);
        }
    }

    /**
     * 选择场景
     * @param {Object} scene - 场景对象
     * @param {string} type - 输入类型
     */
    selectScene(scene, type) {
        const input = type === 'start' ? this.startInput : this.endInput;
        
        input.value = scene.name;
        
        if (type === 'start') {
            this.selectedStartScene = scene;
        } else {
            this.selectedEndScene = scene;
        }

        this.updatePlanButtonState();
        this.showSceneInfo(scene, type);
    }

    /**
     * 清除输入
     * @param {string} type - 输入类型
     */
    clearInput(type) {
        const input = type === 'start' ? this.startInput : this.endInput;
        input.value = '';
        
        if (type === 'start') {
            this.selectedStartScene = null;
        } else {
            this.selectedEndScene = null;
        }

        this.hideSuggestions(type);
        this.updatePlanButtonState();
        this.hideSceneInfo(type);
    }

    /**
     * 清除选择
     * @param {string} type - 输入类型
     */
    clearSelection(type) {
        if (type === 'start') {
            this.selectedStartScene = null;
        } else {
            this.selectedEndScene = null;
        }
        
        this.updatePlanButtonState();
        this.hideSceneInfo(type);
    }

    /**
     * 更新规划按钮状态
     */
    updatePlanButtonState() {
        const canPlan = this.selectedStartScene && this.selectedEndScene;
        this.planButton.disabled = !canPlan;
        
        if (canPlan) {
            this.planButton.classList.add('ready');
        } else {
            this.planButton.classList.remove('ready');
        }
    }

    /**
     * 显示场景信息
     * @param {Object} scene - 场景对象
     * @param {string} type - 输入类型
     */
    showSceneInfo(scene, type) {
        // 这里可以添加场景信息的显示逻辑
        console.log(`Selected ${type} scene:`, scene);
    }

    /**
     * 隐藏场景信息
     * @param {string} type - 输入类型
     */
    hideSceneInfo(type) {
        // 这里可以添加隐藏场景信息的逻辑
        console.log(`Cleared ${type} scene`);
    }

    /**
     * 处理键盘导航
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyboardNavigation(e) {
        const suggestionsContainer = this.currentActiveInput === 'start' ? 
            this.startSuggestions : this.endSuggestions;
        
        if (!suggestionsContainer.classList.contains('show')) return;

        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
        const activeItem = suggestionsContainer.querySelector('.suggestion-item.active');
        let activeIndex = -1;

        if (activeItem) {
            activeIndex = parseInt(activeItem.dataset.index);
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, items.length - 1);
                this.setActiveSuggestion(items, activeIndex);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                this.setActiveSuggestion(items, activeIndex);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (activeItem) {
                    activeItem.click();
                }
                break;
                
            case 'Escape':
                this.hideSuggestions(this.currentActiveInput);
                break;
        }
    }

    /**
     * 设置活动建议项
     * @param {NodeList} items - 建议项列表
     * @param {number} index - 活动索引
     */
    setActiveSuggestion(items, index) {
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }

    /**
     * 获取当前查询
     * @param {string} type - 输入类型
     * @returns {string} 查询字符串
     */
    getCurrentQuery(type) {
        const input = type === 'start' ? this.startInput : this.endInput;
        return input.value.trim();
    }

    /**
     * 获取类别图标
     * @param {string} category - 类别
     * @returns {string} 图标
     */
    getCategoryIcon(category) {
        const icons = {
            '公共区域': '🏛️',
            '展览区域': '🖼️',
            '教育区域': '📚',
            '服务区域': '🛍️',
            '体验区域': '🎮'
        };
        return icons[category] || '📍';
    }

    /**
     * 处理规划路线
     */
    handlePlanRoute() {
        if (!this.selectedStartScene || !this.selectedEndScene) {
            return;
        }

        console.log('Planning route from:', this.selectedStartScene.name, 'to:', this.selectedEndScene.name);
        
        // 这里将调用路线规划算法
        if (window.routeUI) {
            window.routeUI.planRoute(this.selectedStartScene.id, this.selectedEndScene.id);
        }
    }

    /**
     * 处理清除路线
     */
    handleClearRoute() {
        this.clearInput('start');
        this.clearInput('end');
        
        if (window.routeUI) {
            window.routeUI.clearRoute();
        }
    }

    /**
     * 处理快速操作
     * @param {Event} e - 点击事件
     */
    handleQuickAction(e) {
        const action = e.currentTarget.dataset.action;
        
        switch (action) {
            case 'reverse':
                this.reverseStartEnd();
                break;
            case 'current':
                this.setCurrentPosition();
                break;
        }
    }

    /**
     * 交换起终点
     */
    reverseStartEnd() {
        const tempScene = this.selectedStartScene;
        const tempValue = this.startInput.value;
        
        this.selectedStartScene = this.selectedEndScene;
        this.selectedEndScene = tempScene;
        
        this.startInput.value = this.endInput.value;
        this.endInput.value = tempValue;
        
        this.updatePlanButtonState();
    }

    /**
     * 设置为当前位置
     */
    setCurrentPosition() {
        // 这里需要获取当前场景信息
        const currentScene = this.getCurrentScene();
        if (currentScene) {
            this.selectScene(currentScene, 'start');
        }
    }

    /**
     * 获取当前场景
     * @returns {Object|null} 当前场景
     */
    getCurrentScene() {
        // 这里需要与krpano集成获取当前场景
        // 暂时返回null
        return null;
    }

    /**
     * 切换面板显示状态
     */
    togglePanel() {
        const panel = document.getElementById('route-planning-panel');
        panel.classList.toggle('collapsed');
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        document.getElementById('loading-overlay').classList.add('show');
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('show');
    }
}

// 创建全局搜索UI控制器实例
window.searchUI = new SearchUIController();