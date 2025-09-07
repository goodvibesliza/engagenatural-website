// src/pages/brand/BrandDashboardPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandManagerLayout from '../../components/brand/BrandManagerLayout';

export default function BrandDashboardPage() {
  const navigate = useNavigate();
  
  // ROI Calculator state
  const [totalInvestment, setTotalInvestment] = useState(5000);
  const [employeesTrained, setEmployeesTrained] = useState(10);
  const [avgProfitPerItem, setAvgProfitPerItem] = useState(5);
  
  // Calculate ROI
  const calculateROI = () => {
    const additionalProductsSold = employeesTrained * 3; // Assume 3 additional products per trained employee
    const additionalRevenue = additionalProductsSold * avgProfitPerItem;
    const roi = ((additionalRevenue - totalInvestment) / totalInvestment) * 100;
    
    return {
      additionalProductsSold,
      additionalRevenue,
      roi: roi.toFixed(1)
    };
  };
  
  const roiResults = calculateROI();
  
  // Handle numeric input changes
  const handleNumericInput = (setter) => (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value === '' ? '' : parseFloat(value));
    }
  };
  
  return (
    <BrandManagerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Brand Dashboard</h1>
        <p className="text-gray-600">Welcome to your brand dashboard</p>
      </div>
      
      {/* ROI Calculator */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">ROI Calculator</h2>
        <p className="text-gray-600 mb-4">
          Calculate the return on investment for your training programs based on additional product sales.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Investment ($)
            </label>
            <input
              type="text"
              value={totalInvestment}
              onChange={handleNumericInput(setTotalInvestment)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="5000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employees Trained
            </label>
            <input
              type="text"
              value={employeesTrained}
              onChange={handleNumericInput(setEmployeesTrained)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avg. Profit Per Item ($)
            </label>
            <input
              type="text"
              value={avgProfitPerItem}
              onChange={handleNumericInput(setAvgProfitPerItem)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="5"
            />
          </div>
        </div>
        
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium">Calculated Results</h3>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Additional Products Sold</p>
              <p className="text-2xl font-bold">{roiResults.additionalProductsSold}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Additional Revenue</p>
              <p className="text-2xl font-bold">${roiResults.additionalRevenue.toFixed(2)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">ROI Percentage</p>
              <p className={`text-2xl font-bold ${parseFloat(roiResults.roi) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roiResults.roi}%
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
            <h3 className="font-medium mb-2">Templates</h3>
            <p className="text-gray-600 text-sm mb-4">Browse available templates for your content</p>
            <button 
              onClick={() => navigate('/brand/templates')}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              View Templates →
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
            <h3 className="font-medium mb-2">Content</h3>
            <p className="text-gray-600 text-sm mb-4">Manage your brand content</p>
            <button 
              onClick={() => navigate('/brand/content')}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              Manage Content →
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
            <h3 className="font-medium mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm mb-4">View insights and performance metrics</p>
            <button 
              onClick={() => navigate('/brand/analytics')}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              View Analytics →
            </button>
          </div>
        </div>
      </div>
      
      {/* Recent Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Recent Content</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          No content items found. Start by creating new content from a template.
        </div>
      </div>
    </BrandManagerLayout>
  );
}