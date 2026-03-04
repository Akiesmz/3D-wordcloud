import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from parser import parse_text_file
from tokenizer import tokenize_and_count
from wordcloud_api import generate_wordcloud_data

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

file_storage = {}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")
    
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["txt", "docx"]:
        raise HTTPException(status_code=400, detail="仅支持txt和docx文件")
    
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        text = parse_text_file(file_path, file_ext)
        word_counts = tokenize_and_count(text)
        wordcloud_data = generate_wordcloud_data(word_counts)
        
        file_storage[file_id] = {
            "filename": file.filename,
            "filepath": file_path,
            "wordcloud_data": wordcloud_data
        }
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "status": "success",
            "word_count": len(wordcloud_data),
            "words": wordcloud_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理文件失败: {str(e)}")

@router.get("/wordcloud/{file_id}")
def get_wordcloud(file_id: str):
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="文件不存在或已过期")
    
    return {
        "file_id": file_id,
        "words": file_storage[file_id]["wordcloud_data"]
    }
