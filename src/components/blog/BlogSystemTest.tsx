/**
 * Quick test component to verify the enhanced blog system
 * Remove this file after testing is complete
 */

import { useState } from 'react';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { EnhancedBlogList } from '@/components/blog/EnhancedBlogList';

export function BlogSystemTest() {
  const [testMode, setTestMode] = useState<'filters' | 'list' | 'combined'>('combined');

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Enhanced Blog System Test</h1>
        
        {/* Test Mode Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Test Mode:</label>
          <div className="space-x-4">
            <button
              onClick={() => setTestMode('filters')}
              className={`px-4 py-2 rounded ${
                testMode === 'filters' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-300'
              }`}
            >
              Filters Only
            </button>
            <button
              onClick={() => setTestMode('list')}
              className={`px-4 py-2 rounded ${
                testMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-300'
              }`}
            >
              List Only
            </button>
            <button
              onClick={() => setTestMode('combined')}
              className={`px-4 py-2 rounded ${
                testMode === 'combined' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-300'
              }`}
            >
              Combined
            </button>
          </div>
        </div>

        {/* Test Content */}
        {testMode === 'filters' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">BlogFilters Component Test</h2>
            <BlogFilters
              filters={{
                search: '',
                category: '',
                dateRange: '',
                sortBy: 'newest',
                tags: [],
                location: ''
              }}
              onFiltersChange={(filters) => {
                console.log('Filters changed:', filters);
              }}
              availableCategories={['Travel', 'Food', 'Culture', 'Adventure']}
              availableTags={['europe', 'asia', 'food', 'culture', 'adventure']}
              availableLocations={['Paris', 'Tokyo', 'New York', 'London']}
              isLoading={false}
            />
          </div>
        )}

        {testMode === 'list' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">EnhancedBlogList Component Test</h2>
            <EnhancedBlogList />
          </div>
        )}

        {testMode === 'combined' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Combined System Test</h2>
              <p className="text-gray-600 mb-4">
                This tests the full enhanced blog system with both components working together.
              </p>
              <EnhancedBlogList />
            </div>
          </div>
        )}

        {/* Debug Information */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-medium text-yellow-800 mb-2">Debug Information</h3>
          <p className="text-sm text-yellow-700">
            Check the browser console for any React Query errors or other issues.
            The enhanced blog system should load without errors.
          </p>
        </div>
      </div>
    </div>
  );
}
