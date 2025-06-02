// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css'; // react-grid-layout 기본 스타일
import 'react-resizable/css/styles.css';  // react-resizable 기본 스타일
import { v4 as uuidv4 } from 'uuid';
import useAuthStore from '../store/authStore'; // authStore 경로 확인
import api from '../services/api';             // api 서비스 경로 확인
import WidgetWrapper from '../components/WidgetWrapper'; // WidgetWrapper 경로 확인
import NotesWidget from '../components/widgets/NotesWidget'; // NotesWidget 경로 확인
import WeatherWidget from '../components/widgets/WeatherWidget'; // WeatherWidget 경로 확인
import { Button, Box, CircularProgress, Alert, Typography, Container, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu'; // For mobile menu toggle
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LogoutIcon from '@mui/icons-material/Logout'; // For logout icon

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardPage() {
  const logout = useAuthStore((state) => state.logout);
  const [widgets, setWidgets] = useState([]);
  const [layouts, setLayouts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false); // For mobile drawer

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // ... (fetchWidgetsAndLayouts, useEffect, onLayoutChange, addWidget, deleteWidget, updateWidgetConfig remain mostly the same) ...
  // Minor adjustment for addWidget to ensure it respects current cols for the breakpoint
  const addWidget = async (type) => {
    const newWidgetId = uuidv4();

    // Determine current breakpoint based on window width or use a fixed one like 'lg' for default new widget calculation
    // This is a simplified example; you might need a more robust way to get current breakpoint for react-grid-layout
    const currentBreakpoint = ResponsiveGridLayout.utils.getBreakpointFromWidth(layouts, window.innerWidth);
    const currentColLayout = layouts[currentBreakpoint] || layouts.lg || []; // Fallback
    const cols = ResponsiveGridLayout.utils.getColsFromBreakpoint(currentBreakpoint, layouts.cols) || 12;


    let newY = 0;
    if (currentColLayout.length > 0) {
      newY = Math.max(...currentColLayout.map(item => item.y + item.h), 0);
    }

    const newLayoutItem = {
      i: newWidgetId,
      x: (currentColLayout.filter(item => item.y === newY).length * (type === 'weather' ? 3 : 4)) % cols,
      y: newY,
      w: type === 'weather' ? Math.min(3, cols) : Math.min(4, cols), // Ensure w doesn't exceed current cols
      h: type === 'weather' ? 2 : 3,
      minW: type === 'weather' ? Math.min(2, cols) : Math.min(3, cols),
      minH: 2,
    };

    const defaultConfig = type === 'notes' ? { content: '' } : { city: 'Seoul' };

    try {
      const response = await api.post('/api/widgets', {
        type: type,
        config: defaultConfig,
        layout: newLayoutItem
      });
      const addedWidget = response.data;

      setWidgets(prev => [...prev, addedWidget]);
      
      setLayouts(prevLayouts => {
        const newLayoutsForAllBreakpoints = { ...prevLayouts };
        // Add the new item to all breakpoint layouts or at least 'lg' and the current one
        Object.keys(newLayoutsForAllBreakpoints).forEach(bp => {
            if (Array.isArray(newLayoutsForAllBreakpoints[bp])) {
                 newLayoutsForAllBreakpoints[bp] = [...newLayoutsForAllBreakpoints[bp], newLayoutItem];
            }
        });
        if (!newLayoutsForAllBreakpoints.lg) { // Ensure lg is there
            newLayoutsForAllBreakpoints.lg = [newLayoutItem];
        }

        return newLayoutsForAllBreakpoints;
      });

    } catch (err) {
      console.error("Failed to add widget:", err.response?.data?.msg || err.message);
      setError(err.response?.data?.msg || 'Failed to add widget');
    }
  };


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const drawerContent = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', width: 250 }} role="presentation">
      <Typography variant="h6" sx={{ my: 2 }}>
        Menu
      </Typography>
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => addWidget('notes')}>
            <ListItemIcon><AddIcon /></ListItemIcon>
            <ListItemText primary="Add Notes" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => addWidget('weather')}>
            <ListItemIcon><AddIcon /></ListItemIcon>
            <ListItemText primary="Add Weather" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Container maxWidth={false} sx={{ mt: 2, mb: 2 }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2, p: 1,
        backgroundColor: 'action.hover',
        borderRadius: 1
      }}>
        <Typography variant="h5" component="h1">My Dashboard</Typography>
        
        {/* Mobile Menu Button - shown only on xs screens */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ display: { sm: 'none' } }} // Only display on extra-small to small screens
        >
          <MenuIcon />
        </IconButton>

        {/* Desktop Buttons - hidden on xs screens */}
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}> {/* Hidden on extra-small, shown on small and up */}
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => addWidget('notes')}
            sx={{ mr: 1 }}
            size="small"
          >
            Add Notes
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            color="secondary"
            onClick={() => addWidget('weather')}
            sx={{ mr: 1 }}
            size="small"
          >
            Add Weather
          </Button>
          <Button variant="outlined" onClick={logout} size="small">
            Logout
          </Button>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{ display: { xs: 'block', sm: 'none' } }} // Only for mobile
      >
        {drawerContent}
      </Drawer>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <ResponsiveGridLayout
        layouts={layouts}
        // breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } // 기본값 사용 가능
        // cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 } // 기본값 사용 가능
        rowHeight={30}
        margin={[10, 10]}
        containerPadding={[10, 10]}
        onLayoutChange={onLayoutChange}
        isDraggable
        isResizable
        draggableHandle=".widget-drag-handle"
      >
        {widgets.map((widget) => (
          <div key={widget.id} data-grid={widget.layout} className="bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
            <WidgetWrapper widget={widget} onDelete={deleteWidget}>
              {widget.type === 'notes' && (
                <NotesWidget
                  config={widget.config}
                  onSave={(newContent) => updateWidgetConfig(widget.id, { content: newContent })}
                />
              )}
              {widget.type === 'weather' && (
                <WeatherWidget
                  initialCity={widget.config?.city || 'Seoul'}
                  onCityChange={(newCity) => updateWidgetConfig(widget.id, { city: newCity })}
                />
              )}
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>
    </Container>
  );
}
