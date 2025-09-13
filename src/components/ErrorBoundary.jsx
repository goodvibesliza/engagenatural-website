import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      info: null,
      key: 0
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('ErrorBoundary caught error', error, info);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      info: null,
      key: this.state.key + 1
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full border border-red-200">
            <div className="flex items-center text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-bold">Something went wrong</h2>
            </div>
            
            <div className="mb-4 p-3 bg-red-50 rounded border border-red-100">
              <p className="font-medium text-red-800">
                {this.state.error?.name || 'Error'}
              </p>
              <p className="text-red-700">
                {this.state.error?.message || 'An unknown error occurred'}
              </p>
            </div>
            
            <details className="mb-6 text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                Show error details
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-xs text-gray-800 max-h-60">
                {this.state.error?.stack || 'No stack trace available'}
                {this.state.info?.componentStack && (
                  <>
                    {'\n\nComponent Stack:\n'}
                    {this.state.info.componentStack}
                  </>
                )}
              </pre>
            </details>
            
            <button
              onClick={this.handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
