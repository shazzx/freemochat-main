import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { domain } from '@/config/domain';

const HashtagResult = ({ hashtag, onPress }) => {
  const formatUsageCount = (count) => {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      return (count / 1000).toFixed(1) + 'K';
    } else {
      return (count / 1000000).toFixed(1) + 'M';
    }
  };

  const formatLastUsed = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div 
      className='flex w-full justify-between items-center p-4 gap-3 bg-card rounded-md hover:bg-accent cursor-pointer transition-colors'
      onClick={() => onPress && onPress(hashtag.name)}
    >
      <div className='flex gap-3 items-center flex-1'>
        <div className='w-12 h-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground'>
          <span className='text-xl font-bold'>#</span>
        </div>
        
        <div className="flex flex-col justify-center flex-1">
          <div className='font-semibold text-foreground'>
            #{hashtag.displayName || hashtag.name}
          </div>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <span>
              {formatUsageCount(hashtag.usageCount)} {hashtag.usageCount === 1 ? 'post' : 'posts'}
            </span>
            <span>•</span>
            <span>
              {formatLastUsed(hashtag.lastUsed)}
            </span>
          </div>
        </div>
      </div>
      
      <div className='flex items-center'>
        <svg 
          className="w-5 h-5 text-muted-foreground" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default HashtagResult;