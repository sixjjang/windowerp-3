import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  Upload as UploadIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import MenuPermissionSettings from '../../components/MenuPermissionSettings';
// import ChatTargetSettings from '../../components/ChatTargetSettings';
import { API_BASE } from '../../utils/auth';
import {
  downloadEstimates,
  downloadContracts,
  downloadOrders,
  downloadDeliveries,
  downloadCustomers,
  downloadProducts,
  downloadOptions,
  downloadVendors,
  downloadSchedules,
  downloadMeasurements,
  downloadAllData,
  uploadAndRestore,
  getDataStatus
} from '../../utils/backupUtils';

interface User {
  id: number;
  username: string;
  role: string;
  isApproved: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  accountNumber?: string;
}

// 역할 정의 및 설명
const ROLES = {
  admin: { label: '관리자', description: '모든 기능 접근 가능' },
  staff: { label: '직원', description: '업무 관련 기능 접근 가능' },
  guest: { label: '손님', description: '제한된 기능만 접근 가능' }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// 전역 사용자 목록 상태 관리
let globalFetchUsers: (() => Promise<void>) | null = null;

export const setGlobalFetchUsers = (fetchFn: () => Promise<void>) => {
  globalFetchUsers = fetchFn;
};

export const refreshUserList = async () => {
  if (globalFetchUsers) {
    await globalFetchUsers();
  }
};

const AdminUserManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    name: '', 
    role: 'staff',
    email: '',
    phone: '',
    address: '',
    accountNumber: ''
  });
  const [registerMsg, setRegisterMsg] = useState('');
  
  // 백업 관련 상태
  const [dataStatus, setDataStatus] = useState(getDataStatus());
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err: any) {
      setError('사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // 전역 함수로 등록
    setGlobalFetchUsers(fetchUsers);
    
    // 전역 이벤트 리스너 추가
    const handleRefreshUserList = () => {
      fetchUsers();
    };
    
    window.addEventListener('refreshUserList', handleRefreshUserList);
    
    // 클린업
    return () => {
      window.removeEventListener('refreshUserList', handleRefreshUserList);
    };
  }, []);

  // 직원 등록
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/registerUser`, newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegisterMsg('직원 등록 성공!');
      setNewUser({ username: '', password: '', name: '', role: 'staff', email: '', phone: '', address: '', accountNumber: '' });
      fetchUsers();
    } catch (err: any) {
      setRegisterMsg('직원 등록 실패: ' + (err.response?.data || err.message));
    }
  };

  // 직원 삭제
  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch {}
  };

  // 직원 승인
  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/users/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch {}
  };

  // 권한 변경
  const handleRoleChange = async (id: number, role: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/users/${id}/role`, { role }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch {}
  };

  // 백업 관련 함수들
  const handleIndividualDownload = (downloadFunction: () => boolean, dataName: string) => {
    setBackupLoading(true);
    setBackupMessage(null);
    
    setTimeout(() => {
      const success = downloadFunction();
      setBackupLoading(false);
      if (success) {
        setBackupMessage({ type: 'success', text: `${dataName} 다운로드가 완료되었습니다.` });
      } else {
        setBackupMessage({ type: 'error', text: `${dataName} 다운로드에 실패했습니다.` });
      }
    }, 100);
  };

  const handleAllDataDownload = () => {
    setBackupLoading(true);
    setBackupMessage(null);
    
    setTimeout(() => {
      const success = downloadAllData();
      setBackupLoading(false);
      if (success) {
        setBackupMessage({ type: 'success', text: '전체 데이터 백업이 완료되었습니다.' });
      } else {
        setBackupMessage({ type: 'error', text: '전체 데이터 백업에 실패했습니다.' });
      }
    }, 100);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setBackupMessage(null);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      setBackupMessage({ type: 'error', text: '복구할 파일을 선택해주세요.' });
      return;
    }

    if (!window.confirm('기존 데이터가 모두 덮어쓰여집니다. 정말 복구하시겠습니까?')) {
      return;
    }

    setRestoreLoading(true);
    setBackupMessage(null);

    try {
      const result = await uploadAndRestore(selectedFile);
      setRestoreLoading(false);
      
      if (result.success) {
        setBackupMessage({ type: 'success', text: result.message });
        setDataStatus(getDataStatus()); // 상태 업데이트
        setSelectedFile(null);
        // 파일 입력 초기화
        const fileInput = document.getElementById('restore-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setBackupMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setRestoreLoading(false);
      setBackupMessage({ type: 'error', text: '복구 중 오류가 발생했습니다.' });
    }
  };

  const refreshDataStatus = () => {
    setDataStatus(getDataStatus());
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="관리자 탭">
          <Tab label="직원/사용자 관리" />
          <Tab label="메뉴 권한 설정" />
          <Tab label="데이터 백업/복구" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <div style={{ padding: 0 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 24 }}>직원/사용자 관리</h2>
          <form onSubmit={handleRegister} style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="text"
              placeholder="아이디 *"
              value={newUser.username}
              onChange={e => setNewUser({ ...newUser, username: e.target.value })}
              required
              style={{ fontSize: '1rem', height: 36, padding: '0 8px', minWidth: 120, textAlign: 'center' }}
            />
            <input
              type="password"
              placeholder="비밀번호 *"
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              required
              style={{ fontSize: '1rem', height: 36, padding: '0 8px', minWidth: 120, textAlign: 'center' }}
            />
            <input
              type="text"
              placeholder="이름 *"
              value={newUser.name}
              onChange={e => setNewUser({ ...newUser, name: e.target.value })}
              required
              style={{ fontSize: '1rem', height: 36, padding: '0 8px', minWidth: 120, textAlign: 'center' }}
            />
            <input
              type="email"
              placeholder="이메일"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              style={{ fontSize: '1rem', height: 36, padding: '0 8px', minWidth: 150, textAlign: 'center' }}
            />
            <input
              type="text"
              placeholder="전화번호"
              value={newUser.phone}
              onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
              style={{ fontSize: '1rem', height: 36, padding: '0 8px', minWidth: 120, textAlign: 'center' }}
            />
            <input
              type="text"
              placeholder="주소"
              value={newUser.address}
              onChange={e => setNewUser({ ...newUser, address: e.target.value })}
              style={{ fontSize: '1rem', height: 36, padding: '0 8px', minWidth: 200, textAlign: 'center' }}
            />
            <input
              type="text"
              placeholder="계좌번호"
              value={newUser.accountNumber}
              onChange={e => setNewUser({ ...newUser, accountNumber: e.target.value })}
              style={{ fontSize: '1rem', height: 36, padding: '0 8px', minWidth: 150, textAlign: 'center' }}
            />
            <select
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}
              style={{ fontSize: '1rem', height: 36, padding: '0 8px', minWidth: 160, textAlign: 'center' }}
            >
              <option value="admin">관리자 - 모든 기능 접근</option>
              <option value="staff">직원 - 업무 기능 접근</option>
              <option value="guest">손님 - 제한된 기능만</option>
            </select>
            <button type="submit" style={{ fontSize: '1rem', height: 36, padding: '0 16px' }}>직원 등록</button>
            {registerMsg && <span style={{ marginLeft: 8, color: registerMsg.includes('성공') ? 'green' : 'red' }}>{registerMsg}</span>}
          </form>
          {loading && <div style={{ textAlign: 'center' }}>로딩 중...</div>}
          {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                <th style={{ textAlign: 'center', width: 40 }}>ID</th>
                <th style={{ textAlign: 'center', width: 120 }}>아이디</th>
                <th style={{ textAlign: 'center', width: 100 }}>이름</th>
                <th style={{ textAlign: 'center', width: 150 }}>이메일</th>
                <th style={{ textAlign: 'center', width: 120 }}>전화번호</th>
                <th style={{ textAlign: 'center', width: 150 }}>주소</th>
                <th style={{ textAlign: 'center', width: 120 }}>계좌번호</th>
                <th style={{ textAlign: 'center', width: 120 }}>역할</th>
                <th style={{ textAlign: 'center', width: 80 }}>승인여부</th>
                <th style={{ textAlign: 'center', width: 120 }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ textAlign: 'center' }}>{user.id}</td>
                  <td style={{ textAlign: 'center' }}>{user.username}</td>
                  <td style={{ textAlign: 'center' }}>{user.name || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{user.email || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{user.phone || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{user.address || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{user.accountNumber || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <select value={user.role} onChange={e => handleRoleChange(user.id, e.target.value)} style={{ fontSize: '1rem', height: 32, padding: '0 8px', minWidth: 100, textAlign: 'center' }}>
                      <option value="admin">관리자</option>
                      <option value="staff">직원</option>
                      <option value="guest">손님</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>{user.isApproved === 1 ? '승인' : '대기'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {user.isApproved !== 1 && (
                      <button onClick={() => handleApprove(user.id)} style={{ fontSize: '1rem', height: 32, padding: '0 12px' }}>승인</button>
                    )}
                    <button onClick={() => handleDelete(user.id)} style={{ marginLeft: 8, fontSize: '1rem', height: 32, padding: '0 12px' }}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <MenuPermissionSettings />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BackupIcon /> 데이터 백업/복구
          </Typography>
          
          {backupMessage && (
            <Alert 
              severity={backupMessage.type} 
              sx={{ mb: 2 }}
              onClose={() => setBackupMessage(null)}
            >
              {backupMessage.text}
            </Alert>
          )}

          {/* 데이터 상태 표시 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon /> 현재 데이터 상태
                <Button 
                  size="small" 
                  onClick={refreshDataStatus}
                  sx={{ ml: 'auto' }}
                >
                  새로고침
                </Button>
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Chip label={`견적서: ${dataStatus.estimates}개`} color="primary" variant="outlined" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip label={`계약서: ${dataStatus.contracts}개`} color="primary" variant="outlined" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip label={`주문서: ${dataStatus.orders}개`} color="primary" variant="outlined" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip label={`납품관리: ${dataStatus.deliveries}개`} color="primary" variant="outlined" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip label={`고객: ${dataStatus.customers}개`} color="secondary" variant="outlined" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip label={`제품: ${dataStatus.products}개`} color="secondary" variant="outlined" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip label={`옵션: ${dataStatus.options}개`} color="secondary" variant="outlined" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip label={`거래처: ${dataStatus.vendors}개`} color="secondary" variant="outlined" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip label={`스케줄: ${dataStatus.schedules}개`} color="info" variant="outlined" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Chip label={`실측데이터: ${dataStatus.measurements}개`} color="info" variant="outlined" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 개별 다운로드 */}
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon /> 개별 데이터 다운로드
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">견적서</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataStatus.estimates}개의 견적서 데이터
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleIndividualDownload(downloadEstimates, '견적서')}
                    disabled={backupLoading || dataStatus.estimates === 0}
                  >
                    다운로드
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">계약서</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataStatus.contracts}개의 계약서 데이터
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleIndividualDownload(downloadContracts, '계약서')}
                    disabled={backupLoading || dataStatus.contracts === 0}
                  >
                    다운로드
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">주문서</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataStatus.orders}개의 주문서 데이터
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleIndividualDownload(downloadOrders, '주문서')}
                    disabled={backupLoading || dataStatus.orders === 0}
                  >
                    다운로드
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">납품관리</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataStatus.deliveries}개의 납품관리 데이터
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleIndividualDownload(downloadDeliveries, '납품관리')}
                    disabled={backupLoading || dataStatus.deliveries === 0}
                  >
                    다운로드
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">고객리스트</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataStatus.customers}개의 고객 데이터
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleIndividualDownload(downloadCustomers, '고객리스트')}
                    disabled={backupLoading || dataStatus.customers === 0}
                  >
                    다운로드
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">제품리스트</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataStatus.products}개의 제품 데이터
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleIndividualDownload(downloadProducts, '제품리스트')}
                    disabled={backupLoading || dataStatus.products === 0}
                  >
                    다운로드
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">옵션리스트</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataStatus.options}개의 옵션 데이터
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleIndividualDownload(downloadOptions, '옵션리스트')}
                    disabled={backupLoading || dataStatus.options === 0}
                  >
                    다운로드
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">거래처리스트</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataStatus.vendors}개의 거래처 데이터
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleIndividualDownload(downloadVendors, '거래처리스트')}
                    disabled={backupLoading || dataStatus.vendors === 0}
                  >
                    다운로드
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">스케줄내역</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataStatus.schedules}개의 스케줄 데이터
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleIndividualDownload(downloadSchedules, '스케줄내역')}
                    disabled={backupLoading || dataStatus.schedules === 0}
                  >
                    다운로드
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">실측데이터</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataStatus.measurements}개의 실측 데이터
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleIndividualDownload(downloadMeasurements, '실측데이터')}
                    disabled={backupLoading || dataStatus.measurements === 0}
                  >
                    다운로드
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* 일괄 다운로드 */}
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BackupIcon /> 일괄 백업 다운로드
          </Typography>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body1" gutterBottom>
                모든 데이터를 하나의 Excel 파일로 다운로드합니다.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={backupLoading ? <CircularProgress size={20} /> : <BackupIcon />}
                onClick={handleAllDataDownload}
                disabled={backupLoading}
                sx={{ mt: 1 }}
              >
                {backupLoading ? '다운로드 중...' : '전체 데이터 백업'}
              </Button>
            </CardContent>
          </Card>

          <Divider sx={{ my: 3 }} />

          {/* 데이터 복구 */}
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RestoreIcon /> 데이터 복구
          </Typography>
          <Card>
            <CardContent>
              <Typography variant="body1" gutterBottom>
                백업 파일을 업로드하여 데이터를 복구합니다. 기존 데이터는 덮어쓰여집니다.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <input
                  id="restore-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Button 
                  variant="outlined" 
                  startIcon={<UploadIcon />}
                  onClick={() => document.getElementById('restore-file-input')?.click()}
                  disabled={restoreLoading}
                >
                  파일 선택
                </Button>
                {selectedFile && (
                  <Typography variant="body2" color="text.secondary">
                    선택된 파일: {selectedFile.name}
                  </Typography>
                )}
                <Button 
                  variant="contained" 
                  color="warning"
                  startIcon={restoreLoading ? <CircularProgress size={20} /> : <RestoreIcon />}
                  onClick={handleRestore}
                  disabled={!selectedFile || restoreLoading}
                >
                  {restoreLoading ? '복구 중...' : '데이터 복구'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>
    </Box>
  );
};

export default AdminUserManagement; 