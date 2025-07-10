import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Description as DescriptionIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';

interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  description?: string;
  customerName?: string;
  address?: string;
  contact?: string;
  priority: string;
  status: string;
  color?: string;
  constructionWorker?: string;
  constructionWorkerPhone?: string;
  vehicleNumber?: string;
}

interface ScheduleDetailModalProps {
  open: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
}

const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  open,
  onClose,
  event,
}) => {
  if (!event) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#FF4757';
      case 'medium':
        return '#FFA502';
      case 'low':
        return '#2ED573';
      default:
        return '#FF6B9D';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#2ED573';
      case 'in_progress':
        return '#FFA502';
      case 'pending':
        return '#FF6B9D';
      default:
        return '#FF6B9D';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: '#23232a',
          borderRadius: 3,
          border: '1px solid rgba(255, 107, 157, 0.2)',
          color: 'white',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
              width: 40,
              height: 40,
            }}
          >
            <ScheduleIcon />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            일정 상세보기
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { color: '#FF6B9D' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'white',
              mb: 1,
            }}
          >
            {event.title}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={event.type}
              size="small"
              sx={{
                background: event.color || 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                color: 'white',
                fontWeight: 600,
              }}
            />
            <Chip
              label={`우선순위: ${event.priority}`}
              size="small"
              sx={{
                background: getPriorityColor(event.priority),
                color: 'white',
                fontWeight: 600,
              }}
            />
            <Chip
              label={`상태: ${event.status}`}
              size="small"
              sx={{
                background: getStatusColor(event.status),
                color: 'white',
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 107, 157, 0.2)', mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 날짜 및 시간 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ScheduleIcon sx={{ color: '#FF6B9D', fontSize: 20 }} />
            <Box>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                날짜
              </Typography>
              <Typography sx={{ color: 'white', fontWeight: 500 }}>
                {new Date(event.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </Typography>
            </Box>
          </Box>

          {event.time && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ScheduleIcon sx={{ color: '#FF6B9D', fontSize: 20 }} />
              <Box>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  시간
                </Typography>
                <Typography sx={{ color: 'white', fontWeight: 500 }}>
                  {event.time}
                </Typography>
              </Box>
            </Box>
          )}

          {/* 고객명 */}
          {event.customerName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ color: '#FF6B9D', fontSize: 20 }} />
              <Box>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  고객명
                </Typography>
                <Typography sx={{ color: 'white', fontWeight: 500 }}>
                  {event.customerName}
                </Typography>
              </Box>
            </Box>
          )}

          {/* 시공자명 */}
          {event.constructionWorker && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ color: '#40c4ff', fontSize: 20 }} />
              <Box>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  시공자명
                </Typography>
                <Typography sx={{ color: 'white', fontWeight: 500 }}>
                  {event.constructionWorker}
                </Typography>
              </Box>
            </Box>
          )}
          {/* 시공자 전화번호 */}
          {event.constructionWorkerPhone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PhoneIcon sx={{ color: '#40c4ff', fontSize: 20 }} />
              <Box>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  시공자 전화번호
                </Typography>
                <Typography sx={{ color: 'white', fontWeight: 500 }}>
                  {event.constructionWorkerPhone}
                </Typography>
              </Box>
            </Box>
          )}
          {/* 차량번호 */}
          {event.vehicleNumber && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DescriptionIcon sx={{ color: '#40c4ff', fontSize: 20 }} />
              <Box>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  차량번호
                </Typography>
                <Typography sx={{ color: 'white', fontWeight: 500 }}>
                  {event.vehicleNumber}
                </Typography>
              </Box>
            </Box>
          )}

          {/* 주소 */}
          {event.address && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocationIcon sx={{ color: '#FF6B9D', fontSize: 20 }} />
              <Box>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  주소
                </Typography>
                <Typography sx={{ color: 'white', fontWeight: 500 }}>
                  {event.address}
                </Typography>
              </Box>
            </Box>
          )}

          {/* 연락처 */}
          {event.contact && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PhoneIcon sx={{ color: '#FF6B9D', fontSize: 20 }} />
              <Box>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  연락처
                </Typography>
                <Typography sx={{ color: 'white', fontWeight: 500 }}>
                  {event.contact}
                </Typography>
              </Box>
            </Box>
          )}

          {/* 설명 */}
          {event.description && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <DescriptionIcon sx={{ color: '#FF6B9D', fontSize: 20, mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', mb: 0.5 }}>
                  상세 설명
                </Typography>
                <Typography
                  sx={{
                    color: 'white',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {event.description}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 107, 157, 0.3)',
            color: '#FF6B9D',
            '&:hover': {
              borderColor: '#FF6B9D',
              background: 'rgba(255, 107, 157, 0.1)',
            },
          }}
        >
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleDetailModal; 