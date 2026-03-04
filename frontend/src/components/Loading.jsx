function Loading({ status }) {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p>{status || '正在处理文件...'}</p>
    </div>
  )
}

export default Loading
