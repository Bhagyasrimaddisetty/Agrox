import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [satelliteData, setSatelliteData] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [creditApplication, setCreditApplication] = useState({
    farmer_name: '',
    farmer_email: '',
    requested_amount: '',
    purpose: ''
  });
  const [insuranceQuote, setInsuranceQuote] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchPlots();
    fetchDashboardSummary();
  }, []);

  const fetchPlots = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/farm-plots`);
      setPlots(response.data.plots);
      if (response.data.plots.length > 0) {
        setSelectedPlot(response.data.plots[0]);
      }
    } catch (error) {
      console.error('Error fetching plots:', error);
    }
  };

  const fetchDashboardSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard-summary`);
      setDashboardSummary(response.data);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    }
  };

  const fetchSatelliteData = async (plotId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/satellite-data/${plotId}?days=30`);
      setSatelliteData(response.data.readings);
    } catch (error) {
      console.error('Error fetching satellite data:', error);
    }
    setLoading(false);
  };

  const handlePlotSelect = (plot) => {
    setSelectedPlot(plot);
    fetchSatelliteData(plot.id);
  };

  const submitCreditApplication = async () => {
    if (!selectedPlot) return;
    
    setLoading(true);
    try {
      const applicationData = {
        ...creditApplication,
        plot_id: selectedPlot.id
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/credit-application`, applicationData);
      
      alert(`Application ${response.data.status}!\nApproved Amount: $${response.data.approved_amount.toLocaleString()}\nInterest Rate: ${response.data.interest_rate}%\nCrop Health Score: ${response.data.crop_health_score}/100`);
      
      setCreditApplication({ farmer_name: '', farmer_email: '', requested_amount: '', purpose: '' });
    } catch (error) {
      console.error('Error submitting credit application:', error);
      alert('Error submitting application. Please try again.');
    }
    setLoading(false);
  };

  const getInsuranceQuote = async () => {
    if (!selectedPlot) return;
    
    setLoading(true);
    try {
      const coverageAmount = selectedPlot.area_acres * 1000; // $1000 per acre default
      const response = await axios.get(`${API_BASE_URL}/api/insurance-quote/${selectedPlot.id}?coverage_amount=${coverageAmount}`);
      setInsuranceQuote(response.data);
    } catch (error) {
      console.error('Error getting insurance quote:', error);
    }
    setLoading(false);
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLevelColor = (risk) => {
    if (risk === 'Low') return 'bg-green-100 text-green-800';
    if (risk === 'Medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Latest satellite reading for selected plot
  const latestReading = satelliteData.length > 0 ? satelliteData[satelliteData.length - 1] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">AgroX</h1>
                <p className="text-green-100">Satellite-Aided Fintech Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-green-100">Welcome back!</p>
                <p className="font-semibold">Smart Farming Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {['dashboard', 'monitoring', 'credit', 'insurance'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-green-600 to-blue-600 rounded-xl overflow-hidden">
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1514864151880-d1bef4892f29?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxzYXRlbGxpdGUlMjBhZ3JpY3VsdHVyZXxlbnwwfHx8fDE3NTM3OTQ3NzB8MA&ixlib=rb-4.1.0&q=85"
                  alt="Satellite Agriculture"
                  className="w-full h-full object-cover opacity-30"
                />
              </div>
              <div className="relative px-8 py-12">
                <div className="max-w-3xl">
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Smart Credit & Insurance Powered by Satellite Data
                  </h2>
                  <p className="text-xl text-green-100 mb-6">
                    Monitor crop health in real-time, access instant credit approvals, and get risk-based insurance quotes using advanced satellite imagery analysis.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setActiveTab('monitoring')}
                      className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                    >
                      View Satellite Data
                    </button>
                    <button
                      onClick={() => setActiveTab('credit')}
                      className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                    >
                      Apply for Credit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Farm Plots</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardSummary.total_plots || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Acres</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardSummary.total_acres || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Crop Health</p>
                    <p className={`text-3xl font-bold ${getHealthScoreColor(dashboardSummary.avg_crop_health || 0)}`}>
                      {dashboardSummary.avg_crop_health || 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Loans</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardSummary.active_loans || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Farm Plots Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Your Farm Plots</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plots.map((plot) => (
                    <div
                      key={plot.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handlePlotSelect(plot)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{plot.farm_name}</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {plot.crop_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{plot.location}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{plot.area_acres} acres</span>
                        <span className="text-gray-500">Planted: {plot.planting_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Satellite Crop Monitoring</h3>
                <p className="text-sm text-gray-600">Real-time satellite analysis of your farm plots</p>
              </div>
              
              {selectedPlot && (
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{selectedPlot.farm_name}</h4>
                        <p className="text-gray-600">{selectedPlot.location} • {selectedPlot.area_acres} acres • {selectedPlot.crop_type}</p>
                      </div>
                      <button
                        onClick={() => fetchSatelliteData(selectedPlot.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Refresh Data
                      </button>
                    </div>
                    
                    {latestReading && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">NDVI Index</p>
                              <p className="text-2xl font-bold text-green-900">{latestReading.ndvi_value}</p>
                            </div>
                            <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-800">Crop Health</p>
                              <p className={`text-2xl font-bold ${getHealthScoreColor(latestReading.crop_health_score)}`}>
                                {latestReading.crop_health_score}%
                              </p>
                            </div>
                            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-yellow-800">Soil Moisture</p>
                              <p className="text-2xl font-bold text-yellow-900">{(latestReading.soil_moisture * 100).toFixed(0)}%</p>
                            </div>
                            <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-red-800">Weather Risk</p>
                              <p className="text-2xl font-bold text-red-900">{(latestReading.weather_risk * 100).toFixed(0)}%</p>
                            </div>
                            <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Satellite Data Trend Chart */}
                    {satelliteData.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h5 className="font-semibold text-gray-900 mb-4">30-Day Crop Health Trend</h5>
                        <div className="space-y-2">
                          {satelliteData.slice(-10).map((reading, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                              <span className="text-sm text-gray-600">{reading.date}</span>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm">
                                  NDVI: <span className="font-semibold">{reading.ndvi_value}</span>
                                </span>
                                <span className="text-sm">
                                  Health: <span className={`font-semibold ${getHealthScoreColor(reading.crop_health_score)}`}>
                                    {reading.crop_health_score}%
                                  </span>
                                </span>
                                <span className="text-sm">
                                  Temp: <span className="font-semibold">{reading.temperature}°C</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credit Tab */}
        {activeTab === 'credit' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Smart Credit Application</h3>
                <p className="text-sm text-gray-600">Get instant credit approval based on satellite crop analysis</p>
              </div>
              
              <div className="p-6">
                {selectedPlot && latestReading && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Selected Farm: {selectedPlot.farm_name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-green-600">Area:</span> {selectedPlot.area_acres} acres
                      </div>
                      <div>
                        <span className="text-green-600">Crop Health:</span> 
                        <span className={`font-semibold ${getHealthScoreColor(latestReading.crop_health_score)}`}>
                          {latestReading.crop_health_score}%
                        </span>
                      </div>
                      <div>
                        <span className="text-green-600">NDVI:</span> {latestReading.ndvi_value}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Application Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={creditApplication.farmer_name}
                          onChange={(e) => setCreditApplication({...creditApplication, farmer_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={creditApplication.farmer_email}
                          onChange={(e) => setCreditApplication({...creditApplication, farmer_email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter your email"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Requested Amount ($)</label>
                        <input
                          type="number"
                          value={creditApplication.requested_amount}
                          onChange={(e) => setCreditApplication({...creditApplication, requested_amount: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter loan amount"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Loan</label>
                        <select
                          value={creditApplication.purpose}
                          onChange={(e) => setCreditApplication({...creditApplication, purpose: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select purpose</option>
                          <option value="seeds">Seeds & Planting</option>
                          <option value="fertilizer">Fertilizer & Chemicals</option>
                          <option value="equipment">Equipment Purchase</option>
                          <option value="irrigation">Irrigation System</option>
                          <option value="general">General Farm Operations</option>
                        </select>
                      </div>

                      <button
                        onClick={submitCreditApplication}
                        disabled={loading || !selectedPlot}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Processing...' : 'Submit Application'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Satellite-Based Risk Assessment</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center mb-4">
                        <img 
                          src="https://images.unsplash.com/photo-1581922813291-c6d23508c2c4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxzYXRlbGxpdGUlMjBhZ3JpY3VsdHVyZXxlbnwwfHx8fDE3NTM3OTQ3NzB8MA&ixlib=rb-4.1.0&q=85"
                          alt="Satellite Analysis"
                          className="w-16 h-16 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <h5 className="font-semibold text-blue-900">Real-Time Analysis</h5>
                          <p className="text-sm text-blue-700">Powered by satellite imagery</p>
                        </div>
                      </div>
                      
                      {latestReading && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-700">Crop Vigor (NDVI)</span>
                            <span className="font-semibold text-blue-900">{latestReading.ndvi_value}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-700">Health Score</span>
                            <span className={`font-semibold ${getHealthScoreColor(latestReading.crop_health_score)}`}>
                              {latestReading.crop_health_score}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-700">Weather Risk</span>
                            <span className="font-semibold text-blue-900">{(latestReading.weather_risk * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-700">Soil Moisture</span>
                            <span className="font-semibold text-blue-900">{(latestReading.soil_moisture * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 p-3 bg-white rounded border">
                        <p className="text-sm text-gray-700">
                          <strong>AI Assessment:</strong> Based on satellite analysis, your farm shows 
                          {latestReading && latestReading.crop_health_score > 80 ? ' excellent' : 
                           latestReading && latestReading.crop_health_score > 60 ? ' good' : ' moderate'} 
                          crop health indicators. This will positively impact your credit approval and interest rates.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insurance Tab */}
        {activeTab === 'insurance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Crop Insurance Quotes</h3>
                <p className="text-sm text-gray-600">Get risk-based insurance quotes using satellite data analysis</p>
              </div>
              
              <div className="p-6">
                {selectedPlot && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{selectedPlot.farm_name}</h4>
                        <p className="text-gray-600">{selectedPlot.location} • {selectedPlot.area_acres} acres • {selectedPlot.crop_type}</p>
                      </div>
                      <button
                        onClick={getInsuranceQuote}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {loading ? 'Calculating...' : 'Get Quote'}
                      </button>
                    </div>

                    {insuranceQuote && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h5 className="font-semibold text-blue-900 mb-4">Insurance Quote Details</h5>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-blue-700">Coverage Amount:</span>
                                <span className="font-semibold text-blue-900">${insuranceQuote.coverage_amount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Annual Premium:</span>
                                <span className="font-semibold text-blue-900">${insuranceQuote.premium_amount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Premium Rate:</span>
                                <span className="font-semibold text-blue-900">{insuranceQuote.premium_rate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Risk Level:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskLevelColor(insuranceQuote.risk_level)}`}>
                                  {insuranceQuote.risk_level}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Valid Until:</span>
                                <span className="font-semibold text-blue-900">{insuranceQuote.valid_until}</span>
                              </div>
                            </div>
                            
                            <div className="mt-6 p-4 bg-white rounded border">
                              <h6 className="font-semibold text-gray-900 mb-2">Coverage Breakdown</h6>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Crop Failure:</span>
                                  <span>${insuranceQuote.coverage_details.crop_failure.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Weather Damage:</span>
                                  <span>${insuranceQuote.coverage_details.weather_damage.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Pest & Disease:</span>
                                  <span>${insuranceQuote.coverage_details.pest_disease.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <button className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                              Purchase Policy
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h5 className="font-semibold text-green-900 mb-4">Satellite Risk Analysis</h5>
                            <div className="flex items-center mb-4">
                              <img 
                                src="https://images.unsplash.com/photo-1720200793798-947f201e2028?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwzfHxzYXRlbGxpdGUlMjBhZ3JpY3VsdHVyZXxlbnwwfHx8fDE3NTM3OTQ3NzB8MA&ixlib=rb-4.1.0&q=85"
                                alt="Satellite Analysis"
                                className="w-16 h-16 rounded-lg object-cover mr-4"
                              />
                              <div>
                                <h6 className="font-semibold text-green-900">Real-Time Assessment</h6>
                                <p className="text-sm text-green-700">Crop Health Score: {insuranceQuote.crop_health_score}%</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="p-3 bg-white rounded border">
                                <h6 className="font-semibold text-gray-900 mb-2">Risk Factors Analyzed</h6>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  <li>• Vegetation health index (NDVI)</li>
                                  <li>• Soil moisture levels</li>
                                  <li>• Weather pattern analysis</li>
                                  <li>• Historical yield data</li>
                                  <li>• Regional climate risks</li>
                                </ul>
                              </div>

                              <div className="p-3 bg-white rounded border">
                                <h6 className="font-semibold text-gray-900 mb-2">Premium Benefits</h6>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  <li>• Real-time monitoring included</li>
                                  <li>• Satellite-verified claims</li>
                                  <li>• Fast claim processing</li>
                                  <li>• No field inspection required</li>
                                  <li>• Weather alert notifications</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!insuranceQuote && (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Your Insurance Quote</h3>
                        <p className="text-gray-600 mb-6">Click "Get Quote" to receive a personalized insurance quote based on satellite crop analysis.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;