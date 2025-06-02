import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Button } from '@mui/material'; // Using MUI for consistency
import { debounce } from 'lodash'; // For debouncing save

function NotesWidget({ config, onSave }) {
  const [content, setContent] = useState(config?.content || '');

  useEffect(() => {
    setContent(config?.content || '');
  }, [config?.content]);

  // Debounce the save function to avoid too many API calls
  const debouncedSave = useCallback(
    debounce((newContent) => {
      onSave(newContent);
    }, 1000), // Save after 1 second of inactivity
    [onSave]
  );

  const handleChange = (e) => {
    setContent(e.target.value);
    debouncedSave(e.target.value);
  };

  return (
    <TextField
      fullWidth
      multiline
      rows={6} // Adjust as needed
      variant="outlined"
      placeholder="Type your notes here..."
      value={content}
      onChange={handleChange}
      className="w-full h-full" // Tailwind for full width/height within its grid item
    />
  );
}

export default NotesWidget;