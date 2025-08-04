import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  MenuItem,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { API_BASE, getAuthHeaders } from '../../utils/auth';

interface CompanyInfo {
  id: number;
  type: '우리회사';
  businessNumber: string;
  name: string;
  ceo: string;
  businessType: string;
  businessItem: string;
  address: string;
  contact: string;
  phone?: string; // 핸드폰 필드 추가
  fax?: string;
  email?: string;
  // 납품지정보 필드들
  deliveryCompanyName?: string;
  deliveryContact?: string;
  deliveryAddress?: string;
  deliveryNote?: string;
}

const defaultCompanyInfo: CompanyInfo = {
  id: Date.now(),
  type: '우리회사',
  businessNumber: '',
  name: '',
  ceo: '',
  businessType: '',
  businessItem: '',
  address: '',
  contact: '',
  phone: '', // 핸드폰 기본값 추가
  fax: '',
  email: '',
  // 납품지정보 기본값
  deliveryCompanyName: '',
  deliveryContact: '',
  deliveryAddress: '',
  deliveryNote: '',
};

const CompanyInfoManagement = () => {
  const [infos, setInfos] = useState<CompanyInfo[]>([
    { ...defaultCompanyInfo },
  ]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'error',
  });
  const [tabValue, setTabValue] = useState(0);
  const [savedCompanies, setSavedCompanies] = useState<CompanyInfo[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log('CompanyInfoManagement 컴포넌트 마운트 - Firebase에서 회사 정보 로드');
    fetchCompanyInfo();
  }, []);

  // 저장된 목록 상태 변경 감지
  useEffect(() => {
    console.log('savedCompanies 상태 변경:', savedCompanies.length, '개');
  }, [savedCompanies]);

  // 자동 넘버링을 위한 회사명 생성 함수
  const generateCompanyName = (): string => {
    const existingNames = infos.map(info => info.name);

    let counter = 1;
    let newName = `우리회사${counter}`;

    while (existingNames.includes(newName)) {
      counter++;
      newName = `우리회사${counter}`;
    }

    return newName;
  };

  // 회사명 중복 체크 함수
  const isDuplicateName = (name: string, currentIndex: number): boolean => {
    return infos.some(
      (info, idx) =>
        idx !== currentIndex && info.name === name && name.trim() !== ''
    );
  };

  const fetchCompanyInfo = async () => {
    try {
      console.log('=== Firebase에서 회사 정보 불러오기 시작 ===');
      console.log('API URL:', `${API_BASE}/companyInfo`);
      console.log('전체 URL:', `${API_BASE}/companyInfo`);
      
      const response = await fetch(`${API_BASE}/companyInfo`);
      console.log('API 응답 상태:', response.status);
      console.log('API 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Firebase API 응답 데이터:', data);
        console.log('데이터 타입:', typeof data);
        console.log('배열 여부:', Array.isArray(data));
        console.log('데이터 길이:', Array.isArray(data) ? data.length : 'N/A');

        if (Array.isArray(data) && data.length > 0) {
          // API에서 받은 데이터를 프론트엔드 형식에 맞게 변환
          const formattedData = data.map((item: any) => ({
            id: item.id || Date.now(),
            type: item.type || '우리회사',
            businessNumber: item.businessNumber || '',
            name: item.name || '',
            ceo: item.ceo || '',
            businessType: item.businessType || '',
            businessItem: item.businessItem || '',
            address: item.address || '',
            contact: item.contact || '',
            phone: item.phone || '',
            fax: item.fax || '',
            email: item.email || '',
            // 납품지정보 필드들
            deliveryCompanyName: item.deliveryCompanyName || '',
            deliveryContact: item.deliveryContact || '',
            deliveryAddress: item.deliveryAddress || '',
            deliveryNote: item.deliveryNote || '',
          }));
          console.log('변환된 데이터:', formattedData);
          setInfos(formattedData);
          setSavedCompanies(formattedData); // 저장된 목록도 업데이트
          
          console.log(
            'Firebase 데이터 로드 완료 - infos:',
            formattedData.length,
            '개, savedCompanies:',
            formattedData.length,
            '개'
          );
        } else {
          console.log('Firebase에 데이터가 없음 - 기본값 설정');
          // 데이터가 없으면 기본값 설정
          setInfos([{ ...defaultCompanyInfo }]);
          setSavedCompanies([]); // 저장된 목록은 비움
        }
      } else {
        console.error('API 응답 오류:', response.status);
        setSnackbar({
          open: true,
          message: '회사 정보를 불러오는데 실패했습니다.',
          severity: 'error',
        });
        // 에러 시에도 기본값 설정
        setInfos([{ ...defaultCompanyInfo }]);
        setSavedCompanies([]);
      }
    } catch (error) {
      console.error('회사 정보 불러오기 중 오류:', error);
      setSnackbar({
        open: true,
        message: '네트워크 오류가 발생했습니다.',
        severity: 'error',
      });
      // 에러 시에도 기본값 설정
      setInfos([{ ...defaultCompanyInfo }]);
      setSavedCompanies([]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('=== Firebase 저장 시작 ===');
      console.log('저장할 데이터:', infos);

      // 필수 필드 검증
      const requiredFields = ['name', 'businessNumber', 'ceo'];
      const missingFields = infos.flatMap((info, idx) => {
        const missing = requiredFields.filter(field => !info[field as keyof CompanyInfo] || info[field as keyof CompanyInfo] === '');
        return missing.map(field => `회사 ${idx + 1}의 ${field}`);
      });

      if (missingFields.length > 0) {
        setSnackbar({
          open: true,
          message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
          severity: 'error',
        });
        return;
      }

      // 저장 전 중복 체크
      const duplicates = infos.filter((info, idx) =>
        isDuplicateName(info.name, idx)
      );
      if (duplicates.length > 0) {
        setSnackbar({
          open: true,
          message: `중복된 회사명이 있습니다: ${duplicates.map(d => d.name).join(', ')}`,
          severity: 'error',
        });
        return;
      }

      // Firestore 호환성을 위해 데이터 형식 수정
      const formattedInfos = infos.map(info => {
        const cleanInfo = {
          type: info.type,
          businessNumber: info.businessNumber || '',
          name: info.name || '',
          ceo: info.ceo || '',
          businessType: info.businessType || '',
          businessItem: info.businessItem || '',
          address: info.address || '',
          contact: info.contact || '',
          phone: info.phone || '',
          fax: info.fax || '',
          email: info.email || '',
          // 납품지정보 필드들
          deliveryCompanyName: info.deliveryCompanyName || '',
          deliveryContact: info.deliveryContact || '',
          deliveryAddress: info.deliveryAddress || '',
          deliveryNote: info.deliveryNote || ''
        };
        
        // 빈 문자열이 아닌 필드만 포함
        return Object.fromEntries(
          Object.entries(cleanInfo).filter(([key, value]) => 
            value !== '' && value !== null && value !== undefined
          )
        );
      });

      console.log('Firebase API 호출 시작:', `${API_BASE}/saveCompanyInfo`);
      console.log('전송할 데이터:', formattedInfos);
      
      const response = await fetch(`${API_BASE}/saveCompanyInfo`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formattedInfos),
      });

      console.log('Firebase 저장 응답 상태:', response.status);
      console.log('Firebase 저장 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = await response.json();
        console.log('Firebase 저장 성공 - 응답 데이터:', responseData);

        setSnackbar({
          open: true,
          message: '회사 정보가 Firebase에 성공적으로 저장되었습니다!',
          severity: 'success',
        });

        // 저장된 목록 상태 직접 업데이트
        setSavedCompanies(infos);
        console.log('저장된 목록 상태 업데이트 완료:', infos.length, '개');

        // Firebase에서 최신 데이터 다시 로드하여 확인
        console.log('Firebase에서 최신 데이터 다시 로드 중...');
        await fetchCompanyInfo();

        // 저장된 목록 탭으로 자동 이동
        setTabValue(1);
      } else {
        const errorData = await response.text();
        console.error('Firebase 저장 실패:', errorData);
        console.error('응답 상태:', response.status);
        setSnackbar({
          open: true,
          message: `Firebase 저장 실패 (${response.status}): ${errorData}`,
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Firebase 저장 중 오류:', error);
      setSnackbar({
        open: true,
        message: 'Firebase 저장 중 네트워크 오류가 발생했습니다.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    idx: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setInfos(prev =>
      prev.map((info, i) => (i === idx ? { ...info, [name]: value } : info))
    );
  };

  const handleAdd = () => {
    const newCompanyName = generateCompanyName();
    setInfos(prev => [
      ...prev,
      {
        ...defaultCompanyInfo,
        id: Date.now(),
        type: '우리회사',
        name: newCompanyName,
      },
    ]);
  };

  const handleDelete = (idx: number) => {
    setInfos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // 저장된 목록 탭으로 이동할 때 Firebase에서 최신 데이터 가져오기
    if (newValue === 1) {
      console.log('저장된 목록 탭 클릭 - Firebase에서 최신 데이터 로드');
      // 즉시 로드 시도
      fetchCompanyInfo();
      
      // 3초 후 다시 한 번 시도 (네트워크 지연 대응)
      setTimeout(() => {
        console.log('3초 후 재시도 - Firebase에서 데이터 로드');
        fetchCompanyInfo();
      }, 3000);
    }
  };

  const handleViewCompany = (company: CompanyInfo) => {
    setSelectedCompany(company);
  };

  const handleEditCompany = (company: CompanyInfo) => {
    // 편집 모드로 전환하고 해당 회사 정보를 입력 폼에 로드
    setInfos([company]);
    setTabValue(0); // 입력/수정 탭으로 이동
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 'bold' }}>
        우리 회사/타회사 정보 관리
      </Typography>

      {/* 탭 네비게이션 */}
              <Box
          sx={{
            borderBottom: 1,
            borderColor: 'rgba(255, 107, 157, 0.2)',
            mb: 3,
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '16px',
            padding: '8px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
              height: 3,
              borderRadius: 2,
            },
          }}
        >
          <Tab
            label="입력/수정"
            sx={{
              color: '#333',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#FF6B9D',
              },
            }}
          />
          <Tab
            label="저장된 목록"
            sx={{
              color: '#333',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#FF6B9D',
              },
            }}
          />
        </Tabs>
      </Box>

      {/* 입력/수정 탭 */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            회사 추가 시 자동으로 넘버링된 이름이 생성되며, 직접 수정
            가능합니다.
          </Typography>
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              우리회사 추가
            </Button>
          </Box>
          {infos.map((info, idx) => (
            <Paper key={info.id} sx={{ p: 3, mb: 3, position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <IconButton onClick={() => handleDelete(idx)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="구분"
                    value="우리회사"
                    fullWidth
                    size="small"
                    disabled
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#FF6B9D',
                        fontWeight: 600,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="사업자등록번호"
                    name="businessNumber"
                    value={info.businessNumber}
                    onChange={e => handleChange(idx, e)}
                    fullWidth
                    size="small"
                    placeholder="000-00-00000"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="회사명"
                    name="name"
                    value={info.name}
                    onChange={e => handleChange(idx, e)}
                    fullWidth
                    size="small"
                    error={isDuplicateName(info.name, idx)}
                    helperText={
                      isDuplicateName(info.name, idx)
                        ? '중복된 회사명입니다'
                        : ''
                    }
                    placeholder="직접 입력하거나 자동 생성된 이름 사용"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="대표자"
                    name="ceo"
                    value={info.ceo}
                    onChange={e => handleChange(idx, e)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="업태"
                    name="businessType"
                    value={info.businessType}
                    onChange={e => handleChange(idx, e)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="업종"
                    name="businessItem"
                    value={info.businessItem}
                    onChange={e => handleChange(idx, e)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="사업장 주소"
                    name="address"
                    value={info.address}
                    onChange={e => handleChange(idx, e)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="연락처"
                    name="contact"
                    value={info.contact}
                    onChange={e => handleChange(idx, e)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="핸드폰"
                    name="phone"
                    value={info.phone || ''}
                    onChange={e => handleChange(idx, e)}
                    fullWidth
                    size="small"
                    placeholder="010-0000-0000"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="팩스"
                    name="fax"
                    value={info.fax}
                    onChange={e => handleChange(idx, e)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="이메일"
                    name="email"
                    value={info.email}
                    onChange={e => handleChange(idx, e)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* 납품지정보 섹션 */}
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#FF6B9D', fontWeight: 'bold' }}>
                  납품지정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="상호"
                      name="deliveryCompanyName"
                      value={info.deliveryCompanyName || ''}
                      onChange={e => handleChange(idx, e)}
                      fullWidth
                      size="small"
                      placeholder="납품받을 상호명"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="연락처"
                      name="deliveryContact"
                      value={info.deliveryContact || ''}
                      onChange={e => handleChange(idx, e)}
                      fullWidth
                      size="small"
                      placeholder="납품지 연락처"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="납품받을 주소"
                      name="deliveryAddress"
                      value={info.deliveryAddress || ''}
                      onChange={e => handleChange(idx, e)}
                      fullWidth
                      size="small"
                      placeholder="납품받을 주소를 입력하세요"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="비고"
                      name="deliveryNote"
                      value={info.deliveryNote || ''}
                      onChange={e => handleChange(idx, e)}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      placeholder="납품지 관련 비고사항을 입력하세요"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          ))}
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSaving ? 'Firebase에 저장 중...' : '저장'}
          </Button>
        </Box>
      )}

      {/* 저장된 목록 탭 */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#333', fontWeight: 'bold' }}>
              저장된 회사 정보 목록 ({savedCompanies.length}개)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                console.log('수동 새로고침 버튼 클릭');
                fetchCompanyInfo();
              }}
              sx={{
                color: '#FF6B9D',
                borderColor: '#FF6B9D',
                '&:hover': {
                  borderColor: '#FF4757',
                  backgroundColor: 'rgba(255, 107, 157, 0.1)',
                },
              }}
            >
              새로고침
            </Button>
          </Box>
          {savedCompanies.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                저장된 회사 정보가 없습니다. 입력/수정 탭에서 회사 정보를
                추가해주세요.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {savedCompanies.map(company => (
                <Grid item xs={12} md={6} lg={4} key={company.id}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #3A3A3A 0%, #4A4A4A 100%)',
                      borderRadius: 20,
                      boxShadow: '0 4px 20px rgba(255, 107, 157, 0.15)',
                      border: '1px solid rgba(255, 107, 157, 0.1)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 12px 40px rgba(255, 107, 157, 0.35)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Chip
                          label={company.type}
                          color={
                            company.type === '우리회사'
                              ? 'primary'
                              : 'secondary'
                          }
                          size="small"
                          sx={{
                            background:
                              company.type === '우리회사'
                                ? 'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)'
                                : 'linear-gradient(135deg, #FFB3D1 0%, #FF6B7A 100%)',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '20px',
                          }}
                        />
                        <Typography
                          variant="h6"
                          component="div"
                          sx={{
                            fontWeight: 700,
                            background:
                              'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {company.name}
                        </Typography>
                      </Box>
                      <Typography
                        color="rgba(255, 255, 255, 0.8)"
                        gutterBottom
                        sx={{ fontWeight: 500 }}
                      >
                        대표자: {company.ceo || '미입력'}
                      </Typography>
                      <Typography
                        color="rgba(255, 255, 255, 0.7)"
                        sx={{ fontSize: '0.875rem', mb: 1 }}
                      >
                        사업자번호: {company.businessNumber || '미입력'}
                      </Typography>
                      <Typography
                        color="rgba(255, 255, 255, 0.7)"
                        sx={{ fontSize: '0.875rem', mb: 1 }}
                      >
                        연락처: {company.contact || '미입력'}
                      </Typography>
                      <Typography
                        color="rgba(255, 255, 255, 0.7)"
                        sx={{ fontSize: '0.875rem', mb: 1 }}
                      >
                        핸드폰: {company.phone || '미입력'}
                      </Typography>
                      <Typography
                        color="rgba(255, 255, 255, 0.7)"
                        sx={{
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        주소: {company.address || '미입력'}
                      </Typography>
                      <Typography
                        color="rgba(255, 255, 255, 0.7)"
                        sx={{
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        이메일: {company.email || '미입력'}
                      </Typography>
                      {/* 납품지정보 표시 */}
                      {company.deliveryCompanyName && (
                        <Typography
                          color="rgba(255, 255, 255, 0.7)"
                          sx={{
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mt: 1,
                            pt: 1,
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          납품지: {company.deliveryCompanyName}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewCompany(company)}
                        sx={{
                          background: 'rgba(255, 107, 157, 0.1)',
                          color: '#FF6B9D',
                          border: '1px solid rgba(255, 107, 157, 0.3)',
                          borderRadius: '8px',
                          '&:hover': {
                            background: 'rgba(255, 107, 157, 0.2)',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        상세보기
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditCompany(company)}
                        sx={{
                          background:
                            'linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)',
                          color: 'white',
                          borderRadius: '8px',
                          '&:hover': {
                            background:
                              'linear-gradient(135deg, #FFB3D1 0%, #FF6B7A 100%)',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        수정
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* 회사 정보 상세보기 모달 */}
      {selectedCompany && (
        <Paper
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            p: 3,
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: '#333', fontWeight: 'bold' }}>회사 정보 상세보기</Typography>
            <IconButton onClick={() => setSelectedCompany(null)} sx={{ color: '#333' }}>×</IconButton>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#333' }}>
                <strong>구분:</strong> {selectedCompany.type}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#333' }}>
                <strong>회사명:</strong> {selectedCompany.name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>사업자등록번호:</strong>{' '}
                {selectedCompany.businessNumber || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>대표자:</strong> {selectedCompany.ceo || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>업태:</strong>{' '}
                {selectedCompany.businessType || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>업종:</strong>{' '}
                {selectedCompany.businessItem || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>주소:</strong> {selectedCompany.address || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>연락처:</strong> {selectedCompany.contact || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>핸드폰:</strong> {selectedCompany.phone || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>팩스:</strong> {selectedCompany.fax || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>이메일:</strong> {selectedCompany.email || '미입력'}
              </Typography>
            </Grid>
          </Grid>

          {/* 납품지정보 섹션 */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" sx={{ mb: 2, color: '#FF6B9D', fontWeight: 'bold' }}>
            납품지정보
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>상호:</strong> {selectedCompany.deliveryCompanyName || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>연락처:</strong> {selectedCompany.deliveryContact || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>납품받을 주소:</strong> {selectedCompany.deliveryAddress || '미입력'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom sx={{ color: '#333' }}>
                <strong>비고:</strong> {selectedCompany.deliveryNote || '미입력'}
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={() => handleEditCompany(selectedCompany)}
            >
              수정하기
            </Button>
            <Button variant="outlined" onClick={() => setSelectedCompany(null)}>
              닫기
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyInfoManagement;
