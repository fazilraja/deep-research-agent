'use client'

interface ProgressDisplayProps {
  status: string
  message: string
  isVisible: boolean
}

export default function ProgressDisplay({ status, message, isVisible }: ProgressDisplayProps) {
  if (!isVisible) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'starting':
        return 'text-blue-600'
      case 'processing':
        return 'text-yellow-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'starting':
        return '🚀'
      case 'processing':
        return '⚡'
      case 'completed':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '🔍'
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getStatusIcon(status)}</span>
          <span className={`font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <p className="text-gray-700 mt-2">{message}</p>
        {status === 'processing' && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/3"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}