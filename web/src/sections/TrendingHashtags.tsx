import React, { useState, useEffect } from 'react';
import HashtagResult from './HashtagResult';
import { axiosClient } from '@/api/axiosClient';
import ScreenLoader from '@/components/ScreenLoader';

const TrendingHashtags = ({ onHashtagPress }) => {
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  const fetchTrendingHashtags = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/search/trending-hashtags?limit=10');
      if (response.data) {
        setTrendingHashtags(response.data);
      }
    } catch (err) {
      console.error('Error fetching trending hashtags:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <ScreenLoader />
      </div>
    );
  }

  return (
    <>
      <div className="text-lg font-semibold mb-4">Trending Hashtags</div>
      
      {trendingHashtags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <span className="text-2xl text-muted-foreground">#</span>
          </div>
          <p className="text-muted-foreground">No trending hashtags yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trendingHashtags.map((hashtag) => (
            <HashtagResult
              key={hashtag._id}
              hashtag={hashtag}
              onPress={onHashtagPress}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default TrendingHashtags;