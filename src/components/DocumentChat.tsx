import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export function DocumentChat() {
  const [file, setFile] = useState<File | null>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFile(file)
    setIsProcessing(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const data = await response.json()
      console.log('Upload successful:', data)
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuery = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error('Error querying document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Document Chat</CardTitle>
          <CardDescription>Upload a document and ask questions about it</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                onChange={handleFileUpload}
                accept=".docx"
                disabled={isProcessing}
              />
              {isProcessing && <p className="text-sm text-muted-foreground mt-2">Processing document...</p>}
            </div>

            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Ask a question about your document..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={!file || isProcessing}
              />
              <Button 
                onClick={handleQuery}
                disabled={!file || !query.trim() || isProcessing || isLoading}
              >
                Ask
              </Button>
            </div>

            {results.length > 0 && (
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {results.map((result, index) => (
                  <div key={index} className="mb-4">
                    <p className="text-sm">{result}</p>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 