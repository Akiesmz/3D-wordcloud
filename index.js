'use strict';

// 配置参数
const config = {
    baseAngle: Math.PI / 1440, // 进一步降低基础旋转角度
    radius: 180, // 调整球体半径
    focalLength: 500, // 增加焦距，防止变形
    initialSpeed: 0.2, // 降低初始速度
    damping: 0.98, // 增加阻尼，使运动更平滑
    maxSpeed: 1.5, // 降低最大速度
    autoRotationSpeed: 0.2, // 自动旋转的基础速度
    minFontSize: 12,
    maxFontSize: 30,
    colorSchemes: {
        default: ['#ff7676', '#76d8ff', '#ffde59', '#52fa5a', '#ac88ff', '#ff8cf0', '#5ce1e6'],
        warm: ['#ff7e5f', '#feb47b', '#ffcc5c', '#ff5f5f', '#ff9e7a', '#ffd175'],
        cool: ['#5ee7df', '#b490ca', '#63a4ff', '#79d1c3', '#6a7fdb', '#8c96e9'],
        monochrome: ['#ffffff', '#dddddd', '#bbbbbb', '#999999', '#777777', '#555555'],
        neon: ['#00FFFF', '#FF00FF', '#00FF00', '#FFFF00', '#FF0000', '#0000FF'],
        pastel: ['#FFB6C1', '#FFD700', '#98FB98', '#87CEFA', '#DDA0DD', '#FFDAB9']
    },
    currentColorScheme: 'default',
    zoomFactor: 1,
    rotationSpeed: 1
};

// 全局变量
let angleX = 0,
    angleY = 0;
let isDragging = false;
let lastMouseX, lastMouseY;
let velocityX = 0, velocityY = 0;
let isPaused = false;
let tagCloud = null;
let tooltip = null;
let cloudData = [];
let mouseX = 0, mouseY = 0;

/**
 * 词云初始化类
 */
class TagCloud {
    constructor(options) {
        this.container = options.container;
        this.data = options.data;
        this.tags = [];
        this.init();
    }

    /**
     * 初始化词云
     */
    init() {
        // 创建标签元素
        this.createTags();
        
        // 开始动画
        this.animate();
        
        // 设置事件监听
        this.setupEventListeners();
    }

    /**
     * 创建标签元素
     */
    createTags() {
        const container = this.container;
        container.innerHTML = ''; // 清空容器
        this.tags = []; // 重置标签数组
        
        // 找出最大和最小size值，用于归一化
        const sizes = this.data.map(item => item.size);
        const maxSize = Math.max(...sizes);
        const minSize = Math.min(...sizes);
        const sizeRange = maxSize - minSize;
        
        // 根据数据创建标签
        this.data.forEach((item, index) => {
            // 创建标签元素
            const tag = document.createElement('a');
            tag.className = 'tag';
            tag.href = '#';
            tag.textContent = item.text;
            
            // 计算球面坐标 - 使用斐波那契分布算法，更均匀
            const len = this.data.length;
            const phi = Math.acos(1 - 2 * (index + 0.5) / len);
            const theta = Math.PI * (3 - Math.sqrt(5)) * (index + 0.5);
            
            const z = config.radius * Math.cos(phi);
            const x = config.radius * Math.sin(phi) * Math.cos(theta);
            const y = config.radius * Math.sin(phi) * Math.sin(theta);
            
            // 根据size值确定颜色 - 大的标签使用更鲜艳的颜色
            const colorScheme = config.colorSchemes[config.currentColorScheme];
            // 根据size值选择颜色，使大的标签使用前面的颜色（通常更鲜艳）
            const normalizedSize = sizeRange ? (item.size - minSize) / sizeRange : 0.5;
            const colorIndex = Math.floor(normalizedSize * (colorScheme.length - 1));
            const color = colorScheme[colorIndex];
            tag.style.color = color;
            
            // 设置大小 - 根据词频调整大小，使用非线性映射使差异更明显
            const sizeRatio = sizeRange ? (item.size - minSize) / sizeRange : 0.5;
            const fontSizeRange = config.maxFontSize - config.minFontSize;
            // 使用平方根函数使小值也有合理大小
            const baseSize = config.minFontSize + fontSizeRange * Math.sqrt(sizeRatio);
            tag.style.fontSize = `${baseSize}px`;
            
            // 添加数据属性
            tag.dataset.size = item.size;
            tag.dataset.text = item.text;
            tag.dataset.index = index;
            
            // 添加到容器
            container.appendChild(tag);
            
            // 创建标签对象
            const tagObj = new Tag(tag, x, y, z, item.size);
            this.tags.push(tagObj);
            
            // 添加随机初始位置的小偏移，使启动动画更自然
            tagObj.x += (Math.random() - 0.5) * 20;
            tagObj.y += (Math.random() - 0.5) * 20;
            tagObj.z += (Math.random() - 0.5) * 20;
            
            // 初始位置
            tagObj.move();
        });
        
        // 添加颜色方案切换按钮
        this.addColorSchemeSelector();
    }
    
    /**
     * 添加颜色方案选择器
     */
    addColorSchemeSelector() {
        // 检查是否已存在
        if (document.getElementById('colorSchemeSelector')) {
            return;
        }
        
        const controls = document.querySelector('.controls');
        if (!controls) return;
        
        // 创建下拉选择器
        const selector = document.createElement('select');
        selector.id = 'colorSchemeSelector';
        selector.style.padding = '8px';
        selector.style.background = 'rgba(255,255,255,0.2)';
        selector.style.border = 'none';
        selector.style.borderRadius = '4px';
        selector.style.color = 'white';
        selector.style.cursor = 'pointer';
        selector.style.marginLeft = '10px';
        
        // 添加选项
        Object.keys(config.colorSchemes).forEach(scheme => {
            const option = document.createElement('option');
            option.value = scheme;
            option.textContent = scheme.charAt(0).toUpperCase() + scheme.slice(1);
            if (scheme === config.currentColorScheme) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
        
        // 添加事件监听
        selector.addEventListener('change', (e) => {
            const newScheme = e.target.value;
            this.updateColorScheme(newScheme);
        });
        
        // 添加到控制区
        controls.appendChild(selector);
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 标签鼠标悬停事件
        this.tags.forEach(tag => {
            tag.element.addEventListener('mouseover', (e) => {
                this.showTooltip(e, tag);
            });
            
            tag.element.addEventListener('mouseout', () => {
                this.hideTooltip();
            });
            
            tag.element.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleTagClick(tag);
            });
        });
    }

