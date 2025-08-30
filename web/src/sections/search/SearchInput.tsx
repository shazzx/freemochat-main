import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import debounce from 'lodash/debounce';

interface SearchSuggestion {
    value: string;
    type: 'user' | 'group' | 'page';
}

export function SearchInput() {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    
    const { data: suggestions = [], isLoading } = useQuery<SearchSuggestion[]>({
        queryKey: ['searchSuggestions', inputValue],
        queryFn: async () => {
            if (!inputValue || inputValue.trim().length < 2) return [];
            const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(inputValue)}`);
            if (!response.ok) throw new Error('Failed to fetch suggestions');
            return response.json();
        },
        enabled: inputValue.trim().length >= 2,
        staleTime: 30000, 
    });

    
    const handleSearch = () => {
        if (inputValue.trim()) {
            navigate(`/search?query=${encodeURIComponent(inputValue)}`);
            setShowSuggestions(false);
        }
    };

    
    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        setInputValue(suggestion.value);
        navigate(`/search?query=${encodeURIComponent(suggestion.value)}&type=${suggestion.type}`);
        setShowSuggestions(false);
    };

    
    const debouncedInputChange = debounce((value: string) => {
        setInputValue(value);
        setShowSuggestions(value.trim().length >= 2);
    }, 300);

    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full max-w-md">
            <div className="flex">
                <Input
                    ref={inputRef}
                    placeholder="Search for users, groups, pages, posts..."
                    className="pr-10"
                    value={inputValue}
                    onChange={(e) => debouncedInputChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => inputValue.trim().length >= 2 && setShowSuggestions(true)}
                />
                <Button
                    type="button"
                    onClick={handleSearch}
                    variant="ghost"
                    size="icon"
                    className="absolute right-0"
                >
                    <Search className="h-4 w-4" />
                </Button>
            </div>

            {showSuggestions && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200"
                >
                    {isLoading ? (
                        <div className="p-2 text-sm text-gray-500">Loading suggestions...</div>
                    ) : suggestions.length > 0 ? (
                        <ul>
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={`${suggestion.type}-${suggestion.value}-${index}`}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <span className="mr-2">
                                        {suggestion.type === 'user' && '👤'}
                                        {suggestion.type === 'group' && '👥'}
                                        {suggestion.type === 'page' && '📄'}
                                    </span>
                                    <span>{suggestion.value}</span>
                                    <span className="ml-auto text-xs text-gray-500 capitalize">{suggestion.type}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        inputValue.trim().length >= 2 && (
                            <div className="p-2 text-sm text-gray-500">No suggestions found</div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
