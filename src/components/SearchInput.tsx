import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  containerClassName?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  id,
  className = '',
  containerClassName = '',
}: SearchInputProps) {
  const uniqueId = id || React.useId();

  return (
    <div className={`relative flex-1 ${containerClassName}`}>
      {/* Non-interactive search icon */}
      <div className="absolute right-3.5 inset-y-0 flex items-center justify-center pointer-events-none text-gray-400 dark:text-gray-500">
        <Search className="w-4 h-4" />
      </div>

      {/* Styled text input */}
      <input
        type="text"
        id={uniqueId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-10 w-full pl-10 pr-9 py-2 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm ${className}`}
      />

      {/* Interactive clear button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 inset-y-0 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
          aria-label="Clear search"
          id={`${uniqueId}-clear`}
        >
          <X className="w-4 h-4 hidden" />
        </button>
      )}
    </div>
  );
}
