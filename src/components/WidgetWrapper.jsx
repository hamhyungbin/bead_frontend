// src/components/WidgetWrapper.jsx
import React from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

function WidgetWrapper({ widget, onDelete, children }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(widget.id);
  };

  return (
    <Paper elevation={2} className="h-full flex flex-col overflow-hidden">
      <Box
        className="widget-drag-handle bg-gray-100 dark:bg-gray-700 p-2 flex justify-between items-center cursor-move border-b dark:border-gray-600"
        sx={{
          borderTopLeftRadius: 'inherit',
          borderTopRightRadius: 'inherit',
          // 작은 화면/위젯 크기를 위한 패딩 조정 예시 (필요시)
          // p: { xxs: 1, xs: 1, sm: 2 } 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden', mr: 1 }}> {/* overflow: hidden과 오른쪽 마진 추가 */}
          <DragIndicatorIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', flexShrink: 0 }} /> {/* 아이콘이 줄어들지 않도록 */}
          <Typography variant="subtitle2" className="flex-grow capitalize select-none" noWrap> {/* noWrap으로 텍스트 한줄 처리 */}
            {widget.type.replace('_', ' ')}
          </Typography>
        </Box>
        <IconButton
            size="small"
            onClick={handleDelete}
            aria-label={`delete ${widget.type} widget`}
            className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            sx={{ flexShrink: 0 }} // 삭제 버튼이 줄어들지 않도록
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box p={2} className="widget-content flex-grow overflow-auto">
        {children}
      </Box>
    </Paper>
  );
}

export default WidgetWrapper;
