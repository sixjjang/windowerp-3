import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Button,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Person as StaffIcon,
  PersonOutline as GuestIcon,
} from '@mui/icons-material';

// 메뉴 권한 설정 인터페이스
interface MenuPermission {
  text: string;
  path: string;
  roles: string[];
}

interface SectionPermission {
  section: string;
  items: MenuPermission[];
}

// 기본 메뉴 권한 설정
const defaultMenuPermissions: SectionPermission[] = [
  {
    section: '업무 관리',
    items: [
      { text: '견적 관리', path: '/estimate', roles: ['admin', 'staff'] },
      { text: '계약 관리', path: '/contract', roles: ['admin', 'staff'] },
      { text: '주문 관리', path: '/order', roles: ['admin', 'staff'] },
      { text: '납품 관리', path: '/delivery', roles: ['admin', 'staff'] },
      { text: '스케줄', path: '/schedule', roles: ['admin', 'staff', 'guest'] },
      { text: '실측 데이터', path: '/measurement', roles: ['admin', 'staff'] },
      {
        text: '과거자료조회',
        path: '/historical',
        roles: ['admin', 'staff', 'guest'],
      },
      {
        text: '커튼 시뮬레이터',
        path: '/curtain-simulator',
        roles: ['admin', 'staff', 'guest'],
      },
    ],
  },
  {
    section: '관리',
    items: [
      { text: '고객 관리', path: '/customers', roles: ['admin', 'staff'] },
      { text: '제품 관리', path: '/products', roles: ['admin'] },
      { text: '옵션 관리', path: '/options', roles: ['admin'] },
      { text: '공식 관리', path: '/formulas', roles: ['admin'] },
      { text: '우리회사정보', path: '/company-info', roles: ['admin'] },
      { text: '거래처 관리', path: '/vendors', roles: ['admin'] },
      { text: '회계 관리', path: '/accounting', roles: ['admin'] },
      { text: '통계', path: '/statistics', roles: ['admin'] },
      { text: '세금계산서', path: '/tax-invoice', roles: ['admin'] },
      { text: '직원/사용자관리', path: '/admin/users', roles: ['admin'] },

    ],
  },
];

// 역할별 아이콘과 색상
const roleConfig = {
  admin: { icon: <AdminIcon />, color: '#f44336', label: '관리자' },
  staff: { icon: <StaffIcon />, color: '#2196f3', label: '직원' },
  guest: { icon: <GuestIcon />, color: '#4caf50', label: '손님' },
};

const MenuPermissionSettings: React.FC = () => {
  const [menuPermissions, setMenuPermissions] = useState<SectionPermission[]>(
    defaultMenuPermissions
  );
  const [savedPermissions, setSavedPermissions] = useState<SectionPermission[]>(
    defaultMenuPermissions
  );

  // 권한 변경 핸들러
  const handlePermissionChange = (
    sectionIndex: number,
    itemIndex: number,
    role: string,
    checked: boolean
  ) => {
    const newPermissions = [...menuPermissions];
    const item = newPermissions[sectionIndex].items[itemIndex];

    if (checked) {
      if (!item.roles.includes(role)) {
        item.roles.push(role);
      }
    } else {
      item.roles = item.roles.filter(r => r !== role);
    }

    setMenuPermissions(newPermissions);
  };

  // 섹션별 권한 변경 핸들러
  const handleSectionPermissionChange = (
    sectionIndex: number,
    role: string,
    checked: boolean
  ) => {
    const newPermissions = [...menuPermissions];
    const section = newPermissions[sectionIndex];

    section.items.forEach(item => {
      if (checked) {
        if (!item.roles.includes(role)) {
          item.roles.push(role);
        }
      } else {
        item.roles = item.roles.filter(r => r !== role);
      }
    });

    setMenuPermissions(newPermissions);
  };

  // 권한 저장
  const handleSave = () => {
    // 실제로는 API 호출하여 서버에 저장
    setSavedPermissions([...menuPermissions]);
    console.log('권한 설정 저장:', menuPermissions);
  };

  // 권한 초기화
  const handleReset = () => {
    setMenuPermissions([...defaultMenuPermissions]);
  };

  // 권한 미리보기
  const getRolePreview = (roles: string[]) => {
    return roles.map(role => (
      <Chip
        key={role}
        icon={roleConfig[role as keyof typeof roleConfig].icon}
        label={roleConfig[role as keyof typeof roleConfig].label}
        size="small"
        sx={{
          mr: 0.5,
          mb: 0.5,
          backgroundColor: roleConfig[role as keyof typeof roleConfig].color,
          color: 'white',
        }}
      />
    ));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
      >
        <SecurityIcon color="primary" />
        메뉴 권한 설정
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        각 메뉴별로 접근 가능한 역할을 설정할 수 있습니다. 설정 후 저장 버튼을
        클릭하세요.
      </Alert>

      {/* 역할별 설명 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(roleConfig).map(([role, config]) => (
          <Grid item xs={12} sm={4} key={role}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ color: config.color }}>{config.icon}</Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {config.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {role === 'admin' && '모든 기능 접근 가능'}
                  {role === 'staff' && '업무 관련 기능 접근 가능'}
                  {role === 'guest' && '제한된 기능만 접근 가능'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 메뉴 권한 설정 */}
      {menuPermissions.map((section, sectionIndex) => (
        <Accordion key={sectionIndex} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Typography variant="h6">{section.section}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {Object.keys(roleConfig).map(role => (
                  <FormControlLabel
                    key={role}
                    control={
                      <Checkbox
                        checked={section.items.every(item =>
                          item.roles.includes(role)
                        )}
                        indeterminate={
                          section.items.some(item =>
                            item.roles.includes(role)
                          ) &&
                          !section.items.every(item =>
                            item.roles.includes(role)
                          )
                        }
                        onChange={e =>
                          handleSectionPermissionChange(
                            sectionIndex,
                            role,
                            e.target.checked
                          )
                        }
                        size="small"
                      />
                    }
                    label={roleConfig[role as keyof typeof roleConfig].label}
                    sx={{ mr: 0 }}
                  />
                ))}
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {section.items.map((item, itemIndex) => (
                <Grid item xs={12} key={itemIndex}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.text}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {Object.keys(roleConfig).map(role => (
                            <FormControlLabel
                              key={role}
                              control={
                                <Checkbox
                                  checked={item.roles.includes(role)}
                                  onChange={e =>
                                    handlePermissionChange(
                                      sectionIndex,
                                      itemIndex,
                                      role,
                                      e.target.checked
                                    )
                                  }
                                  size="small"
                                />
                              }
                              label={
                                roleConfig[role as keyof typeof roleConfig]
                                  .label
                              }
                              sx={{ mr: 0 }}
                            />
                          ))}
                        </Box>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1 }}
                      >
                        경로: {item.path}
                      </Typography>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mr: 1 }}
                        >
                          접근 권한:
                        </Typography>
                        {getRolePreview(item.roles)}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      <Divider sx={{ my: 3 }} />

      {/* 저장/초기화 버튼 */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="outlined" onClick={handleReset} color="warning">
          초기화
        </Button>
        <Button variant="contained" onClick={handleSave} color="primary">
          권한 설정 저장
        </Button>
      </Box>

      {/* 변경사항 알림 */}
      {JSON.stringify(menuPermissions) !== JSON.stringify(savedPermissions) && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          권한 설정이 변경되었습니다. 저장 버튼을 클릭하여 변경사항을
          저장하세요.
        </Alert>
      )}
    </Box>
  );
};

export default MenuPermissionSettings;
