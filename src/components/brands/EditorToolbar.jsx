import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { 
  Bold, 
  Italic, 
  Link, 
  Undo, 
  Redo, 
  Type,
  List,
  ListOrdered
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Input } from '../ui/input';

/**
 * Basic rich text toolbar for community post editor
 * Supports bold, italic, links with minimal formatting
 */
export default function EditorToolbar({ 
  textareaRef, 
  onFormat,
  disabled = false 
}) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Format text at cursor position
  const formatText = (type, value = '') => {
    if (!textareaRef.current || disabled) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let newText = '';
    let newCursorPos = start;
    
    switch (type) {
      case 'bold':
        newText = text.substring(0, start) + 
                  `**${selectedText || 'bold text'}**` + 
                  text.substring(end);
        newCursorPos = selectedText ? end + 4 : start + 2;
        break;
        
      case 'italic':
        newText = text.substring(0, start) + 
                  `*${selectedText || 'italic text'}*` + 
                  text.substring(end);
        newCursorPos = selectedText ? end + 2 : start + 1;
        break;
        
      case 'link':
        const linkMarkdown = `[${linkText || selectedText || 'link text'}](${linkUrl})`;
        newText = text.substring(0, start) + linkMarkdown + text.substring(end);
        newCursorPos = start + linkMarkdown.length;
        setLinkPopoverOpen(false);
        setLinkUrl('');
        setLinkText('');
        break;
        
      default:
        return;
    }
    
    // Update textarea value
    textarea.value = newText;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    // Trigger change event
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    
    if (onFormat) {
      onFormat(type, newText);
    }
  };

  const handleLinkInsert = () => {
    if (!linkUrl.trim()) return;
    formatText('link');
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="flex items-center space-x-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
      {/* Text Formatting */}
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          disabled={disabled}
          title="Bold (Ctrl+B)"
          className="w-8 h-8 p-0"
        >
          <Bold className="w-4 h-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          disabled={disabled}
          title="Italic (Ctrl+I)"
          className="w-8 h-8 p-0"
        >
          <Italic className="w-4 h-4" />
        </Button>
      </div>

      {/* Links */}
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              title="Insert Link"
              className="w-8 h-8 p-0"
            >
              <Link className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Link Text</label>
                <Input
                  placeholder="Display text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleLinkInsert)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleLinkInsert)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLinkPopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleLinkInsert}
                  disabled={!linkUrl.trim()}
                >
                  Insert Link
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 ml-auto">
        Use **bold**, *italic*, and [link text](url) for formatting
      </div>
    </div>
  );
}