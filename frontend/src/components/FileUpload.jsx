import { useState, useRef } from 'react'

function FileUpload({ onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (ext === 'txt' || ext === 'docx') {
        setSelectedFile(file)
      } else {
        alert('请选择txt或docx文件')
      }
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (ext === 'txt' || ext === 'docx') {
        setSelectedFile(file)
      } else {
        alert('请选择txt或docx文件')
      }
    }
  }

  return (
    <div 
      className="upload-container"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="upload-icon">📁</div>
      <h2>上传文本文件</h2>
      <p>支持 .txt 和 .docx 格式</p>
      
      <input
        type="file"
        accept=".txt,.docx"
        onChange={handleFileChange}
        className="file-input"
        ref={fileInputRef}
      />
      
      <button 
        className="upload-button"
        onClick={() => fileInputRef.current?.click()}
      >
        选择文件
      </button>

      {selectedFile && (
        <div className="selected-file">
          <span>📄</span>
          <span>{selectedFile.name}</span>
          <button 
            onClick={handleUpload}
            style={{
              marginLeft: '15px',
              background: 'linear-gradient(135deg, #00d9ff, #00ff88)',
              color: '#1a1a2e',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '15px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            开始生成词云
          </button>
        </div>
      )}
    </div>
  )
}

export default FileUpload
