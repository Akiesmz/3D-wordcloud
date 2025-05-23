'use strict';

// 配置参数
const config = {
    baseAngle: Math.PI / 1440, // 基础旋转角度
    radius: 0, // 球体半径 - 将在初始化时计算
    focalLength: 500, // 焦距
    zoomFactor: 1, // 缩放因子 - 将在初始化时计算
    initialSpeed: 0.1, // 更低的初始速度
    damping: 0.2, // 增强阻尼效果，提高拖拽响应
    maxSpeed: 0.4, // 限制最大速度
    autoRotationSpeed: 0.1, // 自动旋转速度
    maxAllowedSpeed: 0.3, // 提高最大允许速度阈值
    emergencyDamping: 0.99, // 紧急减速时的阻尼系数
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
        // 计算响应式半径
        this.calculateResponsiveRadius();
        
        // 创建标签元素
        this.createTags();
        
        // 开始动画
        this.animate();
        
        // 设置事件监听
        this.setupEventListeners();
    }
    
    /**
     * 计算响应式半径
     */
    calculateResponsiveRadius() {
        const container = this.container;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // 使用容器较小边的45%作为半径，使词云球更大
        const minDimension = Math.min(containerWidth, containerHeight);
        config.radius = minDimension * 0.45;
        
        // 计算缩放因子 - 基于参考尺寸700px
        const referenceDimension = 700; // 参考尺寸
        config.zoomFactor = minDimension / referenceDimension;
        
        // 限制缩放因子的范围，避免太大或太小
        config.zoomFactor = Math.max(0.5, Math.min(1.5, config.zoomFactor));
        
        // 调整焦距与半径成比例
        config.focalLength = config.radius * 2.5;
        
        console.log(`响应式半径已设置: ${config.radius}px, 焦距: ${config.focalLength}px, 缩放因子: ${config.zoomFactor}`);
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
            
            // 设置更明显的随机初始位置，用于加载动画
            const spreadFactor = 50 + Math.random() * 50; // 增加扩散范围
            tagObj.x += (Math.random() - 0.5) * spreadFactor;
            tagObj.y += (Math.random() - 0.5) * spreadFactor;
            tagObj.z += (Math.random() - 0.5) * spreadFactor;
            
            // 初始位置设置
            tagObj.element.style.opacity = '0'; // 初始透明
            tagObj.element.style.transition = 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease-out';
            tagObj.move();
            
            // 延迟设置透明度，触发动画
            setTimeout(() => {
                tagObj.element.style.opacity = '';
            }, 50);
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
                // 添加悬停动画效果
                tag.element.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease-out';
                tag.element.style.transform = `${tag.element.style.transform} scale(1.2)`;
                tag.element.style.boxShadow = '0 0 15px rgba(255,255,255,0.7)';
                
                // 显示工具提示
                this.showTooltip(e, tag);
                
                // 提高z-index确保悬停标签在最上层
                const currentZIndex = parseInt(tag.element.style.zIndex || '0');
                tag.element.style.zIndex = currentZIndex + 1000;
            });
            
            tag.element.addEventListener('mouseout', () => {
                // 平滑恢复原始状态
                tag.element.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease-out';
                tag.element.style.transform = tag.element.style.transform.replace(' scale(1.2)', '');
                tag.element.style.boxShadow = '';
                
                // 延迟恢复z-index确保动画完成
                setTimeout(() => {
                    const currentZIndex = parseInt(tag.element.style.zIndex || '0');
                    if (currentZIndex > 0) {
                        tag.element.style.zIndex = currentZIndex - 1000;
                    }
                }, 300);
                
                // 隐藏工具提示
                this.hideTooltip();
            });
            
            tag.element.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleTagClick(tag);
            });
        });
    }

    /**
     * 显示工具提示 - 优化后的版本
     */
    showTooltip(e, tag) {
        const tooltip = document.getElementById('tooltip');
        
        // 设置丰富的内容
        const text = tag.element.dataset.text;
        const size = tag.element.dataset.size;
        tooltip.innerHTML = `
            <div style="font-weight:bold;margin-bottom:4px;">${text}</div>
            <div style="font-size:12px;opacity:0.8;">权重: ${size}</div>
            <div style="font-size:11px;opacity:0.6;margin-top:4px;">点击查看详情</div>
        `;
        
        // 计算精确位置（避免超出屏幕）
        const x = e.pageX + 15;
        const y = e.pageY + 15;
        const maxX = window.innerWidth - tooltip.offsetWidth - 10;
        const maxY = window.innerHeight - tooltip.offsetHeight - 10;
        
        tooltip.style.left = `${Math.min(x, maxX)}px`;
        tooltip.style.top = `${Math.min(y, maxY)}px`;
        
        // 添加现代样式
        tooltip.style.cssText = `
            position: absolute;
            padding: 8px 12px;
            background: rgba(0,0,0,0.85);
            color: white;
            border-radius: 6px;
            font-size: 14px;
            pointer-events: none;
            transform: translateY(10px);
            opacity: 0;
            transition: transform 0.2s ease-out, opacity 0.2s ease-out;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 200px;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255,255,255,0.1);
        `;
        
        // 显示动画
        setTimeout(() => {
            tooltip.style.transform = 'translateY(0)';
            tooltip.style.opacity = '1';
        }, 10);
    }

    /**
     * 隐藏工具提示 - 优化后的版本
     */
    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        
        // 添加隐藏动画
        tooltip.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        tooltip.style.transform = 'translateY(10px)';
        tooltip.style.opacity = '0';
        
        // 动画完成后重置样式
        setTimeout(() => {
            tooltip.style.transform = '';
            tooltip.style.transition = '';
        }, 200);
    }

    /**
     * 处理标签点击 - 优化后的点击效果
     */
    handleTagClick(tag) {
        // 添加点击反馈动画
        tag.element.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), color 0.3s ease-out';
        tag.element.style.transform = `${tag.element.style.transform} scale(0.95)`;
        
        // 保存原始颜色
        const originalColor = tag.element.style.color;
        
        setTimeout(() => {
            // 点击后放大并改变颜色
            tag.element.style.transform = tag.element.style.transform.replace(' scale(0.95)', '') + ' scale(1.3)';
            tag.element.style.color = '#ffffff';
            
            // 1秒后恢复原始状态
            setTimeout(() => {
                tag.element.style.transform = tag.element.style.transform.replace(' scale(1.3)', '');
                tag.element.style.color = originalColor;
                
                // 重置过渡效果
                setTimeout(() => {
                    tag.element.style.transition = '';
                }, 300);
            }, 1000);
            
            // 更新标签位置
            tag.move();
        }, 100);
        
        // 记录点击日志
        console.log(`标签点击: ${tag.element.dataset.text}, 权重: ${tag.element.dataset.size}`);
        
        // 这里可以添加更多点击操作，如显示详情等
        // 例如: this.showTagDetails(tag);
    }

    /**
     * X轴旋转 - 优化后的旋转计算
     */
    rotateX() {
        const angle = angleX * config.baseAngle;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        this.tags.forEach(tag => {
            // 精确的3D旋转计算，保持球体形状
            const y = tag.y * cos - tag.z * sin;
            const z = tag.z * cos + tag.y * sin;
            
            // 确保数值稳定性
            tag.y = Math.abs(y) < 0.0001 ? 0 : y;
            tag.z = Math.abs(z) < 0.0001 ? 0 : z;
        });
    }

    /**
     * Y轴旋转 - 优化后的旋转计算
     */
    rotateY() {
        const angle = angleY * config.baseAngle;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        this.tags.forEach(tag => {
            // 精确的3D旋转计算，保持球体形状
            const x = tag.x * cos - tag.z * sin;
            const z = tag.z * cos + tag.x * sin;
            
            // 确保数值稳定性
            tag.x = Math.abs(x) < 0.0001 ? 0 : x;
            tag.z = Math.abs(z) < 0.0001 ? 0 : z;
        });
    }

    /**
     * 优化后的动画循环
     */
    animate() {
        const that = this;
        let lastTime = performance.now();
        let frameId = null;
        
        const loop = (currentTime) => {
            // 只在页面可见时运行动画
            if (document.visibilityState !== 'visible') {
                frameId = requestAnimationFrame(loop);
                return;
            }
            
            // 计算时间差（毫秒），限制最大帧间隔避免跳跃
            const deltaTime = Math.min(100, currentTime - lastTime);
            lastTime = currentTime;
            
            if (!isPaused) {
                // 检查速度是否超过阈值
                const currentSpeed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
                const useEmergencyDamping = currentSpeed > config.maxAllowedSpeed;
                
                // 应用阻尼 - 根据速度选择不同的阻尼系数
                const dampingFactor = useEmergencyDamping ? config.emergencyDamping : config.damping;
                velocityX *= dampingFactor;
                velocityY *= dampingFactor;
                
                // 限制最大速度
                velocityX = Math.min(config.maxSpeed, Math.max(-config.maxSpeed, velocityX));
                velocityY = Math.min(config.maxSpeed, Math.max(-config.maxSpeed, velocityY));
                
                // 如果正在紧急减速，记录日志
                if (useEmergencyDamping) {
                    console.log(`速度过快: ${currentSpeed.toFixed(3)}, 应用紧急减速`);
                }
                
                // 优化后的自动旋转逻辑
                if (!isDragging) {
                    // 基于当前速度的平滑自动旋转
                    const targetSpeed = config.autoRotationSpeed * config.rotationSpeed;
                    
                    // 平滑过渡到目标速度
                    const acceleration = 0.0005 * deltaTime;
                    if (Math.abs(velocityX) < targetSpeed * 0.8) {
                        velocityX += (targetSpeed * 0.5 - velocityX) * acceleration;
                    }
                    if (Math.abs(velocityY) < targetSpeed * 0.4) {
                        velocityY += (targetSpeed * 0.2 - velocityY) * acceleration;
                    }
                    
                    // 确保最小旋转速度
                    if (Math.abs(velocityX) < 0.01) {
                        velocityX = 0.005 * targetSpeed;
                    }
                    if (Math.abs(velocityY) < 0.01) {
                        velocityY = 0.002 * targetSpeed;
                    }
                }
                
                // 根据时间差调整角度变化（转换为秒）
                angleX += velocityY * (deltaTime / 1000);
                angleY += velocityX * (deltaTime / 1000);
                
                // 执行旋转 - 保持球体形状
                that.rotateX();
                that.rotateY();
            }
            
            // 批量更新标签位置 - 即使在暂停状态下也更新位置，但不进行旋转
            that.tags.forEach(tag => tag.move());
            
            // 继续动画循环
            frameId = requestAnimationFrame(loop);
        };
        
        // 启动动画循环
        frameId = requestAnimationFrame(loop);
        
        // 添加清理方法
        this.stopAnimation = () => {
            if (frameId) {
                cancelAnimationFrame(frameId);
                frameId = null;
            }
        };
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
        // 计算缩放和透明度 - 确保球体不变形
        const scale = config.focalLength / (config.focalLength - this.z);
        const alpha = Math.max(0.3, Math.min(1, (this.z + config.radius) / (2 * config.radius)));
        
        // 计算基于size的字体大小 - 更精确的缩放
        const baseSize = parseFloat(this.element.style.fontSize);
        const sizeScale = Math.max(0.7, Math.min(1.3, scale)) * config.zoomFactor; // 限制缩放范围并应用缩放因子
        
        // 计算位置 - 基于容器中心
        const container = document.getElementById('wrap');
        const centerX = container ? container.offsetWidth / 2 : 0;
        const centerY = container ? container.offsetHeight / 2 : 0;
        
        // 应用缩放因子到位置计算
        const posX = centerX + this.x * config.zoomFactor;
        const posY = centerY + this.y * config.zoomFactor;
        
        // 使用3D变换保持球体形状
        this.element.style.transform = `translate3d(${posX}px, ${posY}px, ${this.z}px) scale(${sizeScale})`;
        
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
        
        // 确保容器已完全加载并有正确的尺寸
        await new Promise(resolve => {
            // 如果容器已经有尺寸，立即解析
            if (wrap.offsetWidth > 0 && wrap.offsetHeight > 0) {
                resolve();
            } else {
                // 否则等待一帧以确保样式已应用
                requestAnimationFrame(resolve);
            }
        });
        
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
                        
                        // 暂停/继续时的平滑过渡处理
                        if (isPaused) {
                            // 平滑减速到停止
                            const slowDown = () => {
                                if (Math.abs(velocityX) > 0.001 || Math.abs(velocityY) > 0.001) {
                                    velocityX *= 0.9;
                                    velocityY *= 0.9;
                                    requestAnimationFrame(slowDown);
                                } else {
                                    velocityX = 0;
                                    velocityY = 0;
                                }
                                
                                // 更新标签位置
                                tagCloud.tags.forEach(tag => {
                                    tag.element.style.transition = 'transform 0.3s ease-out';
                                    tag.move();
                                });
                            };
                            slowDown();
                        } else {
                            // 继续时恢复过渡效果
                            tagCloud.tags.forEach(tag => {
                                tag.element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                            });
                            
                            // 恢复自动旋转
                            velocityX = 0.005 * config.autoRotationSpeed;
                            velocityY = 0.002 * config.autoRotationSpeed;
                        }
                        
                        // 添加按钮状态反馈
                        target.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            target.style.transform = '';
                        }, 200);
                        break;

                    case 'resetBtn':
                        // 重置所有状态
                        velocityX = 0;
                        velocityY = 0;
                        angleX = 0;
                        angleY = 0;
                        config.rotationSpeed = 1;
                        config.autoRotationSpeed = 0.1; // 使用新的较慢的自动旋转速度
                        config.zoomFactor = 1;
                        
                        // 重置暂停状态
                        isPaused = false;
                        document.getElementById('pauseBtn').textContent = '暂停';
                        
                        // 恢复所有标签的过渡效果
                        tagCloud.tags.forEach(tag => {
                            tag.element.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
                        });
                        
                        // 重新计算响应式半径
                        tagCloud.calculateResponsiveRadius();
                        
                        // 重新创建标签
                        tagCloud.createTags();
                        tagCloud.setupEventListeners();
                        
                        console.log('词云已重置到初始状态');
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
                
                // 动态灵敏度计算 - 基于移动速度和方向
                const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const baseSensitivity = 0.015; // 提高基础灵敏度
                const dynamicSensitivity = baseSensitivity * (1 + moveDistance * 0.01);
                
                // 应用动态灵敏度
                velocityX = -deltaX * dynamicSensitivity;
                velocityY = -deltaY * dynamicSensitivity;
                
                // 动态速度限制 - 基于当前速度
                const currentSpeed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
                const speedLimit = Math.min(0.4, 0.2 + currentSpeed * 0.5);
                
                // 应用速度限制
                if (currentSpeed > speedLimit) {
                    const ratio = speedLimit / currentSpeed;
                    velocityX *= ratio;
                    velocityY *= ratio;
                }
                
                // 应用旋转
                angleY += velocityX;
                angleX += velocityY;
                
                // 角度限制
                angleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, angleX));
                
                // 更新鼠标位置
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                
                // 拖拽时禁用过渡效果，获得更直接的响应
                tagCloud.tags.forEach(tag => {
                    tag.element.style.transition = 'none';
                    tag.move();
                });
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                
                // 恢复标签的过渡效果
                tagCloud.tags.forEach(tag => {
                    tag.element.style.transition = 'transform 0.3s ease-out';
                });
                
                // 添加惯性效果 - 速度逐渐衰减
                const decayFactor = 0.95; // 衰减系数
                const minSpeed = 0.001; // 最小速度阈值
                
                const applyDecay = () => {
                    if (Math.abs(velocityX) > minSpeed || Math.abs(velocityY) > minSpeed) {
                        velocityX *= decayFactor;
                        velocityY *= decayFactor;
                        
                        angleY += velocityX;
                        angleX += velocityY;
                        
                        // 角度限制
                        angleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, angleX));
                        
                        tagCloud.tags.forEach(tag => tag.move());
                        requestAnimationFrame(applyDecay);
                    }
                };
                
                requestAnimationFrame(applyDecay);
            }
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
        
        // 优化后的窗口大小调整处理
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            
            // 添加防抖机制，延迟200ms执行
            resizeTimeout = setTimeout(() => {
                if (tagCloud) {
                    // 添加过渡效果
                    tagCloud.tags.forEach(tag => {
                        tag.element.style.transition = 'transform 0.6s ease-out';
                    });
                    
                    // 重新计算响应式半径
                    tagCloud.calculateResponsiveRadius();
                    
                    // 更新所有标签的位置
                    tagCloud.tags.forEach(tag => {
                        tag.move();
                    });
                    
                    // 移除过渡效果
                    setTimeout(() => {
                        tagCloud.tags.forEach(tag => {
                            tag.element.style.transition = '';
                        });
                    }, 600);
                    
                    console.log('窗口大小已改变，词云已平滑更新');
                }
            }, 200);
        });
        
        console.log('3D词云初始化完成');
    } catch (error) {
        console.error('初始化词云时出错:', error);
    }
};