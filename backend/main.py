from fastapi import FastAPI, UploadFile, File, status, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from document_processor import DocumentProcessor, TESSERACT_AVAILABLE, FAISS_AVAILABLE
from typing import List, Dict
import uvicorn
import os
from datetime import datetime
import shutil

app = FastAPI(
    title="Document Processing API",
    description="AI-Powered Document Processing and Query System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize document processor
doc_processor = None

@app.get("/", response_class=JSONResponse)
async def root():
    """Root endpoint providing comprehensive API status and documentation"""
    # Check if uploads directory exists and count files
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    uploaded_files = len([f for f in os.listdir(upload_dir) if os.path.isfile(os.path.join(upload_dir, f))])
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "api_info": {
                "name": "Document Processing API",
                "version": "1.0.0",
                "status": "Active and Running",
                "timestamp": datetime.now().isoformat(),
                "documentation": {
                    "swagger_ui": "/docs",
                    "redoc": "/redoc"
                }
            },
            "available_endpoints": [
                {
                    "path": "/",
                    "method": "GET",
                    "description": "API Status and Information",
                    "requires_auth": False
                },
                {
                    "path": "/upload",
                    "method": "POST",
                    "description": "Upload and Process Documents",
                    "accepts": "Multipart Form Data (file)",
                    "requires_auth": False
                },
                {
                    "path": "/query",
                    "method": "POST",
                    "description": "Query Processed Documents",
                    "accepts": "JSON (query: string)",
                    "requires_auth": False
                }
            ],
            "system_status": {
                "document_processor": {
                    "initialized": doc_processor is not None,
                    "ready_for_queries": doc_processor is not None
                },
                "storage": {
                    "upload_directory": upload_dir,
                    "files_count": uploaded_files,
                    "storage_status": "Available"
                }
            },
            "security": {
                "cors": {
                    "enabled": True,
                    "allowed_origins": [
                        "http://localhost:5174",
                        "http://127.0.0.1:5174"
                    ]
                }
            }
        }
    )

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document"""
    global doc_processor
    
    try:
        # Validate file type
        allowed_extensions = {'.txt', '.pdf', '.docx'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "error": "Invalid file type",
                    "detail": f"Allowed types are: {', '.join(allowed_extensions)}",
                    "received_type": file_ext
                }
            )

        # Create uploads directory if it doesn't exist
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save the uploaded file
        file_path = os.path.join(upload_dir, file.filename)
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Failed to save file",
                    "detail": str(e)
                }
            )
        
        # Process the document
        try:
            doc_processor = DocumentProcessor(file_path)
            await doc_processor.process()
            
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "message": "Document processed successfully",
                    "file_name": file.filename,
                    "status": "ready_for_queries",
                    "features": {
                        "ocr_available": TESSERACT_AVAILABLE,
                        "faiss_available": FAISS_AVAILABLE
                    }
                }
            )
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Failed to process document",
                    "detail": str(e)
                }
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Error processing document",
                "detail": str(e)
            }
        )

@app.post("/query")
async def query_document(query: str = Query(..., description="The query to search in the document")):
    """Query the processed document"""
    if not doc_processor:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "No document has been processed yet. Please upload a document first."}
        )
    
    try:
        results = doc_processor.query(query)
        
        # Format response
        response = {
            "query": query,
            "results": results,
            "total_results": len(results),
            "metadata": {
                "sections_found": list(set(r["section"] for r in results))
            }
        }
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=response
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Error processing query: {str(e)}"}
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 