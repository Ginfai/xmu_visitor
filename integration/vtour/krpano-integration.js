/**
 * krpano与搜索路线规划系统的集成脚本
 * Refactored for Modular HTML UI
 */

// 全局变量
let krpanoInstance = null;
let searchEngine = null;

// The scene data is now loaded from route_planning/scene_data.js
// Make sure allSceneData is defined in that file.


/**
 * 初始化krpano集成
 */
function initKrpanoIntegration(krpano_interface) {
    if (!krpano_interface) {
        console.error("krpano integration failed: krpano_interface object is missing.");
        return;
    }
    krpanoInstance = krpano_interface;

    initSearchEngine();
    loadHtmlUi(); // Dynamically load the UI

    console.log('krpano集成初始化完成');
}

/**
 * Dynamically loads the search panel HTML and sets up listeners.
 */
function loadHtmlUi() {
    fetch('search_panel.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('ui-container').innerHTML = html;
            console.log('Search panel UI loaded.');
            // After loading, setup the event listeners
            setupPanelEventListeners();
        })
        .catch(error => {
            console.error('Failed to load search panel UI:', error);
        });
}

/**
 * Shows the HTML search panel.
 */
function showSearchPanel() {
    const panel = document.getElementById('search-panel');
    if (panel) {
        panel.style.display = 'block';
    }
}

/**
 * Hides the HTML search panel.
 */
function hideSearchPanel() {
    const panel = document.getElementById('search-panel');
    if (panel) {
        panel.style.display = 'none';
    }
}

/**
 * Toggles the visibility of the HTML search panel.
 * This function will be called from krpano.
 */
function toggleHtmlSearchPanel() {
    const panel = document.getElementById('search-panel');
    if (panel) {
        const isVisible = panel.style.display === 'block';
        panel.style.display = isVisible ? 'none' : 'block';
    }
}


/**
 * Sets up event listeners for the loaded HTML panel.
 */
function setupPanelEventListeners() {
    const planRouteBtn = document.getElementById('plan-route-btn');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const startPointInput = document.getElementById('start-point');
    const endPointInput = document.getElementById('end-point');
    const startPointSuggestions = document.getElementById('start-point-suggestions');
    const endPointSuggestions = document.getElementById('end-point-suggestions');


    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', hideSearchPanel);
    }

    if (planRouteBtn && startPointInput && endPointInput) {
        planRouteBtn.addEventListener('click', () => {
            const startText = startPointInput.value;
            const endText = endPointInput.value;

            if (startText && endText) {
                console.log('Planning route from HTML panel:', startText, '->', endText);
                planRouteFromKrpano(startText, endText);
                hideSearchPanel(); // Hide panel after planning
            } else {
                alert('请输入起点和终点');
            }
        });
    }

    // Autocomplete listeners
    if (startPointInput && startPointSuggestions) {
        startPointInput.addEventListener('input', () => {
            showSuggestions(startPointInput, startPointSuggestions);
        });
        startPointInput.addEventListener('blur', () => {
            // Delay hiding to allow click event on suggestion to fire
            setTimeout(() => {
                startPointSuggestions.style.display = 'none';
            }, 200);
        });
    }

    if (endPointInput && endPointSuggestions) {
        endPointInput.addEventListener('input', () => {
            showSuggestions(endPointInput, endPointSuggestions);
        });
        endPointInput.addEventListener('blur', () => {
            setTimeout(() => {
                endPointSuggestions.style.display = 'none';
            }, 200);
        });
    }
}

/**
 * Shows autocomplete suggestions for a given input.
 * @param {HTMLInputElement} inputElement The input field.
 * @param {HTMLDivElement} suggestionsContainer The container to show suggestions in.
 */
function showSuggestions(inputElement, suggestionsContainer) {
    const query = inputElement.value;

    if (!query || query.trim().length === 0) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.innerHTML = '';
        return;
    }

    const results = searchEngine.search(query);
    suggestionsContainer.innerHTML = ''; // Clear previous suggestions

    if (results.length > 0) {
        results.forEach(scene => {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.textContent = scene.name;
            suggestionDiv.addEventListener('mousedown', (e) => {
                // Use mousedown to prevent blur event from hiding the list before click is registered
                e.preventDefault();
                inputElement.value = scene.name;
                suggestionsContainer.style.display = 'none';
                suggestionsContainer.innerHTML = '';
            });
            suggestionsContainer.appendChild(suggestionDiv);
        });
        suggestionsContainer.style.display = 'block';
    } else {
        suggestionsContainer.style.display = 'none';
    }
}


/**
 * 初始化搜索引擎
 */
function initSearchEngine() {
    if (typeof allSceneData === 'undefined' || !allSceneData) {
        console.error("Scene data (allSceneData) is not loaded or empty.");
        return;
    }
    // This search engine logic remains largely the same.
    searchEngine = {
        scenes: Object.values(allSceneData),
        search: function(query, limit = 5) {
             if (!query || !query.trim()) return [];
            const queryLower = query.toLowerCase().trim();
            const scoredResults = this.scenes.map(scene => {
                let score = 0;
                if (scene.name.toLowerCase().includes(queryLower)) {
                    score += 50;
                }
                const keywordMatches = scene.keywords.filter(k => k.toLowerCase().includes(queryLower)).length;
                score += keywordMatches * 20;
                if (scene.importance) { // Check if importance exists
                    score += scene.importance * 2;
                }
                return { ...scene, score };
            });
            return scoredResults.filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
        },
        getSceneById: function(sceneId) {
            return this.scenes.find(scene => scene.id === sceneId) || null;
        },
        calculateDistance: function(sceneId1, sceneId2) {
            const scene1 = this.getSceneById(sceneId1);
            const scene2 = this.getSceneById(sceneId2);
            if (!scene1 || !scene2) return Infinity;
            const dx = scene2.mapPosition.x - scene1.mapPosition.x;
            const dy = scene2.mapPosition.y - scene1.mapPosition.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
    };
    console.log(`搜索引擎初始化完成，共加载 ${searchEngine.scenes.length} 个场景`);
}

/**
 * 从krpano调用路线规划
 */
function planRouteFromKrpano(startText, endText) {
    const startResults = searchEngine.search(startText, 1);
    const endResults = searchEngine.search(endText, 1);

    if (startResults.length === 0 || endResults.length === 0) {
        krpanoInstance.call('trace("HTML UI: 无法找到匹配的场景")');
        return;
    }

    const startScene = startResults[0];
    const endScene = endResults[0];

    // Simple straight line for now, can be replaced with a proper pathfinding algorithm
    const route = {
        path: [startScene, endScene],
        distance: searchEngine.calculateDistance(startScene.id, endScene.id)
    };

    if (route) {
        console.log("Route found:", route);
        // Call a krpano action to show the route on the map
        const routeDataString = JSON.stringify({
             start: startScene,
             end: endScene,
             path: route.path.map(p => p.id)
        });
        krpanoInstance.call(`show_route_on_map('${routeDataString}');`);

    } else {
        krpanoInstance.call('trace("HTML UI: 无法计算路线")');
    }
}


// 导出全局函数供krpano和HTML调用
window.krpanoIntegration = {
    init: initKrpanoIntegration,
    // Make the toggle function available globally so krpano can call it via js()
    toggleHtmlSearchPanel: toggleHtmlSearchPanel
};
