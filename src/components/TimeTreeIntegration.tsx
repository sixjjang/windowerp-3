import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Sync as SyncIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  timeTreeAPI,
  getTimeTreeSettings,
  saveTimeTreeSettings,
  syncWithTimeTree,
  TimeTreeSettings,
  TimeTreeCalendar,
} from '../utils/timetreeUtils';

interface TimeTreeIntegrationProps {
  open: boolean;
  onClose: () => void;
  onSync?: (events: any[]) => void;
  currentEvents?: any[];
}

const TimeTreeIntegration: React.FC<TimeTreeIntegrationProps> = ({
  open,
  onClose,
  onSync,
  currentEvents = [],
}) => {
  const [settings, setSettings] = useState<TimeTreeSettings>(getTimeTreeSettings());
  const [calendars, setCalendars] = useState<TimeTreeCalendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (open) {
      checkAuthStatus();
      if (isAuthenticated) {
        loadCalendars();
      }
    }
  }, [open, isAuthenticated]);

  const checkAuthStatus = () => {
    const authenticated = timeTreeAPI.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (!authenticated) {
      setMessage({ type: 'info', text: '타임트리 인증이 필요합니다. 설정에서 인증을 완료해주세요.' });
    }
  };

  const loadCalendars = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const calendarList = await timeTreeAPI.getCalendars();
      setCalendars(calendarList);
      setMessage(null);
    } catch (error) {
      console.error('캘린더 목록 로드 실패:', error);
      setMessage({ 
        type: 'error', 
        text: `캘린더 목록 로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof TimeTreeSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveTimeTreeSettings(newSettings);
  };

  const handleSync = async () => {
    if (!settings.enabled || !settings.calendar_id) {
      setMessage({ type: 'error', text: '타임트리 연동을 활성화하고 캘린더를 선택해주세요.' });
      return;
    }

    setSyncing(true);
    try {
      const result = await syncWithTimeTree(currentEvents, settings);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        if (result.syncedEvents && onSync) {
          onSync(result.syncedEvents);
        }
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('동기화 실패:', error);
      setMessage({ 
        type: 'error', 
        text: `동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAuth = () => {
    // 타임트리 OAuth 인증 URL로 리다이렉트
    const clientId = process.env.REACT_APP_TIMETREE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/timetree-callback`);
    const authUrl = `https://timetreeapis.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=events_read events_write`;
    
    window.open(authUrl, '_blank', 'width=500,height=600');
  };

  const handleDisconnect = () => {
    timeTreeAPI.clearAuth();
    setIsAuthenticated(false);
    setCalendars([]);
    setMessage({ type: 'info', text: '타임트리 연동이 해제되었습니다.' });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        <Typography variant="h6">타임트리 연동 설정</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          icon={isAuthenticated ? <CheckCircleIcon /> : <ErrorIcon />}
          label={isAuthenticated ? '연결됨' : '연결 안됨'}
          color={isAuthenticated ? 'success' : 'error'}
          size="small"
        />
      </DialogTitle>

      <DialogContent>
        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        {/* 인증 상태 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            인증 상태
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <Typography variant="body2" color="success.main">
                  타임트리에 연결되어 있습니다.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleDisconnect}
                >
                  연결 해제
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body2" color="error.main">
                  타임트리 인증이 필요합니다.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAuth}
                >
                  인증하기
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 연동 설정 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            연동 설정
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                disabled={!isAuthenticated}
              />
            }
            label="타임트리 연동 활성화"
          />

          {settings.enabled && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* 캘린더 선택 */}
              <FormControl fullWidth>
                <InputLabel>캘린더 선택</InputLabel>
                <Select
                  value={settings.calendar_id || ''}
                  onChange={(e) => handleSettingChange('calendar_id', e.target.value)}
                  label="캘린더 선택"
                  disabled={loading}
                >
                  {calendars.map((calendar) => (
                    <MenuItem key={calendar.id} value={calendar.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: calendar.color || '#40c4ff',
                          }}
                        />
                        {calendar.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {loading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">캘린더 목록 로딩 중...</Typography>
                  </Box>
                )}
              </FormControl>

              {/* 동기화 방향 */}
              <FormControl fullWidth>
                <InputLabel>동기화 방향</InputLabel>
                <Select
                  value={settings.sync_direction}
                  onChange={(e) => handleSettingChange('sync_direction', e.target.value)}
                  label="동기화 방향"
                >
                  <MenuItem value="both">양방향 동기화</MenuItem>
                  <MenuItem value="to_timetree">로컬 → 타임트리</MenuItem>
                  <MenuItem value="from_timetree">타임트리 → 로컬</MenuItem>
                </Select>
              </FormControl>

              {/* 자동 동기화 */}
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.auto_sync}
                    onChange={(e) => handleSettingChange('auto_sync', e.target.checked)}
                  />
                }
                label="자동 동기화"
              />

              {settings.auto_sync && (
                <TextField
                  fullWidth
                  type="number"
                  label="동기화 간격 (분)"
                  value={settings.sync_interval}
                  onChange={(e) => handleSettingChange('sync_interval', parseInt(e.target.value) || 30)}
                  inputProps={{ min: 5, max: 1440 }}
                  helperText="5분 ~ 1440분 (24시간) 사이로 설정하세요."
                />
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 수동 동기화 */}
        <Box>
          <Typography variant="h6" gutterBottom>
            수동 동기화
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
              onClick={handleSync}
              disabled={!settings.enabled || !settings.calendar_id || syncing}
            >
              {syncing ? '동기화 중...' : '지금 동기화'}
            </Button>
            
            <Tooltip title="캘린더 목록 새로고침">
              <IconButton
                onClick={loadCalendars}
                disabled={loading || !isAuthenticated}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            현재 {currentEvents.length}개의 일정이 로컬에 저장되어 있습니다.
          </Typography>
        </Box>

        {/* 도움말 */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon fontSize="small" />
            도움말
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 타임트리 연동을 통해 외부 일정과 동기화할 수 있습니다.<br/>
            • 양방향 동기화 시 로컬 일정과 타임트리 일정이 서로 반영됩니다.<br/>
            • 자동 동기화를 활성화하면 설정한 간격으로 자동으로 동기화됩니다.<br/>
            • 타임트리에서 가져온 일정은 "타임트리" 타입으로 표시됩니다.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimeTreeIntegration; 