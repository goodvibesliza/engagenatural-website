import React, { useState, useEffect, createContext, useContext, Suspense } from 'react';

// Create a context for brand-related data
const BrandContext = createContext({
  brandId: null,
  brandName: '',
  brandData: {},
  isLoading: true,
  error: null,
  theme: {
    primaryColor: '#27AE60', // Default green color from mockups
    secondaryColor: '#3498DB',
    textColor: '#333333',
    backgroundColor: '#F5F5F5'
  }
});

// Custom hook to use the brand context
export const useBrandContext = () => useContext(BrandContext);

/**
 * Error Boundary Component for Brand Components
 */
class BrandErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error(`[BrandComponentAdapter] Error in ${this.props.componentName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h3 className="text-md font-medium text-red-800">Component Error</h3>
          </div>
          <p className="text-sm text-red-600 mb-2">
            {this.props.componentName ? 
              `The ${this.props.componentName} component encountered an error.` : 
              'A component error occurred.'}
          </p>
          {this.props.fallback ? (
            this.props.fallback
          ) : (
            <button 
              className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Loading Spinner Component
 */
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center p-6">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mb-2"></div>
    <p className="text-sm text-gray-600">{message}</p>
  </div>
);

/**
 * BrandComponentAdapter
 * 
 * A wrapper component that adapts legacy brand components to work with the new dashboard structure.
 * Provides error handling, loading states, and consistent props.
 * 
 * @param {React.Component} Component - The component to adapt
 * @param {Object} props - Props to pass to the component
 * @param {string} props.brandId - The brand ID
 * @param {string} props.componentName - Name of the component (for error reporting)
 * @param {Object} props.defaultData - Default data to provide if component expects it
 * @param {React.Component} props.fallback - Fallback UI to show on error
 * @param {boolean} props.withSuspense - Whether to wrap in Suspense
 * @param {Object} props.contextOverrides - Values to override in the brand context
 */
const BrandComponentAdapter = ({
  Component,
  brandId,
  componentName = 'Brand Component',
  defaultData = {},
  fallback = null,
  withSuspense = true,
  contextOverrides = {},
  ...props
}) => {
  // State for component data
  const [brandData, setBrandData] = useState(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brandName, setBrandName] = useState(brandId || 'Sample Brand');

  // Effect to simulate loading brand data
  // In a real app, this would fetch from an API or Firebase
  useEffect(() => {
    const loadBrandData = async () => {
      try {
        setIsLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // In a real app, this would be a fetch call
        // For now, just use the default data plus some standard fields
        const data = {
          ...defaultData,
          id: brandId || 'sample-brand',
          name: brandName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setBrandData(data);
        setError(null);
      } catch (err) {
        console.error(`[BrandComponentAdapter] Error loading data for ${componentName}:`, err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBrandData();
  }, [brandId, brandName, defaultData]);

  // Create context value with merged overrides
  const contextValue = {
    brandId: brandId || 'sample-brand',
    brandName,
    brandData,
    isLoading,
    error,
    theme: {
      primaryColor: '#27AE60', // Default green color from mockups
      secondaryColor: '#3498DB',
      textColor: '#333333',
      backgroundColor: '#F5F5F5',
      ...contextOverrides?.theme
    },
    ...contextOverrides
  };

  // Helper function to detect common props that legacy components might expect
  const getLegacyProps = () => {
    return {
      // Common props that might be expected by legacy components
      brandId: brandId || 'sample-brand',
      brand: brandData,
      data: brandData,
      loading: isLoading,
      error: error,
      onError: (err) => setError(err),
      onSuccess: () => setError(null),
      // Firebase-related props that might be expected
      db: props.db || window.db || null,
      storage: props.storage || window.storage || null,
      auth: props.auth || window.auth || null,
      // Navigation related props
      navigate: props.navigate || ((path) => console.log(`[BrandComponentAdapter] Navigate to: ${path}`)),
      history: props.history || { push: (path) => console.log(`[BrandComponentAdapter] History push: ${path}`) },
      // Other common props
      theme: contextValue.theme,
    };
  };

  // Combine all props
  const combinedProps = {
    ...getLegacyProps(),
    ...props,
  };

  // The actual component rendering with all safety wrappers
  const renderComponent = () => (
    <BrandErrorBoundary componentName={componentName} fallback={fallback}>
      <BrandContext.Provider value={contextValue}>
        {isLoading && !props.skipLoading ? (
          <LoadingSpinner message={`Loading ${componentName}...`} />
        ) : error && !props.ignoreError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              Error loading {componentName}: {error.message || 'Unknown error'}
            </p>
            <button 
              className="mt-2 text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        ) : (
          <div className="brand-component-wrapper">
            <Component {...combinedProps} />
          </div>
        )}
      </BrandContext.Provider>
    </BrandErrorBoundary>
  );

  // Return with or without Suspense based on prop
  return withSuspense ? (
    <Suspense fallback={<LoadingSpinner message={`Loading ${componentName}...`} />}>
      {renderComponent()}
    </Suspense>
  ) : (
    renderComponent()
  );
};

export default BrandComponentAdapter;
