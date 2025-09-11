import React from 'react';

export default function LearningPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Learning Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Continue your learning journey and discover new training content
        </p>
      </div>

      {/* Continue Learning Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span role="img" aria-label="book">📚</span>
          <h2 className="text-xl font-semibold text-gray-900">Continue Learning</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder boxes */}
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-gray-50 rounded-lg p-4 h-40 flex flex-col justify-between">
                <div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                  <div className="h-6 w-20 bg-blue-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Completed Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span role="img" aria-label="check">✅</span>
          <h2 className="text-xl font-semibold text-gray-900">Completed</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder boxes */}
            {[1, 2].map((item) => (
              <div key={item} className="bg-gray-50 rounded-lg p-4 h-40 flex flex-col justify-between">
                <div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                  <div className="h-6 w-20 bg-green-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discover Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span role="img" aria-label="sparkle">✨</span>
          <h2 className="text-xl font-semibold text-gray-900">Discover</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder boxes */}
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-gray-50 rounded-lg p-4 h-40 flex flex-col justify-between">
                <div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                  <div className="h-6 w-20 bg-purple-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
