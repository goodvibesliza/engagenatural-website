// src/pages/brand/BrandROICalculatorPage.jsx
import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/auth-context';
import BrandManagerLayout from '../../components/brand/BrandManagerLayout';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function BrandROICalculatorPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' or 'saved'
  
  // Input state
  const [inputs, setInputs] = useState({
    numUsers: 100,
    productPrice: 49.99,
    profitMargin: 40, // percentage
    platformCost: 199, // monthly cost
    timeframe: 12, // months
    scenarioName: 'New Scenario',
  });
  
  // Results state
  const [results, setResults] = useState({
    additionalProducts: 0,
    additionalRevenue: 0,
    additionalProfit: 0,
    platformCostTotal: 0,
    netProfit: 0,
    roi: 0,
    breakEvenUsers: 0,
    paybackPeriod: 0,
    monthlyData: [],
  });

  // Chart refs
  const roiChartRef = useRef(null);
  const breakEvenChartRef = useRef(null);
  
  // Load saved scenarios
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        setLoading(true);
        const brandId = localStorage.getItem('selectedBrandId');
        
        if (!brandId) {
          setError('No brand selected');
          return;
        }
        
        const scenariosQuery = query(
          collection(db, 'roi_scenarios'),
          where('brandId', '==', brandId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(scenariosQuery);
        const loadedScenarios = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setScenarios(loadedScenarios);
      } catch (err) {
        console.error('Error loading scenarios:', err);
        setError('Failed to load saved scenarios');
      } finally {
        setLoading(false);
      }
    };
    
    loadScenarios();
  }, [user]);
  
  // Calculate ROI whenever inputs change
  useEffect(() => {
    calculateROI();
  }, [inputs]);
  
  // Calculate all ROI metrics
  const calculateROI = () => {
    const { numUsers, productPrice, profitMargin, platformCost, timeframe } = inputs;
    
    // Basic calculations
    const profitPerProduct = (productPrice * profitMargin) / 100;
    const additionalProductsPerUser = 3; // Each trained user sells 3 more products
    const totalAdditionalProducts = numUsers * additionalProductsPerUser;
    const additionalRevenue = totalAdditionalProducts * productPrice;
    const additionalProfit = totalAdditionalProducts * profitPerProduct;
    const platformCostTotal = platformCost * timeframe;
    const netProfit = additionalProfit - platformCostTotal;
    const roi = platformCostTotal > 0 ? (netProfit / platformCostTotal) * 100 : 0;
    
    // Break-even calculations
    const breakEvenProducts = Math.ceil(platformCostTotal / profitPerProduct);
    const breakEvenUsers = Math.ceil(breakEvenProducts / additionalProductsPerUser);
    
    // Payback period (in months)
    const monthlyProfit = additionalProfit / timeframe;
    const paybackPeriod = monthlyProfit > 0 ? platformCostTotal / monthlyProfit : 0;
    
    // Generate monthly data for charts
    const monthlyData = [];
    for (let i = 1; i <= timeframe; i++) {
      const monthlyPlatformCost = platformCost * i;
      const monthlyAdditionalProducts = (totalAdditionalProducts / timeframe) * i;
      const monthlyAdditionalProfit = (additionalProfit / timeframe) * i;
      const monthlyNetProfit = monthlyAdditionalProfit - monthlyPlatformCost;
      const monthlyROI = monthlyPlatformCost > 0 ? (monthlyNetProfit / monthlyPlatformCost) * 100 : 0;
      
      monthlyData.push({
        month: i,
        costs: monthlyPlatformCost,
        revenue: monthlyAdditionalProducts * productPrice,
        profit: monthlyAdditionalProfit,
        netProfit: monthlyNetProfit,
        roi: monthlyROI
      });
    }
    
    setResults({
      additionalProducts: totalAdditionalProducts,
      additionalRevenue,
      additionalProfit,
      platformCostTotal,
      netProfit,
      roi,
      breakEvenUsers,
      paybackPeriod,
      monthlyData
    });
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Parse numeric inputs
    if (name !== 'scenarioName') {
      parsedValue = parseFloat(value) || 0;
    }
    
    setInputs(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };
  
  // Save current scenario
  const handleSaveScenario = async () => {
    try {
      setSaving(true);
      const brandId = localStorage.getItem('selectedBrandId');
      
      if (!brandId) {
        setError('No brand selected');
        return;
      }
      
      if (!inputs.scenarioName.trim()) {
        setError('Scenario name is required');
        return;
      }
      
      const scenarioData = {
        ...inputs,
        results: {
          additionalProducts: results.additionalProducts,
          additionalRevenue: results.additionalRevenue,
          additionalProfit: results.additionalProfit,
          platformCostTotal: results.platformCostTotal,
          netProfit: results.netProfit,
          roi: results.roi,
          breakEvenUsers: results.breakEvenUsers,
          paybackPeriod: results.paybackPeriod
        },
        brandId,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      };
      
      await addDoc(collection(db, 'roi_scenarios'), scenarioData);
      
      // Refresh scenarios list
      const scenariosQuery = query(
        collection(db, 'roi_scenarios'),
        where('brandId', '==', brandId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(scenariosQuery);
      const loadedScenarios = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setScenarios(loadedScenarios);
      setError(null);
      setActiveTab('saved');
    } catch (err) {
      console.error('Error saving scenario:', err);
      setError('Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };
  
  // Load a saved scenario
  const handleLoadScenario = (scenario) => {
    setInputs({
      numUsers: scenario.numUsers,
      productPrice: scenario.productPrice,
      profitMargin: scenario.profitMargin,
      platformCost: scenario.platformCost,
      timeframe: scenario.timeframe,
      scenarioName: `${scenario.scenarioName} (Copy)`
    });
    
    setActiveTab('calculator');
  };
  
  // Delete a saved scenario
  const handleDeleteScenario = async (scenarioId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'roi_scenarios', scenarioId));
      
      // Update scenarios list
      setScenarios(scenarios.filter(s => s.id !== scenarioId));
    } catch (err) {
      console.error('Error deleting scenario:', err);
      setError('Failed to delete scenario');
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };
  
  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Format months
  const formatMonths = (value) => {
    if (value < 1) {
      return 'Less than 1 month';
    }
    const months = Math.floor(value);
    const days = Math.round((value - months) * 30);
    
    if (days === 0) {
      return months === 1 ? '1 month' : `${months} months`;
    }
    
    return months === 0
      ? `${days} days`
      : months === 1
      ? `1 month and ${days} days`
      : `${months} months and ${days} days`;
  };
  
  // Chart data for ROI over time
  const roiChartData = {
    labels: results.monthlyData.map(d => `Month ${d.month}`),
    datasets: [
      {
        label: 'Net Profit',
        data: results.monthlyData.map(d => d.netProfit),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Platform Costs',
        data: results.monthlyData.map(d => d.costs),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y',
      }
    ],
  };
  
  // Chart options for ROI
  const roiChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Amount ($)'
        }
      },
    },
    plugins: {
      title: {
        display: true,
        text: 'Profit vs. Cost Over Time'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  };
  
  // Chart data for break-even analysis
  const breakEvenChartData = {
    labels: ['Current Users', 'Break-Even Users'],
    datasets: [
      {
        label: 'Number of Users',
        data: [inputs.numUsers, results.breakEvenUsers],
        backgroundColor: [
          inputs.numUsers >= results.breakEvenUsers ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)'
        ],
        borderColor: [
          inputs.numUsers >= results.breakEvenUsers ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)',
          'rgb(54, 162, 235)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Chart options for break-even
  const breakEvenChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Current Users vs. Break-Even Point'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatNumber(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Users'
        }
      }
    }
  };
  
  return (
    <BrandManagerLayout>
      {/* Page header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            ROI Calculator
          </h1>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`inline-flex items-center px-3 py-2 border ${
                activeTab === 'calculator'
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } text-sm leading-4 font-medium rounded-md`}
            >
              Calculator
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`inline-flex items-center px-3 py-2 border ${
                activeTab === 'saved'
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } text-sm leading-4 font-medium rounded-md`}
            >
              Saved Scenarios
            </button>
          </div>
        </div>
        
        {/* Description */}
        <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-700">
              Calculate your ROI based on users who complete training selling 3 more products than they would otherwise.
            </span>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-gray-200">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>
      
      {activeTab === 'calculator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calculator inputs */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Calculator Inputs</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="scenarioName" className="block text-sm font-medium text-gray-700 mb-1">
                    Scenario Name
                  </label>
                  <input
                    type="text"
                    id="scenarioName"
                    name="scenarioName"
                    value={inputs.scenarioName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter scenario name"
                  />
                </div>
                
                <div>
                  <label htmlFor="numUsers" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Users Completing Training
                  </label>
                  <input
                    type="number"
                    id="numUsers"
                    name="numUsers"
                    min="1"
                    value={inputs.numUsers}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter number of users"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Each trained user sells 3 more products than untrained users
                  </p>
                </div>
                
                <div>
                  <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Average Product Price ($)
                  </label>
                  <input
                    type="number"
                    id="productPrice"
                    name="productPrice"
                    min="0.01"
                    step="0.01"
                    value={inputs.productPrice}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product price"
                  />
                </div>
                
                <div>
                  <label htmlFor="profitMargin" className="block text-sm font-medium text-gray-700 mb-1">
                    Profit Margin (%)
                  </label>
                  <input
                    type="number"
                    id="profitMargin"
                    name="profitMargin"
                    min="1"
                    max="100"
                    value={inputs.profitMargin}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter profit margin percentage"
                  />
                </div>
                
                <div>
                  <label htmlFor="platformCost" className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Platform Cost ($)
                  </label>
                  <input
                    type="number"
                    id="platformCost"
                    name="platformCost"
                    min="0"
                    step="0.01"
                    value={inputs.platformCost}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter monthly platform cost"
                  />
                </div>
                
                <div>
                  <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">
                    Timeframe (months)
                  </label>
                  <input
                    type="number"
                    id="timeframe"
                    name="timeframe"
                    min="1"
                    max="60"
                    value={inputs.timeframe}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter timeframe in months"
                  />
                </div>
                
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleSaveScenario}
                    disabled={saving}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save Scenario
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Results and charts */}
          <div className="lg:col-span-2">
            {/* Key metrics */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">ROI Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Additional Products Sold:</dt>
                      <dd className="text-sm font-semibold text-gray-900">{formatNumber(results.additionalProducts)}</dd>
                    </div>
                    
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Additional Revenue:</dt>
                      <dd className="text-sm font-semibold text-gray-900">{formatCurrency(results.additionalRevenue)}</dd>
                    </div>
                    
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Additional Profit:</dt>
                      <dd className="text-sm font-semibold text-gray-900">{formatCurrency(results.additionalProfit)}</dd>
                    </div>
                    
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Total Platform Cost:</dt>
                      <dd className="text-sm font-semibold text-gray-900">{formatCurrency(results.platformCostTotal)}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Net Profit:</dt>
                      <dd className={`text-sm font-semibold ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(results.netProfit)}
                      </dd>
                    </div>
                    
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">ROI:</dt>
                      <dd className={`text-sm font-semibold ${results.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(results.roi)}
                      </dd>
                    </div>
                    
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Break-Even Users:</dt>
                      <dd className="text-sm font-semibold text-gray-900">{formatNumber(results.breakEvenUsers)}</dd>
                    </div>
                    
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Payback Period:</dt>
                      <dd className="text-sm font-semibold text-gray-900">{formatMonths(results.paybackPeriod)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className={`text-center text-sm font-medium ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.netProfit >= 0 
                    ? `This scenario is profitable with a ${formatPercentage(results.roi)} return on investment.`
                    : `This scenario is not profitable. You need ${formatNumber(results.breakEvenUsers - inputs.numUsers)} more trained users to break even.`
                  }
                </div>
              </div>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 gap-6">
              {/* ROI Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Profit vs. Cost Over Time</h3>
                <div className="h-64">
                  <Line ref={roiChartRef} options={roiChartOptions} data={roiChartData} />
                </div>
              </div>
              
              {/* Break-even Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Break-Even Analysis</h3>
                <div className="h-64">
                  <Bar ref={breakEvenChartRef} options={breakEvenChartOptions} data={breakEvenChartData} />
                </div>
                <div className="mt-4 text-center text-sm text-gray-500">
                  {inputs.numUsers >= results.breakEvenUsers 
                    ? `You are ${formatNumber(inputs.numUsers - results.breakEvenUsers)} users above the break-even point.`
                    : `You need ${formatNumber(results.breakEvenUsers - inputs.numUsers)} more users to break even.`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Saved Scenarios</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="sr-only">Loading...</span>
            </div>
          ) : scenarios.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No saved scenarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new ROI calculation scenario.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setActiveTab('calculator')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Scenario
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scenario Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Profit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scenarios.map((scenario) => (
                    <tr key={scenario.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {scenario.scenarioName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(scenario.numUsers)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={scenario.results.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatPercentage(scenario.results.roi)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={scenario.results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(scenario.results.netProfit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scenario.createdAt?.toDate 
                          ? new Date(scenario.createdAt.toDate()).toLocaleDateString() 
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleLoadScenario(scenario)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteScenario(scenario.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </BrandManagerLayout>
  );
}