    /**
     * 显示工具提示
     */
    showTooltip(e, tag) {
        const tooltip = document.getElementById('tooltip');
        tooltip.textContent = `${tag.element.dataset.text} (权重: ${tag.element.dataset.size})`;
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY + 10}px`;
        tooltip.style.opacity = '1';
    }

    /**
     * 隐藏工具提示
     */
    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.opacity = '0';
    }

    /**
     * 处理标签点击
     */
    handleTagClick(tag) {
        // 点击标签时的特效
        tag.element.style.transform = `${tag.element.style.transform} scale(1.2)`;
        setTimeout(() => {
            tag.move(); // 恢复正常大小
        }, 300);
        
        // 这里可以添加更多点击操作，如显示详情等
        console.log(`标签点击: ${tag.element.dataset.text}, 权重: ${tag.element.dataset.size}`);
    }

    /**
     * X轴旋转
     */
    rotateX() {
        const cos = Math.cos(angleX * config.baseAngle),
              sin = Math.sin(angleX * config.baseAngle);
        
        this.tags.forEach(tag => {
            const y = tag.y * cos - tag.z * sin,
                  z = tag.z * cos + tag.y * sin;
            tag.y = y;
            tag.z = z;
        });
    }

    /**
     * Y轴旋转
     */
    rotateY() {
        const cos = Math.cos(angleY * config.baseAngle),
              sin = Math.sin(angleY * config.baseAngle);
        
        this.tags.forEach(tag => {
            const x = tag.x * cos - tag.z * sin,
                  z = tag.z * cos + tag.x * sin;
            tag.x = x;
            tag.z = z;
        });
    }

    /**
     * 动画循环
     */
    animate() {
        const that = this;
        let lastTime = 0;
        
        function loop(currentTime) {
            // 计算时间差，用于平滑动画
            const deltaTime = lastTime ? (currentTime - lastTime) / 16 : 1; // 标准化为16ms一帧
            lastTime = currentTime;
            
            if (!isPaused) {
                // 应用阻尼和速度限制
                velocityX = Math.min(config.maxSpeed, Math.max(-config.maxSpeed, velocityX * config.damping));
                velocityY = Math.min(config.maxSpeed, Math.max(-config.maxSpeed, velocityY * config.damping));
                
                // 自动旋转逻辑改进
                if (!isDragging) { // 只有在不拖拽时才应用自动旋转
                    // 如果速度很小，使用固定的自动旋转速度，而不是累加
                    if (Math.abs(velocityX) < 0.05) {
                        velocityX = 0.005 * config.autoRotationSpeed * config.rotationSpeed;
                    }
                    if (Math.abs(velocityY) < 0.05) {
                        velocityY = 0.002 * config.autoRotationSpeed * config.rotationSpeed;
                    }
                }
                
                // 根据时间差调整角度变化，使动画平滑
                angleX += velocityY * deltaTime;
                angleY += velocityX * deltaTime;
            }
            
            // 执行旋转
            that.rotateX();
            that.rotateY();
            
            // 更新标签位置
            that.tags.forEach(tag => tag.move());
            
            // 继续动画循环
            requestAnimationFrame(loop);
        }
        
        // 启动动画循环
        requestAnimationFrame(loop);
    }
    
    /**
     * 更新颜色方案
     */
    updateColorScheme(schemeName) {
        if (config.colorSchemes[schemeName]) {
            config.currentColorScheme = schemeName;
            const colorScheme = config.colorSchemes[schemeName];
            
            // 找出最大和最小size值，用于归一化
            const sizes = this.data.map(item => item.size);
            const maxSize = Math.max(...sizes);
            const minSize = Math.min(...sizes);
            const sizeRange = maxSize - minSize;
            
            this.tags.forEach((tag, index) => {
                const item = this.data[index];
                // 根据size值确定颜色
                const normalizedSize = sizeRange ? (item.size - minSize) / sizeRange : 0.5;
                const colorIndex = Math.floor(normalizedSize * (colorScheme.length - 1));
                const color = colorScheme[colorIndex];
                tag.element.style.color = color;
                
                // 添加过渡效果
                tag.element.style.transition = 'color 0.5s ease-in-out';
            });
            
            console.log(`颜色方案已更新为: ${schemeName}`);
        }
    }
    
    /**
     * 调整旋转速度
     */
    adjustSpeed(factor) {
        config.rotationSpeed *= factor;
    }
    
    /**
     * 重置词云
     */
    reset() {
        velocityX = 0;
        velocityY = 0;
        angleX = 0;
        angleY = 0;
        config.rotationSpeed = 1;
        isPaused = false;
        document.getElementById('pauseBtn').textContent = '暂停';
        
        // 重新创建标签
        this.createTags();
        this.setupEventListeners();
    }
}

/**
 * 标签类
 */
class Tag {
    constructor(element, x, y, z, size) {
        this.element = element;
        this.x = x;
        this.y = y;
        this.z = z;
        this.size = size;
    }

    /**
     * 移动标签到计算位置
     */
    move() {
        // 计算缩放和透明度 - 修正缩放计算
        const scale = config.focalLength / (config.focalLength - this.z * config.zoomFactor);
        const alpha = Math.max(0.3, Math.min(1, (this.z + config.radius) / (2 * config.radius)));
        
        // 计算基于size的字体大小 - 更平滑的缩放
        const baseSize = parseFloat(this.element.style.fontSize);
        const sizeScale = Math.max(0.7, Math.min(1.3, scale)); // 限制缩放范围
        
        // 计算位置
        const posX = this.x + config.radius;
        const posY = this.y + config.radius;
        
        // 使用更简单的transform，避免过度旋转导致变形
        this.element.style.transform = `translate3d(${posX}px, ${posY}px, 0) scale(${sizeScale})`;
        
        // 只在非拖拽状态下添加过渡效果
        if (!isDragging) {
            // 使用更短的过渡时间，避免延迟感
            this.element.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
        } else {
            this.element.style.transition = 'none';
        }
        
        // 设置透明度
        this.element.style.opacity = alpha;
        
        // 根据z轴位置调整z-index - 使用更大的范围以避免重叠
        const zIndex = Math.floor((this.z + config.radius) * 20);
        if (this.element.style.zIndex !== zIndex) {
            this.element.style.zIndex = zIndex;
        }
        
        // 根据z轴位置调整文字阴影 - 前景更亮
        const shadowIntensity = Math.max(0, (this.z + config.radius) / (2 * config.radius));
        this.element.style.textShadow = `0 0 ${shadowIntensity * 4}px rgba(255,255,255,${shadowIntensity * 0.4})`;
        
        // 移除直接的事件处理，改为使用事件委托
        // 这样可以避免在每次move()调用时重新绑定事件
    }
}

/**
 * 加载JSON数据
 */
async function loadCloudData() {
    try {
        const response = await fetch('./wordcloud_data.json');
        if (!response.ok) {
            throw new Error('无法加载词云数据');
        }
        cloudData = await response.json();
        return cloudData;
    } catch (error) {
        console.error('加载数据失败:', error);
        // 使用默认数据
        return [
            {"text": "JavaScript", "size": 40},
            {"text": "HTML5", "size": 35},
            {"text": "CSS3", "size": 30},
            {"text": "React", "size": 28},
            {"text": "Vue", "size": 26},
            {"text": "Node.js", "size": 25},
            {"text": "TypeScript", "size": 22},
            {"text": "Angular", "size": 20},
            {"text": "Webpack", "size": 18},
            {"text": "Git", "size": 16},
            {"text": "Docker", "size": 15},
            {"text": "Python", "size": 14},
            {"text": "Java", "size": 13},
            {"text": "PHP", "size": 12},
            {"text": "MongoDB", "size": 11},
            {"text": "MySQL", "size": 10},
            {"text": "Redis", "size": 9},
            {"text": "GraphQL", "size": 8},
            {"text": "REST API", "size": 7},
            {"text": "AWS", "size": 6}
        ];
    }
}

/**
 * 初始化应用
 */
window.onload = async function() {
    try {
        // 获取DOM元素
        const wrap = document.getElementById('wrap');
        tooltip = document.getElementById('tooltip');
        
        // 加载数据
        const data = await loadCloudData();
        
        // 创建词云
        tagCloud = new TagCloud({
            container: wrap,
            data: data
        });
        
        // 使用事件委托处理所有控制按钮
        const controls = document.querySelector('.controls');
        if (controls) {
            controls.addEventListener('click', (e) => {
                const target = e.target;
                if (!target.matches('button')) return;

                switch (target.id) {
                    case 'pauseBtn':
                        isPaused = !isPaused;
                        target.textContent = isPaused ? '继续' : '暂停';
                        // 暂停时重置速度
                        if (isPaused) {
                            velocityX = 0;
                            velocityY = 0;
                        }
                        break;

                    case 'speedUpBtn':
                        if (!isPaused) {
                            config.rotationSpeed = Math.min(2, config.rotationSpeed * 1.5);
                            config.autoRotationSpeed = Math.min(1, config.autoRotationSpeed * 1.5);
                            // 立即应用新速度
                            if (Math.abs(velocityX) < 0.05) velocityX = 0.005 * config.autoRotationSpeed;
                            if (Math.abs(velocityY) < 0.05) velocityY = 0.002 * config.autoRotationSpeed;
                        }
                        console.log('Speed increased:', config.rotationSpeed);
                        break;

                    case 'slowDownBtn':
                        if (!isPaused) {
                            config.rotationSpeed = Math.max(0.1, config.rotationSpeed * 0.75);
                            config.autoRotationSpeed = Math.max(0.1, config.autoRotationSpeed * 0.75);
                            // 立即应用新速度
                            if (Math.abs(velocityX) < 0.05) velocityX = 0.005 * config.autoRotationSpeed;
                            if (Math.abs(velocityY) < 0.05) velocityY = 0.002 * config.autoRotationSpeed;
                        }
                        console.log('Speed decreased:', config.rotationSpeed);
                        break;

                    case 'resetBtn':
                        // 重置所有状态
                        velocityX = 0;
                        velocityY = 0;
                        angleX = 0;
                        angleY = 0;
                        config.rotationSpeed = 1;
                        config.autoRotationSpeed = 0.2;
                        config.zoomFactor = 1;
                        isPaused = false;
                        document.getElementById('pauseBtn').textContent = '暂停';
                        
                        // 重新创建标签
                        tagCloud.createTags();
                        tagCloud.setupEventListeners();
                        console.log('Cloud reset');
                        break;
                }
            });

            // 添加鼠标悬停效果
            controls.addEventListener('mouseover', (e) => {
                if (e.target.matches('button')) {
                    e.target.style.background = 'rgba(255,255,255,0.3)';
                }
            });

            controls.addEventListener('mouseout', (e) => {
                if (e.target.matches('button')) {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                }
            });
        }
        
        // 鼠标事件 - 改进拖拽检测
        document.addEventListener('mousedown', function(e) {
            // 检查是否点击在词云区域内，但不是标签
            const wrapElement = document.getElementById('wrap');
            if (wrapElement && wrapElement.contains(e.target) && !e.target.classList.contains('tag')) {
                isDragging = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                // 防止文本选择
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            if (isDragging) {
                const deltaX = e.clientX - lastMouseX;
                const deltaY = e.clientY - lastMouseY;
                
                // 降低灵敏度，使拖动更平滑
                velocityX = Math.min(config.maxSpeed, Math.max(-config.maxSpeed, deltaX * 0.05));
                velocityY = Math.min(config.maxSpeed, Math.max(-config.maxSpeed, deltaY * 0.05));
                
                angleY += velocityX;
                angleX += velocityY;
                
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
            }
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
        
        // 鼠标离开窗口时停止拖拽
        document.addEventListener('mouseleave', function() {
            isDragging = false;
        });
        
        // 鼠标滚轮缩放 - 改进检测和缩放效果
        document.addEventListener('wheel', function(e) {
            const wrapElement = document.getElementById('wrap');
            if (wrapElement && wrapElement.contains(e.target)) {
                e.preventDefault();
                // 更平滑的缩放效果
                config.zoomFactor = Math.max(0.5, Math.min(1.5, config.zoomFactor - e.deltaY * 0.0005));
                console.log('Zoom factor:', config.zoomFactor);
            }
        }, { passive: false });
        
        // 窗口大小调整
        window.addEventListener('resize', function() {
            // 可以在这里添加响应式调整
            if (tagCloud) {
                // 重新计算容器大小等
            }
        });
        
        console.log('3D词云初始化完成');
    } catch (error) {
        console.error('初始化词云时出错:', error);
    }
};