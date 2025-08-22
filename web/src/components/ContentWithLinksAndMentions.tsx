import React, { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const URL_REGEX = /(?:(?:https?|ftp):\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
const MENTION_REGEX = /@(\w+)/g;
const HASHTAG_REGEX = /#([a-zA-Z0-9_]+)/g;

const MAX_CONTENT_LENGTH = 150;

interface ContentWithLinksAndMentionsProps {
  content: string;
  theme?: any;
  mentions?: any[];
  navigation?: any;
  onHashtagPress?: (hashtag: string) => void;
  expanded?: boolean;
  toggleReadMore?: () => void;
  hasBackground?: boolean;
  maxLength?: number;
  showReadMore?: boolean;
}

const ContentWithLinksAndMentions = memo<ContentWithLinksAndMentionsProps>(({
  content,
  theme,
  mentions = [],
  navigation,
  onHashtagPress,
  expanded = true,
  toggleReadMore,
  hasBackground = false,
  maxLength = MAX_CONTENT_LENGTH,
  showReadMore = true,
}) => {
  const navigate = useNavigate();

  const parsedContent = useMemo(() => {
    if (!content) return [];

    // First, replace user IDs with usernames for display
    let displayContent = content;

    // Replace @userId with @username for each mentioned user
    // Handle both 24-character MongoDB ObjectIds and any deleted users
    // Skip special mentions like @followers
    const userIdRegex = /@([a-f\d]{24})/g;
    let match;
    const processedIds = new Set();

    while ((match = userIdRegex.exec(content)) !== null) {
      const userId = match[1];
      if (!processedIds.has(userId)) {
        processedIds.add(userId);
        const user = mentions.find(u => u._id === userId);

        if (user) {
          // Replace user ID with current username
          const idRegex = new RegExp(`@${userId}`, 'g');
          displayContent = displayContent.replace(idRegex, `@${user.username}`);
        } else {
          // Handle deleted/not found users
          const idRegex = new RegExp(`@${userId}`, 'g');
          displayContent = displayContent.replace(idRegex, '@deleted-user');
        }
      }
    }

    // Parse the content for different types of content
    const parts = [];
    let lastIndex = 0;

    // Create patterns for different content types
    const patterns = [
      { type: 'url', regex: URL_REGEX },
      { type: 'mention', regex: MENTION_REGEX },
      { type: 'hashtag', regex: HASHTAG_REGEX }
    ];

    // Find all matches and their positions
    const matches = [];

    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.regex.source, 'gi');
      let match;

      while ((match = regex.exec(displayContent)) !== null) {
        matches.push({
          type: pattern.type,
          content: match[0],
          index: match.index,
          length: match[0].length,
          groups: match
        });
      }
    });

    // Sort matches by position
    matches.sort((a, b) => a.index - b.index);

    // Process matches in order
    matches.forEach(match => {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: displayContent.slice(lastIndex, match.index)
        });
      }

      // Add the match based on type
      if (match.type === 'url') {
        parts.push({
          type: 'link',
          content: match.content
        });
      } else if (match.type === 'mention') {
        const username = match.content.slice(1); // Remove @ symbol

        if (username === 'deleted-user') {
          parts.push({
            type: 'text',
            content: match.content,
            style: { color: '#999', fontStyle: 'italic' }
          });
        } else if (username === 'followers') {
          // Handle special @followers mention
          parts.push({
            type: 'special-mention',
            content: match.content,
            username: username
          });
        } else {
          const mentionedUser = mentions.find(user => user.username === username);

          if (mentionedUser) {
            parts.push({
              type: 'mention',
              content: match.content,
              user: mentionedUser
            });
          } else {
            parts.push({
              type: 'text',
              content: match.content
            });
          }
        }
      } else if (match.type === 'hashtag') {
        const hashtagName = match.content.slice(1); // Remove # symbol
        parts.push({
          type: 'hashtag',
          content: match.content,
          hashtag: hashtagName
        });
      }

      lastIndex = match.index + match.length;
    });

    // Add remaining text
    if (lastIndex < displayContent.length) {
      parts.push({
        type: 'text',
        content: displayContent.slice(lastIndex)
      });
    }

    return parts;
  }, [content, mentions]);

  const displayContent = useMemo(() => {
    if (expanded || content.length <= maxLength || !showReadMore) {
      return parsedContent;
    } else {
      let totalLength = 0;
      let cutoffIndex = 0;

      for (let i = 0; i < parsedContent.length; i++) {
        totalLength += parsedContent[i].content.length;
        if (totalLength >= maxLength) {
          cutoffIndex = i;
          break;
        }
      }

      const truncated = parsedContent.slice(0, cutoffIndex + 1);

      if (truncated.length > 0 && truncated[cutoffIndex].type === 'text') {
        const lastItem = { ...truncated[cutoffIndex] };
        const remainingLength = maxLength - (totalLength - lastItem.content.length);
        lastItem.content = lastItem.content.substring(0, remainingLength) + '...';
        truncated[cutoffIndex] = lastItem;
      }

      return truncated;
    }
  }, [parsedContent, expanded, content.length, maxLength, showReadMore]);

  const handleMentionPress = useCallback((user) => {
      navigate(`/user/${user.username}`, {replace: true});
  }, [navigation, navigate]);

  const handleHashtagPress = useCallback((hashtag) => {
    if (onHashtagPress) {
      onHashtagPress(hashtag);
    } else if (navigation?.navigate) {
      navigation.navigate('hashtags-feed', { hashtag });
    } else if (navigate) {
      navigate(`/hashtag/${hashtag}`);
    }
  }, [onHashtagPress, navigation, navigate]);

  const handleLinkPress = useCallback((url) => {
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }
    window.open(formattedUrl, '_blank');
  }, []);

  // Dynamic styles based on hasBackground prop
  const hasBackgroundTextStyles = hasBackground ? { 
    fontSize: '18px', 
    fontWeight: 700,
    color: 'white',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  } : {};

  const baseTextColor = hasBackground ? 'white' : (theme?.colors?.text || 'var(--card-foreground)');
  const primaryColor = hasBackground ? 'white' : (theme?.colors?.primary || 'var(--primary)');

  return (
    <div style={hasBackground ? { textAlign: 'center', width: '100%' } : {}}>
      {displayContent.map((item, index) => {
        if (item.type === 'link') {
          return (
            <span
              key={index}
              style={{
                color: primaryColor,
                textDecoration: 'underline',
                cursor: 'pointer',
                ...hasBackgroundTextStyles
              }}
              onClick={() => handleLinkPress(item.content)}
            >
              {item.content}
            </span>
          );
        } else if (item.type === 'mention') {
          return (
            <span
              key={index}
              style={{
                color: primaryColor,
                fontWeight: hasBackground ? 700 : 500,
                cursor: 'pointer',
                ...hasBackgroundTextStyles
              }}
              onClick={() => handleMentionPress(item.user)}
            >
              {item.content}
            </span>
          );
        } else if (item.type === 'special-mention') {
          return (
            <span
              key={index}
              style={{
                color: hasBackground ? 'white' : '#4A90E2',
                fontWeight: hasBackground ? 700 : 600,
                backgroundColor: hasBackground ? 'rgba(74, 144, 226, 0.2)' : 'rgba(74, 144, 226, 0.1)',
                padding: hasBackground ? '2px 6px' : '1px 4px',
                borderRadius: '4px',
                ...hasBackgroundTextStyles
              }}
            >
              {item.content}
            </span>
          );
        } else if (item.type === 'hashtag') {
          return (
            <span
              key={index}
              style={{
                color: primaryColor,
                fontWeight: hasBackground ? 700 : 500,
                textDecoration: 'underline',
                cursor: 'pointer',
                ...hasBackgroundTextStyles
              }}
              onClick={() => handleHashtagPress(item.hashtag)}
            >
              {item.content}
            </span>
          );
        } else {
          return (
            <span
              key={index}
              style={{
                color: baseTextColor,
                ...hasBackgroundTextStyles,
                ...item.style || {} // Apply additional styling for deleted users
              }}
            >
              {item.content}
            </span>
          );
        }
      })}

      {showReadMore && content.length > maxLength && toggleReadMore && (
        <div style={{ marginTop: '8px' }}>
          <span
            style={{ 
              color: primaryColor, 
              cursor: 'pointer', 
              fontWeight: hasBackground ? 700 : 500,
              fontSize: hasBackground ? '18px' : '14px'
            }}
            onClick={toggleReadMore}
          >
            {expanded ? 'Show less' : 'Read more'}
          </span>
        </div>
      )}
    </div>
  );
});

export default ContentWithLinksAndMentions;