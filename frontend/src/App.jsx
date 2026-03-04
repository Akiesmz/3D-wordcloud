import { useState } from 'react'
import FileUpload from './components/FileUpload'
import WordCloud3D from './components/WordCloud3D'
import Loading from './components/Loading'

function App() {
  const [wordData, setWordData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('')

  const handleFileUpload = async (file) => {
    setLoading(true)
    setError(null)
    setWordData(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // 显示上传中状态
      setStatus('上传文件中...')
      
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('文件上传失败')
      }

      setStatus('分析文本中...')
      
      const data = await response.json()
      
      setStatus('加载词云展示中...')
      
      setWordData(data.words)
    } catch (err) {
      setError(err.message || '处理文件时出错')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>3D球体词云</h1>
        <p>上传文本文件，生成炫酷的3D词云</p>
      </header>

      <main className="main">
        {!wordData && !loading && (
          <FileUpload onUpload={handleFileUpload} />
        )}

        {loading && <Loading status={status} />}

        {error && (
          <div className="error">
            <p>{error}</p>
            <button onClick={() => setError(null)}>重试</button>
          </div>
        )}

        {wordData && (
          <div className="wordcloud-container">
            <button className="back-button" onClick={() => setWordData(null)}>
              上传新文件
            </button>
            <WordCloud3D words={wordData} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
