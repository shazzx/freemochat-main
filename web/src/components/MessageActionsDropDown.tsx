import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Trash, Reply, Smile } from 'lucide-react';

const MessageActionsDropdown = ({onDelete,  setSelectedMessageId }) => {
  const [isOpen, setIsOpen] = useState(true);
  const dropdownRef = useRef(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
      setSelectedMessageId(null)
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    switch (action) {
      case 'delete':
        onDelete();
        break;
    }
    setSelectedMessageId(null)

  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* <div
        className="cursor-pointer rounded-full"
        onClick={handleToggle}
        onDoubleClick={handleToggle}
        onTouchStart={(e) => {
          e.preventDefault();
          let timer = setTimeout(() => handleToggle(), 500);
          e.target.addEventListener('touchend', () => clearTimeout(timer), { once: true });
        }}
      >
        <MoreVertical size={16} />
      </div> */}

      {isOpen && (
        <div className="origin-top-right z-50 border border-accent hover:bg-accent absolute right-0 mt-2 w-24 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button
              onClick={() => handleAction('delete')}
              className="flex items-center p-1 text-sm w-full text-left"
              role="menuitem"
            >
              <Trash className="mr-3" size={18} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageActionsDropdown;