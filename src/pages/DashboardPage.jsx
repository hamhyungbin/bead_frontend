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
import AddIcon from '@mui/icons-material/Add'; //
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

const ResponsiveGridLayout = WidthProvider(Responsive); //

export default function DashboardPage() {
  const logout = useAuthStore((state) => state.logout); //
  const [widgets, setWidgets] = useState([]); //
  const [layouts, setLayouts] = useState({}); // 레이아웃 상태 (예: {lg: [], md: [], ...})
  const [isLoading, setIsLoading] = useState(false); //
  const [error, setError] = useState(null); //
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  // MUI의 useMediaQuery를 사용하여 현재 화면 크기가 'sm' (small) 이상인지 확인합니다.
  // sm 브레이크포인트는 일반적으로 600px입니다.
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));


  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // 위젯 데이터 및 레이아웃 불러오기
  const fetchWidgetsAndLayouts = useCallback(async () => { //
    setIsLoading(true); //
    setError(null); //
    try {
      const response = await api.get('/api/widgets'); //
      const fetchedWidgets = response.data; //
      setWidgets(fetchedWidgets); //

      // 백엔드에서 레이아웃 정보가 breakpoint별로 오지 않는 경우, 'lg'만 설정하거나
      // 모든 breakpoint에 동일한 레이아웃을 복사해줄 수 있습니다.
      // react-grid-layout은 layouts 객체에 모든 정의된 breakpoint에 대한 키를 기대합니다.
      const newLayouts = {};
      const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }; // ResponsiveGridLayout에 전달된 breakpoints와 동일하게 사용
      const backendLayout = fetchedWidgets.map(w => w.layout);

      Object.keys(breakpoints).forEach(bp => {
        newLayouts[bp] = backendLayout.map(item => ({ ...item })); // 각 breakpoint에 레이아웃 복사
      });
      
      setLayouts(newLayouts); //

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch widgets'); //
    } finally {
      setIsLoading(false); //
    }
  }, []); //

  useEffect(() => { //
    fetchWidgetsAndLayouts(); //
  }, [fetchWidgetsAndLayouts]); //

  // 레이아웃 변경 시 호출되는 함수
  const onLayoutChange = useCallback(async (currentLayout, allLayouts) => {
    // currentLayout: 현재 활성 breakpoint의 레이아웃 배열
    // allLayouts: 모든 breakpoint의 레이아웃 객체 {lg: [...], md: [...]}
    setLayouts(allLayouts); // UI 즉시 업데이트

    // 변경된 레이아웃 정보 백엔드에 저장
    // currentLayout (현재 breakpoint의 layout)을 기준으로 업데이트합니다.
    // react-grid-layout은 사용자가 드래그/리사이즈 시 현재 breakpoint의 layout만 변경합니다.
    // 서버에는 변경된 위젯의 레이아웃 정보(i, x, y, w, h)만 업데이트합니다.
    
    // 어떤 breakpoint의 레이아웃이 변경되었는지 확인 (예: 'lg', 'md' 등)
    // `currentLayout` 파라미터는 현재 활성화된 breakpoint의 레이아웃을 나타냅니다.
    // `allLayouts`는 모든 breakpoint에 대한 레이아웃을 포함하므로,
    // `currentLayout`의 각 아이템을 `allLayouts`의 해당 breakpoint에서 찾아 비교하거나
    // 혹은 `currentLayout`을 직접 순회하며 변경된 위젯의 정보를 업데이트할 수 있습니다.
    // 여기서는 currentLayout을 사용합니다.

    for (const item of currentLayout) {
      const widgetToUpdate = widgets.find(w => w.id === item.i); //
      if (widgetToUpdate) {
        // 실제 레이아웃 값 변경 여부 확인 (최적화)
        const prevLayout = widgetToUpdate.layout;
        if (
          prevLayout.x !== item.x ||
          prevLayout.y !== item.y ||
          prevLayout.w !== item.w ||
          prevLayout.h !== item.h
        ) {
          try {
            // 서버에는 위젯 ID와 새로운 layout 객체 (x,y,w,h 포함)를 보냅니다.
            await api.put(`/api/widgets/${item.i}`, { layout: { ...item } }); //
            
            // 로컬 widgets 상태의 layout도 업데이트
            setWidgets(prevWidgets => //
              prevWidgets.map(w => (w.id === item.i ? { ...w, layout: { ...item } } : w)) //
            );
          } catch (err) {
            console.error("Failed to update widget layout:", err); //
            // 오류 발생 시 사용자에게 알림 또는 레이아웃 롤백 고려
          }
        }
      }
    }
  }, [widgets, api, setLayouts]); // 의존성 배열 수정: api, setLayouts 추가

  // 새 위젯 추가 함수
  const addWidget = async (type) => { //
    const newWidgetId = uuidv4(); //

    // 현재 'lg' 브레이크포인트의 레이아웃 가져오기 (또는 가장 넓은 breakpoint)
    const currentLgLayout = layouts?.lg || []; //
    let newY = 0; //
    if (currentLgLayout.length > 0) { //
      newY = Math.max(...currentLgLayout.map(item => item.y + item.h), 0); //
    }
    
    // layouts.cols?.lg 가 없을 수 있으므로 안전하게 접근 (기본값 12)
    const lgCols = (layouts && layouts.cols && layouts.cols.lg) ? layouts.cols.lg : 12;

    const newLayoutItemBase = { //
      i: newWidgetId, //
      x: (currentLgLayout.filter(item => item.y === newY).length * (type === 'weather' ? 3 : 4)) % lgCols, //
      y: newY, //
      w: type === 'weather' ? 3 : 4, //
      h: type === 'weather' ? 2 : 3, //
      minW: type === 'weather' ? 2 : 3, //
      minH: 2, //
    };

    const defaultConfig = type === 'notes' ? { content: '' } : { city: '' }; // WeatherWidget 초기 도시를 빈 문자열로 하여 자동 감지 유도

    try {
      const response = await api.post('/api/widgets', { //
        type: type, //
        config: defaultConfig, //
        layout: newLayoutItemBase // DB에는 기본 레이아웃(lg 기준) 저장
      });
      const addedWidget = response.data; // 서버는 전체 위젯 객체 (ID 포함된 layout 포함) 반환 가정
      
      // 서버에서 반환된 layout으로 설정 (ID가 포함되어 있을 것이므로)
      const finalLayoutItem = { ...addedWidget.layout, i: addedWidget.id };


      setWidgets(prev => [...prev, { ...addedWidget, layout: finalLayoutItem }]); //
      
      // 모든 breakpoint에 새 위젯 레이아웃 추가
      setLayouts(prevLayouts => { //
        const newLayoutsState = { ...prevLayouts };
        Object.keys(newLayoutsState.cols || {lg:12}).forEach(bp => { // newLayoutsState.cols가 존재하면 사용
            const bpCols = (newLayoutsState.cols && newLayoutsState.cols[bp]) ? newLayoutsState.cols[bp] : lgCols;
            newLayoutsState[bp] = [
                ...(newLayoutsState[bp] || []),
                {
                    ...finalLayoutItem,
                    // breakpoint별로 w, x 등을 다르게 설정할 수 있지만, 여기서는 일단 동일하게 추가
                    w: type === 'weather' ? Math.min(3, bpCols) : Math.min(4, bpCols),
                    x: ((newLayoutsState[bp] || []).filter(item => item.y === newY).length * (type === 'weather' ? 3 : 4)) % bpCols,
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

  // 위젯 삭제 함수
  const deleteWidget = async (widgetId) => { //
    try {
      await api.delete(`/api/widgets/${widgetId}`); //
      setWidgets(prev => prev.filter(w => w.id !== widgetId)); //
      setLayouts(prevLayouts => { //
        const newLayouts = {}; //
        for (const breakpoint in prevLayouts) { //
          if (Array.isArray(prevLayouts[breakpoint])) { // cols 같은 속성 제외
             newLayouts[breakpoint] = prevLayouts[breakpoint].filter(item => item.i !== widgetId); //
          } else {
             newLayouts[breakpoint] = prevLayouts[breakpoint]; // cols 같은 속성은 그대로 유지
          }
        }
        return newLayouts; //
      });
    } catch (err) {
      console.error("Failed to delete widget:", err); //
      setError(err.response?.data?.msg || 'Failed to delete widget'); //
    }
  };

  // 위젯 설정 업데이트 함수 (예: 노트 내용, 날씨 도시)
  const updateWidgetConfig = async (widgetId, newConfig) => { //
    try {
      const response = await api.put(`/api/widgets/${widgetId}`, { config: newConfig }); //
      setWidgets(prev => //
        prev.map(w => (w.id === widgetId ? { ...w, config: response.data.config } : w)) //
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
          p: { xs: 1, sm: 1.5 }, // 반응형 패딩
          backgroundColor: 'action.hover', 
          borderRadius: 1 
      }}>
        <Typography variant={isDesktop ? "h5" : "h6"} component="h1"> {/* 화면 크기에 따라 글자 크기 조절 */}
          My Dashboard
        </Typography>
        
        {isDesktop ? (
          <Box>
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
        ) : (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
        {drawerItems}
      </Drawer>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} {/* */}

      <ResponsiveGridLayout
        layouts={layouts} //
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} //
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }} //
        rowHeight={30} //
        margin={[10, 10]} //
        containerPadding={[10, 10]} //
        onLayoutChange={onLayoutChange} //
        isDraggable //
        isResizable //
        draggableHandle=".widget-drag-handle" //
      >
        {widgets.map((widget) => ( //
          <div key={widget.id} data-grid={widget.layout || {x:0,y:0,w:1,h:1}} className="bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700"> {/* widget.layout이 없을 경우 대비 */}
            <WidgetWrapper widget={widget} onDelete={deleteWidget}>
              {widget.type === 'notes' && ( //
                <NotesWidget
                  config={widget.config} //
                  onSave={(newContent) => updateWidgetConfig(widget.id, { content: newContent })} //
                />
              )}
              {widget.type === 'weather' && ( //
                <WeatherWidget
                  initialCity={widget.config?.city} // 빈 문자열 전달 가능
                  onCityChange={(newCity) => updateWidgetConfig(widget.id, { city: newCity })} //
                />
              )}
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>
    </Container>
  );
}
