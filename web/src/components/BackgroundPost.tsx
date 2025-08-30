import React, { memo } from 'react';
import ContentWithLinksAndMentions from '@/components/ContentWithLinksAndMentions';

interface MentionUser {
  _id: string;
  username: string;
  firstname: string;
  lastname: string;
  profile?: string;
}

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

interface ContentWithLinksAndMentionsProps {
  content: string;
  hasBackground?: boolean;
  theme?: Theme;
  expanded: boolean;
  toggleReadMore: () => void;
  mentions: MentionUser[];
  navigation?: any;
  onHashtagPress: (hashtag: string) => void;
  maxLength?: number;
  showReadMore?: boolean;
}

interface BackgroundPostProps {
  content: string;
  backgroundColor: string;
  containerWidth?: number;
  theme?: Theme;
  onPress?: () => void;
  mentions?: MentionUser[];
  navigation?: any;
  onHashtagPress: (hashtag: string) => void;
  isShared?: boolean;
  ContentWithLinksAndMentions?: React.ComponentType<ContentWithLinksAndMentionsProps>;
  expanded?: boolean;
  toggleReadMore?: () => void;
  className?: string;
}

const BackgroundPost: React.FC<BackgroundPostProps> = memo(({
  content,
  backgroundColor,
  containerWidth = 500,
  theme,
  onPress,
  mentions = [],
  navigation,
  onHashtagPress,
  isShared = false,
  ContentWithLinksAndMentions: CustomContentComponent,
  expanded = false,
  toggleReadMore = () => {},
  className = ''
}) => {

  if (!backgroundColor || !content?.trim()) {
    return null;
  }

  const ContentComponent = CustomContentComponent || ContentWithLinksAndMentions;

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
  const postHeight = Math.min(Math.max(200, parseInt(textStyle.fontSize! as string) * 8), 400);

  const containerStyle: React.CSSProperties = {
    backgroundColor: backgroundColor,
    height: `${postHeight}px`,
    marginLeft: isShared ? '10px' : '0',
    marginRight: isShared ? '10px' : '0',
    marginTop: isShared ? '8px' : '6px',
    marginBottom: isShared ? '8px' : '6px',
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
    position: 'relative',
  };

  return (
    <div 
      className={`background-post-container ${className}`}
      style={containerStyle}
      onClick={onPress}
    >
      <div style={contentContainerStyle}>
        <ContentComponent
          content={content}
          hasBackground={true}
          theme={theme}
          expanded={expanded}
          toggleReadMore={toggleReadMore}
          mentions={mentions}
          navigation={navigation}
          onHashtagPress={onHashtagPress}
        />
      </div>

      <div style={gradientStyle} />
    </div>
  );
});

BackgroundPost.displayName = 'BackgroundPost';

export default BackgroundPost;
export type { BackgroundPostProps, MentionUser, Theme, ContentWithLinksAndMentionsProps };