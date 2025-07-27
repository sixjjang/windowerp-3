import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  useTheme,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  VolumeUp as VolumeIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import {
  SoundSettings,
  FirebaseSoundFile,
  getNotificationSoundsFromFirebase,
  getUserSoundSettingsFromFirebase,
  saveUserSoundSettingsToFirebase,
  getNotificationSoundPlayer,
  getDefaultSoundSettings,
  downloadNotificationSound,
  downloadAllNotificationSounds,
  getLocalNotificationSounds,
  saveDownloadedFilesList,
  getDownloadedFilesList,
} from '../utils/soundUtils';
import { UserContext } from './Layout';

interface SoundSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const { userId } = useContext(UserContext);
  const [settings, setSettings] = useState<SoundSettings>(getDefaultSoundSettings());
  const [soundFiles, setSoundFiles] = useState<FirebaseSoundFile[]>([]);
  const [testingSound, setTestingSound] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [showLocalFiles, setShowLocalFiles] = useState(false);
  const [localFiles, setLocalFiles] = useState<FirebaseSoundFile[]>([]);

  // 설정 및 소리 파일 로드
  const loadData = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 병렬로 설정과 소리 파일 목록 로드
      const [userSettings, availableSounds] = await Promise.all([
        getUserSoundSettingsFromFirebase(userId),
        getNotificationSoundsFromFirebase()
      ]);
      
      setSettings(userSettings);
      setSoundFiles(availableSounds);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setError('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (open && userId) {
      loadData();
    }
  }, [open, userId]);

  // 설정 변경 핸들러
  const handleSettingChange = async (key: keyof SoundSettings, value: any) => {
    if (!userId) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await saveUserSoundSettingsToFirebase(userId, newSettings);
      // 로컬 플레이어 설정도 업데이트
      const player = getNotificationSoundPlayer(userId);
      await player.updateSettings(newSettings);
    } catch (error) {
      console.error('설정 저장 실패:', error);
      setError('설정 저장에 실패했습니다.');
    }
  };

  // 소리 테스트
  const handleTestSound = async (soundKey: string) => {
    if (!userId || !settings.enabled) return;
    
    setTestingSound(soundKey);
    setError(null);
    
    try {
      // 로컬 파일인 경우 직접 재생
      if (showLocalFiles) {
        const localFile = localFiles.find(f => f.name === soundKey);
        if (localFile && (localFile as any).url) {
          const audio = new Audio((localFile as any).url);
          audio.volume = settings.volume;
          await audio.play();
        } else {
          const player = getNotificationSoundPlayer(userId);
          await player.playTestSound(soundKey);
        }
      } else {
        const player = getNotificationSoundPlayer(userId);
        await player.playTestSound(soundKey);
      }
    } catch (error) {
      console.error('소리 테스트 실패:', error);
      setError('소리 재생에 실패했습니다. 브라우저 설정을 확인해주세요.');
    } finally {
      setTestingSound(null);
    }
  };

  // 볼륨 변경
  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const volume = Array.isArray(newValue) ? newValue[0] : newValue;
    handleSettingChange('volume', volume / 100);
  };

  // 채팅 알림 소리 선택
  const handleChatSoundSelect = (soundKey: string) => {
    handleSettingChange('chatSound', soundKey);
  };

  // 일정 알림 소리 선택
  const handleScheduleSoundSelect = (soundKey: string) => {
    handleSettingChange('scheduleSound', soundKey);
  };

  // 새로고침
  const handleRefresh = async () => {
    if (!userId) return;
    
    setRefreshing(true);
    try {
      const player = getNotificationSoundPlayer(userId);
      await player.refreshSettings();
      await loadData();
    } catch (error) {
      console.error('새로고침 실패:', error);
      setError('새로고침에 실패했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  // 개별 알림 소리 다운로드
  const handleDownloadSound = async (fileName: string) => {
    setDownloading(true);
    setError(null);
    
    try {
      const success = await downloadNotificationSound(fileName);
      if (success) {
        // 성공 메시지 표시 (선택사항)
        console.log(`${fileName} 다운로드 완료`);
      } else {
        setError(`${fileName} 다운로드에 실패했습니다.`);
      }
    } catch (error) {
      console.error('다운로드 실패:', error);
      setError('다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  // 모든 알림 소리 다운로드
  const handleDownloadAll = async () => {
    setDownloading(true);
    setError(null);
    setDownloadProgress({ current: 0, total: soundFiles.length });
    
    try {
      const result = await downloadAllNotificationSounds();
      
      if (result.success > 0) {
        // 성공 메시지 표시
        console.log(`${result.success}개 파일 다운로드 완료`);
        
        // 다운로드 완료 후 로컬 파일 목록 저장
        saveDownloadedFilesList(soundFiles);
        
        // 로컬 파일 표시로 전환
        setShowLocalFiles(true);
        setLocalFiles(getDownloadedFilesList());
        
        if (result.failed > 0) {
          setError(`${result.success}개 성공, ${result.failed}개 실패`);
        }
      } else {
        setError('다운로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('전체 다운로드 실패:', error);
      setError('다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  // 로컬 파일 로드
  const handleLoadLocalFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const files = await getLocalNotificationSounds();
      setLocalFiles(files);
      setShowLocalFiles(true);
      
      if (files.length === 0) {
        setError('로컬 파일을 찾을 수 없습니다. 다운로드 폴더를 확인하거나 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('로컬 파일 로드 실패:', error);
      
      // 사용자가 디렉토리 선택을 취소한 경우
      if (error instanceof Error && error.name === 'AbortError') {
        setError('디렉토리 선택이 취소되었습니다.');
      } else {
        setError('로컬 파일 로드에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Firebase 파일로 돌아가기
  const handleShowFirebaseFiles = () => {
    setShowLocalFiles(false);
    setLocalFiles([]);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
          border: '1px solid rgba(255, 107, 157, 0.2)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: '#e0e6ed',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon sx={{ color: '#FF6B9D' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            알림 소리 설정
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
          <IconButton
            onClick={onClose}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, background: 'rgba(244, 67, 54, 0.1)' }}>
            {error}
          </Alert>
        )}

        {!loading && (
          <>
            {/* 알림 소리 활성화 */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#FF6B9D',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#FF6B9D',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#e0e6ed', fontWeight: 500 }}>
                    알림 소리 활성화
                  </Typography>
                }
              />
            </Box>

            <Divider sx={{ background: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />

            {/* 볼륨 설정 */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ color: '#e0e6ed', mb: 2, fontWeight: 500 }}>
                볼륨
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VolumeIcon sx={{ color: '#FF6B9D' }} />
                <Slider
                  value={settings.volume * 100}
                  onChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={5}
                  sx={{
                    color: '#FF6B9D',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#FF6B9D',
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: '#FF6B9D',
                    },
                  }}
                />
                <Typography sx={{ color: '#e0e6ed', minWidth: 40 }}>
                  {Math.round(settings.volume * 100)}%
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ background: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />

            {/* 알림 소리 선택 */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ color: '#e0e6ed', fontWeight: 500 }}>
                  알림 소리 파일 {showLocalFiles && '(로컬 파일)'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {showLocalFiles ? (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleShowFirebaseFiles}
                      sx={{
                        color: '#FF6B9D',
                        borderColor: '#FF6B9D',
                        '&:hover': {
                          borderColor: '#FF6B9D',
                          backgroundColor: 'rgba(255, 107, 157, 0.1)',
                        },
                      }}
                    >
                      Firebase 파일
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleLoadLocalFiles}
                        sx={{
                          color: '#FF6B9D',
                          borderColor: '#FF6B9D',
                          '&:hover': {
                            borderColor: '#FF6B9D',
                            backgroundColor: 'rgba(255, 107, 157, 0.1)',
                          },
                        }}
                      >
                        로컬 파일
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<GetAppIcon />}
                        onClick={handleDownloadAll}
                        disabled={downloading}
                        sx={{
                          color: '#FF6B9D',
                          borderColor: '#FF6B9D',
                          '&:hover': {
                            borderColor: '#FF6B9D',
                            backgroundColor: 'rgba(255, 107, 157, 0.1)',
                          },
                          '&:disabled': {
                            color: 'rgba(255, 255, 255, 0.3)',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                        }}
                      >
                        {downloading ? '다운로드 중...' : '전체 다운로드'}
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
              
              {downloadProgress && (
                <Box sx={{ mb: 2, p: 2, background: 'rgba(255, 107, 157, 0.1)', borderRadius: 2 }}>
                  <Typography sx={{ color: '#e0e6ed', fontSize: '0.875rem' }}>
                    다운로드 진행률: {downloadProgress.current}/{downloadProgress.total}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(downloadProgress.current / downloadProgress.total) * 100}
                    sx={{
                      mt: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#FF6B9D',
                      },
                    }}
                  />
                </Box>
              )}
              
              {(showLocalFiles ? localFiles : soundFiles).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {showLocalFiles ? '로컬 파일을 찾을 수 없습니다.' : '사용 가능한 알림 소리가 없습니다.'}
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* 채팅 알림 소리 설정 */}
                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ color: '#e0e6ed', fontWeight: 500, mb: 2 }}>
                      💬 채팅 알림 소리
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', mb: 2 }}>
                      대시보드 전직원채팅, 스케줄 각일정별 채팅에서 사용
                    </Typography>
                    <List sx={{ p: 0, mb: 2 }}>
                      {(showLocalFiles ? localFiles : soundFiles).map((sound) => (
                        <ListItem
                          key={`chat-${sound.name}`}
                          sx={{
                            background: settings.chatSound === sound.name 
                              ? 'rgba(255, 107, 157, 0.1)' 
                              : 'transparent',
                            borderRadius: 2,
                            mb: 1,
                            border: settings.chatSound === sound.name 
                              ? '1px solid rgba(255, 107, 157, 0.3)' 
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                          onClick={() => handleChatSoundSelect(sound.name)}
                        >
                          <ListItemText
                            primary={
                              <Typography sx={{ color: '#e0e6ed', fontWeight: settings.chatSound === sound.name ? 600 : 400 }}>
                                {sound.name}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                                {new Date(sound.updated).toLocaleDateString()} • {(sound.size / 1024).toFixed(1)}KB
                                {showLocalFiles && (
                                  <span style={{ color: '#FF6B9D', marginLeft: '8px' }}>
                                    📁 로컬
                                  </span>
                                )}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {!showLocalFiles && (
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadSound((sound as any).originalName || `${sound.name}.${(sound as any).extension || 'mp3'}`);
                                  }}
                                  disabled={downloading}
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    '&:hover': {
                                      color: '#FF6B9D',
                                    },
                                    '&:disabled': {
                                      color: 'rgba(255, 255, 255, 0.3)',
                                    },
                                  }}
                                  title="다운로드"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              )}
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTestSound(sound.name);
                                }}
                                disabled={testingSound === sound.name || !settings.enabled}
                                sx={{
                                  color: testingSound === sound.name ? '#FF6B9D' : 'rgba(255, 255, 255, 0.7)',
                                  '&:hover': {
                                    color: '#FF6B9D',
                                  },
                                }}
                              >
                                <PlayIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* 일정 알림 소리 설정 */}
                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ color: '#e0e6ed', fontWeight: 500, mb: 2 }}>
                      📅 일정 알림 소리
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', mb: 2 }}>
                      스케줄 일정 등록, 수정, 삭제 시 사용
                    </Typography>
                    <List sx={{ p: 0 }}>
                      {(showLocalFiles ? localFiles : soundFiles).map((sound) => (
                        <ListItem
                          key={`schedule-${sound.name}`}
                          sx={{
                            background: settings.scheduleSound === sound.name 
                              ? 'rgba(255, 107, 157, 0.1)' 
                              : 'transparent',
                            borderRadius: 2,
                            mb: 1,
                            border: settings.scheduleSound === sound.name 
                              ? '1px solid rgba(255, 107, 157, 0.3)' 
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                          onClick={() => handleScheduleSoundSelect(sound.name)}
                        >
                          <ListItemText
                            primary={
                              <Typography sx={{ color: '#e0e6ed', fontWeight: settings.scheduleSound === sound.name ? 600 : 400 }}>
                                {sound.name}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                                {new Date(sound.updated).toLocaleDateString()} • {(sound.size / 1024).toFixed(1)}KB
                                {showLocalFiles && (
                                  <span style={{ color: '#FF6B9D', marginLeft: '8px' }}>
                                    📁 로컬
                                  </span>
                                )}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {!showLocalFiles && (
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadSound((sound as any).originalName || `${sound.name}.${(sound as any).extension || 'mp3'}`);
                                  }}
                                  disabled={downloading}
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    '&:hover': {
                                      color: '#FF6B9D',
                                    },
                                    '&:disabled': {
                                      color: 'rgba(255, 255, 255, 0.3)',
                                    },
                                  }}
                                  title="다운로드"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              )}
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTestSound(sound.name);
                                }}
                                disabled={testingSound === sound.name || !settings.enabled}
                                sx={{
                                  color: testingSound === sound.name ? '#FF6B9D' : 'rgba(255, 255, 255, 0.7)',
                                  '&:hover': {
                                    color: '#FF6B9D',
                                  },
                                }}
                              >
                                <PlayIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </>
              )}
            </Box>

            {/* 알림 소리 타입별 설명 */}
            <Box sx={{ mt: 3, p: 2, background: 'rgba(255, 107, 157, 0.05)', borderRadius: 2 }}>
              <Typography sx={{ color: '#FF6B9D', fontWeight: 600, mb: 1 }}>
                💡 알림 소리 분리 설정 완료!
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                • <strong>💬 채팅 알림:</strong> 대시보드 전직원채팅, 스케줄 각일정별 채팅<br/>
                • <strong>📅 일정 알림:</strong> 스케줄 일정 등록, 수정, 삭제<br/>
                • 각각 다른 소리를 설정하여 어떤 알림인지 쉽게 구분할 수 있습니다!
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              borderColor: 'rgba(255, 107, 157, 0.5)',
              color: '#FF6B9D',
            },
          }}
        >
          닫기
        </Button>
        <Button
          onClick={() => {
            const defaultSettings = getDefaultSoundSettings();
            handleSettingChange('enabled', defaultSettings.enabled);
            handleSettingChange('volume', defaultSettings.volume);
            handleSettingChange('chatSound', defaultSettings.chatSound);
            handleSettingChange('scheduleSound', defaultSettings.scheduleSound);
          }}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FF4757 0%, #FF6B9D 100%)',
            },
          }}
        >
          기본값으로 복원
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SoundSettingsModal; 