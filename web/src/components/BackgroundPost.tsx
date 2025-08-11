import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the mention user interface
interface MentionUser {
  _id: string;
  username: string;
  firstname: string;
  lastname: string;
  profile?: string;
}

// Define the theme interface
interface Theme {
  colors: {
    text: string;
    primary: string;
    background: string;
    card: string;
    border: string;
    [key: string]: string;
  };
  dark?: boolean;
}

// Define the ContentWithLinksAndMentions component props
interface ContentWithLinksAndMentionsProps {
  content: string;
  hasBackground?: boolean;
  theme?: Theme;
  expanded: boolean;
  toggleReadMore: () => void;
  mentions: MentionUser[];
  onHashtagPress: (hashtag: string) => void;
}

// Define the main component props
interface BackgroundPostProps {
  content: string;
  backgroundColor: string;
  containerWidth?: number;
  theme?: Theme;
  onPress?: () => void;
  mentions?: MentionUser[];
  onHashtagPress: (hashtag: string) => void;
  isShared?: boolean;
  ContentWithLinksAndMentions?: React.ComponentType<ContentWithLinksAndMentionsProps>;
  expanded?: boolean;
  toggleReadMore?: () => void;
  className?: string;
}

// Regex patterns for parsing content
const URL_REGEX = /(?:(?:https?|ftp):\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
const MENTION_REGEX = /@(\w+)/g;
const HASHTAG_REGEX = /#([a-zA-Z0-9_]+)/g;
const MAX_CONTENT_LENGTH = 360;

interface ContentPart {
  type: 'text' | 'link' | 'mention' | 'hashtag';
  content: string;
  user?: MentionUser;
  hashtag?: string;
  style?: React.CSSProperties;
}

// Default ContentWithLinksAndMentions component
const DefaultContentWithLinksAndMentions: React.FC<ContentWithLinksAndMentionsProps> = ({
  content,
  hasBackground = false,
  expanded,
  toggleReadMore,
  mentions = [],
  onHashtagPress,
}) => {
  const navigate = useNavigate();

  const parsedContent = useMemo(() => {
    if (!content) return [];

    let displayContent = content;

    // Replace user IDs with usernames
    const userIdRegex = /@([a-f\d]{24})/g;
    let match;
    const processedIds = new Set<string>();

    while ((match = userIdRegex.exec(content)) !== null) {
      const userId = match[1];
      if (!processedIds.has(userId)) {
        processedIds.add(userId);
        const user = mentions.find(u => u._id === userId);

        if (user) {
          const idRegex = new RegExp(`@${userId}`, 'g');
          displayContent = displayContent.replace(idRegex, `@${user.username}`);
        } else {
          const idRegex = new RegExp(`@${userId}`, 'g');
          displayContent = displayContent.replace(idRegex, '@deleted-user');
        }
      }
    }

    const parts: ContentPart[] = [];
    let lastIndex = 0;

    const patterns = [
      { type: 'url' as const, regex: URL_REGEX },
      { type: 'mention' as const, regex: MENTION_REGEX },
      { type: 'hashtag' as const, regex: HASHTAG_REGEX }
    ];

    const matches: Array<{
      type: 'url' | 'mention' | 'hashtag';
      content: string;
      index: number;
      length: number;
      groups: RegExpExecArray;
    }> = [];

    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.regex.source, 'gi');
      let match: RegExpExecArray | null;

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

    matches.sort((a, b) => a.index - b.index);

    matches.forEach(match => {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: displayContent.slice(lastIndex, match.index)
        });
      }

      if (match.type === 'url') {
        parts.push({
          type: 'link',
          content: match.content
        });
      } else if (match.type === 'mention') {
        const username = match.content.slice(1);

        if (username === 'deleted-user') {
          parts.push({
            type: 'text',
            content: match.content,
            style: { color: '#999', fontStyle: 'italic' }
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
        const hashtagName = match.content.slice(1);
        parts.push({
          type: 'hashtag',
          content: match.content,
          hashtag: hashtagName
        });
      }

      lastIndex = match.index + match.length;
    });

    if (lastIndex < displayContent.length) {
      parts.push({
        type: 'text',
        content: displayContent.slice(lastIndex)
      });
    }

    return parts;
  }, [content, mentions]);

  const displayContent = useMemo(() => {
    if (expanded || content.length <= MAX_CONTENT_LENGTH) {
      return parsedContent;
    } else {
      let totalLength = 0;
      let cutoffIndex = 0;

      for (let i = 0; i < parsedContent.length; i++) {
        totalLength += parsedContent[i].content.length;
        if (totalLength >= MAX_CONTENT_LENGTH) {
          cutoffIndex = i;
          break;
        }
      }

      const truncated = parsedContent.slice(0, cutoffIndex + 1);

      if (truncated.length > 0 && truncated[cutoffIndex].type === 'text') {
        const lastItem = { ...truncated[cutoffIndex] };
        const remainingLength = MAX_CONTENT_LENGTH - (totalLength - lastItem.content.length);
        lastItem.content = lastItem.content.substring(0, remainingLength) + '...';
        truncated[cutoffIndex] = lastItem;
      }

      return truncated;
    }
  }, [parsedContent, expanded, content.length]);

  const handleMentionPress = React.useCallback((user: MentionUser) => {
    navigate(`/user/${user.username}`);
  }, [navigate]);

  const handleHashtagPress = React.useCallback((hashtag: string) => {
    onHashtagPress(hashtag);
  }, [onHashtagPress]);

  const baseTextStyle: React.CSSProperties = hasBackground ? {
    color: 'white',
    fontWeight: 700,
    fontSize: '18px'
  } : {
    color: 'var(--card-foreground)'
  };

  const linkStyle: React.CSSProperties = {
    ...baseTextStyle,
    color: hasBackground ? 'white' : 'var(--primary)',
    textDecoration: 'underline',
    cursor: 'pointer'
  };

  const mentionStyle: React.CSSProperties = {
    ...baseTextStyle,
    color: hasBackground ? 'white' : 'var(--primary)',
    fontWeight: hasBackground ? 700 : 500,
    cursor: 'pointer'
  };

  const hashtagStyle: React.CSSProperties = {
    ...baseTextStyle,
    color: hasBackground ? 'white' : 'var(--primary)',
    fontWeight: hasBackground ? 700 : 500,
    textDecoration: 'underline',
    cursor: 'pointer'
  };

  return (
    <div style={hasBackground ? { textAlign: 'center', width: '100%' } : {}}>
      {displayContent.map((item, index) => {
        if (item.type === 'link') {
          return (
            <span
              key={index}
              style={linkStyle}
              onClick={() => {
                const url = item.content.startsWith('http') ? item.content : `https://${item.content}`;
                window.open(url, '_blank');
              }}
            >
              {item.content}
            </span>
          );
        } else if (item.type === 'mention') {
          return (
            <span
              key={index}
              style={mentionStyle}
              onClick={() => handleMentionPress(item.user!)}
            >
              {item.content}
            </span>
          );
        } else if (item.type === 'hashtag') {
          return (
            <span
              key={index}
              style={hashtagStyle}
              onClick={() => handleHashtagPress(item.hashtag!)}
            >
              {item.content}
            </span>
          );
        } else {
          return (
            <span
              key={index}
              style={{ ...baseTextStyle, ...item.style }}
            >
              {item.content}
            </span>
          );
        }
      })}

      {content.length > MAX_CONTENT_LENGTH && (
        <div style={{ marginTop: '8px' }}>
          <span
            style={{
              color: hasBackground ? 'white' : 'var(--primary)',
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
};

const BackgroundPost: React.FC<BackgroundPostProps> = ({
  content,
  backgroundColor,
  containerWidth = 500,
  theme,
  onPress,
  mentions = [],
  onHashtagPress,
  isShared = false,
  ContentWithLinksAndMentions = DefaultContentWithLinksAndMentions,
  expanded = false,
  toggleReadMore = () => {},
  className = ''
}) => {

  if (!backgroundColor || !content?.trim()) {
    return null;
  }

  const getTextStyle = (): React.CSSProperties => {
    const textLength: number = content.length;
    let fontSize: number = 24;

    if (textLength > 200) fontSize = 18;
    else if (textLength > 150) fontSize = 20;
    else if (textLength > 100) fontSize = 22;
    else if (textLength > 50) fontSize = 24;

    return {
      fontSize: `${fontSize}px`,
      color: 'white',
      textAlign: 'center',
      fontWeight: 700,
      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
      lineHeight: `${fontSize * 1.3}px`,
    };
  };

  const textStyle = getTextStyle();
  const postHeight = Math.min(Math.max(200, parseInt(textStyle.fontSize!) * 8), 400);

  const containerStyle: React.CSSProperties = {
    backgroundColor: backgroundColor,
    height: `${postHeight}px`,
    marginLeft: isShared ? '10px' : '0',
    marginRight: isShared ? '10px' : '0',
    marginTop: isShared ? '8px' : '10px',
    marginBottom: isShared ? '8px' : '10px',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: '8px',
    cursor: onPress ? 'pointer' : 'default',
  };

  const gradientStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${backgroundColor}22`,
    opacity: 0.1,
    zIndex: 1,
  };

  const contentContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    width: '100%',
    padding: '20px',
  };

  return (
    <div 
      className={`background-post-container ${className}`}
      style={containerStyle}
      onClick={onPress}
    >
      <div style={contentContainerStyle}>
        <ContentWithLinksAndMentions
          content={content}
          hasBackground={true}
          theme={theme}
          expanded={expanded}
          toggleReadMore={toggleReadMore}
          mentions={mentions}
          onHashtagPress={onHashtagPress}
        />
      </div>

      <div style={gradientStyle} />
    </div>
  );
};

// Add display name for better debugging
BackgroundPost.displayName = 'BackgroundPost';

export default BackgroundPost;
export type { BackgroundPostProps, MentionUser, Theme, ContentWithLinksAndMentionsProps };