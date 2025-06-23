'use client'

import { useState, useRef, useEffect } from 'react'
import SearchForm from '@/components/SearchForm'
import ProgressDisplay from '@/components/ProgressDisplay'
import ResultsDisplay from '@/components/ResultsDisplay'

interface SearchResult {
  final_response: string
  iterations: number
  total_cost: number
  total_tokens: number
  completed: boolean
}

export default function Home() {
  const [isSearching, setIsSearching] = useState(false)
  const [progress, setProgress] = useState({ status: '', message: '' })
  const [result, setResult] = useState<SearchResult | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const handleSearch = (query: string) => {
    setIsSearching(true)
    setResult(null)
    setProgress({ status: 'starting', message: 'Initializing search...' })

    // Close existing EventSource if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Create new EventSource for SSE
    const eventSource = new EventSource(
      `http://localhost:8000/api/search/stream?query=${encodeURIComponent(query)}`
    )
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.status === 'completed' && data.result) {
          setResult(data.result)
          setProgress({ status: 'completed', message: 'Search completed successfully!' })
          setIsSearching(false)
          eventSource.close()
        } else if (data.status === 'error') {
          setProgress({ status: 'error', message: data.message || 'An error occurred' })
          setIsSearching(false)
          eventSource.close()
        } else {
          setProgress({ status: data.status, message: data.message })
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      setProgress({ status: 'error', message: 'Connection error. Please try again.' })
      setIsSearching(false)
      eventSource.close()
    }
  }

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Search Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ask me anything and I'll search the web to find comprehensive answers for you.
          </p>
        </header>

        <main className="space-y-8">
          <SearchForm onSearch={handleSearch} isSearching={isSearching} />
          
          <ProgressDisplay 
            status={progress.status}
            message={progress.message}
            isVisible={isSearching || progress.status === 'completed' || progress.status === 'error'}
          />

          <ResultsDisplay 
            result={result}
            isVisible={result !== null}
          />
        </main>
      </div>
    </div>
  )
}
