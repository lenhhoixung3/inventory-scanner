'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-sm text-gray-500 mb-2">Ứng dụng hoặc bộ quét gặp sự cố.</p>
          <div className="p-3 bg-red-50 text-red-700 text-xs font-mono rounded-lg mb-6 max-w-full overflow-auto">
            {this.state.error?.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold"
          >
            Tải lại trang
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
