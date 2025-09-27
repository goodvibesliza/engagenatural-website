// src/pages/brand/BrandROICalculatorPage.jsx
import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/auth-context';
import BrandManagerLayout from '../../components/brand/BrandManagerLayout';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { 
  AlertCircle, 
  ArrowRight, 
  Calculator, 
  Calendar, 
  ChevronDown, 
  DollarSign, 
  Download, 
  Save, 
  Trash2, 
  TrendingUp, 
  Users 
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function BrandROICalculatorPage({ brandId }) {
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
        
        // Ensure brandId prop is provided
        if (!brandId) {
          setError('No brand selected');
          setLoading(false);
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
  }, [user, brandId]);
  
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
    const breakEvenUsers = Math.ceil(platformCostTotal / (additionalProductsPerUser * profitPerProduct));
    const paybackPeriod = platformCost > 0 ? 
      (platformCostTotal / (additionalProfit / timeframe)) : 0;
    
    // Monthly projections
    const monthlyData = [];
    let cumulativeProfit = 0;
    let cumulativeCost = 0;
    
    for (let month = 1; month <= timeframe; month++) {
      const monthlyRevenue = (additionalRevenue / timeframe);
      const monthlyProfit = (additionalProfit / timeframe);
      cumulativeProfit += monthlyProfit;
      cumulativeCost += platformCost;
      
      monthlyData.push({
        month,
        revenue: monthlyRevenue,
        profit: monthlyProfit,
        cumulativeProfit,
        cumulativeCost,
        netProfit: cumulativeProfit - cumulativeCost,
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
      monthlyData,
    });
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: name === 'scenarioName' ? value : parseFloat(value) || 0
    }));
  };
  
  // Save current scenario
  const saveScenario = async () => {
    try {
      setSaving(true);
      
      if (!brandId) {
        setError('No brand selected');
        setSaving(false);
        return;
      }
      
      const scenarioData = {
        brandId,
        name: inputs.scenarioName,
        inputs: { ...inputs },
        results: { ...results },
        createdAt: serverTimestamp(),
        createdBy: user?.uid || 'unknown',
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
      setActiveTab('saved');
    } catch (err) {
      console.error('Error saving scenario:', err);
      setError('Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };
  
  // Load a saved scenario
  const loadScenario = (scenario) => {
    setInputs(scenario.inputs);
    setResults(scenario.results);
    setActiveTab('calculator');
  };
  
  // Delete a saved scenario
  const deleteScenario = async (scenarioId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'roi_scenarios', scenarioId));
      
      // Update scenarios list
      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };
  
  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };
  
  // Format months
  const formatMonths = (value) => {
    const months = Math.floor(value);
    const days = Math.round((value - months) * 30);
    
    if (months === 0) {
      return `${days} days`;
    } else if (days === 0) {
      return months === 1 ? `1 month` : `${months} months`;
    } else {
      return `${months} month${months !== 1 ? 's' : ''} and ${days} day${days !== 1 ? 's' : ''}`;
    }
  };
  
  // Chart data for ROI over time
  const roiChartData = {
    labels: results.monthlyData.map(data => `Month ${data.month}`),
    datasets: [
      {
        label: 'Cumulative Profit',
        data: results.monthlyData.map(data => data.cumulativeProfit),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Cumulative Cost',
        data: results.monthlyData.map(data => data.cumulativeCost),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Net Profit',
        data: results.monthlyData.map(data => data.netProfit),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  
  // Chart options for ROI
  const roiChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'ROI Projection Over Time'
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
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time Period'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Amount ($)'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
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
        label: 'Users',
        data: [inputs.numUsers, results.breakEvenUsers],
        backgroundColor: [
          inputs.numUsers >= results.breakEvenUsers ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)'
        ],
        borderColor: [
          inputs.numUsers >= results.breakEvenUsers ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Chart options for break-even
  const breakEvenChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Break-Even Analysis'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatNumber(context.parsed.y) + ' users';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Number of Users'
        },
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatNumber(value);
          }
        }
      }
    }
  };
  
  // Monthly projection chart data
  const monthlyProjectionData = {
    labels: results.monthlyData.map(data => `Month ${data.month}`),
    datasets: [
      {
        type: 'line',
        label: 'Net Profit',
        data: results.monthlyData.map(data => data.netProfit),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        yAxisID: 'y',
        tension: 0.4
      },
      {
        type: 'bar',
        label: 'Monthly Revenue',
        data: results.monthlyData.map(data => data.revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Monthly Cost',
        data: results.monthlyData.map(() => inputs.platformCost),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        yAxisID: 'y'
      }
    ]
  };
  
  // Monthly projection chart options
  const monthlyProjectionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Projections'
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
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Amount ($)'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ROI Calculator</h1>
          <p className="text-gray-500 dark:text-gray-400">Calculate the return on investment for your training programs</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="saved">Saved Scenarios</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <TabsContent value="calculator" className="mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                ROI Calculator Inputs
              </CardTitle>
              <CardDescription>
                Enter your details to calculate ROI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scenarioName">Scenario Name</Label>
                <Input
                  id="scenarioName"
                  name="scenarioName"
                  value={inputs.scenarioName}
                  onChange={handleInputChange}
                  placeholder="My ROI Scenario"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numUsers">Number of Trained Users</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="numUsers"
                    name="numUsers"
                    type="number"
                    min="1"
                    value={inputs.numUsers}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Number of retail employees who will complete training</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productPrice">Average Product Price ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="productPrice"
                    name="productPrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={inputs.productPrice}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Average price of products sold</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Profit Margin (%)</Label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="profitMargin"
                    name="profitMargin"
                    type="number"
                    min="1"
                    max="100"
                    value={inputs.profitMargin}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Percentage profit on each product sold</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platformCost">Monthly Platform Cost ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="platformCost"
                    name="platformCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={inputs.platformCost}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Monthly cost of the training platform</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe (Months)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="timeframe"
                    name="timeframe"
                    type="number"
                    min="1"
                    max="60"
                    value={inputs.timeframe}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Time period for ROI calculation</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setInputs({
                numUsers: 100,
                productPrice: 49.99,
                profitMargin: 40,
                platformCost: 199,
                timeframe: 12,
                scenarioName: 'New Scenario',
              })}>
                Reset
              </Button>
              <Button onClick={saveScenario} disabled={saving}>
                {saving ? 'Saving...' : 'Save Scenario'}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          {/* Results Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                ROI Results
              </CardTitle>
              <CardDescription>
                Based on each trained user selling 3 additional products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Additional Products</p>
                  <p className="text-2xl font-bold">{formatNumber(results.additionalProducts)}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Additional Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(results.additionalRevenue)}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Additional Profit</p>
                  <p className="text-2xl font-bold">{formatCurrency(results.additionalProfit)}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Platform Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(results.platformCostTotal)}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Net Profit</p>
                  <p className={`text-2xl font-bold ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(results.netProfit)}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">ROI</p>
                  <p className={`text-2xl font-bold ${results.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(results.roi)}
                  </p>
                </div>
              </div>
              
              {/* Break-even Analysis */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Break-even Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Break-even Users</p>
                    <p className="text-xl font-bold">{formatNumber(results.breakEvenUsers)} users</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {inputs.numUsers >= results.breakEvenUsers 
                        ? `You are ${formatNumber(inputs.numUsers - results.breakEvenUsers)} users above break-even`
                        : `You need ${formatNumber(results.breakEvenUsers - inputs.numUsers)} more users to break even`
                      }
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Payback Period</p>
                    <p className="text-xl font-bold">{formatMonths(results.paybackPeriod)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Time needed to recover the investment
                    </p>
                  </div>
                </div>
              </div>
              
              {/* ROI Chart */}
              <div>
                <h3 className="text-lg font-medium mb-4">ROI Projection</h3>
                <div className="h-72">
                  <Line ref={roiChartRef} data={roiChartData} options={roiChartOptions} />
                </div>
              </div>
              
              {/* Break-even Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Break-even Analysis</h3>
                  <div className="h-64">
                    <Bar ref={breakEvenChartRef} data={breakEvenChartData} options={breakEvenChartOptions} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Monthly Projection</h3>
                  <div className="h-64">
                    <Bar data={monthlyProjectionData} options={monthlyProjectionOptions} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" className="mr-2">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button onClick={saveScenario} disabled={saving}>
                {saving ? 'Saving...' : 'Save Scenario'}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="saved" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Saved ROI Scenarios</CardTitle>
            <CardDescription>
              View and compare your saved ROI calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : scenarios.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No saved scenarios found</p>
                <Button onClick={() => setActiveTab('calculator')}>
                  Create New Scenario
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {scenarios.map((scenario) => (
                  <Card key={scenario.id} className="bg-gray-50 dark:bg-gray-800">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => loadScenario(scenario)}>
                            Load
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteScenario(scenario.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {scenario.createdAt?.toDate 
                          ? new Date(scenario.createdAt.toDate()).toLocaleDateString() 
                          : 'Date not available'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Users</p>
                          <p className="font-medium">{formatNumber(scenario.inputs.numUsers)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">ROI</p>
                          <p className={`font-medium ${scenario.results.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(scenario.results.roi)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Net Profit</p>
                          <p className={`font-medium ${scenario.results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(scenario.results.netProfit)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Payback Period</p>
                          <p className="font-medium">{formatMonths(scenario.results.paybackPeriod)}</p>
                        </div>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between items-center pt-2">
                        <div className="text-sm">
                          <span className="text-gray-500">Timeframe: </span>
                          <span className="font-medium">{scenario.inputs.timeframe} months</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => loadScenario(scenario)}>
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
}
