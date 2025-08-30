import React, { useState, useCallback } from 'react';
import { Search, X, TreePine, Trash2, Droplets, CloudRain, MapPin, Briefcase, Globe, ArrowRight, Loader2, AlertCircle, Clock, ExternalLink, Share } from 'lucide-react';


interface MapData {
  type: 'clustered' | 'individual';
  data: any[];
}

interface GlobalMapCounts {
  totalPosts: number;
  totalElements: number;
  categories: {
    plantation: { posts: number; totalTrees: number };
    garbage_collection: { posts: number; totalBins: number };
    water_ponds: { posts: number; totalPonds: number };
    rain_water: { posts: number; totalHarvesters: number };
  };
}

interface SearchResult {
  city: string;
  country: string;
  displayName: string;
  elementCount: number;
  projectCount: number;
  center: {
    latitude: number;
    longitude: number;
  };
}

interface SelectedElement {
  _id: string;
  postId: {
    _id: string;
    postType: string;
    projectDetails?: {
      name: string;
      description: string;
      owner?: string;
    };
    user?: string;
    username?: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
  };
  plantationData?: any;
  garbageCollectionData?: any;
  waterPondsData?: any;
  rainWaterData?: any;
  media?: any[];
  updateHistory?: Array<{
    updateDate: string;
    media: any[];
    notes: string;
  }>;
  createdAt?: string;
}


const ElementDetailsModal: React.FC<{
  visible: boolean;
  element: SelectedElement | null;
  isLoading: boolean;
  onClose: () => void;
  onEdit?: (element: SelectedElement) => void;
  onDelete?: (element: SelectedElement) => void;
  allowEdit?: boolean;
}> = ({ visible, element, isLoading, onClose, onEdit, onDelete, allowEdit = false }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  
  const getCategoryConfig = (postType: string) => {
    const baseConfig = {
      plantation: { icon: TreePine, color: '#4CAF50', name: 'Trees', singular: 'Tree' },
      garbage_collection: { icon: Trash2, color: '#FF9800', name: 'Bins', singular: 'Bin' },
      water_ponds: { icon: Droplets, color: '#2196F3', name: 'Ponds', singular: 'Pond' },
      rain_water: { icon: CloudRain, color: '#00BCD4', name: 'Harvesters', singular: 'Harvester' },
      all: { icon: MapPin, color: '#666', name: 'All Elements', singular: 'Element' }
    };

    return baseConfig[postType] || baseConfig.all;
  };

  const getElementSpecificData = (element: SelectedElement) => {
    if (element.plantationData) {
      return {
        type: 'Plant',
        details: [
          { label: 'Species', value: element.plantationData.species || 'Unknown' },
          { label: 'Type', value: element.plantationData.type || 'Unknown' },
          { label: 'Height', value: element.plantationData.estimatedHeight ? `${element.plantationData.estimatedHeight}m` : 'Unknown' },
        ]
      };
    } else if (element.garbageCollectionData) {
      return {
        type: 'Bin',
        details: [
          { label: 'Type', value: element.garbageCollectionData.type || 'Unknown' },
          { label: 'Capacity', value: element.garbageCollectionData.capacity || 'Unknown' },
          { label: 'Material', value: element.garbageCollectionData.material || 'Unknown' },
        ]
      };
    } else if (element.waterPondsData) {
      return {
        type: 'Pond',
        details: [
          { label: 'Type', value: element.waterPondsData.type || 'Unknown' },
          { label: 'Purpose', value: element.waterPondsData.purpose || 'Unknown' },
          { label: 'Capacity', value: element.waterPondsData.capacity || 'Unknown' },
          { label: 'Depth', value: element.waterPondsData.estimatedDepth ? `${element.waterPondsData.estimatedDepth}m` : 'Unknown' }
        ]
      };
    } else if (element.rainWaterData) {
      return {
        type: 'Harvester',
        details: [
          { label: 'Type', value: element.rainWaterData.type || 'Unknown' },
          { label: 'Capacity', value: element.rainWaterData.capacity || 'Unknown' },
          { label: 'Storage', value: element.rainWaterData.storageMethod || 'Unknown' },
          { label: 'Volume', value: element.rainWaterData.estimatedVolume ? `${element.rainWaterData.estimatedVolume}L` : 'Unknown' }
        ]
      };
    }

    return null;
  };

  const getRelativeTime = (date: string): string => {
    const now = new Date().getTime();
    const targetDate = new Date(date).getTime();
    const diffInSeconds = Math.floor((now - targetDate) / 1000);

    
    if (diffInSeconds < 0) {
      const futureDiffInSeconds = Math.abs(diffInSeconds);

      if (futureDiffInSeconds < 60) return 'In a moment';

      const diffInMinutes = Math.floor(futureDiffInSeconds / 60);
      if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1 minute remaining' : `${diffInMinutes} minutes remaining`;
      }

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hour remaining' : `${diffInHours} hours remaining`;
      }

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return diffInDays === 1 ? '1 day remaining' : `${diffInDays} days remaining`;
      }

      if (diffInDays < 365) {
        const diffInMonths = Math.floor(diffInDays / 30);
        return diffInMonths === 1 ? '1 month remaining' : `${diffInMonths} months remaining`;
      }

      const diffInYears = Math.floor(diffInDays / 365);
      return diffInYears === 1 ? '1 year remaining' : `${diffInYears} years remaining`;
    }

    
    if (diffInSeconds < 60) return 'Just now';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }

    if (diffInDays < 365) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
  };

  
  const getProjectDetails = () => {
    if (element?.postId?.projectDetails) {
      return element.postId.projectDetails;
    }

    return {
      name: 'Environmental Project',
      description: element?.postId?.postType ? `${element.postId.postType} project` : 'Environmental project'
    };
  };

  
  const handleOpenInMaps = useCallback(() => {
    if (!element?.location) return;

    const { latitude, longitude } = element.location;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;

    window.open(url, '_blank');
  }, [element]);

  const getAllMedia = () => {
    const allMedia = [];

    
    if (element?.media) {
      element.media.forEach((item, index) => {
        allMedia.push({
          ...item,
          source: 'main',
          sourceIndex: index
        });
      });
    }

    
    if (element?.updateHistory) {
      element.updateHistory.forEach((update, updateIndex) => {
        if (update.media) {
          update.media.forEach((item, mediaIndex) => {
            allMedia.push({
              ...item,
              source: 'update',
              sourceIndex: updateIndex,
              updateDate: update.updateDate,
              updateNotes: update.notes
            });
          });
        }
      });
    }

    return allMedia;
  };

  
  const handleImagePress = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  }, []);

  if (!visible) return null;

  const categoryConfig = element ? getCategoryConfig(element.postId?.postType) : getCategoryConfig('all');
  const elementData = element ? getElementSpecificData(element) : null;
  const projectDetails = getProjectDetails();
  const allMedia = getAllMedia();
  const IconComponent = categoryConfig.icon;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Element Details</h2>
              {allowEdit && element && onEdit && (
                <button
                  onClick={() => onEdit(element)}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading details...</p>
              </div>
            ) : element ? (
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${categoryConfig.color}20` }}>
                      <IconComponent className="w-6 h-6" style={{ color: categoryConfig.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {projectDetails.name}
                      </h3>
                      {projectDetails.owner && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Owner: {projectDetails.owner}
                        </p>
                      )}
                    </div>
                  </div>
                  {projectDetails.description && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {projectDetails.description}
                    </p>
                  )}
                </div>


                {allMedia.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Media Gallery ({allMedia.length})
                    </h4>
                    <div className={`flex pb-2 ${allMedia.length > 1 ? 'space-x-3 overflow-x-auto' : 'justify-center'}`}>
                      {allMedia.map((mediaItem, index) => (
                        <div
                          key={index}
                          className={`relative cursor-pointer group ${allMedia.length > 1 ? 'flex-shrink-0' : ''}`}
                          onClick={() => handleImagePress(index)}
                        >
                          <img
                            src={mediaItem.url}
                            alt={`Media ${index + 1}`}
                            className="w-64 h-64 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                          />
                          <div
                            className="absolute top-1 left-1 px-2 py-1 rounded text-xs text-white font-medium"
                            style={{ backgroundColor: mediaItem.source === 'main' ? categoryConfig.color : '#666' }}
                          >
                            {mediaItem.source === 'main' ? 'Original' : 'Update'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {element.updateHistory && element.updateHistory.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      Update History ({element.updateHistory.length})
                    </h4>
                    <div className="space-y-4">
                      {element.updateHistory.map((update, index) => (
                        <div key={index} className="border-b border-gray-100 dark:border-gray-600 pb-4 last:border-b-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {new Date(update.updateDate).toLocaleDateString()} ({getRelativeTime(update.updateDate)})
                            </span>
                          </div>
                          {update.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {update.notes}
                            </p>
                          )}
                          {update.media && update.media.length > 0 && (
                            <div className={`flex ${update.media.length > 1 ? 'space-x-2 overflow-x-auto' : 'justify-center'}`}>
                              {update.media.map((mediaItem, mediaIndex) => (
                                <img
                                  key={mediaIndex}
                                  src={mediaItem.url}
                                  alt={`Update ${mediaIndex + 1}`}
                                  className="w-64 h-64 object-cover rounded cursor-pointer hover:opacity-80"
                                  onClick={() => {
                                    const mediaItemIndex = allMedia.findIndex(m =>
                                      m.source === 'update' && m.sourceIndex === index && m.url === mediaItem.url
                                    );
                                    if (mediaItemIndex !== -1) {
                                      handleImagePress(mediaItemIndex);
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {elementData && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      {elementData.type} Information
                    </h4>
                    <div className="space-y-2">
                      {elementData.details.map((detail, index) => (
                        <div key={index} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                          <span className="text-gray-600 dark:text-gray-400">{detail.label}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white">Location Details</h4>
                    <button
                      onClick={handleOpenInMaps}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">Open in Maps</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {element.location.address && (
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-400">Address</span>
                        <span className="font-medium text-gray-900 dark:text-white text-right">{element.location.address}</span>
                      </div>
                    )}
                    {element.location.city && (
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-400">City</span>
                        <span className="font-medium text-gray-900 dark:text-white">{element.location.city}</span>
                      </div>
                    )}
                    {element.location.country && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">Country</span>
                        <span className="font-medium text-gray-900 dark:text-white">{element.location.country}</span>
                      </div>
                    )}
                  </div>
                </div>

                {element && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Metadata</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-400">Created</span>
                        <span className="font-medium text-gray-900 dark:text-white text-right">
                          {new Date(element.createdAt).toLocaleDateString()}<br />
                          <span className="text-sm text-gray-500">({getRelativeTime(element.createdAt)})</span>
                        </span>
                      </div>
                      {element?.plantationData && element.plantationData.nextUpdateDue && (
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600 dark:text-gray-400">Update Due</span>
                          <span className="font-medium text-gray-900 dark:text-white text-right">
                            {new Date(element.plantationData.nextUpdateDue).toLocaleDateString()}<br />
                            <span className="text-sm text-gray-500">({getRelativeTime(element.plantationData.nextUpdateDue)})</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {allowEdit && element && onDelete && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <button
                      onClick={() => onDelete(element)}
                      className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="font-medium">Delete Element</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">No element data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {imageViewerVisible && (
        <div className="fixed inset-0 bg-black z-[100]">
          <button
            onClick={() => setImageViewerVisible(false)}
            className="absolute top-4 right-4 z-70 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {allMedia[selectedImageIndex] && (
            <>
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={allMedia[selectedImageIndex].url}
                  alt="Full size"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg">
                <h3 className="font-semibold mb-1">
                  {allMedia[selectedImageIndex].source === 'main' ? 'Original Photo' : 'Update Photo'}
                </h3>
                {allMedia[selectedImageIndex].updateDate && (
                  <p className="text-sm opacity-80 mb-1">
                    {new Date(allMedia[selectedImageIndex].updateDate).toLocaleDateString()}
                  </p>
                )}
                {allMedia[selectedImageIndex].updateNotes && (
                  <p className="text-sm opacity-90">
                    {allMedia[selectedImageIndex].updateNotes}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ElementDetailsModal;