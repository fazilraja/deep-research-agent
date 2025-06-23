'use client'

interface SearchResult {
  final_response: string
  iterations: number
  total_cost: number
  total_tokens: number
  completed: boolean
}

interface ResultsDisplayProps {
  result: SearchResult | null
  isVisible: boolean
}

export default function ResultsDisplay({ result, isVisible }: ResultsDisplayProps) {
  if (!isVisible || !result) return null

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Results</h2>
          
          <div className="prose max-w-none mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                {result.final_response}
              </pre>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Search Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-blue-800 font-medium">Iterations</div>
                <div className="text-blue-600 text-lg font-semibold">{result.iterations}</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-800 font-medium">Cost</div>
                <div className="text-green-600 text-lg font-semibold">
                  ${result.total_cost.toFixed(6)}
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-purple-800 font-medium">Tokens</div>
                <div className="text-purple-600 text-lg font-semibold">
                  {result.total_tokens.toLocaleString()}
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${result.completed ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <div className={`font-medium ${result.completed ? 'text-green-800' : 'text-yellow-800'}`}>
                  Status
                </div>
                <div className={`text-lg font-semibold ${result.completed ? 'text-green-600' : 'text-yellow-600'}`}>
                  {result.completed ? 'Complete' : 'Partial'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}