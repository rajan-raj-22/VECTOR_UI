const API_BASE_URL = 'http://127.0.0.1:8000';

export const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.error || 'Failed to upload document');
        }

        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
        throw new Error('Failed to upload document');
    }
};

export const queryDocument = async (query: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/query?query=${encodeURIComponent(query)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.error || 'Failed to query document');
        }

        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Query failed: ${error.message}`);
        }
        throw new Error('Failed to query document');
    }
}; 