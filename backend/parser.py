import os

def parse_text_file(file_path: str, file_ext: str) -> str:
    if file_ext == "txt":
        return parse_txt(file_path)
    elif file_ext == "docx":
        return parse_docx(file_path)
    else:
        raise ValueError(f"不支持的文件格式: {file_ext}")

def parse_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def parse_docx(file_path: str) -> str:
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n".join(paragraphs)
    except ImportError:
        raise ImportError("请安装python-docx库: pip install python-docx")
