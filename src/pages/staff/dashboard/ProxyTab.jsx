import React from 'react';

/**
 * ProxyTab - A minimal component that either renders its children or a placeholder
 * Used to easily swap between legacy dashboard tabs and new page components
 */
export default function ProxyTab({ children, title }) {
  return (
    <div className="proxy-tab">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      )}
      
      {children ? (
        children
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            {title ? `${title} content will be migrated here` : 'Content will be migrated here'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            This is a placeholder for future content
          </p>
        </div>
      )}
    </div>
  );
}
