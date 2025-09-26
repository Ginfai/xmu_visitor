/**
 * 搜索引擎 - 处理场景搜索和自动补全功能
 */
class SearchEngine {
    constructor() {
        this.scenes = [];
        this.searchIndex = [];
        this.currentQuery = '';
        this.debounceTimer = null;
        this.debounceDelay = 300; // 防抖延迟
        
        // 初始化场景数据
        this.initSceneData();
    }

    /**
     * 初始化场景数据
     */
    initSceneData() {
        // 模拟场景数据 - 实际使用时从tour.xml或API获取
        this.scenes = [
            {
                id: 'scene_001',
                name: '入口大厅',
                description: '博物馆主入口，设有咨询台和导览服务',
                keywords: ['入口', '大厅', '前台', '咨询', '导览', '主入口'],
                category: '公共区域',
                mapPosition: { x: 100, y: 200 },
                importance: 5,
                estimatedVisitTime: 5
            },
            {
                id: 'scene_002',
                name: '古代文物展厅',
                description: '展示古代文物和历史文化',
                keywords: ['古代', '文物', '历史', '文化', '古董', '展品'],
                category: '展览区域',
                mapPosition: { x: 200, y: 150 },
                importance: 4,
                estimatedVisitTime: 15
            },
            {
                id: 'scene_003',
                name: '现代艺术画廊',
                description: '现代艺术作品展示空间',
                keywords: ['现代', '艺术', '画廊', '绘画', '雕塑', '当代'],
                category: '展览区域',
                mapPosition: { x: 300, y: 180 },
                importance: 4,
                estimatedVisitTime: 12
            },
            {
                id: 'scene_004',
                name: '临时展览厅',
                description: '举办临时展览和特别活动',
                keywords: ['临时', '展览', '特别', '活动', '特展'],
                category: '展览区域',
                mapPosition: { x: 250, y: 250 },
                importance: 3,
                estimatedVisitTime: 10
            },
            {
                id: 'scene_005',
                name: '教育中心',
                description: '教育讲座和互动学习区域',
                keywords: ['教育', '讲座', '学习', '互动', '培训', '课程'],
                category: '教育区域',
                mapPosition: { x: 150, y: 300 },
                importance: 3,
                estimatedVisitTime: 8
            },
            {
                id: 'scene_006',
                name: '咖啡厅',
                description: '休息和用餐区域',
                keywords: ['咖啡', '休息', '用餐', '餐厅', '饮品', '食物'],
                category: '服务区域',
                mapPosition: { x: 180, y: 120 },
                importance: 2,
                estimatedVisitTime: 5
            },
            {
                id: 'scene_007',
                name: '纪念品商店',
                description: '博物馆纪念品和文创产品',
                keywords: ['纪念品', '商店', '文创', '礼品', '购买', '商品'],
                category: '服务区域',
                mapPosition: { x: 120, y: 80 },
                importance: 2,
                estimatedVisitTime: 3
            },
            {
                id: 'scene_008',
                name: '多媒体体验区',
                description: '互动多媒体展示和体验',
                keywords: ['多媒体', '互动', '体验', '科技', '数字', 'VR'],
                category: '体验区域',
                mapPosition: { x: 350, y: 200 },
                importance: 4,
                estimatedVisitTime: 10
            }
        ];

        this.buildSearchIndex();
    }

    /**
     * 构建搜索索引
     */
    buildSearchIndex() {
        this.searchIndex = this.scenes.map(scene => ({
            id: scene.id,
            name: scene.name,
            description: scene.description,
            keywords: scene.keywords,
            category: scene.category,
            searchText: [
                scene.name,
                scene.description,
                ...scene.keywords,
                scene.category
            ].join(' ').toLowerCase(),
            importance: scene.importance,
            mapPosition: scene.mapPosition
        }));
    }

