import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";

export interface MentionReference {
  _id: string;       
  username: string;  
  firstname: string;
  lastname: string;
  profile: string;
}

interface UserSuggestion {
  _id: string;       
  username: string;  
  firstname: string;
  lastname: string;
  profile: string;
  isSpecial?: boolean; 
}

interface MentionsInputProps {
  value: string;
  onChangeText: (text: string, mentionUserIds: string[], mentionReferences: MentionReference[]) => void;
  placeholder?: string;
  className?: string;
  onSuggestionsFetch?: Function;
  initialReferences?: MentionReference[];
  textLimit?: number;
}

const MentionsInput: React.FC<MentionsInputProps> = ({
  value,
  onChangeText,
  placeholder,
  className,
  onSuggestionsFetch,
  initialReferences = [],
  textLimit = 2000
}) => {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentMentionQuery, setCurrentMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionReferences, setMentionReferences] = useState<MentionReference[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ 
    top: 0, 
    left: 0, 
    width: 0, 
    showAbove: false 
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  
  const [displayText, setDisplayText] = useState('');
  const [internalText, setInternalText] = useState('');

  
  const mapDisplayToInternalPosition = useCallback((displayPos: number): number => {
    if (mentionReferences.length === 0) return displayPos;

    let internalPos = displayPos;
    let displayOffset = 0;

    
    const sortedRefs = [...mentionReferences].sort((a, b) => {
      const aPos = displayText.indexOf(`@${a.username}`, displayOffset);
      const bPos = displayText.indexOf(`@${b.username}`, displayOffset);
      return aPos - bPos;
    });

    for (const ref of sortedRefs) {
      const displayMentionPos = displayText.indexOf(`@${ref.username}`, displayOffset);
      
      if (displayMentionPos !== -1 && displayMentionPos < displayPos) {
        const displayMentionLength = `@${ref.username}`.length;
        const internalMentionLength = `@${ref._id}`.length;
        const lengthDiff = internalMentionLength - displayMentionLength;
        
        internalPos += lengthDiff;
        displayOffset = displayMentionPos + displayMentionLength;
      }
    }

    return internalPos;
  }, [displayText, mentionReferences]);

  
  const convertDisplayToInternal = useCallback((display: string, references: MentionReference[]): string => {
    let internal = display;
    
    
    const sortedRefs = [...references].sort((a, b) => {
      const aPos = display.indexOf(`@${a.username}`);
      const bPos = display.indexOf(`@${b.username}`);
      return bPos - aPos; 
    });

    for (const ref of sortedRefs) {
      const usernameRegex = new RegExp(`@${ref.username}\\b`, 'g');
      internal = internal.replace(usernameRegex, `@${ref._id}`);
    }

    return internal;
  }, []);

  
  const convertInternalToDisplay = useCallback((internal: string, references: MentionReference[]): string => {
    let display = internal;
    
    for (const ref of references) {
      const userIdRegex = new RegExp(`@${ref._id}`, 'g');
      display = display.replace(userIdRegex, `@${ref.username}`);
    }

    return display;
  }, []);

  
  const calculateSuggestionPosition = useCallback(() => {
    if (!textareaRef.current || !containerRef.current) return;

    const textarea = textareaRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    
    const viewportHeight = window.innerHeight;
    
    
    const spaceAbove = containerRect.top;
    const spaceBelow = viewportHeight - containerRect.bottom;
    
    
    const suggestionBoxHeight = 200;
    
    
    const showAbove = spaceAbove > suggestionBoxHeight && spaceAbove > spaceBelow;
    
    
    if (showAbove) {
      
      setSuggestionPosition({
        top: -suggestionBoxHeight - 8, 
        left: 0,
        width: containerRect.width,
        showAbove: true
      });
    } else {
      
      setSuggestionPosition({
        top: containerRect.height + 8, 
        left: 0,
        width: containerRect.width,
        showAbove: false
      });
    }
  }, []);

  
  useEffect(() => {
    if (initialReferences.length > 0 && !isInitialized) {
      setMentionReferences(initialReferences);
      setIsInitialized(true);
    }
  }, [initialReferences, isInitialized]);

  
  useEffect(() => {
    
    if (!isInitialized && initialReferences.length > 0) {
      return; 
    }

    if (value !== undefined) {
      const referencesToUse = mentionReferences.length > 0 ? mentionReferences : initialReferences;
      
      if (referencesToUse.length > 0) {
        const display = convertInternalToDisplay(value, referencesToUse);
        setDisplayText(display);
        setInternalText(value);
      } else {
        
        setDisplayText(value);
        setInternalText(value);
      }
    } else {
      
      setDisplayText('');
      setInternalText('');
    }
  }, [value, mentionReferences, convertInternalToDisplay, isInitialized, initialReferences]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  
  useEffect(() => {
    if (showSuggestions) {
      calculateSuggestionPosition();
    }
  }, [showSuggestions, calculateSuggestionPosition]);

  
  useEffect(() => {
    const handleResize = () => {
      if (showSuggestions) {
        calculateSuggestionPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSuggestions, calculateSuggestionPosition]);

  
  const fetchSuggestions = useCallback(async (query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (query.length >= 0 && onSuggestionsFetch) {
        try {
          const userResults = await onSuggestionsFetch(query);
          
          
          const followersOption: UserSuggestion = {
            _id: 'followers',
            username: 'followers',
            firstname: 'All',
            lastname: 'Followers',
            profile: '',
            isSpecial: true
          };

          
          const shouldShowFollowers = query === '' || 'followers'.toLowerCase().includes(query.toLowerCase());
          
          const allSuggestions = shouldShowFollowers 
            ? [followersOption, ...userResults]
            : userResults;

          setSuggestions(allSuggestions);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          
          const followersOption: UserSuggestion = {
            _id: 'followers',
            username: 'followers',
            firstname: 'All',
            lastname: 'Followers',
            profile: '',
            isSpecial: true
          };
          
          const shouldShowFollowers = query === '' || 'followers'.toLowerCase().includes(query.toLowerCase());
          setSuggestions(shouldShowFollowers ? [followersOption] : []);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
  }, [onSuggestionsFetch]);

  const handleTextChange = (text: string) => {
    if (text.length > textLimit) {
      return; 
    }

    setDisplayText(text);
    
    const textarea = textareaRef.current;
    const cursorPos = textarea?.selectionStart || 0;
    setCursorPosition(cursorPos);

    
    let mentionStart = -1;
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === '@') {
        if (i === 0 || /\s/.test(text[i - 1])) {
          mentionStart = i;
          break;
        }
      } else if (/\s/.test(text[i])) {
        break;
      }
    }

    if (mentionStart !== -1) {
      const mentionEnd = cursorPos;
      const mentionText = text.substring(mentionStart + 1, mentionEnd);

      if (!mentionText.includes(' ') && mentionText.length >= 0) {
        setCurrentMentionQuery(mentionText);
        setMentionStartIndex(mentionStart);
        setShowSuggestions(true);
        fetchSuggestions(mentionText);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }

    
    let updatedReferences = [...mentionReferences];
    
    
    const activeMentions = updatedReferences.filter(ref => {
      return text.includes(`@${ref.username}`);
    });

    
    if (activeMentions.length !== mentionReferences.length) {
      setMentionReferences(activeMentions);
      updatedReferences = activeMentions;
    }

    
    const internal = convertDisplayToInternal(text, updatedReferences);
    setInternalText(internal);

    
    const userIdRegex = /@([a-f\d]{24}|followers)/g; 
    const foundUserIds: string[] = [];
    let match;

    while ((match = userIdRegex.exec(internal)) !== null) {
      const userId = match[1];
      if (!foundUserIds.includes(userId)) {
        foundUserIds.push(userId);
      }
    }

    onChangeText(internal, foundUserIds, updatedReferences);
  };

  const handleSuggestionPress = (suggestion: UserSuggestion) => {
    
    if (suggestion.isSpecial) {
      
      const mentionText = `@${suggestion.username}`;
      const beforeMention = displayText.substring(0, mentionStartIndex);
      const afterMention = displayText.substring(cursorPosition);
      const newText = beforeMention + mentionText + ' ' + afterMention;

      setShowSuggestions(false);
      setSuggestions([]);
      setCurrentMentionQuery('');
      setMentionStartIndex(-1);

      const newCursorPosition = beforeMention.length + mentionText.length + 1;
      setCursorPosition(newCursorPosition);

      
      setDisplayText(newText);
      setInternalText(newText);

      
      const userIdRegex = /@([a-f\d]{24})/g;
      const foundUserIds: string[] = [];
      const activeReferences: MentionReference[] = [];
      let match;

      
      const allUserIds = ['followers'];
      
      while ((match = userIdRegex.exec(newText)) !== null) {
        const userId = match[1];
        if (!foundUserIds.includes(userId)) {
          foundUserIds.push(userId);
          const existingRef = mentionReferences.find(ref => ref._id === userId);
          if (existingRef) {
            activeReferences.push(existingRef);
          }
        }
      }

      setMentionReferences(activeReferences);
      onChangeText(newText, allUserIds.concat(foundUserIds), activeReferences);

      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 100);
      
      return;
    }

    
    const internalMentionStartIndex = mapDisplayToInternalPosition(mentionStartIndex);
    const internalCursorPosition = mapDisplayToInternalPosition(cursorPosition);

    
    const beforeMention = internalText.substring(0, internalMentionStartIndex);
    const afterMention = internalText.substring(internalCursorPosition);

    
    const displayMentionText = `@${suggestion.username}`;
    const beforeMentionDisplay = displayText.substring(0, mentionStartIndex);
    const afterMentionDisplay = displayText.substring(cursorPosition);
    const newDisplayText = beforeMentionDisplay + displayMentionText + ' ' + afterMentionDisplay;

    
    const internalMentionText = `@${suggestion._id}`;
    const newInternalText = beforeMention + internalMentionText + ' ' + afterMention;

    
    const newReference: MentionReference = {
      _id: suggestion._id,
      username: suggestion.username,
      firstname: suggestion.firstname,
      lastname: suggestion.lastname,
      profile: suggestion.profile
    };

    
    const updatedReferences = mentionReferences.filter(ref => ref._id !== suggestion._id);
    updatedReferences.push(newReference);

    setShowSuggestions(false);
    setSuggestions([]);
    setCurrentMentionQuery('');
    setMentionStartIndex(-1);

    const newCursorPosition = beforeMentionDisplay.length + displayMentionText.length + 1;
    setCursorPosition(newCursorPosition);

    
    setMentionReferences(updatedReferences);
    setDisplayText(newDisplayText);
    setInternalText(newInternalText);

    
    const userIdRegex = /@([a-f\d]{24}|followers)/g;
    const finalUserIds: string[] = [];
    let match;

    while ((match = userIdRegex.exec(newInternalText)) !== null) {
      const userId = match[1];
      if (!finalUserIds.includes(userId)) {
        finalUserIds.push(userId);
      }
    }

    onChangeText(newInternalText, finalUserIds, updatedReferences);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 100);
  };

  const handleSelectionChange = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = event.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart);
  };

  return (
    <div ref={containerRef} className="relative">
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className={`absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto ${
            suggestionPosition.showAbove 
              ? 'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]' 
              : 'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]'   
          }`}
          style={{
            top: suggestionPosition.top,
            left: suggestionPosition.left,
            width: suggestionPosition.width
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion._id}-${index}`}
              className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSuggestionPress(suggestion)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                suggestion.isSpecial ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                <span className={`text-sm font-bold ${
                  suggestion.isSpecial ? 'text-white' : 'text-gray-600'
                }`}>
                  {suggestion.isSpecial ? '👥' : suggestion.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className={`font-medium text-sm ${
                  suggestion.isSpecial ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  @{suggestion.username}
                </div>
                <div className={`text-xs ${
                  suggestion.isSpecial ? 'text-blue-500 dark:text-blue-300 italic' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {suggestion.isSpecial ? 'Mention all your followers' : `${suggestion.firstname} ${suggestion.lastname}`}
                </div>
              </div>
              {suggestion.isSpecial && (
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Special
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={displayText} 
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        onSelect={handleSelectionChange}
      />
    </div>
  );
};

export default MentionsInput;