import React from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'; // 드래그 핸들 아이콘

function WidgetWrapper({ widget, onDelete, children }) {
  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent drag start on delete click
    onDelete(widget.id);
  };

  return (
    <Paper elevation={2} className="h-full flex flex-col overflow-hidden"> {/* h-full 추가 */}
      <Box
        className="widget-drag-handle bg-gray-100 dark:bg-gray-700 p-2 flex justify-between items-center cursor-move border-b dark:border-gray-600"
        sx={{ borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }} // Paper의 radius 상속
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DragIndicatorIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="subtitle2" className="flex-grow capitalize select-none">
            {widget.type.replace('_', ' ')}
          </Typography>
        </Box>
        <IconButton
            size="small"
            onClick={handleDelete}
            aria-label={`delete ${widget.type} widget`}
            className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box p={2} className="widget-content flex-grow overflow-auto"> {/* flex-grow와 overflow-auto 추가 */}
        {children}
      </Box>
    </Paper>
  );
}

export default WidgetWrapper;