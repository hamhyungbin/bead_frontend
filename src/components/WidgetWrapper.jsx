// src/components/WidgetWrapper.jsx
import React from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material'; //
import DeleteIcon from '@mui/icons-material/Delete'; //
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'; //

function WidgetWrapper({ widget, onDelete, children }) {
  const handleDelete = (e) => {
    // onClick 이벤트에서도 혹시 모를 전파를 막기 위해 유지할 수 있습니다.
    e.stopPropagation(); //
    onDelete(widget.id); //
  };

  // IconButton에서 mousedown 이벤트가 드래그 핸들로 전파되는 것을 막습니다.
  const handleMouseDownOnDelete = (e) => {
    e.stopPropagation();
  };

  return (
    <Paper elevation={2} className="h-full flex flex-col overflow-hidden"> {/* */}
      <Box
        className="widget-drag-handle bg-gray-100 dark:bg-gray-700 p-2 flex justify-between items-center cursor-move border-b dark:border-gray-600" //
        sx={{ borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }} //
      >
        <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden', mr: 1 }}> {/* 반응형 개선 시 추가된 부분 */}
          <DragIndicatorIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', flexShrink: 0 }} /> {/* */}
          <Typography variant="subtitle2" className="flex-grow capitalize select-none" noWrap> {/* 반응형 개선 시 noWrap 추가 */}
            {widget.type.replace('_', ' ')} {/* */}
          </Typography>
        </Box>
        <IconButton
            size="small"
            onClick={handleDelete} //
            onMouseDown={handleMouseDownOnDelete} // 이 부분을 추가합니다.
            aria-label={`delete ${widget.type} widget`} //
            className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" //
            sx={{ flexShrink: 0 }} // 반응형 개선 시 추가된 부분
        >
          <DeleteIcon fontSize="small" /> {/* */}
        </IconButton>
      </Box>
      <Box p={2} className="widget-content flex-grow overflow-auto"> {/* */}
        {children} {/* */}
      </Box>
    </Paper>
  );
}

export default WidgetWrapper; //
