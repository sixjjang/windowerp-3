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
} from '@mui/material';
import {
  Print as PrintIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

export interface Contract {
  id: number;
  contractNo: string;
  estimateNo: string;
  contractDate: string;
  customerName: string;
  contact: string;
  emergencyContact: string;
  address: string;
  projectName: string;
  type: string;
  totalAmount: number;
  discountedAmount: number;
  depositAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  signatureData?: string;
  agreementMethod: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
  measurementDate?: string;
  constructionDate?: string;
  rows?: any[];
}

interface ContractTemplateProps {
  contract: Contract;
  onClose: () => void;
  open: boolean;
}

// 출력 항목 정의
const OUTPUT_FIELDS = [
  { key: 'brand', label: '브랜드' },
  { key: 'space', label: '공간' },
  { key: 'productCode', label: '제품코드' },
  { key: 'productType', label: '제품종류' },
  { key: 'curtainType', label: '커튼종류' },
  { key: 'pleatType', label: '주름방식' },
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
  { key: 'totalPrice', label: '금액' },
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
    showSignature: true,
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
    showSignature: true,
  },
  template3: {
    name: '전체 템플릿',
    fields: OUTPUT_FIELDS.map(f => f.key),
    showHeader: true,
    showCustomerInfo: true,
    showCompanyInfo: true,
    showFooter: true,
    showSignature: true,
  },
};

// 기본 회사 정보
const DEFAULT_COMPANY_INFO = {
  name:
    localStorage.getItem('contractCompanyName') ||
    localStorage.getItem('companyName') ||
    '[회사명]',
  address:
    localStorage.getItem('contractCompanyAddress') ||
    localStorage.getItem('companyAddress') ||
    '[회사주소]',
  phone:
    localStorage.getItem('contractCompanyPhone') ||
    localStorage.getItem('companyPhone') ||
    '[전화번호]',
  email:
    localStorage.getItem('contractCompanyEmail') ||
    localStorage.getItem('companyEmail') ||
    '[이메일]',
};

