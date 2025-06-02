// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { v4 as uuidv4 } from 'uuid';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import WidgetWrapper from '../components/WidgetWrapper';
import NotesWidget from '../components/widgets/NotesWidget';
import WeatherWidget from '../components/widgets/WeatherWidget';
import ClockWidget from '../components/widgets/ClockWidget'; // 시계 위젯 import
import {
  Button,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // 시계 아이콘

const ResponsiveGridLayout = WidthProvider(Responsive);

// ResponsiveGridLayout에 전달될 breakpoints와 cols를 상수로 정의
const RGL_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }; //
const RGL_COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }; //

export default function DashboardPage() {
  const logout = useAuthStore((state) => state.logout); //
  const [widgets, setWidgets] = useState([]); //
  const [layouts, setLayouts] = useState({}); //
  const [isLoading, setIsLoading] = useState(false); //
  const [error, setError] = useState(null); //
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const fetchWidgetsAndLayouts = useCallback(async () => { //
    setIsLoading(true); //
    setError(null); //
    try {
      const response = await api.get('/api/widgets'); //
      const fetchedWidgets = response.data; //
      setWidgets(fetchedWidgets); //

      const newLayoutsObj = {};
      Object.keys(RGL_BREAKPOINTS).forEach(bp => {
        newLayoutsObj[bp] = fetchedWidgets.map(w => ({
          ...(w.layout || { x: 0, y: 0, w: (w.type === 'clock' ? 2 : (w.type === 'weather' ? 3 : 4)), h: (w.type === 'clock' ? 1 : (w.type === 'weather' ? 2 : 3)) }), // 기본값 제공
          i: w.id.toString(), // 'i'는 문자열이어야 합니다.
        }));
      });
      setLayouts(newLayoutsObj); //

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch widgets'); //
    } finally {
      setIsLoading(false); //
    }
  }, []); //

  useEffect(() => { //
    fetchWidgetsAndLayouts(); //
  }, [fetchWidgetsAndLayouts]); //

  const onLayoutChange = useCallback(async (currentLayout, allLayouts) => {
    setLayouts(allLayouts); // RGL의 모든 breakpoint 레이아웃으로 UI 상태 업데이트

    // 'lg' breakpoint의 레이아웃을 기준으로 서버에 저장하고 canonical widget.layout 업데이트
    const lgLayoutToPersist = allLayouts.lg || currentLayout;

    for (const item of lgLayoutToPersist) {
      const widget = widgets.find(w => w.id === item.i); //
      if (widget) {
        const currentCanonicalLayout = widget.layout || {};
        // 실제 레이아웃 변경 여부 확인 (x, y, w, h만 비교)
        if (
          currentCanonicalLayout.x !== item.x ||
          currentCanonicalLayout.y !== item.y ||
          currentCanonicalLayout.w !== item.w ||
          currentCanonicalLayout.h !== item.h
        ) {
          try {
            // 서버에는 'lg' 기준 레이아웃 정보 업데이트
            await api.put(`/api/widgets/${item.i}`, { layout: { ...item, i: item.i.toString() } }); //
            
            // 로컬 widgets 상태의 layout도 'lg' 기준으로 업데이트
            setWidgets(prevWidgets => //
              prevWidgets.map(w =>
                w.id === item.i ? { ...w, layout: { ...item, i: item.i.toString() } } : w
              ) //
            );
          } catch (err) {
            console.error("Failed to update widget layout:", err); //
            setError('Failed to save layout changes. Please try again.');
          }
        }
      }
    }
  }, [widgets, api]); // setLayouts는 useCallback 의존성에 필요 없음

  const addWidget = async (type) => { //
    const newWidgetId = uuidv4(); //

    const defaultWidths = { notes: 4, weather: 3, clock: 2 };
    const defaultHeights = { notes: 3, weather: 2, clock: 1 };
    const minWidths = { notes: 3, weather: 2, clock: 2 };
    const minHeights = { notes: 2, weather: 2, clock: 1 };

    const newLayoutItemBase = { //
      i: newWidgetId.toString(),
      x: (layouts.lg?.filter(item => item.y === 0).reduce((acc, item) => acc + item.w, 0) % RGL_COLS.lg) || 0, // 가장 윗줄 오른쪽으로 추가 시도
      y: 0, // Infinity, // 새 위젯을 가장 아래에 배치 (react-grid-layout이 y값 조정)
      w: defaultWidths[type] || 3, //
      h: defaultHeights[type] || 2, //
      minW: minWidths[type] || 2, //
      minH: minHeights[type] || 1, //
    };

    const defaultConfig = type === 'notes' ? { content: '' } : 
                          type === 'weather' ? { city: '' } : // 자동 감지 유도
                          {}; // Clock은 별도 config 불필요

    try {
      const response = await api.post('/api/widgets', { //
        type: type, //
        config: defaultConfig, //
        layout: newLayoutItemBase // DB에는 'lg' 기준 레이아웃 저장
      });
      const addedWidgetData = response.data; // 서버는 id 포함된 widget 객체 반환 가정
      
      // 서버로부터 받은 layout (id 포함) 사용, 없으면 newLayoutItemBase 사용
      const finalWidget = {
        ...addedWidgetData,
        id: addedWidgetData.id.toString(),
        layout: { ...(addedWidgetData.layout || newLayoutItemBase), i: addedWidgetData.id.toString() }
      };

      setWidgets(prev => [...prev, finalWidget]); //
      
      setLayouts(prevLayouts => { //
        const newLayoutsState = { ...prevLayouts };
        Object.keys(RGL_BREAKPOINTS).forEach(bp => {
          const bpCols = RGL_COLS[bp] || 12;
          newLayoutsState[bp] = [
            ...(newLayoutsState[bp] || []),
            {
              ...finalWidget.layout, // 서버에서 받은 레이아웃 기준으로
              // 필요시 breakpoint 별 w, x 조정 (여기서는 일단 동일하게)
              w: defaultWidths[type] ? Math.min(defaultWidths[type], bpCols) : Math.min(3, bpCols),
              x: ((newLayoutsState[bp] || []).filter(item => item.y === 0).reduce((acc, item) => acc + item.w, 0) % bpCols) || 0,
            }
          ];
        });
        return newLayoutsState; //
      });

    } catch (err) {
      console.error("Failed to add widget:", err.response?.data?.msg || err.message); //
      setError(err.response?.data?.msg || 'Failed to add widget');
    }
  };

  const deleteWidget = async (widgetIdToDelete) => { //
    const idStr = widgetIdToDelete.toString();
    try {
      await api.delete(`/api/widgets/${idStr}`); //
      setWidgets(prev => prev.filter(w => w.id.toString() !== idStr)); //
      
      setLayouts(prevLayouts => { //
        const newLayouts = { ...prevLayouts }; //
        for (const breakpoint in newLayouts) { //
          if (Array.isArray(newLayouts[breakpoint])) {
            newLayouts[breakpoint] = newLayouts[breakpoint].filter(item => item.i.toString() !== idStr); //
          }
          // cols 등 다른 속성은 그대로 유지
        }
        return newLayouts; //
      });
    } catch (err) {
      console.error("Failed to delete widget:", err); //
      setError(err.response?.data?.msg || 'Failed to delete widget'); //
    }
  };

  const updateWidgetConfig = async (widgetId, newConfig) => { //
    try {
      const response = await api.put(`/api/widgets/${widgetId.toString()}`, { config: newConfig }); //
      setWidgets(prev => //
        prev.map(w => (w.id.toString() === widgetId.toString() ? { ...w, config: response.data.config } : w)) //
      );
    } catch (err) {
      console.error("Failed to update widget config:", err); //
      setError(err.response?.data?.msg || 'Failed to update widget config'); //
    }
  };

  if (isLoading) { //
    return ( //
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}> {/* */}
        <CircularProgress /> {/* */}
      </Box>
    );
  }
  
  const drawerItems = (
    <Box onClick={handleDrawerToggle} sx={{ width: 250, pt: 2 }} role="presentation">
      <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
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
          <ListItemButton onClick={() => addWidget('clock')}>
            <ListItemIcon><AccessTimeIcon /></ListItemIcon>
            <ListItemText primary="Add Clock" />
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
    <Container maxWidth={false} sx={{ mt: 2, mb: 2 }}> {/* */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2, 
          p: { xs: 1, sm: 1.5 },
          backgroundColor: 'action.hover', 
          borderRadius: 1 
      }}>
        <Typography variant={isDesktop ? "h5" : "h6"} component="h1">
          My Dashboard
        </Typography>
        
        {isDesktop ? (
          <Box>
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => addWidget('notes')} sx={{ mr: 1 }} size="small" > Add Notes </Button>
            <Button startIcon={<AddIcon />} variant="contained" color="secondary" onClick={() => addWidget('weather')} sx={{ mr: 1 }} size="small" > Add Weather </Button>
            <Button startIcon={<AccessTimeIcon />} variant="contained" color="info" onClick={() => addWidget('clock')} sx={{ mr: 1 }} size="small"> Add Clock </Button>
            <Button variant="outlined" onClick={logout} size="small"> Logout </Button>
          </Box>
        ) : (
          <IconButton color="inherit" aria-label="open drawer" edge="end" onClick={handleDrawerToggle} > <MenuIcon /> </IconButton>
        )}
      </Box>

      <Drawer anchor="right" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' } }} >
        {drawerItems}
      </Drawer>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} {/* */}

      <ResponsiveGridLayout
        layouts={layouts} //
        breakpoints={RGL_BREAKPOINTS} //
        cols={RGL_COLS} //
        rowHeight={30} //
        margin={[10, 10]} //
        containerPadding={[10, 10]} //
        onLayoutChange={onLayoutChange} //
        isDraggable //
        isResizable //
        draggableHandle=".widget-drag-handle" //
        // compactType={null} // 레이아웃 깨짐 현상 완화를 위해 시도해볼 수 있는 옵션
        // preventCollision={true} // 충돌 방지 옵션
      >
        {widgets.map((widget) => {
          // 레이아웃 객체에서 해당 위젯의 레이아웃 정보를 찾거나 기본값 사용
          // 현재 활성 breakpoint를 알아내서 해당 레이아웃을 적용하는 것이 더 정확할 수 있으나,
          // RGL이 layouts prop을 통해 이를 관리하므로, widget.layout은 lg 기준으로 유지.
          const itemLayout = widget.layout || {
            x: 0, y: 0,
            w: (widget.type === 'clock' ? 2 : (widget.type === 'weather' ? 3 : 4)),
            h: (widget.type === 'clock' ? 1 : (widget.type === 'weather' ? 2 : 3)),
            i: widget.id.toString()
          };
          return (
            <div key={widget.id.toString()} data-grid={itemLayout} className="bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700"> {/* */}
              <WidgetWrapper widget={widget} onDelete={deleteWidget}>
                {widget.type === 'notes' && ( //
                  <NotesWidget config={widget.config} onSave={(newContent) => updateWidgetConfig(widget.id, { content: newContent })} /> //
                )}
                {widget.type === 'weather' && ( //
                  <WeatherWidget initialCity={widget.config?.city} onCityChange={(newCity) => updateWidgetConfig(widget.id, { city: newCity })} /> //
                )}
                {widget.type === 'clock' && (
                  <ClockWidget />
                )}
              </WidgetWrapper>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </Container>
  );
}
