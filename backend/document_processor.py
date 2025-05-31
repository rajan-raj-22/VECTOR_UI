from langchain_community.document_loaders import Docx2txtLoader, TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
try:
    from langchain_community.vectorstores import FAISS
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
from docx import Document
from PIL import Image
from zipfile import ZipFile
from io import BytesIO
import os
from typing import List, Dict
import re
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Optional OCR support
TESSERACT_AVAILABLE = False
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    print("Pytesseract not available. OCR features will be disabled.")

class DocumentProcessor:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.chunks = []
        self.processed_text = ""
        self.vector_store = None
        self.embeddings = HuggingFaceEmbeddings()
        self.chunk_embeddings = None
        
    async def process(self):
        """Process the document and create vector store"""
        try:
            # Determine file type and use appropriate loader
            file_ext = os.path.splitext(self.file_path)[1].lower()
            
            if file_ext == '.docx':
                loader = Docx2txtLoader(self.file_path)
                docs_text = loader.load()
                doc_text = "\n".join([doc.page_content for doc in docs_text])
                
                # Extract tables and images only for DOCX
                tables_text = self._extract_tables()
                
                # Only attempt OCR if available
                ocr_text = ""
                if TESSERACT_AVAILABLE:
                    ocr_text, _ = self._extract_images_and_ocr()
                
                # Combine all text with clear section markers
                self.processed_text = (
                    f"{doc_text}\n\n"
                    f"{'='*50}\nTABLE DATA\n{'='*50}\n{tables_text}\n\n"
                )
                if ocr_text:
                    self.processed_text += f"{'='*50}\nIMAGE OCR TEXT\n{'='*50}\n{ocr_text}"
            
            elif file_ext == '.txt':
                loader = TextLoader(self.file_path)
                docs_text = loader.load()
                self.processed_text = "\n".join([doc.page_content for doc in docs_text])
            
            elif file_ext == '.pdf':
                loader = PyPDFLoader(self.file_path)
                docs_text = loader.load()
                self.processed_text = "\n".join([doc.page_content for doc in docs_text])
            
            else:
                raise ValueError(f"Unsupported file type: {file_ext}")
            
            # Create chunks with smaller size and less overlap
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=300,  # Reduced chunk size
                chunk_overlap=50,  # Reduced overlap
                length_function=len,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            self.chunks = splitter.create_documents([self.processed_text])
            
            # Create embeddings for chunks
            if FAISS_AVAILABLE:
                try:
                    self.vector_store = FAISS.from_documents(self.chunks, self.embeddings)
                except Exception as e:
                    print(f"Failed to create FAISS index: {e}")
                    # Fallback to direct embeddings
                    self.chunk_embeddings = self.embeddings.embed_documents([chunk.page_content for chunk in self.chunks])
            else:
                # Store embeddings directly if FAISS is not available
                self.chunk_embeddings = self.embeddings.embed_documents([chunk.page_content for chunk in self.chunks])
            
            print(f"Successfully processed document into {len(self.chunks)} chunks")
            return True
            
        except Exception as e:
            print(f"Error during document processing: {e}")
            raise

    def _extract_tables(self) -> str:
        """Extract tables from the document"""
        try:
            doc = Document(self.file_path)
            table_data = []
            for i, table in enumerate(doc.tables, 1):
                table_data.append(f"Table {i}:")
                for row in table.rows:
                    row_data = [cell.text.strip() for cell in row.cells]
                    if any(row_data):
                        table_data.append("  " + " | ".join(row_data))
                table_data.append("")  # Add spacing between tables
            return "\n".join(table_data)
        except Exception as e:
            print(f"Error extracting tables: {e}")
            return ""
    
    def _extract_images_and_ocr(self, lang='eng'):
        """Extract and OCR images from the document"""
        if not TESSERACT_AVAILABLE:
            return "", 0
            
        image_texts = []
        success_count = 0
        
        try:
            with ZipFile(self.file_path) as z:
                for file in z.namelist():
                    if file.startswith("word/media/") and file.lower().endswith((".png", ".jpg", ".jpeg")):
                        image_bytes = z.read(file)
                        image = Image.open(BytesIO(image_bytes))
                        
                        # Run OCR
                        text = pytesseract.image_to_string(image, lang=lang)
                        
                        if text.strip():
                            image_texts.append(f"Image {success_count + 1} ({file}):\n{text.strip()}\n")
                            success_count += 1
                            
            return "\n".join(image_texts), success_count
            
        except Exception as e:
            print(f"Error extracting images or running OCR: {e}")
            return "", 0
    
    def query(self, query: str, k: int = 3) -> List[Dict]:
        """Semantic search using vector store or direct embeddings"""
        if not (self.vector_store or self.chunk_embeddings):
            raise ValueError("Document hasn't been processed yet")
        
        try:
            if FAISS_AVAILABLE and self.vector_store:
                # Get similar chunks using FAISS
                results = self.vector_store.similarity_search_with_score(query, k=k)
                results_with_scores = [(doc, score) for doc, score in results]
            else:
                # Compute similarity directly using embeddings
                query_embedding = self.embeddings.embed_query(query)
                similarities = cosine_similarity([query_embedding], self.chunk_embeddings)[0]
                
                # Get top k results
                top_k_indices = np.argsort(similarities)[-k:][::-1]
                results_with_scores = [(self.chunks[i], 1 - similarities[i]) for i in top_k_indices]
            
            # Format results
            formatted_results = []
            for doc, score in results_with_scores:
                # Identify the section of the document
                section = "Main Content"
                if "TABLE DATA" in doc.page_content:
                    section = "Table Data"
                elif "IMAGE OCR TEXT" in doc.page_content:
                    section = "Image OCR Text"
                
                # Clean and format the content
                content = doc.page_content.strip()
                content = re.sub(r'\n\s*\n', '\n', content)  # Remove extra newlines
                content = re.sub(r'={50,}', '', content)  # Remove section separators
                
                # Format the relevance score as a percentage
                relevance = float(1 - score) * 100
                
                formatted_results.append({
                    "content": content,
                    "section": section,
                    "relevance_score": f"{relevance:.1f}%"
                })
            
            # Sort results by relevance score
            formatted_results.sort(key=lambda x: float(x["relevance_score"].rstrip('%')), reverse=True)
            
            return formatted_results
        except Exception as e:
            print(f"Error during query: {e}")
            return [{"error": str(e), "content": "Failed to process query"}] 