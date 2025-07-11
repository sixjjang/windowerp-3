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
} from '@mui/material';
import {
  Print as PrintIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

import { Estimate, EstimateRow, OptionItem } from '../types';

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
  },
  template3: {
    name: '전체 템플릿',
    fields: OUTPUT_FIELDS.map(f => f.key),
    showHeader: true,
    showCustomerInfo: true,
    showCompanyInfo: true,
    showFooter: true,
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

  useEffect(() => {
    setTemplate(currentTemplate);
  }, [currentTemplate]);

  const handleFieldToggle = (fieldKey: string) => {
    const newFields = template.fields.includes(fieldKey)
      ? template.fields.filter((f: string) => f !== fieldKey)
      : [...template.fields, fieldKey];
    setTemplate({ ...template, fields: newFields });
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

    onClose();
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

        {/* 안내 문구 탭 */}
        {activeTab === 2 && (
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
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('estimateTemplates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
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
                    회사명: {companyInfo.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#000' }}>
                    서명: _________________
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
                회사명: {companyInfo.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#000' }}>
                서명: _________________
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};

export default EstimateTemplate;
