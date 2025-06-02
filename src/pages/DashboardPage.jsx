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

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardPage() {
  const logout = useAuthStore((state) => state.logout);
  const [widgets, setWidgets] = useState([]);
  const [layouts, setLayouts] = useState({}); // 레이아웃 상태 (예: {lg: [], md: [], ...})
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 위젯 데이터 및 레이아웃 불러오기
  const fetchWidgetsAndLayouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/widgets');
      const fetchedWidgets = response.data;
      setWidgets(fetchedWidgets);

      // 백엔드에서 받아온 layout 정보를 react-grid-layout 형식으로 변환
      // 현재는 하나의 브레이크포인트(lg)만 사용한다고 가정합니다.
      // 여러 브레이크포인트를 사용한다면 백엔드 저장 방식과 이 로직을 맞춰야 합니다.
      const newLayouts = { lg: fetchedWidgets.map(w => w.layout) };
      setLayouts(newLayouts);

    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch widgets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWidgetsAndLayouts();
  }, [fetchWidgetsAndLayouts]);

  // 레이아웃 변경 시 호출되는 함수
  const onLayoutChange = useCallback(async (layout, allLayouts) => {
    // layout: 현재 브레이크포인트의 레이아웃 배열 [{i,x,y,w,h}, ...]
    // allLayouts: 모든 브레이크포인트의 레이아웃 객체 {lg: [...], md: [...]}
    setLayouts(allLayouts); // UI 즉시 업데이트

    // 변경된 레이아웃 정보 백엔드에 저장
    // 실제 프로덕션에서는 변경된 위젯만 골라서 업데이트하거나, 디바운싱을 적용할 수 있습니다.
    const currentBreakpointLayout = allLayouts.lg || []; // 'lg' 브레이크포인트 기준
    for (const item of currentBreakpointLayout) {
      const widget = widgets.find(w => w.id === item.i);
      // 레이아웃이 실제로 변경되었는지 확인 후 API 호출 (선택적 최적화)
      if (widget && (
          widget.layout.x !== item.x ||
          widget.layout.y !== item.y ||
          widget.layout.w !== item.w ||
          widget.layout.h !== item.h
      )) {
        try {
          await api.put(`/api/widgets/${item.i}`, { layout: item });
          // 로컬 widgets 상태의 layout도 업데이트 (필요하다면)
          setWidgets(prevWidgets =>
            prevWidgets.map(w => (w.id === item.i ? { ...w, layout: item } : w))
          );
        } catch (err) {
          console.error("Failed to update widget layout:", err);
          // 오류 발생 시 사용자에게 알림 또는 레이아웃 롤백 고려
        }
      }
    }
  }, [widgets]); // widgets가 변경될 때마다 함수 재생성 (API 호출 시 최신 widgets 참조 위함)

  // 새 위젯 추가 함수
  const addWidget = async (type) => {
    const newWidgetId = uuidv4();

    // 현재 'lg' 브레이크포인트의 레이아웃 가져오기
    const currentLgLayout = layouts.lg || [];
    let newY = 0;
    if (currentLgLayout.length > 0) {
      // 기존 위젯들의 y + h 중 최대값을 찾아 그 아래에 배치
      newY = Math.max(...currentLgLayout.map(item => item.y + item.h), 0);
    }

    const newLayoutItem = {
      i: newWidgetId,
      x: (currentLgLayout.filter(item => item.y === newY).length * (type === 'weather' ? 3 : 4)) % (layouts.lg?.cols || 12), // 같은 y 선상에서 x 위치 계산
      y: newY, // 계산된 y 값 사용
      w: type === 'weather' ? 3 : 4,
      h: type === 'weather' ? 2 : 3,
      minW: type === 'weather' ? 2 : 3,
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
        const updatedLgLayout = [...(prevLayouts.lg || []), newLayoutItem];
        // 다른 브레이크포인트에 대한 처리도 필요하다면 여기에 추가
        return { ...prevLayouts, lg: updatedLgLayout };
      });

    } catch (err) {
      console.error("Failed to add widget:", err.response?.data?.msg || err.message);
      // setError(err.response?.data?.msg || 'Failed to add widget'); // 필요시 에러 상태 업데이트
    }
  };

  // 위젯 삭제 함수
  const deleteWidget = async (widgetId) => {
    try {
      await api.delete(`/api/widgets/${widgetId}`);
      setWidgets(prev => prev.filter(w => w.id !== widgetId));
      // layouts 상태에서도 해당 위젯 레이아웃 제거
      setLayouts(prevLayouts => {
        const newLayouts = {};
        for (const breakpoint in prevLayouts) {
          newLayouts[breakpoint] = prevLayouts[breakpoint].filter(item => item.i !== widgetId);
        }
        return newLayouts;
      });
    } catch (err) {
      console.error("Failed to delete widget:", err);
      setError(err.response?.data?.msg || 'Failed to delete widget');
    }
  };

  // 위젯 설정 업데이트 함수 (예: 노트 내용, 날씨 도시)
  const updateWidgetConfig = async (widgetId, newConfig) => {
    try {
      const response = await api.put(`/api/widgets/${widgetId}`, { config: newConfig });
      setWidgets(prev =>
        prev.map(w => (w.id === widgetId ? { ...w, config: response.data.config } : w))
      );
    } catch (err) {
      console.error("Failed to update widget config:", err);
      setError(err.response?.data?.msg || 'Failed to update widget config');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 1, backgroundColor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="h5" component="h1">My Dashboard</Typography>
        <div>
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
        </div>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <ResponsiveGridLayout
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30} // 기본 행 높이, 필요에 따라 조절
        margin={[10, 10]} // 그리드 아이템 간 마진 [x, y]
        containerPadding={[10, 10]} // 컨테이너 패딩 [x, y]
        onLayoutChange={onLayoutChange}
        isDraggable
        isResizable
        draggableHandle=".widget-drag-handle" // 드래그 핸들 클래스 지정
      >
        {widgets.map((widget) => (
          // key는 반드시 고유해야 하며, data-grid prop에 레이아웃 정보를 전달합니다.
          // react-grid-layout은 이 div의 자식으로 실제 렌더링할 컴포넌트를 기대합니다.
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
              {/* 추가 위젯 타입들은 여기에 */}
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>
    </Container>
  );
}