    /**
     * 搜索场景
     * @param {string} query - 搜索查询
     * @param {number} limit - 结果数量限制
     * @returns {Array} 搜索结果
     */
    search(query, limit = 5) {
        if (!query || !query.trim()) {
            return [];
        }

        const queryLower = query.toLowerCase().trim();
        const queryWords = queryLower.split(/\s+/);

        // 计算每个场景的匹配分数
        const scoredResults = this.searchIndex.map(item => {
            let score = 0;
            let matchType = 'none';

            // 精确匹配名称
            if (item.name.toLowerCase() === queryLower) {
                score += 100;
                matchType = 'exact';
            }
            // 名称包含查询
            else if (item.name.toLowerCase().includes(queryLower)) {
                score += 50;
                matchType = 'name';
            }
            // 关键词匹配
            else {
                const keywordMatches = item.keywords.filter(keyword => 
                    keyword.toLowerCase().includes(queryLower)
                ).length;
                score += keywordMatches * 20;

                // 描述匹配
                if (item.description.toLowerCase().includes(queryLower)) {
                    score += 10;
                }

                // 多词匹配
                const wordMatches = queryWords.filter(word => 
                    item.searchText.includes(word)
                ).length;
                score += wordMatches * 5;

                matchType = 'keyword';
            }

            // 重要性加权
            score += item.importance * 2;

            return {
                ...item,
                score,
                matchType
            };
        });

        // 过滤和排序结果
        return scoredResults
            .filter(item => item.score > 0)
            .sort((a, b) => {
                // 先按匹配类型排序
                const typeOrder = { exact: 0, name: 1, keyword: 2 };
                const typeDiff = typeOrder[a.matchType] - typeOrder[b.matchType];
                if (typeDiff !== 0) return typeDiff;
                
                // 再按分数排序
                return b.score - a.score;
            })
            .slice(0, limit);
    }

    /**
     * 防抖搜索
     * @param {string} query - 搜索查询
     * @param {Function} callback - 回调函数
     */
    debouncedSearch(query, callback) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const results = this.search(query);
            callback(results);
        }, this.debounceDelay);
    }

    /**
     * 获取场景详情
     * @param {string} sceneId - 场景ID
     * @returns {Object|null} 场景详情
     */
    getSceneById(sceneId) {
        return this.scenes.find(scene => scene.id === sceneId) || null;
    }

    /**
     * 获取场景建议（用于自动补全）
     * @param {string} query - 查询字符串
     * @returns {Array} 建议列表
     */
    getSuggestions(query) {
        const results = this.search(query, 8);
        return results.map(result => ({
            id: result.id,
            name: result.name,
            description: result.description,
            category: result.category,
            matchType: result.matchType,
            score: result.score
        }));
    }

    /**
     * 高亮搜索关键词
     * @param {string} text - 原始文本
     * @param {string} query - 搜索查询
     * @returns {string} 高亮后的HTML
     */
    highlightQuery(text, query) {
        if (!query || !text) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    /**
     * 计算两个场景间的距离
     * @param {string} sceneId1 - 场景1 ID
     * @param {string} sceneId2 - 场景2 ID
     * @returns {number} 距离
     */
    calculateDistance(sceneId1, sceneId2) {
        const scene1 = this.getSceneById(sceneId1);
        const scene2 = this.getSceneById(sceneId2);
        
        if (!scene1 || !scene2) return Infinity;
        
        const dx = scene2.mapPosition.x - scene1.mapPosition.x;
        const dy = scene2.mapPosition.y - scene1.mapPosition.y;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 获取所有场景
     * @returns {Array} 场景列表
     */
    getAllScenes() {
        return this.scenes.map(scene => ({
            id: scene.id,
            name: scene.name,
            description: scene.description,
            category: scene.category,
            mapPosition: scene.mapPosition
        }));
    }

    /**
     * 按类别获取场景
     * @param {string} category - 类别
     * @returns {Array} 场景列表
     */
    getScenesByCategory(category) {
        return this.scenes
            .filter(scene => scene.category === category)
            .map(scene => ({
                id: scene.id,
                name: scene.name,
                description: scene.description,
                mapPosition: scene.mapPosition
            }));
    }

    /**
     * 获取热门场景（按重要性排序）
     * @param {number} limit - 数量限制
     * @returns {Array} 热门场景列表
     */
    getPopularScenes(limit = 5) {
        return this.scenes
            .sort((a, b) => b.importance - a.importance)
            .slice(0, limit)
            .map(scene => ({
                id: scene.id,
                name: scene.name,
                description: scene.description,
                category: scene.category,
                importance: scene.importance,
                mapPosition: scene.mapPosition
            }));
    }
}

// 创建全局搜索引擎实例
window.searchEngine = new SearchEngine();