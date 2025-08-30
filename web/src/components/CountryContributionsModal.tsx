import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, XCircle, TreePine, Trash2, Droplets, CloudRain, Globe, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';

interface CountryContribution {
  country: string;
  count: number;
  displayName: string;
  _id?: string;
}

interface CountryContributionsData {
  categories: {
    plantation: CountryContribution[];
    garbage_collection: CountryContribution[];
    water_ponds: CountryContribution[];
    rain_water: CountryContribution[];
  };
  totals: {
    plantation: number;
    garbage_collection: number;
    water_ponds: number;
    rain_water: number;
  };
  grandTotal: number;
  countriesCount: {
    plantation: number;
    garbage_collection: number;
    water_ponds: number;
    rain_water: number;
  };
  totalUniqueCountries: number;
  success: boolean;
  timestamp: string;
}

interface CountryContributionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const getCategoryConfig = (category: string) => {
  const configs = {
    plantation: { 
      icon: TreePine, 
      color: '#4CAF50', 
      name: 'Trees Planted', 
      unit: 'trees',
      lightColor: '#E8F5E8'
    },
    garbage_collection: { 
      icon: Trash2, 
      color: '#FF9800', 
      name: 'Bins Installed', 
      unit: 'bins',
      lightColor: '#FFF3E0'
    },
    water_ponds: { 
      icon: Droplets, 
      color: '#2196F3', 
      name: 'Ponds Created', 
      unit: 'ponds',
      lightColor: '#E3F2FD'
    },
    rain_water: { 
      icon: CloudRain, 
      color: '#00BCD4', 
      name: 'Harvesters Built', 
      unit: 'harvesters',
      lightColor: '#E0F2F1'
    }
  };
  return configs[category] || configs.plantation;
};

const CountryContributionsModal: React.FC<CountryContributionsModalProps> = ({ visible, onClose }) => {
  const [data, setData] = useState<CountryContributionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'plantation' | 'garbage_collection' | 'water_ponds' | 'rain_water'>('plantation');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<CountryContribution[]>([]);

  const fetchCountryContributions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('Fetching country contributions...');
      
      const { data: responseData } = await axiosClient.get("metrics-aggregator/global/contributions");
      
      if (responseData.success) {
        setData(responseData);
        console.log('Country contributions loaded successfully:', {
          totalCategories: Object.keys(responseData.categories).length,
          grandTotal: responseData.grandTotal,
          uniqueCountries: responseData.totalUniqueCountries
        });
      } else {
        throw new Error(responseData.error || 'Failed to fetch data');
      }
      
    } catch (error) {
      console.error('Error fetching country contributions:', error);
      
      if (window.confirm('Failed to load country contributions. Would you like to retry?')) {
        fetchCountryContributions(isRefresh);
      } else if (!data) {
        setData({
          categories: {
            plantation: [],
            garbage_collection: [],
            water_ponds: [],
            rain_water: []
          },
          totals: {
            plantation: 0,
            garbage_collection: 0,
            water_ponds: 0,
            rain_water: 0
          },
          grandTotal: 0,
          countriesCount: {
            plantation: 0,
            garbage_collection: 0,
            water_ponds: 0,
            rain_water: 0
          },
          totalUniqueCountries: 0,
          success: false,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  useEffect(() => {
    if (visible && !data) {
      fetchCountryContributions();
    }
  }, [visible, data, fetchCountryContributions]);

  useEffect(() => {
    if (data && data.categories[selectedCategory]) {
      const countries = data.categories[selectedCategory];
      if (searchQuery.trim()) {
        const filtered = countries.filter(country =>
          country.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.country.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCountries(filtered);
      } else {
        setFilteredCountries(countries);
      }
    }
  }, [data, selectedCategory, searchQuery]);

  const handleRefresh = useCallback(() => {
    fetchCountryContributions(true);
  }, [fetchCountryContributions]);

  if (!visible) return null;

  const currentConfig = getCategoryConfig(selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Global Country Contributions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Environmental impact by country</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Summary Stats */}
        {data && (
          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <Globe className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.grandTotal.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Contributions</div>
              </div>
              <div className="text-center">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.totalUniqueCountries}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Countries</div>
              </div>
              <div className="text-center">
                <currentConfig.icon className="w-6 h-6 mx-auto mb-2" style={{ color: currentConfig.color }} />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(data.totals[selectedCategory] || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{currentConfig.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2 overflow-x-auto">
            {(['plantation', 'garbage_collection', 'water_ponds', 'rain_water'] as const).map((category) => {
              const config = getCategoryConfig(category);
              const isSelected = selectedCategory === category;
              const count = data?.totals[category] || 0;
              const countriesCount = data?.countriesCount[category] || 0;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg border-2 transition-all whitespace-nowrap ${
                    isSelected 
                      ? 'text-white shadow-md' 
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  style={isSelected ? { backgroundColor: config.color, borderColor: config.color } : {}}
                >
                  <config.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{config.name}</span>
                  <span className="text-xs opacity-90">
                    {count.toLocaleString()} • {countriesCount} countries
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
              <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
              <input
                type="text"
                placeholder={`Search countries in ${currentConfig.name.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {searchQuery.length > 0 && (
                <button onClick={() => setSearchQuery('')} className="ml-2">
                  <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Country List */}
        <div className="flex-1 overflow-hidden">
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: currentConfig.color }} />
              <p className="text-gray-600 dark:text-gray-400">Loading country data...</p>
            </div>
          ) : !filteredCountries.length ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              {searchQuery ? (
                <>
                  <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No countries found matching your search</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No data available for this category</p>
                </>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-6 space-y-3">
                {filteredCountries.map((country, index) => {
                  const percentage = data?.totals[selectedCategory] ? 
                    (country.count / data.totals[selectedCategory] * 100) : 0;

                  return (
                    <div key={`${country.country}-${index}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-bold" style={{ color: currentConfig.color }}>
                            #{index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{country.displayName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {percentage.toFixed(1)}% of global {currentConfig.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold" style={{ color: currentConfig.color }}>
                            {country.count.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{currentConfig.unit}</div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.max(percentage, 2)}%`, 
                            backgroundColor: currentConfig.color 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Refresh button */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <Loader2 className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountryContributionsModal;