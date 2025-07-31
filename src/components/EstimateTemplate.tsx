import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  TextField,
  Divider,
  Card,
  CardMedia,
} from '@mui/material';
import {
  Print as PrintIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { Estimate, EstimateRow, OptionItem } from '../types';
import { getCurrentUser } from '../utils/auth';

interface EstimateTemplateProps {
  estimate: Estimate;
  onClose: () => void;
  discountAmount: number;
  open: boolean;
}

// 출력 항목 정의
const OUTPUT_FIELDS = [
  { key: 'brand', label: '브랜드' },
  { key: 'space', label: '공간' },
  { key: 'productCode', label: '제품코드' },
  { key: 'productType', label: '제품종류' },
  { key: 'productName', label: '제품명' },
  { key: 'width', label: '폭' },
  { key: 'details', label: '세부내용' },
  { key: 'widthMM', label: '가로' },
  { key: 'heightMM', label: '세로' },
  { key: 'area', label: '면적' },
  { key: 'lineDir', label: '줄방향' },
  { key: 'lineLen', label: '줄길이' },
  { key: 'pleatAmount', label: '주름양' },
  { key: 'widthCount', label: '폭수' },
  { key: 'quantity', label: '수량' },
  { key: 'totalPrice', label: '판매금액' },
];

// 기본 템플릿 설정
const DEFAULT_TEMPLATES = {
  template1: {
    name: '기본 템플릿',
    fields: ['productName', 'quantity', 'totalPrice'],
    showHeader: true,
    showCustomerInfo: true,
    showCompanyInfo: true,
    showFooter: true,
    showStamp: true,
  },
  template2: {
    name: '상세 템플릿',
    fields: [
      'brand',
      'productCode',
      'productName',
      'width',
      'details',
      'quantity',
      'totalPrice',
    ],
    showHeader: true,
    showCustomerInfo: true,
    showCompanyInfo: true,
    showFooter: true,
    showStamp: true,
  },
  template3: {
    name: '전체 템플릿',
    fields: OUTPUT_FIELDS.map(f => f.key),
    showHeader: true,
    showCustomerInfo: true,
    showCompanyInfo: true,
    showFooter: true,
    showStamp: true,
  },
};

// 기본 회사 정보
const DEFAULT_COMPANY_INFO = {
  name: localStorage.getItem('companyName') || '[회사명]',
  address: localStorage.getItem('companyAddress') || '[회사주소]',
  phone: localStorage.getItem('companyPhone') || '[전화번호]',
  email: localStorage.getItem('companyEmail') || '[이메일]',
};

// 기본 안내 문구
const DEFAULT_NOTICE_TEXT = `• 본 견적서는 발행일로부터 30일간 유효합니다.
• 견적서에 명시되지 않은 추가 작업은 별도 견적이 필요합니다.
• 설치 및 배송 조건은 별도 협의하시기 바랍니다.
• 문의사항이 있으시면 언제든 연락주시기 바랍니다.`;

// 공간별 톤다운 파스텔 컬러 팔레트
const SPACE_COLORS: { [space: string]: string } = {
  거실: '#e3e7ef',
  안방: '#e7ece7',
  드레스룸: '#f0e7e7',
  중간방: '#e7f0ef',
  끝방: '#f0efe7',
  주방: '#e7eef0',
  기타: '#ececec',
  '': '#f7f7f7',
};
const SPACE_COLOR_LIST = Object.values(SPACE_COLORS);
function getSpaceColor(space: string, lightness = 1) {
  // 없는 공간명은 색상 순환
  const keys = Object.keys(SPACE_COLORS);
  let idx = keys.indexOf(space);
  if (idx === -1)
    idx =
      Math.abs(space.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
      SPACE_COLOR_LIST.length;
  let color = SPACE_COLOR_LIST[idx];
  // 밝기 조정 (옵션행용)
  if (lightness !== 1) {
    // hex to rgb
    const rgb = color.match(/\w\w/g)?.map(x => parseInt(x, 16)) || [
      240, 240, 240,
    ];
    const newRgb = rgb.map(v => Math.round(v + (255 - v) * (lightness - 1)));
    color = `rgb(${newRgb.join(',')})`;
  }
  return color;
}

// 템플릿 설정 모달 컴포넌트
const TemplateSettingsModal: React.FC<{
  open: boolean;
  onClose: () => void;
  currentTemplate: any;
  onSave: (template: any) => void;
}> = ({ open, onClose, currentTemplate, onSave }) => {
  const [template, setTemplate] = useState(currentTemplate);
  const [companyInfo, setCompanyInfo] = useState(() => {
    const saved = localStorage.getItem('estimateCompanyInfo');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_INFO;
  });
  const [noticeText, setNoticeText] = useState(() => {
    const saved = localStorage.getItem('estimateNoticeText');
    return saved || DEFAULT_NOTICE_TEXT;
  });
  const [activeTab, setActiveTab] = useState(0);
  const [savedCompanies, setSavedCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [stampImage, setStampImage] = useState<string | null>(() => {
    const saved = localStorage.getItem('estimateStampImage');
    return saved || null;
  });
  const [stampImageFile, setStampImageFile] = useState<File | null>(null);

  useEffect(() => {
    setTemplate(currentTemplate);
  }, [currentTemplate]);

  // 저장된 회사 정보 불러오기
  useEffect(() => {
    const loadSavedCompanies = async () => {
      try {
        console.log('견적서 템플릿에서 회사 정보 로드 시작');
        
        // Firebase에서 회사 정보 가져오기
        const API_BASE = 'https://us-central1-windowerp-3.cloudfunctions.net';
        const response = await fetch(`${API_BASE}/companyInfo`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Firebase에서 회사 정보 로드 완료:', data);
          
          if (Array.isArray(data)) {
            // 우리회사 타입만 필터링
            const ourCompanies = data.filter((company: any) => company.type === '우리회사');
            setSavedCompanies(ourCompanies);
            console.log('우리회사 정보 필터링 완료:', ourCompanies.length, '개');
            
            // 현재 선택된 회사 ID 찾기
            if (ourCompanies.length > 0) {
              const currentCompany = ourCompanies.find((company: any) => 
                company.name === companyInfo.name && 
                company.address === companyInfo.address
              );
              if (currentCompany) {
                setSelectedCompanyId(currentCompany.id);
                console.log('현재 회사 정보와 일치하는 회사 찾음:', currentCompany.name);
              } else {
                setSelectedCompanyId(ourCompanies[0].id);
                console.log('첫 번째 회사 정보로 설정:', ourCompanies[0].name);
              }
            }
          }
        } else {
          console.error('Firebase API 응답 오류:', response.status);
          // Firebase 실패 시 localStorage에서 로드 (fallback)
          const saved = localStorage.getItem('companyInfo');
          if (saved) {
            const companies = JSON.parse(saved);
            if (Array.isArray(companies)) {
              const ourCompanies = companies.filter((company: any) => company.type === '우리회사');
              setSavedCompanies(ourCompanies);
            }
          }
        }
      } catch (error) {
        console.error('회사 정보 로드 중 오류:', error);
        // 에러 시 localStorage에서 로드 (fallback)
        try {
          const saved = localStorage.getItem('companyInfo');
          if (saved) {
            const companies = JSON.parse(saved);
            if (Array.isArray(companies)) {
              const ourCompanies = companies.filter((company: any) => company.type === '우리회사');
              setSavedCompanies(ourCompanies);
            }
          }
        } catch (localError) {
          console.error('localStorage 로드도 실패:', localError);
        }
      }
    };

    if (open) {
      loadSavedCompanies();
    }
  }, [open, companyInfo.name, companyInfo.address]);

  const handleFieldToggle = (fieldKey: string) => {
    const newFields = template.fields.includes(fieldKey)
      ? template.fields.filter((f: string) => f !== fieldKey)
      : [...template.fields, fieldKey];
    setTemplate({ ...template, fields: newFields });
  };

  // 회사 선택 핸들러
  const handleCompanySelect = (companyId: number) => {
    setSelectedCompanyId(companyId);
    const selectedCompany = savedCompanies.find(company => company.id === companyId);
    if (selectedCompany) {
      setCompanyInfo({
        name: selectedCompany.name,
        address: selectedCompany.address,
        phone: selectedCompany.contact,
        email: selectedCompany.email || ''
      });
    }
  };

  const handleSave = () => {
    // 템플릿 저장
    onSave(template);

    // 회사 정보 저장
    localStorage.setItem('estimateCompanyInfo', JSON.stringify(companyInfo));
    localStorage.setItem('companyName', companyInfo.name);
    localStorage.setItem('companyAddress', companyInfo.address);
    localStorage.setItem('companyPhone', companyInfo.phone);
    localStorage.setItem('companyEmail', companyInfo.email);

    // 안내 문구 저장
    localStorage.setItem('estimateNoticeText', noticeText);

    // 도장 표시 설정 저장
    localStorage.setItem('estimateShowStamp', JSON.stringify(template.showStamp));

    // 도장 이미지 저장
    if (stampImage) {
      localStorage.setItem('estimateStampImage', stampImage);
    }

    onClose();
  };

  // 도장 이미지 업로드 핸들러
  const handleStampImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB 이하)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setStampImage(result);
        setStampImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  // 도장 이미지 삭제 핸들러
  const handleStampImageDelete = () => {
    setStampImage(null);
    setStampImageFile(null);
    localStorage.removeItem('estimateStampImage');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>템플릿 설정</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
          >
            <Tab label="템플릿 설정" />
            <Tab label="회사 정보" />
            <Tab label="도장 설정" />
            <Tab label="안내 문구" />
          </Tabs>
        </Box>

        {/* 템플릿 설정 탭 */}
        {activeTab === 0 && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                템플릿 이름
              </Typography>
              <input
                type="text"
                value={template.name}
                onChange={e =>
                  setTemplate({ ...template, name: e.target.value })
                }
                style={{ width: '100%', padding: '8px', fontSize: '16px' }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                출력할 항목 선택
              </Typography>
              <Grid container spacing={2}>
                {OUTPUT_FIELDS.map(field => (
                  <Grid item xs={6} key={field.key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={template.fields.includes(field.key)}
                          onChange={() => handleFieldToggle(field.key)}
                        />
                      }
                      label={field.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                표시 옵션
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={template.showHeader}
                        onChange={e =>
                          setTemplate({
                            ...template,
                            showHeader: e.target.checked,
                          })
                        }
                      />
                    }
                    label="헤더 표시"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={template.showCustomerInfo}
                        onChange={e =>
                          setTemplate({
                            ...template,
                            showCustomerInfo: e.target.checked,
                          })
                        }
                      />
                    }
                    label="고객 정보 표시"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={template.showCompanyInfo}
                        onChange={e =>
                          setTemplate({
                            ...template,
                            showCompanyInfo: e.target.checked,
                          })
                        }
                      />
                    }
                    label="회사 정보 표시"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={template.showFooter}
                        onChange={e =>
                          setTemplate({
                            ...template,
                            showFooter: e.target.checked,
                          })
                        }
                      />
                    }
                    label="푸터 표시"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={template.showStamp}
                        onChange={e =>
                          setTemplate({
                            ...template,
                            showStamp: e.target.checked,
                          })
                        }
                      />
                    }
                    label="회사 도장 표시"
                  />
                </Grid>
              </Grid>
            </Box>
          </>
        )}

        {/* 회사 정보 탭 */}
        {activeTab === 1 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              회사 정보 설정
            </Typography>
            
            {/* 저장된 회사 선택 */}
            {savedCompanies.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  등록된 회사 선택
                </Typography>
                <Grid container spacing={1}>
                  {savedCompanies.map((company) => (
                    <Grid item xs={12} sm={6} key={company.id}>
                      <Box
                        sx={{
                          p: 2,
                          border: selectedCompanyId === company.id ? '2px solid #1976d2' : '1px solid #ddd',
                          borderRadius: 1,
                          cursor: 'pointer',
                          backgroundColor: selectedCompanyId === company.id ? '#f3f8ff' : 'transparent',
                          '&:hover': {
                            backgroundColor: selectedCompanyId === company.id ? '#f3f8ff' : '#f5f5f5',
                          },
                        }}
                        onClick={() => handleCompanySelect(company.id)}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {company.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                          {company.address}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {company.contact}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* 수동 입력 */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              수동 입력
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="회사명"
                  value={companyInfo.name}
                  onChange={e =>
                    setCompanyInfo({ ...companyInfo, name: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="회사주소"
                  value={companyInfo.address}
                  onChange={e =>
                    setCompanyInfo({ ...companyInfo, address: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="전화번호"
                  value={companyInfo.phone}
                  onChange={e =>
                    setCompanyInfo({ ...companyInfo, phone: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="이메일"
                  value={companyInfo.email}
                  onChange={e =>
                    setCompanyInfo({ ...companyInfo, email: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* 도장 설정 탭 */}
        {activeTab === 2 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              도장 설정
            </Typography>
            
            {/* 도장 이미지 업로드 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                도장 이미지 업로드
              </Typography>
              
              {stampImage ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    현재 등록된 도장 이미지
                  </Typography>
                  <Card sx={{ maxWidth: 200, mb: 2 }}>
                    <CardMedia
                      component="img"
                      image={stampImage}
                      alt="도장 이미지"
                      sx={{ 
                        height: 150, 
                        objectFit: 'contain',
                        backgroundColor: '#f5f5f5'
                      }}
                    />
                  </Card>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleStampImageDelete}
                    sx={{ mr: 1 }}
                  >
                    도장 이미지 삭제
                  </Button>
                </Box>
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    도장 이미지를 업로드하면 기본 텍스트 도장 대신 사용됩니다.
                  </Typography>
                </Box>
              )}
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mr: 1 }}
              >
                도장 이미지 업로드
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleStampImageUpload}
                />
              </Button>
              
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                • 지원 형식: JPG, PNG, GIF, WebP<br/>
                • 최대 파일 크기: 5MB<br/>
                • 권장 크기: 200x200px 이상의 정사각형 이미지
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* 도장 표시 옵션 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                도장 표시 옵션
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={template.showStamp}
                    onChange={e =>
                      setTemplate({
                        ...template,
                        showStamp: e.target.checked,
                      })
                    }
                  />
                }
                label="견적서에 도장 표시"
              />
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                체크하면 견적서 우상단에 도장이 표시됩니다.
              </Typography>
            </Box>
          </Box>
        )}

        {/* 안내 문구 탭 */}
        {activeTab === 3 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              안내 문구 설정
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              견적서 하단에 표시될 안내 문구를 입력하세요. 줄바꿈은 자동으로
              반영됩니다.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="안내 문구"
              value={noticeText}
              onChange={e => setNoticeText(e.target.value)}
              placeholder="• 본 견적서는 발행일로부터 30일간 유효합니다.&#10;• 견적서에 명시되지 않은 추가 작업은 별도 견적이 필요합니다.&#10;• 설치 및 배송 조건은 별도 협의하시기 바랍니다.&#10;• 문의사항이 있으시면 언제든 연락주시기 바랍니다."
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSave} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EstimateTemplate: React.FC<EstimateTemplateProps> = ({
  estimate,
  onClose,
  discountAmount,
  open,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date().toLocaleDateString('ko-KR');
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('estimateTemplates');
    const savedTemplates = saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    
    // 저장된 도장 설정 불러오기
    const savedShowStamp = localStorage.getItem('estimateShowStamp');
    if (savedShowStamp !== null) {
      const showStamp = JSON.parse(savedShowStamp);
      // 모든 템플릿에 도장 설정 적용
      Object.keys(savedTemplates).forEach(key => {
        savedTemplates[key].showStamp = showStamp;
      });
    }
    
    return savedTemplates;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 저장된 회사 정보와 안내 문구 가져오기
  const companyInfo = (() => {
    const saved = localStorage.getItem('estimateCompanyInfo');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_INFO;
  })();

  const noticeText = (() => {
    const saved = localStorage.getItem('estimateNoticeText');
    return saved || DEFAULT_NOTICE_TEXT;
  })();

  // 저장된 도장 이미지 가져오기
  const stampImage = (() => {
    const saved = localStorage.getItem('estimateStampImage');
    return saved || null;
  })();

  const totalAmount = estimate.rows.reduce((sum, row) => {
    let rowTotal = row.totalPrice || 0;
    if (row.options && row.options.length > 0) {
      row.options.forEach(option => {
        rowTotal += (option.salePrice || 0) * (option.quantity || 1);
      });
    }
    return sum + rowTotal;
  }, 0);

  const consumerPrice = Math.round(totalAmount);
  const discountedPrice = Math.round(totalAmount - discountAmount);

  const handlePrint = () => {
    window.print();
  };

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
  };

  const handleSaveTemplate = (template: any) => {
    const newTemplates = { ...templates, [selectedTemplate]: template };
    setTemplates(newTemplates);
    localStorage.setItem('estimateTemplates', JSON.stringify(newTemplates));
  };

  const getFieldValue = (row: EstimateRow, fieldKey: string) => {
    switch (fieldKey) {
      case 'brand':
        return row.brand || '-';
      case 'space':
        // 직접입력 시 커스텀 값 우선 표시
        if (row.space === '직접입력' && row.spaceCustom) {
          return row.spaceCustom;
        }
        return row.space || '-';
      case 'productCode':
        return row.productCode || '-';
      case 'productType':
        return row.productType || '-';
      case 'productName':
        return row.productName || '-';
      case 'width':
        return row.width || '-';
      case 'details':
        return row.details || '-';
      case 'widthMM':
        return row.widthMM ? `${row.widthMM}mm` : '-';
      case 'heightMM':
        return row.heightMM ? `${row.heightMM}mm` : '-';
      case 'area':
        return row.area ? `${row.area}㎡` : '-';
      case 'lineDir':
        return row.lineDir || '-';
      case 'lineLen':
        return row.lineLen ? `${row.lineLen}cm` : '-';
      case 'pleatAmount':
        return row.pleatAmount ? `${row.pleatAmount}` : '-';
      case 'widthCount':
        return row.widthCount ? `${row.widthCount}폭` : '-';
      case 'quantity':
        return row.quantity || '-';
      case 'totalPrice':
        return row.totalPrice === 0
          ? '*서비스 상품입니다.'
          : `${(row.totalPrice || 0).toLocaleString()}원`;
      default:
        return '-';
    }
  };

  // 옵션 금액 계산 함수
  const getOptionAmount = (option: any, row: any) => {
    const optionType = option.note;
    const salePrice = Number(option.salePrice) || 0;
    const quantity = Number(option.quantity) || 1;

    switch (optionType) {
      case '폭당':
        const widthCount = Number(row.widthCount) || 0;
        return salePrice * widthCount * quantity;
      case 'm당':
        const widthMM = Number(row.widthMM) || 0;
        return salePrice * (widthMM / 1000) * quantity;
      case '추가':
        return salePrice * quantity;
      case '포함':
        return 0;
      case 'm2당':
        const area = Number(row.area) || 0;
        return salePrice * area * quantity;
      default:
        return salePrice * quantity;
    }
  };

  const currentTemplate = templates[selectedTemplate];

  // 현재 로그인된 사용자 정보 가져오기
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        // 기본 사용자 정보 설정
        setCurrentUser({
          name: '작성자',
          phone: '010-2290-5000'
        });
      }
    };

    loadCurrentUser();
  }, []);

  return (
    <>
      {/* 모달 다이얼로그 */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        disableEnforceFocus
        disableAutoFocus
      >
        <DialogTitle>
          <Box
            className="print-hide"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">견적서 양식</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>템플릿 선택</InputLabel>
                <Select
                  value={selectedTemplate}
                  onChange={e => handleTemplateChange(e.target.value)}
                  label="템플릿 선택"
                >
                  <MenuItem value="template1">
                    {templates.template1.name}
                  </MenuItem>
                  <MenuItem value="template2">
                    {templates.template2.name}
                  </MenuItem>
                  <MenuItem value="template3">
                    {templates.template3.name}
                  </MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="템플릿 설정">
                <IconButton onClick={() => setSettingsOpen(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Button
                onClick={handlePrint}
                startIcon={<PrintIcon />}
                sx={{ mr: 1 }}
              >
                인쇄
              </Button>
              <Button onClick={onClose}>닫기</Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            ref={printRef}
            className="estimate-template"
            sx={{
              p: 4,
              backgroundColor: 'white',
              color: '#000',
              fontSize: '10.5pt',
            }}
          >
            {/* Header */}
            {currentTemplate.showHeader && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 3,
                  borderBottom: '2px solid #333',
                  pb: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 'bold', color: '#000', mb: 0.5 }}
                  >
                    견적서
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#555' }}>
                    ESTIMATE
                  </Typography>
                </Box>
                {currentTemplate.showCompanyInfo && (
                  <Box sx={{ textAlign: 'right', flex: 1, fontSize: '10pt', position: 'relative' }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}
                    >
                      {currentUser ? `${currentUser.name}(010-2290-5000)` : '작성자(010-2290-5000)'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#000' }}>
                      {companyInfo.address}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#000' }}>
                      TEL: {companyInfo.phone}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      EMAIL: {companyInfo.email}
                    </Typography>
                    
                    {/* 회사 도장 */}
                    {currentTemplate.showStamp && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -15,
                          right: -25,
                          width: 90,
                          height: 90,
                          transform: 'rotate(-12deg)',
                          zIndex: 1,
                          pointerEvents: 'none',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        {stampImage ? (
                          // 업로드된 도장 이미지 사용
                          <Box
                            component="img"
                            src={stampImage}
                            alt="회사 도장"
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                            }}
                          />
                        ) : (
                          // 기본 텍스트 도장
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              background: `
                                radial-gradient(circle at 30% 30%, rgba(255,0,0,0.4) 0%, rgba(255,0,0,0.2) 40%, rgba(255,0,0,0.1) 70%, rgba(255,0,0,0.05) 100%)
                              `,
                              border: '3px solid rgba(255,0,0,0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9pt',
                              fontWeight: 'bold',
                              color: 'rgba(255,0,0,0.9)',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: '60%',
                                height: '60%',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,0,0,0.3)',
                                transform: 'translate(-50%, -50%)',
                              }
                            }}
                          >
                            <Box sx={{ textAlign: 'center', lineHeight: 1.2 }}>
                              <Box sx={{ fontSize: '6pt', mb: 0.5, fontWeight: 'bold' }}>윈도우</Box>
                              <Box sx={{ fontSize: '7pt', fontWeight: 'bold' }}>갤러리</Box>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Estimate & Customer Info */}
            {currentTemplate.showCustomerInfo && (
              <Grid container spacing={2} sx={{ mb: 3, fontSize: '10pt' }}>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      height: '100%',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 1.5,
                        fontWeight: 'bold',
                        borderBottom: '1px solid #e0e0e0',
                        pb: 1,
                        color: '#000',
                      }}
                    >
                      견적 정보
                    </Typography>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          견적번호:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {estimate.estimateNo}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          견적일자:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {estimate.estimateDate || currentDate}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          프로젝트:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {estimate.projectName || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      height: '100%',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 1.5,
                        fontWeight: 'bold',
                        borderBottom: '1px solid #e0e0e0',
                        pb: 1,
                        color: '#000',
                      }}
                    >
                      고객 정보
                    </Typography>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          고객명:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {estimate.customerName || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          연락처:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {estimate.contact || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          주소:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {estimate.address || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            )}

            {/* Items Table */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 1.5,
                  fontWeight: 'bold',
                  borderBottom: '2px solid #333',
                  pb: 1,
                  color: '#000',
                }}
              >
                제품 상세 내역
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ fontSize: '11pt' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          color: '#000',
                          p: 0.5,
                          borderBottom: '1px solid #000',
                          fontSize: '11pt',
                        }}
                      >
                        #
                      </TableCell>
                      {currentTemplate.fields.map((fieldKey: string) => {
                        const field = OUTPUT_FIELDS.find(
                          f => f.key === fieldKey
                        );
                        return (
                          <TableCell
                            key={fieldKey}
                            sx={{
                              fontWeight: 'bold',
                              color: '#000',
                              p: 0.5,
                              borderBottom: '1px solid #000',
                              fontSize: '11pt',
                            }}
                          >
                            {field ? field.label : fieldKey}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {estimate.rows.map((row, index) => {
                      // 공간별 색상
                      const spaceColor = getSpaceColor(row.space);
                      return [
                        // 제품 행
                        <TableRow
                          key={row.id}
                          sx={{ backgroundColor: spaceColor }}
                        >
                          <TableCell
                            sx={{
                              p: 0.5,
                              color: '#000',
                              verticalAlign: 'top',
                              fontSize: '11pt',
                            }}
                          >
                            {index + 1}
                          </TableCell>
                          {currentTemplate.fields.map((fieldKey: string) => (
                            <TableCell
                              key={fieldKey}
                              sx={{
                                p: 0.5,
                                color: '#000',
                                verticalAlign: 'top',
                                fontSize: '11pt',
                              }}
                            >
                              {getFieldValue(row, fieldKey)}
                            </TableCell>
                          ))}
                        </TableRow>,
                        // 옵션 행들
                        ...(row.options && row.options.length > 0
                          ? row.options.map((option, optIndex) => (
                              <TableRow
                                key={`${row.id}-option-${option.id}`}
                                sx={{
                                  backgroundColor: getSpaceColor(
                                    row.space,
                                    1.12
                                  ),
                                }}
                              >
                                <TableCell
                                  sx={{
                                    p: 0.5,
                                    color: '#000',
                                    verticalAlign: 'top',
                                    fontSize: '10.5pt',
                                  }}
                                ></TableCell>
                                {currentTemplate.fields.map(
                                  (fieldKey: string) => {
                                    if (fieldKey === 'productName') {
                                      return (
                                        <TableCell
                                          key={fieldKey}
                                          sx={{
                                            p: 0.5,
                                            color: '#000',
                                            verticalAlign: 'top',
                                            fontSize: '10.5pt',
                                          }}
                                        >
                                          └ {option.optionName}
                                        </TableCell>
                                      );
                                    } else if (fieldKey === 'details') {
                                      return (
                                        <TableCell
                                          key={fieldKey}
                                          sx={{
                                            p: 0.5,
                                            color: '#000',
                                            verticalAlign: 'top',
                                            fontSize: '10.5pt',
                                          }}
                                        >
                                          {option.details}
                                        </TableCell>
                                      );
                                    } else if (fieldKey === 'quantity') {
                                      return (
                                        <TableCell
                                          key={fieldKey}
                                          sx={{
                                            p: 0.5,
                                            color: '#000',
                                            verticalAlign: 'top',
                                            fontSize: '10.5pt',
                                          }}
                                        >
                                          {option.quantity || 1}
                                        </TableCell>
                                      );
                                    } else if (fieldKey === 'totalPrice') {
                                      const optionAmount = getOptionAmount(
                                        option,
                                        row
                                      );
                                      return (
                                        <TableCell
                                          key={fieldKey}
                                          sx={{
                                            p: 0.5,
                                            color: '#000',
                                            verticalAlign: 'top',
                                            fontSize: '10.5pt',
                                          }}
                                        >
                                          {optionAmount.toLocaleString()}원
                                        </TableCell>
                                      );
                                    } else {
                                      return (
                                        <TableCell
                                          key={fieldKey}
                                          sx={{
                                            p: 0.5,
                                            color: '#000',
                                            verticalAlign: 'top',
                                            fontSize: '10.5pt',
                                          }}
                                        >
                                          -
                                        </TableCell>
                                      );
                                    }
                                  }
                                )}
                              </TableRow>
                            ))
                          : []),
                      ];
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ fontSize: '9pt', height: '100%' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 'bold', color: '#000' }}
                  >
                    안내 문구
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      backgroundColor: '#f8f9fa',
                      whiteSpace: 'pre-wrap',
                      height: 'calc(100% - 30px)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ color: '#000' }}
                    >
                      {noticeText}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    height: '100%',
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 320,
                      p: 2,
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: '#000',
                      }}
                    >
                      견적 합계
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        fontSize: '10.5pt',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography variant="body1" sx={{ color: '#000' }}>
                          소비자금액 (VAT포함):
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          {consumerPrice.toLocaleString()}원
                        </Typography>
                      </Box>
                      {discountAmount > 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ color: 'red', fontWeight: 'bold' }}
                          >
                            할인후금액 (VAT포함):
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 'bold', color: 'red' }}
                          >
                            {discountedPrice.toLocaleString()}원
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {currentTemplate.showFooter && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 4,
                  pt: 4,
                  borderTop: '1px solid #ccc',
                }}
              >
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 4, fontWeight: 'bold', color: '#000' }}
                  >
                    고객명: _________________
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#000' }}>
                    서명: _________________
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 4, fontWeight: 'bold', color: '#000' }}
                  >
                    작성자: {currentUser ? currentUser.name : '작성자'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* 템플릿 설정 모달 */}
      <TemplateSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentTemplate={currentTemplate}
        onSave={handleSaveTemplate}
      />

      {/* 숨겨진 출력용 템플릿 - 항상 렌더링되지만 화면에 보이지 않음 */}
      <Box
        className="estimate-template"
        sx={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '210mm',
          height: '297mm',
          backgroundColor: 'white',
          color: '#000',
          fontSize: '10.5pt',
          p: 4,
          visibility: 'hidden',
        }}
      >
        {/* Header */}
        {currentTemplate.showHeader && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 3,
              borderBottom: '2px solid #333',
              pb: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: '#000', mb: 0.5 }}
              >
                견적서
              </Typography>
              <Typography variant="body2" sx={{ color: '#555' }}>
                ESTIMATE
              </Typography>
            </Box>
            {currentTemplate.showCompanyInfo && (
              <Box sx={{ textAlign: 'right', flex: 1, fontSize: '10pt' }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}
                >
                  {currentUser ? `${currentUser.name}(010-2290-5000)` : '작성자(010-2290-5000)'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, color: '#000' }}>
                  {companyInfo.address}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, color: '#000' }}>
                  TEL: {companyInfo.phone}
                </Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>
                  EMAIL: {companyInfo.email}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Estimate & Customer Info */}
        {currentTemplate.showCustomerInfo && (
          <Grid container spacing={2} sx={{ mb: 3, fontSize: '10pt' }}>
            <Grid item xs={6}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  height: '100%',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 1.5,
                    fontWeight: 'bold',
                    borderBottom: '1px solid #e0e0e0',
                    pb: 1,
                    color: '#000',
                  }}
                >
                  견적 정보
                </Typography>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', color: '#000' }}
                    >
                      견적번호:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {estimate.estimateNo}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', color: '#000' }}
                    >
                      견적일자:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {estimate.estimateDate || currentDate}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', color: '#000' }}
                    >
                      프로젝트:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {estimate.projectName || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  height: '100%',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 1.5,
                    fontWeight: 'bold',
                    borderBottom: '1px solid #e0e0e0',
                    pb: 1,
                    color: '#000',
                  }}
                >
                  고객 정보
                </Typography>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', color: '#000' }}
                    >
                      고객명:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {estimate.customerName || '-'}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', color: '#000' }}
                    >
                      연락처:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {estimate.contact || '-'}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', color: '#000' }}
                    >
                      주소:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {estimate.address || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Items Table */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 1.5,
              fontWeight: 'bold',
              borderBottom: '2px solid #333',
              pb: 1,
              color: '#000',
            }}
          >
            제품 상세 내역
          </Typography>
          <TableContainer>
            <Table size="small" sx={{ fontSize: '11pt' }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      color: '#000',
                      p: 0.5,
                      borderBottom: '1px solid #000',
                      fontSize: '11pt',
                    }}
                  >
                    #
                  </TableCell>
                  {currentTemplate.fields.map((fieldKey: string) => {
                    const field = OUTPUT_FIELDS.find(f => f.key === fieldKey);
                    return (
                      <TableCell
                        key={fieldKey}
                        sx={{
                          fontWeight: 'bold',
                          color: '#000',
                          p: 0.5,
                          borderBottom: '1px solid #000',
                          fontSize: '11pt',
                        }}
                      >
                        {field ? field.label : fieldKey}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {estimate.rows.map((row, index) => {
                  // 공간별 색상
                  const spaceColor = getSpaceColor(row.space);
                  return [
                    // 제품 행
                    <TableRow key={row.id} sx={{ backgroundColor: spaceColor }}>
                      <TableCell
                        sx={{
                          p: 0.5,
                          color: '#000',
                          verticalAlign: 'top',
                          fontSize: '11pt',
                        }}
                      >
                        {index + 1}
                      </TableCell>
                      {currentTemplate.fields.map((fieldKey: string) => (
                        <TableCell
                          key={fieldKey}
                          sx={{
                            p: 0.5,
                            color: '#000',
                            verticalAlign: 'top',
                            fontSize: '11pt',
                          }}
                        >
                          {getFieldValue(row, fieldKey)}
                        </TableCell>
                      ))}
                    </TableRow>,
                    // 옵션 행들
                    ...(row.options && row.options.length > 0
                      ? row.options.map((option, optIndex) => (
                          <TableRow
                            key={`${row.id}-option-${option.id}`}
                            sx={{
                              backgroundColor: getSpaceColor(row.space, 1.12),
                            }}
                          >
                            <TableCell
                              sx={{
                                p: 0.5,
                                color: '#000',
                                verticalAlign: 'top',
                                fontSize: '10.5pt',
                              }}
                            ></TableCell>
                            {currentTemplate.fields.map((fieldKey: string) => {
                              if (fieldKey === 'productName') {
                                return (
                                  <TableCell
                                    key={fieldKey}
                                    sx={{
                                      p: 0.5,
                                      color: '#000',
                                      verticalAlign: 'top',
                                      fontSize: '10.5pt',
                                    }}
                                  >
                                    └ {option.optionName}
                                  </TableCell>
                                );
                              } else if (fieldKey === 'details') {
                                return (
                                  <TableCell
                                    key={fieldKey}
                                    sx={{
                                      p: 0.5,
                                      color: '#000',
                                      verticalAlign: 'top',
                                      fontSize: '10.5pt',
                                    }}
                                  >
                                    {option.details}
                                  </TableCell>
                                );
                              } else if (fieldKey === 'quantity') {
                                return (
                                  <TableCell
                                    key={fieldKey}
                                    sx={{
                                      p: 0.5,
                                      color: '#000',
                                      verticalAlign: 'top',
                                      fontSize: '10.5pt',
                                    }}
                                  >
                                    {option.quantity || 1}
                                  </TableCell>
                                );
                              } else if (fieldKey === 'totalPrice') {
                                const optionAmount = getOptionAmount(
                                  option,
                                  row
                                );
                                return (
                                  <TableCell
                                    key={fieldKey}
                                    sx={{
                                      p: 0.5,
                                      color: '#000',
                                      verticalAlign: 'top',
                                      fontSize: '10.5pt',
                                    }}
                                  >
                                    {optionAmount.toLocaleString()}원
                                  </TableCell>
                                );
                              } else {
                                return (
                                  <TableCell
                                    key={fieldKey}
                                    sx={{
                                      p: 0.5,
                                      color: '#000',
                                      verticalAlign: 'top',
                                      fontSize: '10.5pt',
                                    }}
                                  >
                                    -
                                  </TableCell>
                                );
                              }
                            })}
                          </TableRow>
                        ))
                      : []),
                  ];
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ fontSize: '9pt', height: '100%' }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: 'bold', color: '#000' }}
              >
                안내 문구
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  backgroundColor: '#f8f9fa',
                  whiteSpace: 'pre-wrap',
                  height: 'calc(100% - 30px)',
                }}
              >
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ color: '#000' }}
                >
                  {noticeText}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <Box
                sx={{
                  minWidth: 320,
                  p: 2,
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: '#000',
                  }}
                >
                  견적 합계
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    fontSize: '10.5pt',
                  }}
                >
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body1" sx={{ color: '#000' }}>
                      소비자금액 (VAT포함):
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 'bold', color: '#000' }}
                    >
                      {consumerPrice.toLocaleString()}원
                    </Typography>
                  </Box>
                  {discountAmount > 0 && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ color: 'red', fontWeight: 'bold' }}
                      >
                        할인후금액 (VAT포함):
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 'bold', color: 'red' }}
                      >
                        {discountedPrice.toLocaleString()}원
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {currentTemplate.showFooter && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 4,
              pt: 4,
              borderTop: '1px solid #ccc',
            }}
          >
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography
                variant="body2"
                sx={{ mb: 4, fontWeight: 'bold', color: '#000' }}
              >
                고객명: _________________
              </Typography>
              <Typography variant="caption" sx={{ color: '#000' }}>
                서명: _________________
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography
                variant="body2"
                sx={{ mb: 4, fontWeight: 'bold', color: '#000' }}
              >
                작성자: {currentUser ? currentUser.name : '작성자'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};

export default EstimateTemplate;
