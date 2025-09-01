import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import {
  X,
  TreePine,
  Trash2,
  Droplets,
  CloudRain,
  MapPin,
  ExternalLink,
  Earth,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { format } from 'date-fns';
import { axiosClient } from '@/api/axiosClient';
import ElementDetailsModal from '@/models/ElementDetailsModal';

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

interface LocationPostDisplayProps {
  post: {
    _id: string;
    content: string;
    postType: 'plantation' | 'garbage_collection' | 'water_ponds' | 'rain_water';
    media: Array<{
      url: string;
      type: string;
      location?: {
        latitude: number;
        longitude: number;
        address?: string;
      };
      capturedAt?: string;
    }>;
    location: {
      latitude: number;
      longitude: number;
      address?: string;
      country?: string;
      city?: string;
    };
    environmentalContributions?: Array<{
      _id: string;
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
      media?: Array<{
        url: string;
        type: string;
        capturedAt?: string;
      }>;
      updateHistory?: Array<{
        updateDate: string;
        media: any[];
        notes: string;
      }>;
      createdAt?: string;
    }>;
    createdAt: string;
    user?: any;
    target?: any;
    type: string;
    likesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
    videoViewsCount?: number;
    isLikedByUser?: boolean;
    isBookmarkedByUser?: boolean;
  };
  isShared?: boolean,
  setEditModalVisible?: (value: boolean) => void;
  setMapModalVisible?: (value: boolean) => void;
  mapModalVisible?: boolean;
  theme?: any;
}

const createCustomMarkerIcon = (postType: string, index: number): string => {
  const getConfig = (type: string) => {
    const configs = {
      plantation: { color: '#4CAF50', icon: '🌳' },
      garbage_collection: { color: '#FF9800', icon: '🗑️' },
      water_ponds: { color: '#2196F3', icon: '💧' },
      rain_water: { color: '#00BCD4', icon: '🌧️' },
    };
    return configs[type] || { color: '#666', icon: '📍' };
  };

  const config = getConfig(postType);

  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${config.color}" stroke="white" stroke-width="3"/>
      <text x="20" y="26" text-anchor="middle" font-size="16">${config.icon}</text>
      <circle cx="32" cy="8" r="8" fill="white" stroke="${config.color}" stroke-width="2"/>
      <text x="32" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="${config.color}">${index + 1}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

interface ReusableMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Array<{
    id: string;
    position: { lat: number; lng: number };
    data: any;
    index: number;
  }>;
  postType: string;
  onMarkerClick?: (marker: any) => void;
  onViewMoreDetails?: (marker: any) => void;
  interactive?: boolean;
  showInfoWindow?: boolean;
  activeMarker?: any;
  onInfoWindowClose?: () => void;
  onMapClick?: () => void;
  className?: string;
}

const ReusableMap: React.FC<ReusableMapProps> = ({
  center,
  zoom,
  markers,
  postType,
  onMarkerClick,
  onViewMoreDetails,
  interactive = true,
  showInfoWindow = false,
  activeMarker,
  onInfoWindowClose,
  onMapClick,
  className = ""
}) => {
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const mapRef = useRef<google.maps.Map>(null);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        console.log('Google Maps is available for LocationPostDisplay');
        setGoogleMapsReady(true);
        return true;
      }
      return false;
    };

    if (!checkGoogleMaps()) {
      console.log('Waiting for Google Maps to load...');

      const interval = setInterval(() => {
        if (checkGoogleMaps()) {
          clearInterval(interval);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!window.google || !window.google.maps) {
          console.error('Google Maps failed to load within 15 seconds');
        }
      }, 15000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, []);

  const getPostTypeConfig = (type: string) => {
    switch (type) {
      case 'plantation':
        return { icon: TreePine, color: '#4CAF50', title: 'Plantation' };
      case 'garbage_collection':
        return { icon: Trash2, color: '#FF9800', title: 'Garbage Collection' };
      case 'water_ponds':
        return { icon: Droplets, color: '#2196F3', title: 'Water Ponds' };
      case 'rain_water':
        return { icon: CloudRain, color: '#00BCD4', title: 'Rain Water' };
      default:
        return { icon: MapPin, color: '#666', title: 'Location' };
    }
  };

  const getElementSpecificData = (element: any) => {
    if (element.plantationData) {
      return {
        type: 'Tree',
        details: [
          { label: 'Species', value: element.plantationData.species || 'Unknown' },
          { label: 'Type', value: element.plantationData.type || 'Unknown' },
          { label: 'Height', value: element.plantationData.estimatedHeight ? `${element.plantationData.estimatedHeight}m` : 'Unknown' },
          { label: 'Status', value: element.plantationData.isActive ? 'Active' : 'Inactive' }
        ]
      };
    } else if (element.garbageCollectionData) {
      return {
        type: 'Bin',
        details: [
          { label: 'Type', value: element.garbageCollectionData.type || 'Unknown' },
          { label: 'Capacity', value: element.garbageCollectionData.capacity || 'Unknown' },
          { label: 'Material', value: element.garbageCollectionData.material || 'Unknown' }
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

  const typeConfig = getPostTypeConfig(postType);
  const IconComponent = typeConfig.icon;

  if (!googleMapsReady) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-700`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={{
          ...mapOptions,
          zoomControl: interactive,
          scrollwheel: interactive,
          disableDoubleClickZoom: !interactive,
          draggable: interactive,
        }}
        onLoad={(map: any) => {
          mapRef.current = map;
        }}
        onClick={onMapClick}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={
              window.google ? {
                url: createCustomMarkerIcon(postType, marker.index),
                scaledSize: new window.google.maps.Size(interactive ? 50 : 40, interactive ? 50 : 40),
                anchor: new window.google.maps.Point(interactive ? 25 : 20, interactive ? 25 : 20),
              } : undefined
            }
            onClick={() => onMarkerClick?.(marker.data)}
          />
        ))}

        {showInfoWindow && activeMarker && interactive && (
          <InfoWindow
            position={{
              lat: activeMarker.location.latitude,
              lng: activeMarker.location.longitude,
            }}
            onCloseClick={onInfoWindowClose}
          >
            <div className="p-3 max-w-xs">
              <div className="flex items-center space-x-2 mb-2">
                <IconComponent className="w-5 h-5" style={{ color: typeConfig.color }} />
                <h3 className="font-semibold text-gray-900">
                  {activeMarker.projectDetails?.name || activeMarker.postId?.projectDetails?.name || 'Environmental Project'}
                </h3>
              </div>

              <p className="text-xs text-gray-600 mb-2">
                {activeMarker.location.address || `${activeMarker.location.city}, ${activeMarker.location.country}`}
              </p>

              {getElementSpecificData(activeMarker) && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    {getElementSpecificData(activeMarker)?.type} Details
                  </p>
                  {getElementSpecificData(activeMarker)?.details.slice(0, 2).map((detail, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-600">{detail.label}:</span>
                      <span className="font-medium text-gray-900">{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => onViewMoreDetails?.(activeMarker)}
                className="w-full text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
              >
                <span>View More Details</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

const LocationPostDisplay: React.FC<LocationPostDisplayProps> = ({
  post,
  isShared,
  setMapModalVisible,
  mapModalVisible = false,
  theme = { colors: { text: '#000', card: '#fff', primary: '#007bff', surfaceVariant: '#f5f5f5', onSurfaceVariant: '#666' } }
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [showElementModal, setShowElementModal] = useState(false);
  const [isLoadingElementDetails, setIsLoadingElementDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeMarker, setActiveMarker] = useState<any>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  const [mapCenter, setMapCenter] = useState({
    lat: post.location.latitude,
    lng: post.location.longitude,
  });
  const [mapZoom, setMapZoom] = useState(12);

  const fetchElementDetails = useCallback(async (elementId: string) => {
    if (!elementId) {
      console.error('No element ID provided');
      return;
    }

    setIsLoadingElementDetails(true);
    try {
      console.log('Fetching element details for:', elementId);
      const { data, status } = await axiosClient.get(`/posts/environmental-contributions/${elementId}`);

      if (status === 200) {
        console.log('Element details received:', data);
        setSelectedElement(data);
        setShowElementModal(true);
      } else {
        throw new Error(`API returned status: ${status}`);
      }
    } catch (error) {
      console.error('Error fetching element details:', error);
      alert('Error: Unable to load element details. Please try again.');
      setShowElementModal(false);
    } finally {
      setIsLoadingElementDetails(false);
    }
  }, []);

  const handleLocationIconPress = useCallback((mediaItem: any, index: number) => {
    const specificCenter = {
      lat: mediaItem.location.latitude,
      lng: mediaItem.location.longitude,
    };

    setMapCenter(specificCenter);
    setMapZoom(24);

    if (setMapModalVisible) {
      setMapModalVisible(true);
    }
  }, [setMapModalVisible]);

  const getEnvironmentalContributions = () => {
    return post.environmentalContributions || [];
  };

  const getAllContributionMedia = () => {
    const contributions = getEnvironmentalContributions();
    const allMedia = [];

    contributions.forEach((contribution, contributionIndex) => {
      if (contribution.media && contribution.media.length > 0) {
        contribution.media.forEach((mediaItem, mediaIndex) => {
          allMedia.push({
            ...mediaItem,
            location: contribution.location,
            contributionId: contribution._id,
            contributionIndex,
            mediaIndex,
            environmentalData: {
              plantationData: contribution.plantationData,
              garbageCollectionData: contribution.garbageCollectionData,
              waterPondsData: contribution.waterPondsData,
              rainWaterData: contribution.rainWaterData
            }
          });
        });
      }
    });

    return allMedia;
  };

  const getProjectDetails = () => {
    return {
      name: post.content?.split('\n')[0] || 'Environmental Project',
      description: post.content || '',
      location: post.location
    };
  };

  const getAggregatedStats = () => {
    const contributions = getEnvironmentalContributions();
    const totalElements = contributions.length;
    const totalUpdates = contributions.reduce((acc, contrib) =>
      acc + (contrib.updateHistory?.length || 0), 0
    );

    return { totalElements, totalUpdates };
  };

  const getPostTypeConfig = () => {
    switch (post.postType) {
      case 'plantation':
        return {
          name: 'tree',
          color: '#4CAF50',
          title: 'Plantation',
          itemName: 'plant',
          itemsName: 'plants',
          icon: TreePine
        };
      case 'garbage_collection':
        return {
          name: 'delete-variant',
          color: '#FF9800',
          title: 'Garbage Collection',
          itemName: 'bin',
          itemsName: 'bins',
          icon: Trash2
        };
      case 'water_ponds':
        return {
          name: 'water',
          color: '#2196F3',
          title: 'Water Ponds',
          itemName: 'pond',
          itemsName: 'ponds',
          icon: Droplets
        };
      case 'rain_water':
        return {
          name: 'weather-rainy',
          color: '#00BCD4',
          title: 'Rain Water',
          itemName: 'harvester',
          itemsName: 'harvesters',
          icon: CloudRain
        };
      default:
        return {
          name: 'map-marker',
          color: theme.colors.primary,
          title: 'Location Post',
          itemName: 'item',
          itemsName: 'items',
          icon: MapPin
        };
    }
  };

  const handleMarkerClick = useCallback((contribution: any) => {
    const tooltipData = {
      _id: contribution._id,
      postType: post.postType,
      location: contribution.location,
      postId: {
        projectDetails: getProjectDetails()
      },
      ...contribution
    };

    setActiveMarker(tooltipData);
    setShowInfoWindow(true);
    console.log('Showing info window for contribution:', tooltipData);
  }, [post.postType]);

  const handleViewMore = useCallback((element: any) => {
    if (element && element._id) {
      setShowInfoWindow(false);
      fetchElementDetails(element._id);
    } else {
      console.warn('No element ID available for details');
      alert('Unable to load details - element ID not found');
    }
  }, [fetchElementDetails]);

  const handleImagePress = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  }, []);

  const typeConfig = getPostTypeConfig();
  const allMedia = getAllContributionMedia();
  const { totalElements } = getAggregatedStats();
  const IconComponent = typeConfig.icon;

  const mapMarkers = getEnvironmentalContributions().map((contribution, index) => ({
    id: contribution._id,
    position: {
      lat: contribution.location.latitude,
      lng: contribution.location.longitude,
    },
    data: contribution,
    index: index
  }));

  return (
    <>
      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        <div className="px-4 pt-4">
          <div
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: typeConfig.color }}
          >
            <IconComponent className="w-4 h-4" />
            <span>{typeConfig.title}</span>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-accent rounded-lg p-4">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <IconComponent className="w-6 h-6 mx-auto mb-1" style={{ color: typeConfig.color }} />
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {totalElements || 2}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {(totalElements || 2) === 1 ? typeConfig.itemName : typeConfig.itemsName}
                </div>
              </div>

              {post.location?.country && (
                <div className="text-center">
                  <Earth className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {post.location.country}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Location</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {allMedia.length > 0 && (
          <div className="p-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {typeConfig.title} Locations
            </h4>
            <div className={`flex pb-2 ${allMedia.length > 1 ? 'space-x-3 overflow-x-auto' : 'justify-center'}`}>
              {allMedia.map((mediaItem, index) => (
                <div
                  key={`${mediaItem.contributionId}-${index}`}
                  className={`relative cursor-pointer group ${allMedia.length > 1 ? 'flex-shrink-0' : ''}`}
                  onClick={() => handleImagePress(index)}
                >
                  <img
                    src={mediaItem.url}
                    alt={`${typeConfig.title} ${index + 1}`}
                    className="w-80 h-64 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg" />
                  <div
                    className="absolute bottom-1 left-1 px-2 py-1 rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: typeConfig.color }}
                  >
                    {index + 1}
                  </div>
                  <button
                    className="absolute top-1 right-1 bg-black bg-opacity-60 hover:bg-opacity-80 rounded-full p-1 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLocationIconPress(mediaItem, index);
                    }}
                    title="View on map"
                  >
                    <MapPin className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center italic">
              Each image shows one {typeConfig.itemName} at its GPS location. Click the location icon to view on map.
            </p>
          </div>
        )}

        {(post.likesCount > 0 || post.commentsCount > 0 || post.sharesCount > 0) && !isShared && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              {post.likesCount > 0 && (
                <span>{post.likesCount} likes</span>
              )}
              {post.commentsCount > 0 && (
                <span>{post.commentsCount} comments</span>
              )}
              {post.sharesCount > 0 && (
                <span>{post.sharesCount} shares</span>
              )}
            </div>
          </div>
        )}

        <div className="px-4 pb-4 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>
            {`${post?.location?.country}, ${post?.location?.city}` || `${post.location.latitude.toFixed(4)}, ${post.location.longitude.toFixed(4)}`}
          </span>
        </div>
      </div>

      {mapModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" style={{ isolation: 'isolate', transform: 'translateZ(0)' }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {typeConfig.title} Locations ({totalElements || 2})
              </h2>
              <button
                onClick={() => {
                  setMapModalVisible(false);
                  setMapCenter({
                    lat: post.location.latitude,
                    lng: post.location.longitude,
                  });
                  setMapZoom(24);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex-1 relative">
              <ReusableMap
                center={mapCenter}
                zoom={mapZoom}
                markers={mapMarkers}
                postType={post.postType}
                onMarkerClick={handleMarkerClick}
                onViewMoreDetails={handleViewMore}
                interactive={true}
                showInfoWindow={showInfoWindow}
                activeMarker={activeMarker}
                onInfoWindowClose={() => setShowInfoWindow(false)}
                onMapClick={() => setShowInfoWindow(false)}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {imageModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4" style={{ isolation: 'isolate', transform: 'translateZ(0)' }}>
          <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
            <button
              onClick={() => setImageModalVisible(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
            >
              <X className="w-6 h-6" />
            </button>

            {allMedia.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : allMedia.length - 1)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(selectedImageIndex < allMedia.length - 1 ? selectedImageIndex + 1 : 0)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {allMedia[selectedImageIndex] && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={allMedia[selectedImageIndex].url}
                  alt={`${typeConfig.title} ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />

                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white rounded-lg p-4">
                  <h3 className="font-semibold mb-1">
                    {typeConfig.title} {selectedImageIndex + 1} of {allMedia.length}
                  </h3>
                  <p className="text-sm opacity-80 mb-2">
                    {allMedia[selectedImageIndex].location?.address ||
                      `${allMedia[selectedImageIndex].location?.latitude?.toFixed(6)}, ${allMedia[selectedImageIndex].location?.longitude?.toFixed(6)}`}
                  </p>
                  {allMedia[selectedImageIndex].capturedAt && (
                    <p className="text-xs opacity-60 mb-2">
                      Captured: {format(new Date(allMedia[selectedImageIndex].capturedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setImageModalVisible(false);
                      handleLocationIconPress(allMedia[selectedImageIndex], selectedImageIndex);
                    }}
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">View on Map</span>
                  </button>
                </div>

                <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white rounded-lg px-3 py-1 text-sm">
                  {selectedImageIndex + 1} / {allMedia.length}
                </div>
              </div>
            )}
          </div>
        </div >
      )}

      <ElementDetailsModal
        visible={showElementModal}
        element={selectedElement}
        isLoading={isLoadingElementDetails}
        onClose={() => setShowElementModal(false)}
      />

      {
        showMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowMenu(false)}
          />
        )
      }
    </>
  );
};

export default LocationPostDisplay;