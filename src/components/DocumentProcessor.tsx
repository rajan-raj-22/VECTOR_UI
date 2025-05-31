import { useState, useRef } from 'react';
import { uploadDocument, queryDocument } from '../services/api';

export const DocumentProcessor = () => {
    const [file, setFile] = useState<File | null>(null);
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);
        setError(null);
        setUploadSuccess(false);

        try {
            await uploadDocument(selectedFile);
            setUploadSuccess(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload document');
            setUploadSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files?.[0];
        if (!droppedFile) return;

        setFile(droppedFile);
        setLoading(true);
        setError(null);
        setUploadSuccess(false);

        try {
            await uploadDocument(droppedFile);
            setUploadSuccess(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload document');
            setUploadSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleQuery = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await queryDocument(query);
            setResult(response.results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to query document');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">Document Processor</h2>
                
                {/* File Upload Section */}
                <div className="space-y-4">
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                        onClick={handleUploadClick}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf,.txt,.docx"
                        />
                        <div className="flex flex-col items-center gap-3">
                            <svg 
                                className="w-12 h-12 text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span className="text-lg font-medium text-gray-700">
                                {file ? 'Change file' : 'Upload Document'}
                            </span>
                            <span className="text-sm text-gray-500">
                                Click to browse or drag and drop
                            </span>
                            <span className="text-xs text-gray-400">
                                Supports PDF, TXT, DOCX
                            </span>
                        </div>
                        {file && (
                            <div className="mt-4 text-sm text-gray-600">
                                Selected file: <span className="font-medium">{file.name}</span>
                                {uploadSuccess && (
                                    <span className="ml-2 text-green-600">✓ Uploaded successfully</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Query Section */}
                    <form onSubmit={handleQuery} className="space-y-4">
                        <div>
                            <label className="block text-lg font-medium text-gray-700 mb-2">
                                Ask a question about the document:
                            </label>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="What is this document about?"
                                disabled={!uploadSuccess}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !uploadSuccess}
                            className="w-full py-3 px-6 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                'Submit Query'
                            )}
                        </button>
                    </form>

                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Results Display */}
                    {result && (
                        <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">Response:</h3>
                            <div className="prose max-w-none">
                                {typeof result === 'string' ? (
                                    <p className="text-gray-700">{result}</p>
                                ) : (
                                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 