// 기본 안내 문구
const DEFAULT_NOTICE_TEXT = `• 본 계약서는 발행일로부터 30일간 유효합니다.
• 계약서에 명시되지 않은 추가 작업은 별도 협의가 필요합니다.
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
  const keys = Object.keys(SPACE_COLORS);
  let idx = keys.indexOf(space);
  if (idx === -1)
    idx =
      Math.abs(space.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
      SPACE_COLOR_LIST.length;
  let color = SPACE_COLOR_LIST[idx];
  if (lightness !== 1) {
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
    const saved = localStorage.getItem('contractCompanyInfo');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_INFO;
  });
  const [noticeText, setNoticeText] = useState(() => {
    const saved = localStorage.getItem('contractNoticeText');
    return saved || DEFAULT_NOTICE_TEXT;
  });
  const [activeTab, setActiveTab] = useState(0);
  const [savedCompanies, setSavedCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  useEffect(() => {
    setTemplate(currentTemplate);
  }, [currentTemplate]);

  // 저장된 회사 정보 불러오기
  useEffect(() => {
    const loadSavedCompanies = () => {
      try {
        const saved = localStorage.getItem('companyInfo');
        if (saved) {
          const companies = JSON.parse(saved);
          if (Array.isArray(companies)) {
            // 우리회사 타입만 필터링
            const ourCompanies = companies.filter((company: any) => company.type === '우리회사');
            setSavedCompanies(ourCompanies);
            
            // 현재 선택된 회사 ID 찾기
            if (ourCompanies.length > 0) {
              const currentCompany = ourCompanies.find((company: any) => 
                company.name === companyInfo.name && 
                company.address === companyInfo.address
              );
              if (currentCompany) {
                setSelectedCompanyId(currentCompany.id);
              } else {
                setSelectedCompanyId(ourCompanies[0].id);
              }
            }
          }
        }
      } catch (error) {
        console.error('회사 정보 로드 중 오류:', error);
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
    localStorage.setItem('contractCompanyInfo', JSON.stringify(companyInfo));
    localStorage.setItem('contractNoticeText', noticeText);
    onSave(template);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>계약서 템플릿 설정</DialogTitle>
      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="출력 항목" />
          <Tab label="회사 정보" />
          <Tab label="안내 문구" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              출력할 항목 선택
            </Typography>
            <Grid container spacing={1}>
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
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={template.showHeader}
                    onChange={e =>
                      setTemplate({ ...template, showHeader: e.target.checked })
                    }
                  />
                }
                label="헤더 표시"
              />
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={template.showFooter}
                    onChange={e =>
                      setTemplate({ ...template, showFooter: e.target.checked })
                    }
                  />
                }
                label="안내 문구 표시"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={template.showSignature}
                    onChange={e =>
                      setTemplate({
                        ...template,
                        showSignature: e.target.checked,
                      })
                    }
                  />
                }
                label="서명 표시"
              />
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
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
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="주소"
                  value={companyInfo.address}
                  onChange={e =>
                    setCompanyInfo({ ...companyInfo, address: e.target.value })
                  }
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
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              안내 문구 설정
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="안내 문구"
              value={noticeText}
              onChange={e => setNoticeText(e.target.value)}
              helperText="줄바꿈은 • 로 구분됩니다"
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

const ContractTemplate: React.FC<ContractTemplateProps> = ({
  contract,
  onClose,
  open,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date().toLocaleDateString('ko-KR');
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('contractTemplates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 저장된 회사 정보와 안내 문구 가져오기
  const companyInfo = (() => {
    const saved = localStorage.getItem('contractCompanyInfo');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_INFO;
  })();

  const noticeText = (() => {
    const saved = localStorage.getItem('contractNoticeText');
    return saved || DEFAULT_NOTICE_TEXT;
  })();

  const handlePrint = () => {
    window.print();
  };

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
  };

  const handleSaveTemplate = (template: any) => {
    const newTemplates = { ...templates, [selectedTemplate]: template };
    setTemplates(newTemplates);
    localStorage.setItem('contractTemplates', JSON.stringify(newTemplates));
  };

  const getFieldValue = (row: any, fieldKey: string) => {
    switch (fieldKey) {
      case 'brand':
        return row.brand || '-';
      case 'space':
        return row.space || '-';
      case 'productCode':
        return row.productCode || '-';
      case 'productType':
        return row.productType || '-';
      case 'curtainType':
        return row.curtainType || '-';
      case 'pleatType':
        return row.pleatType || '-';
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

  const currentTemplate = templates[selectedTemplate];
  const rows = contract.rows || [];

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
            <Typography variant="h6">계약서 양식</Typography>
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
            className="contract-template"
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
                    계약서
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#555' }}>
                    CONTRACT
                  </Typography>
                </Box>
                {currentTemplate.showCompanyInfo && (
                  <Box sx={{ textAlign: 'right', flex: 1, fontSize: '10pt' }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}
                    >
                      {companyInfo.name}
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

            {/* Contract & Customer Info */}
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
                      계약 정보
                    </Typography>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          계약번호:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {contract.contractNo}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          계약일자:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {contract.contractDate || currentDate}
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
                          {contract.projectName || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          총금액:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {(contract.totalAmount || 0).toLocaleString()}원
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          할인후금액:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {(contract.discountedAmount || 0).toLocaleString()}원
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          계약금:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {(contract.depositAmount || 0).toLocaleString()}원
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          잔금:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {(contract.remainingAmount || 0).toLocaleString()}원
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
                          {contract.customerName || '-'}
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
                          {contract.contact || '-'}
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
                          {contract.address || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          상태:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {contract.status || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#000' }}
                        >
                          시공일자:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2" sx={{ color: '#000' }}>
                          {contract.constructionDate || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            )}

            {/* Items Table */}
            {rows.length > 0 && (
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
                  계약 상세 내역
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
                      {rows.map((row, index) => {
                        const spaceColor = getSpaceColor(row.space || '');
                        return (
                          <React.Fragment key={row.id || index}>
                            <TableRow sx={{ backgroundColor: spaceColor }}>
                              <TableCell
                                sx={{
                                  color: '#000',
                                  p: 0.5,
                                  borderRight: '1px solid #ddd',
                                  fontSize: '10pt',
                                }}
                              >
                                {index + 1}
                              </TableCell>
                              {currentTemplate.fields.map(
                                (fieldKey: string) => (
                                  <TableCell
                                    key={fieldKey}
                                    sx={{
                                      color: '#000',
                                      p: 0.5,
                                      borderRight: '1px solid #ddd',
                                      fontSize: '10pt',
                                    }}
                                  >
                                    {getFieldValue(row, fieldKey)}
                                  </TableCell>
                                )
                              )}
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Footer */}
            {currentTemplate.showFooter && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-line',
                    color: '#000',
                    fontSize: '10pt',
                  }}
                >
                  {noticeText}
                </Typography>
              </Box>
            )}

            {/* Signature */}
            {currentTemplate.showSignature && contract.signatureData && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, fontWeight: 'bold', color: '#000' }}
                >
                  서명
                </Typography>
                <Box
                  sx={{
                    display: 'inline-block',
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    p: 1,
                    backgroundColor: '#f9f9f9',
                  }}
                >
                  <img
                    src={contract.signatureData}
                    alt="서명"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '100px',
                      display: 'block',
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ mt: 1, color: '#000' }}>
                  서명일자: {contract.contractDate}
                </Typography>
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
    </>
  );
};

export default ContractTemplate;
