import React, { useState } from 'react';
import { TreePine, Trash2, Droplets, CloudRain, X, Heart } from 'lucide-react';

interface ContributorData {
  plantation: number;
  garbage_collection: number;
  water_ponds: number;
  rain_water: number;
}

interface EnvironmentalContributorTagProps {
  data: ContributorData;
  hideCount?: boolean;
  theme?: any;
}

const EnvironmentalContributorTag: React.FC<EnvironmentalContributorTagProps> = ({
  data,
  hideCount = false,
  theme,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const contributorTypes = [
    {
      key: 'plantation',
      icon: TreePine,
      color: '#4CAF50',
      name: 'Plantations',
      count: data.plantation
    },
    {
      key: 'garbage_collection',
      icon: Trash2,
      color: '#FF9800',
      name: 'Garbage Collection',
      count: data.garbage_collection
    },
    {
      key: 'water_ponds',
      icon: Droplets,
      color: '#2196F3',
      name: 'Water Ponds',
      count: data.water_ponds
    },
    {
      key: 'rain_water',
      icon: CloudRain,
      color: '#00BCD4',
      name: 'Rain Water',
      count: data.rain_water
    },
  ];

  const totalContributions = data.plantation + data.garbage_collection + data.water_ponds + data.rain_water;

  // Filter to only show icons for categories with contributions > 0
  const activeContributorTypes = contributorTypes.filter(item => item.count > 0);

  // Don't render tag if no contributions
  if (totalContributions === 0) {
    return null;
  }

  return (
    <>
      {/* Main Tag */}
      <button
        onClick={() => setModalVisible(true)}
        className="flex items-center bg-white px-2 py-1.5 rounded-2xl border border-green-100 hover:bg-green-50 transition-colors duration-200 shadow-sm"
      >
        <div className="flex items-center">
          {activeContributorTypes.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.key}
                className="w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center"
                style={{
                  marginLeft: index > 0 ? '-10px' : '0',
                  zIndex: activeContributorTypes.length - index,
                  borderColor: item.color,
                }}
              >
                <IconComponent 
                  className="w-3 h-3" 
                  style={{ color: item.color }} 
                />
              </div>
            );
          })}
        </div>
        {!hideCount && (
          <span className="ml-2 text-sm font-semibold text-green-800">
            {totalContributions}
          </span>
        )}
      </button>

      {/* Modal */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-black">
                Environmental Contributions
              </h2>
              <button
                onClick={() => setModalVisible(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Contributions List */}
            <div className="mb-5">
              {contributorTypes.map((item) => {
                const IconComponent = item.icon;
                const isActive = item.count > 0;
                
                return (
                  <div 
                    key={item.key} 
                    className={`flex items-center py-3 px-2 rounded-xl mb-2 ${
                      isActive ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
                    }`}
                  >
                    <div 
                      className="w-11 h-11 rounded-full flex items-center justify-center mr-3"
                      style={{ 
                        backgroundColor: isActive ? `${item.color}15` : '#F0F0F0' 
                      }}
                    >
                      <IconComponent 
                        className="w-6 h-6" 
                        style={{ color: isActive ? item.color : '#999' }} 
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className={`text-base font-semibold mb-0.5 ${
                        isActive ? 'text-gray-800' : 'text-gray-500'
                      }`}>
                        {item.name}
                      </div>
                      <div className={`text-sm ${
                        isActive ? 'text-gray-600' : 'text-gray-500'
                      }`}>
                        {item.count > 1 ? `${item.count} contributions` : `${item.count} contribution`}
                      </div>
                    </div>
                    
                    <div 
                      className="px-2.5 py-1 rounded-xl min-w-8 text-center"
                      style={{ 
                        backgroundColor: isActive ? item.color : '#E0E0E0' 
                      }}
                    >
                      <span className={`text-xs font-bold ${
                        isActive ? 'text-white' : 'text-gray-600'
                      }`}>
                        {item.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Summary */}
            <div className="bg-green-100 p-3 rounded-xl mb-5 text-center">
              <span className="text-sm font-semibold text-green-800">
                Total Environmental Contributions: {totalContributions}
              </span>
            </div>

            {/* Support Button */}
            <button
              onClick={() => {
                alert('Coming Soon!');
              }}
              className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center py-3.5 rounded-xl mb-2 transition-colors"
            >
              <Heart className="w-5 h-5 text-white mr-2" />
              <span className="text-white text-base font-semibold">
                Support Contributor
              </span>
            </button>

            {/* Coming Soon Badge */}
            <p className="text-center text-xs text-gray-500 italic">
              Feature coming soon!
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default EnvironmentalContributorTag