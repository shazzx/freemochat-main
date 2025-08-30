import { useNavigate } from 'react-router-dom';
import { Hash, User, Users, FileText, Search } from 'lucide-react';
import { Input } from './ui/input';

const SearchSuggestions = ({ 
  suggestions, 
  isVisible, 
  onSuggestionClick, 
  onClose,
  searchRef 
}) => {
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'hashtag':
        return <Hash className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'page':
        return <FileText className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onClose();
    
    if (suggestion.type === 'hashtag') {
      navigate(`/hashtags-feed/${suggestion.value.replace('#', '')}`);
    } else {
      searchRef.current.value = suggestion.value;
      navigate(`/search?query=${suggestion.value}&type=${suggestion.type === 'user' ? 'users' : suggestion.type + 's'}`);
    }
    
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-10 z-50 bg-card max-w-2xl w-full flex flex-col border rounded-md shadow-lg">
      {suggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.type}-${suggestion.value}-${index}`}
          className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => handleSuggestionClick(suggestion)}
        >
          <div className="text-muted-foreground">
            {getIcon(suggestion.type)}
          </div>
          
          <div className="flex-1">
            <span className="text-foreground">
              {suggestion.type === 'hashtag' && !suggestion.value.startsWith('#') 
                ? `#${suggestion.value}` 
                : suggestion.value
              }
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
            {suggestion.type === 'hashtag' ? 'hashtag' : suggestion.type}
          </div>
        </div>
      ))}
    </div>
  );
};

const EnhancedSearchHeader = ({ 
  searchQuery, 
  setSearchQuery, 
  searchSuggestions, 
  setSearchSuggestions,
  searchSuggestionsState, 
  setSearchSuggestionsState,
  searchRef,
  navigate,
  axiosClient 
}) => {
  
  const handleSearchChange = async (e) => {
    setSearchQuery(e.target.value);
    
    if (e.target.value.length > 2) {
      try {
        const { data } = await axiosClient.get(`/search/suggestions?query=${e.target.value}`);
        setSearchSuggestions(data);
        setSearchSuggestionsState(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSearchSuggestions([]);
        setSearchSuggestionsState(false);
      }
    } else {
      setSearchSuggestions([]);
      setSearchSuggestionsState(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    
    if (query) {
      if (query.startsWith('#')) {
        navigate(`/hashtags-feed/${query.replace('#', '')}`);
      } else {
        let val = query.split(' ');
        navigate(`/search?query=${val.join("")}&type=default`);
      }
      
      setSearchSuggestions([]);
      setSearchSuggestionsState(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setSearchSuggestions([]);
      setSearchSuggestionsState(false);
    }
  };

  return (
    <form onSubmit={handleSearchSubmit}>
      <div className="flex relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchRef}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          type="search"
          placeholder="Search people, posts, #hashtags..."
          className="max-w-2xl appearance-none bg-background pl-8 shadow-none"
        />
        
        <SearchSuggestions
          suggestions={searchSuggestions}
          isVisible={searchSuggestionsState}
          onSuggestionClick={() => {}}
          onClose={() => setSearchSuggestionsState(false)}
          searchRef={searchRef}
        />
      </div>
    </form>
  );
};

export default SearchSuggestions;
export { EnhancedSearchHeader };