import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { EstimateTemplate, TemplateRoom } from 'types';
import {
  loadTemplates,
  saveTemplates,
  createTemplate,
  createRoom,
  findSimilarProjects,
} from 'utils/templateUtils';

interface TemplateManagerProps {
  open: boolean;
  onClose: () => void;
  onTemplateSelect?: (template: EstimateTemplate) => void;
}

const TemplateManager = ({
  open,
  onClose,
  onTemplateSelect,
}: TemplateManagerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [templates, setTemplates] = useState<EstimateTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EstimateTemplate | null>(null);
  const [editMode, setEditMode] = useState<'template' | 'room' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [similarProjects, setSimilarProjects] = useState<EstimateTemplate[]>(
    []
  );
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // 폼 상태
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    projectName: '',
  });
  const [roomForm, setRoomForm] = useState({
    name: '',
    width: '',
    height: '',
    quantity: '1',
    productType: '',
    curtainType: '',
    pleatType: '',
    productName: '',
    vendor: '',
    brand: '',
    space: '',
    details: '',
    salePrice: '',
    cost: '',
    purchaseCost: '',
  });

  useEffect(() => {
    if (open) {
      loadTemplateData();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm) {
      const similar = findSimilarProjects(searchTerm, templates);
      setSimilarProjects(similar.map(s => s.template));
    } else {
      setSimilarProjects([]);
    }
  }, [searchTerm, templates]);

  const loadTemplateData = async () => {
    const loadedTemplates = await loadTemplates();
    setTemplates(loadedTemplates);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      setNotification({
        message: '템플릿 이름을 입력해주세요.',
        type: 'error',
      });
      return;
    }

    const newTemplate = createTemplate(
      templateForm.name,
      templateForm.description,
      templateForm.projectName
    );

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    await saveTemplates(updatedTemplates);

    setTemplateForm({ name: '', description: '', projectName: '' });
    setEditMode(null);
    setNotification({ message: '템플릿이 생성되었습니다.', type: 'success' });
  };

  const handleSaveRoom = async () => {
    if (!selectedTemplate || !roomForm.name.trim()) {
      setNotification({ message: '방 이름을 입력해주세요.', type: 'error' });
      return;
    }

    const newRoom: TemplateRoom = {
      ...createRoom(roomForm.name),
      width: parseFloat(roomForm.width) || 0,
      height: parseFloat(roomForm.height) || 0,
      quantity: parseInt(roomForm.quantity) || 1,
      productType: roomForm.productType,
      curtainType: roomForm.curtainType,
      pleatType: roomForm.pleatType,
      productName: roomForm.productName,
      vendor: roomForm.vendor,
      brand: roomForm.brand,
      space: roomForm.space,
      details: roomForm.details,
      salePrice: parseFloat(roomForm.salePrice) || 0,
      cost: parseFloat(roomForm.cost) || 0,
      purchaseCost: parseFloat(roomForm.purchaseCost) || 0,
    };

    const updatedTemplate = {
      ...selectedTemplate,
      rooms: [...selectedTemplate.rooms, newRoom],
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = templates.map(t =>
      t.id === selectedTemplate.id ? updatedTemplate : t
    );

    setTemplates(updatedTemplates);
    setSelectedTemplate(updatedTemplate);
    await saveTemplates(updatedTemplates);

    setRoomForm({
      name: '',
      width: '',
      height: '',
      quantity: '1',
      productType: '',
      curtainType: '',
      pleatType: '',
      productName: '',
      vendor: '',
      brand: '',
      space: '',
      details: '',
      salePrice: '',
      cost: '',
      purchaseCost: '',
    });
    setEditMode(null);
    setNotification({ message: '방이 추가되었습니다.', type: 'success' });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    await saveTemplates(updatedTemplates);

    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }

    setNotification({ message: '템플릿이 삭제되었습니다.', type: 'success' });
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!selectedTemplate) return;

    const updatedRooms = selectedTemplate.rooms.filter(r => r.id !== roomId);
    const updatedTemplate = {
      ...selectedTemplate,
      rooms: updatedRooms,
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = templates.map(t =>
      t.id === selectedTemplate.id ? updatedTemplate : t
    );

    setTemplates(updatedTemplates);
    setSelectedTemplate(updatedTemplate);
    await saveTemplates(updatedTemplates);

    setNotification({ message: '방이 삭제되었습니다.', type: 'success' });
  };

  const handleCopyTemplate = async (template: EstimateTemplate) => {
    const copiedTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (복사본)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = [...templates, copiedTemplate];
    setTemplates(updatedTemplates);
    await saveTemplates(updatedTemplates);

    setNotification({ message: '템플릿이 복사되었습니다.', type: 'success' });
  };

  const handleTemplateSelect = (template: EstimateTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
      onClose();
    }
  };

  const filteredTemplates = templates.filter(
    template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
        disableAutoFocus
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {isMobile && (
              <IconButton
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: 8,
                  color: '#b0b8c1',
                  zIndex: 1,
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography 
              variant="h6" 
              sx={{ 
                flex: 1, 
                textAlign: isMobile ? 'center' : 'left',
                color: '#e0e6ed',
                fontSize: isMobile ? '1.2rem' : '1.25rem',
                fontWeight: 600,
              }}
            >
              견적서 템플릿 관리
            </Typography>
            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEditMode('template')}
                sx={{
                  backgroundColor: '#40c4ff',
                  '&:hover': {
                    backgroundColor: '#33a3cc'
                  }
                }}
              >
                새 템플릿
              </Button>
            )}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ 
          p: isMobile ? 2 : 3,
          backgroundColor: '#1e2633',
          '& .MuiDialogContent-root': {
            backgroundColor: '#1e2633',
          }
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: isMobile ? 1 : 2, 
            height: isMobile ? 'auto' : 600,
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            {/* 왼쪽: 템플릿 목록 */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: isMobile ? '300px' : 'auto'
            }}>
              <TextField
                fullWidth
                placeholder="템플릿 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                sx={{ 
                  mb: 2,
                  '& .MuiInputLabel-root': { color: '#b0b8c1' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#2e3a4a' },
                    '&:hover fieldset': { borderColor: '#40c4ff' },
                    '&.Mui-focused fieldset': { borderColor: '#40c4ff' },
                  },
                  '& .MuiInputBase-input': { color: '#e0e6ed' },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: '#b0b8c1' }} />
                  ),
                }}
              />

              {similarProjects.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    유사한 프로젝트
                  </Typography>
                  {similarProjects.map(template => (
                    <Chip
                      key={template.id}
                      label={template.projectName}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      onClick={() => setSelectedTemplate(template)}
                    />
                  ))}
                </Box>
              )}

              <List sx={{ flex: 1, overflow: 'auto' }}>
                {filteredTemplates.map(template => (
                  <ListItem
                    key={template.id}
                    button
                    selected={selectedTemplate?.id === template.id}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <ListItemText
                      primary={template.name}
                      secondary={
                        <Box component="span">
                          <Typography component="span" variant="body2" color="text.secondary">
                            {template.projectName}
                          </Typography>
                          <Typography component="span" variant="caption" color="text.secondary">
                            방 {template.rooms.length}개 •{' '}
                            {new Date(template.updatedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyTemplate(template)}
                        sx={{ mr: 1 }}
                      >
                        <CopyIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>

            {!isMobile && <Divider orientation="vertical" flexItem />}

            {/* 오른쪽: 선택된 템플릿 상세 */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: isMobile ? '300px' : 'auto'
            }}>
              {selectedTemplate ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        color: '#e0e6ed',
                        fontSize: isMobile ? '1.1rem' : '1.25rem',
                        fontWeight: 600,
                        mb: 1
                      }}
                    >
                      {selectedTemplate.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ color: '#b0b8c1', mb: 0.5 }}
                    >
                      {selectedTemplate.description}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ color: '#8a9299' }}
                    >
                      프로젝트: {selectedTemplate.projectName}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? 1 : 0,
                    }}
                  >
                    <Typography 
                      variant="subtitle1"
                      sx={{ 
                        color: '#e0e6ed',
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        fontWeight: 600
                      }}
                    >
                      방 목록
                    </Typography>
                    <Button
                      variant="outlined"
                      size={isMobile ? "medium" : "small"}
                      startIcon={<AddIcon />}
                      onClick={() => setEditMode('room')}
                      sx={{
                        color: '#40c4ff',
                        borderColor: '#40c4ff',
                        minHeight: isMobile ? '44px' : 'auto',
                        fontSize: isMobile ? '0.9rem' : '0.875rem',
                        '&:hover': {
                          backgroundColor: '#263040',
                          borderColor: '#40c4ff'
                        }
                      }}
                    >
                      방 추가
                    </Button>
                  </Box>

                  <List sx={{ flex: 1, overflow: 'auto' }}>
                    {selectedTemplate.rooms.map(room => (
                      <ListItem key={room.id}>
                        <ListItemText
                          primary={room.name}
                          secondary={
                            <Box component="span">
                              <Typography component="span" variant="body2">
                                {room.width}mm × {room.height}mm ×{' '}
                                {room.quantity}개
                              </Typography>
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                              >
                                {room.productName} • {room.vendor}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>

                  {onTemplateSelect && (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleTemplateSelect(selectedTemplate)}
                      sx={{ 
                        mt: 2,
                        backgroundColor: '#40c4ff',
                        minHeight: isMobile ? '48px' : 'auto',
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: '#33a3cc'
                        }
                      }}
                    >
                      이 템플릿 사용하기
                    </Button>
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: isMobile ? '200px' : 'auto',
                  }}
                >
                  <Typography 
                    sx={{ 
                      color: '#b0b8c1',
                      fontSize: isMobile ? '1rem' : '0.875rem',
                      textAlign: 'center'
                    }}
                  >
                    템플릿을 선택하세요
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          {/* 모바일에서 새 템플릿 버튼 */}
          {isMobile && (
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              justifyContent: 'center',
              borderTop: 1, 
              borderColor: '#2e3a4a', 
              backgroundColor: '#1e2633'
            }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEditMode('template')}
                sx={{
                  backgroundColor: '#40c4ff',
                  minHeight: '48px',
                  fontSize: '1rem',
                  px: 3,
                  '&:hover': {
                    backgroundColor: '#33a3cc'
                  }
                }}
              >
                새 템플릿
              </Button>
            </Box>
          )}
        </DialogContent>

        {!isMobile && (
          <DialogActions sx={{ 
            borderTop: 1, 
            borderColor: '#2e3a4a', 
            p: 2,
            backgroundColor: '#1e2633'
          }}>
            <Button 
              onClick={onClose}
              sx={{ 
                color: '#b0b8c1',
                '&:hover': {
                  backgroundColor: '#2e3a4a'
                }
              }}
            >
              닫기
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* 템플릿 생성 다이얼로그 */}
      <Dialog
        open={editMode === 'template'}
        onClose={() => setEditMode(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>새 템플릿 생성</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="템플릿 이름"
            value={templateForm.name}
            onChange={e =>
              setTemplateForm({ ...templateForm, name: e.target.value })
            }
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="설명"
            value={templateForm.description}
            onChange={e =>
              setTemplateForm({ ...templateForm, description: e.target.value })
            }
            sx={{ mb: 2 }}
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="프로젝트명"
            value={templateForm.projectName}
            onChange={e =>
              setTemplateForm({ ...templateForm, projectName: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMode(null)}>취소</Button>
          <Button variant="contained" onClick={handleSaveTemplate}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 방 추가 다이얼로그 */}
      <Dialog
        open={editMode === 'room'}
        onClose={() => setEditMode(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>방 추가</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              label="방 이름"
              value={roomForm.name}
              onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
            />
            <TextField
              label="수량"
              type="number"
              value={roomForm.quantity}
              onChange={e =>
                setRoomForm({ ...roomForm, quantity: e.target.value })
              }
            />
            <TextField
              label="폭 (mm)"
              type="number"
              value={roomForm.width}
              onChange={e =>
                setRoomForm({ ...roomForm, width: e.target.value })
              }
            />
            <TextField
              label="높이 (mm)"
              type="number"
              value={roomForm.height}
              onChange={e =>
                setRoomForm({ ...roomForm, height: e.target.value })
              }
            />
            <TextField
              label="제품 타입"
              value={roomForm.productType}
              onChange={e =>
                setRoomForm({ ...roomForm, productType: e.target.value })
              }
            />
            <TextField
              label="커튼 타입"
              value={roomForm.curtainType}
              onChange={e =>
                setRoomForm({ ...roomForm, curtainType: e.target.value })
              }
            />
            <TextField
              label="플리츠 타입"
              value={roomForm.pleatType}
              onChange={e =>
                setRoomForm({ ...roomForm, pleatType: e.target.value })
              }
            />
            <TextField
              label="제품명"
              value={roomForm.productName}
              onChange={e =>
                setRoomForm({ ...roomForm, productName: e.target.value })
              }
            />
            <TextField
              label="공급업체"
              value={roomForm.vendor}
              onChange={e =>
                setRoomForm({ ...roomForm, vendor: e.target.value })
              }
            />
            <TextField
              label="브랜드"
              value={roomForm.brand}
              onChange={e =>
                setRoomForm({ ...roomForm, brand: e.target.value })
              }
            />
            <TextField
              label="공간"
              value={roomForm.space}
              onChange={e =>
                setRoomForm({ ...roomForm, space: e.target.value })
              }
            />
            <TextField
              label="판매가"
              type="number"
              value={roomForm.salePrice}
              onChange={e =>
                setRoomForm({ ...roomForm, salePrice: e.target.value })
              }
            />
            <TextField
              label="원가"
              type="number"
              value={roomForm.cost}
              onChange={e => setRoomForm({ ...roomForm, cost: e.target.value })}
            />
            <TextField
              label="매입가"
              type="number"
              value={roomForm.purchaseCost}
              onChange={e =>
                setRoomForm({ ...roomForm, purchaseCost: e.target.value })
              }
            />
            <TextField
              label="상세사항"
              value={roomForm.details}
              onChange={e =>
                setRoomForm({ ...roomForm, details: e.target.value })
              }
              sx={{ gridColumn: '1 / -1' }}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMode(null)}>취소</Button>
          <Button variant="contained" onClick={handleSaveRoom}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 알림 */}
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.type}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TemplateManager;
