# 3D球体词云系统 - 实现计划

## 1. 项目概述

创建一个基于Web的3D球体词云可视化系统，用户可以上传文本文件，系统自动进行分词处理，并将词汇以3D球体形式展示，支持自动旋转和鼠标拖拽交互。

## 2. 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | React 18 + Vite |
| 3D渲染 | Three.js + React Three Fiber + Drei |
| 后端框架 | Python FastAPI |
| 中文分词 | jieba |
| 样式方案 | CSS Modules |

## 3. 功能模块规划

### 3.1 后端模块 (Python FastAPI)

| 模块 | 功能描述 |
|------|----------|
| `main.py` | FastAPI主入口，配置CORS和路由 |
| `upload.py` | 文件上传接口，接收txt/docx等文本文件 |
| `parser.py` | 文本解析，支持txt纯文本和docx格式 |
| `tokenizer.py` | 使用jieba进行中文分词和词频统计 |
| `wordcloud_api.py` | 词云数据生成API，返回词汇及权重 |

### 3.2 前端模块 (React)

| 模块 | 功能描述 |
|------|----------|
| `App.jsx` | 主应用组件 |
| `components/FileUpload.jsx` | 文件上传组件 |
| `components/WordCloud3D.jsx` | 3D球体词云核心组件 |
| `components/Loading.jsx` | 加载状态组件 |
| `api/client.js` | Axios API客户端 |

## 4. 3D球体词云算法

### 4.1 球体分布算法
- 使用球坐标系将词汇映射到球体表面
- 词汇根据词频决定字体大小和球面位置
- 高频词放置在球体"正面"（容易被看到的位置）
- 使用Fibonacci Sphere算法均匀分布词汇

### 4.2 渲染效果
- 词汇以TextGeometry渲染为3D文字
- 每个词汇使用随机或基于词频的颜色
- 球体带有半透明效果或粒子背景
- 支持缩放和焦点控制

### 4.3 交互功能
- **自动旋转**：使用useFrame实现Y轴恒定转速
- **鼠标拖拽**：使用OrbitControls实现自由旋转
- **悬停效果**：鼠标悬停时词汇高亮显示

## 5. API设计

### 5.1 上传文件
```
POST /api/upload
Content-Type: multipart/form-data

Request: file (File)
Response: { "file_id": "uuid", "status": "success" }
```

### 5.2 获取词云数据
```
GET /api/wordcloud/{file_id}

Response: {
  "words": [
    { "text": "词云", "weight": 10, "position": [x, y, z] },
    ...
  ]
}
```

## 6. 目录结构

```
weixin/
├── backend/
│   ├── main.py
│   ├── upload.py
│   ├── parser.py
│   ├── tokenizer.py
│   ├── wordcloud_api.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── api/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 7. 实现步骤

### 步骤1：后端开发
1.1 创建FastAPI项目结构和依赖安装  
1.2 实现文件上传接口  
1.3 实现文本解析模块（支持txt）  
1.4 实现jieba分词和词频统计  
1.5 实现词云数据生成API  

### 步骤2：前端开发
2.1 初始化React + Vite项目  
2.2 安装Three.js相关依赖  
2.3 创建文件上传组件  
2.4 实现3D球体词云组件  
2.5 实现自动旋转和鼠标拖拽功能  
2.6 集成前后端功能  

### 步骤3：测试与优化
3.1 本地运行测试  
3.2 优化3D渲染性能  
3.3 完善交互体验

## 8. 依赖清单

### 后端依赖
- fastapi
- uvicorn
- python-multipart
- jieba

### 前端依赖
- react
- react-dom
- three
- @react-three/fiber
- @react-three/drei
- axios


