import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  TextField,
} from '@mui/material';
import {
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Business,
  Person,
  Store,
  Inventory2,
  Warning,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ASRecord } from '../utils/deliveryStore';

const themeColors = {
  bg: '#18171c',
  card: '#23202a',
  pink: '#ffb6c1',
  red: '#ff4b6e',
  black: '#18171c',
  white: '#fff',
  border: '#ffb6c1',
  shadow: '0 4px 24px rgba(255, 75, 110, 0.08)',
  sectionBg: '#fff0f5',
  sectionBorder: '#ffb6c1',
  iconBg: '#ffb6c1',
  iconColor: '#ff4b6e',
};

interface CompanyInfo {
  id: number;
  name: string;
  contact: string;
  address: string;
}

interface CuteASApplicationModalProps {
  open: boolean;
  asRecord: ASRecord | null;
  onClose: () => void;
}

const defaultCompanies: CompanyInfo[] = [
  {
    id: 1,
    name: '우리회사',
    contact: '010-0000-0000',
    address: '서울시 강남구 테헤란로 123',
  },
  {
    id: 2,
    name: '우리회사2',
    contact: '010-1111-2222',
    address: '서울시 강남구 봉은사로 456',
  },
];

const sectionList = [
  { key: 'company', label: '신청 회사 정보' },
  { key: 'customer', label: '고객 정보' },
  { key: 'vendor', label: '거래처(발주처) 정보' },
  { key: 'product', label: '제품 정보' },
  { key: 'issue', label: '문제점 상세' },
  { key: 'note', label: '추가 메모' },
];

const CuteASApplicationModal: React.FC<CuteASApplicationModalProps> = ({
  open,
  asRecord,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [companies, setCompanies] = useState<CompanyInfo[]>(defaultCompanies);
  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0);
  const [visibleSections, setVisibleSections] = useState({
    company: true,
    customer: true,
    vendor: true,
    product: true,
    issue: true,
    note: true,
  });
  const [title, setTitle] = useState('');
  const [newCompany, setNewCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    // localStorage에서 companyInfo 불러오기
    try {
      const saved = localStorage.getItem('companyInfo');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length > 0) {
          setCompanies(arr);
          // 우리회사 타입만 필터링하여 기본값 설정
          const ourCompanies = arr.filter(
            (company: any) => company.type === '우리회사'
          );
          if (ourCompanies.length > 0) {
            const firstOurCompanyIndex = arr.findIndex(
              (company: any) => company.id === ourCompanies[0].id
            );
            setSelectedCompanyIndex(
              firstOurCompanyIndex >= 0 ? firstOurCompanyIndex : 0
            );
          } else {
            // 우리회사가 없으면 첫 번째 회사 선택
            setSelectedCompanyIndex(0);
          }
        } else {
          // 저장된 데이터가 없으면 기본값 사용
          setCompanies(defaultCompanies);
          setSelectedCompanyIndex(0);
        }
      } else {
        // localStorage에 데이터가 없으면 기본값 사용
        setCompanies(defaultCompanies);
        setSelectedCompanyIndex(0);
      }
    } catch (error) {
      console.error('회사 정보 로드 중 오류:', error);
      // 에러 발생 시 기본값 사용
      setCompanies(defaultCompanies);
      setSelectedCompanyIndex(0);
    }
    // 거래처명 기반 기본 제목 설정
    if (asRecord) {
      setTitle(
        `AS 신청서${asRecord.vendorName ? ` (${asRecord.vendorName})` : ''}`
      );
    }
  }, [asRecord]);

  if (!asRecord) return null;
  const today = new Date().toISOString().split('T')[0];

  // 안전한 selectedCompany 접근
  const selectedCompany = companies[selectedCompanyIndex] ||
    companies[0] || {
      id: 0,
      name: '회사 정보 없음',
      contact: '정보 없음',
      address: '정보 없음',
    };

  // JPG 다운로드
  const handleDownloadJPG = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      backgroundColor: '#fff',
    });
    const link = document.createElement('a');
    link.download = `AS_신청서_${asRecord.customerName}_${today}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // PDF 다운로드
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      backgroundColor: '#fff',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`AS_신청서_${asRecord.customerName}_${today}.pdf`);
  };

  // 회사 추가 핸들러
  const handleAddCompany = () => {
    // 우리회사N 자동 생성
    const existingNumbers = companies
      .map(c => c.name.match(/^우리회사(\d*)$/)?.[1])
      .filter(Boolean)
      .map(Number);
    let nextNum = 1;
    while (existingNumbers.includes(nextNum)) nextNum++;
    setNewCompany({
      id: Date.now(),
      name: `우리회사${nextNum === 1 ? '' : nextNum}`,
      contact: '',
      address: '',
    });
  };

  // 회사 저장 핸들러
  const handleSaveCompany = () => {
    if (!newCompany) return;
    const updated = [...companies, newCompany];
    setCompanies(updated);
    localStorage.setItem('companyInfo', JSON.stringify(updated));
    setNewCompany(null);
  };

  // 회사 삭제 핸들러
  const handleDeleteCompany = (id: number) => {
    const updated = companies.filter(c => c.id !== id);
    setCompanies(updated);
    localStorage.setItem('companyInfo', JSON.stringify(updated));
    if (selectedCompanyIndex >= updated.length) setSelectedCompanyIndex(0);
  };

  // 회사 수정 핸들러
  const handleEditCompany = (
    idx: number,
    field: keyof CompanyInfo,
    value: string
  ) => {
    const updated = companies.map((c, i) =>
      i === idx ? { ...c, [field]: value } : c
    );
    setCompanies(updated);
    localStorage.setItem('companyInfo', JSON.stringify(updated));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { background: themeColors.bg } }}
    >
      <Box sx={{ display: 'flex', minHeight: 600 }}>
        {/* 좌측 패널: 회사 선택, 출력정보 선택 */}
        <Box
          sx={{
            width: 320,
            background: themeColors.card,
            color: themeColors.white,
            p: 3,
            borderRight: `2px solid ${themeColors.pink}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: themeColors.pink, mb: 2, fontWeight: 700 }}
          >
            출력 정보 선택
          </Typography>
          <TextField
            fullWidth
            label="제목"
            value={title}
            onChange={e => setTitle(e.target.value)}
            sx={{
              mb: 3,
              '& .MuiInputBase-input': { color: themeColors.white },
            }}
          />
          <Box sx={{ mb: 3 }}>
            {sectionList.map(sec => (
              <FormControlLabel
                key={sec.key}
                control={
                  <Checkbox
                    checked={
                      visibleSections[sec.key as keyof typeof visibleSections]
                    }
                    onChange={e =>
                      setVisibleSections(v => ({
                        ...v,
                        [sec.key]: e.target.checked,
                      }))
                    }
                    sx={{ color: themeColors.pink }}
                  />
                }
                label={sec.label}
                sx={{ color: themeColors.white, mb: 1 }}
              />
            ))}
          </Box>
          <Divider sx={{ my: 2, borderColor: themeColors.pink }} />
          <Typography
            variant="subtitle2"
            sx={{ color: themeColors.pink, mb: 1, fontWeight: 700 }}
          >
            신청 회사 정보 선택
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{
              mb: 2,
              color: themeColors.pink,
              borderColor: themeColors.pink,
              borderRadius: 2,
              fontWeight: 700,
            }}
            onClick={handleAddCompany}
          >
            + 회사 추가
          </Button>
          {newCompany && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                background: themeColors.sectionBg,
                borderRadius: 2,
                border: `1.5px solid ${themeColors.sectionBorder}`,
              }}
            >
              <TextField
                fullWidth
                label="회사명"
                value={newCompany.name}
                onChange={e =>
                  setNewCompany({ ...newCompany, name: e.target.value })
                }
                sx={{
                  mb: 1,
                  '& .MuiInputBase-input': { color: themeColors.black },
                }}
              />
              <TextField
                fullWidth
                label="연락처"
                value={newCompany.contact}
                onChange={e =>
                  setNewCompany({ ...newCompany, contact: e.target.value })
                }
                sx={{
                  mb: 1,
                  '& .MuiInputBase-input': { color: themeColors.black },
                }}
              />
              <TextField
                fullWidth
                label="주소"
                value={newCompany.address}
                onChange={e =>
                  setNewCompany({ ...newCompany, address: e.target.value })
                }
                sx={{
                  mb: 1,
                  '& .MuiInputBase-input': { color: themeColors.black },
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    background: themeColors.pink,
                    color: themeColors.white,
                    fontWeight: 700,
                  }}
                  onClick={handleSaveCompany}
                >
                  저장
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ color: themeColors.red, borderColor: themeColors.red }}
                  onClick={() => setNewCompany(null)}
                >
                  취소
                </Button>
              </Box>
            </Box>
          )}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel sx={{ color: themeColors.pink }}>회사 선택</InputLabel>
            <Select
              value={companies.length > 0 ? selectedCompanyIndex : ''}
              label="회사 선택"
              onChange={e => setSelectedCompanyIndex(Number(e.target.value))}
              sx={{
                color: themeColors.pink,
                background: themeColors.bg,
                borderRadius: 2,
              }}
            >
              {companies.length > 0 ? (
                companies.map((c, idx) => (
                  <MenuItem key={c.id} value={idx}>
                    {c.name}
                    <Button
                      size="small"
                      sx={{ ml: 2, color: themeColors.red }}
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteCompany(c.id);
                      }}
                    >
                      삭제
                    </Button>
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  등록된 회사가 없습니다
                </MenuItem>
              )}
            </Select>
          </FormControl>
          {companies.length > 0 && companies[selectedCompanyIndex] && (
            <Box
              sx={{
                mb: 2,
                p: 1,
                background: themeColors.sectionBg,
                borderRadius: 2,
                border: `1.5px solid ${themeColors.sectionBorder}`,
              }}
            >
              <TextField
                fullWidth
                label="회사명"
                value={companies[selectedCompanyIndex].name}
                onChange={e =>
                  handleEditCompany(
                    selectedCompanyIndex,
                    'name',
                    e.target.value
                  )
                }
                sx={{
                  mb: 1,
                  '& .MuiInputBase-input': { color: themeColors.black },
                  '& .MuiInputLabel-root': { color: themeColors.black },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: themeColors.sectionBorder,
                  },
                }}
                InputLabelProps={{ style: { color: themeColors.black } }}
                placeholder="회사명"
              />
              <TextField
                fullWidth
                label="연락처"
                value={companies[selectedCompanyIndex].contact}
                onChange={e =>
                  handleEditCompany(
                    selectedCompanyIndex,
                    'contact',
                    e.target.value
                  )
                }
                sx={{
                  mb: 1,
                  '& .MuiInputBase-input': { color: themeColors.black },
                  '& .MuiInputLabel-root': { color: themeColors.black },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: themeColors.sectionBorder,
                  },
                }}
                InputLabelProps={{ style: { color: themeColors.black } }}
                placeholder="연락처"
              />
              <TextField
                fullWidth
                label="주소"
                value={companies[selectedCompanyIndex].address}
                onChange={e =>
                  handleEditCompany(
                    selectedCompanyIndex,
                    'address',
                    e.target.value
                  )
                }
                sx={{
                  mb: 1,
                  '& .MuiInputBase-input': { color: themeColors.black },
                  '& .MuiInputLabel-root': { color: themeColors.black },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: themeColors.sectionBorder,
                  },
                }}
                InputLabelProps={{ style: { color: themeColors.black } }}
                placeholder="주소"
              />
            </Box>
          )}
        </Box>
        {/* 우측 미리보기 */}
        <Box
          sx={{ flex: 1, p: 4, overflowY: 'auto', background: themeColors.bg }}
        >
          <Box
            ref={printRef}
            sx={{
              maxWidth: 800,
              mx: 'auto',
              background: themeColors.white,
              borderRadius: 4,
              boxShadow: themeColors.shadow,
              border: `2px solid ${themeColors.sectionBorder}`,
              p: 4,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: themeColors.red,
                fontWeight: 900,
                textAlign: 'center',
                letterSpacing: 2,
                mb: 2,
                fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ color: themeColors.pink, textAlign: 'center', mb: 4 }}
            >
              작성일: {today}
            </Typography>
            {/* 신청 회사 정보 */}
            {visibleSections.company && (
              <Box
                sx={{
                  background: themeColors.sectionBg,
                  borderRadius: 3,
                  border: `1.5px solid ${themeColors.sectionBorder}`,
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: themeColors.iconBg,
                    color: themeColors.iconColor,
                    width: 36,
                    height: 36,
                  }}
                >
                  <Business />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: themeColors.red, fontWeight: 700 }}
                  >
                    신청 회사 정보
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    회사명: {selectedCompany.name} / 연락처:{' '}
                    {selectedCompany.contact} / 주소: {selectedCompany.address}
                  </Typography>
                </Box>
              </Box>
            )}
            {/* 고객 정보 */}
            {visibleSections.customer && (
              <Box
                sx={{
                  background: themeColors.sectionBg,
                  borderRadius: 3,
                  border: `1.5px solid ${themeColors.sectionBorder}`,
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: themeColors.iconBg,
                    color: themeColors.red,
                    width: 36,
                    height: 36,
                  }}
                >
                  <Person />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: themeColors.red, fontWeight: 700 }}
                  >
                    고객 정보
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    고객명: {asRecord.customerName} / 프로젝트:{' '}
                    {asRecord.contractNo}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    연락처: {asRecord.contact || '정보 없음'} / 주소:{' '}
                    {asRecord.address || '정보 없음'}
                  </Typography>
                </Box>
              </Box>
            )}
            {/* 거래처 정보 */}
            {visibleSections.vendor && (
              <Box
                sx={{
                  background: '#fff8e1',
                  borderRadius: 3,
                  border: `1.5px solid #ffd6e1`,
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#ffd6e1',
                    color: themeColors.red,
                    width: 36,
                    height: 36,
                  }}
                >
                  <Store />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: themeColors.red, fontWeight: 700 }}
                  >
                    거래처(발주처) 정보
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    거래처명: {asRecord.vendorName || '정보 없음'} / 거래처ID:{' '}
                    {asRecord.vendorId || '정보 없음'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    연락처: {asRecord.vendorContact || '정보 없음'} / 이메일:{' '}
                    {asRecord.vendorEmail || '정보 없음'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    주소: {asRecord.vendorAddress || '정보 없음'}
                  </Typography>
                </Box>
              </Box>
            )}
            {/* 제품 정보 */}
            {visibleSections.product && (
              <Box
                sx={{
                  background: themeColors.sectionBg,
                  borderRadius: 3,
                  border: `1.5px solid ${themeColors.sectionBorder}`,
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: themeColors.iconBg,
                    color: themeColors.red,
                    width: 36,
                    height: 36,
                  }}
                >
                  <Inventory2 />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: themeColors.red, fontWeight: 700 }}
                  >
                    제품 정보
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    AS 접수일: {asRecord.date} / 시공/납품일자: {'정보 없음'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    공간: {asRecord.space || '-'} / 제품코드:{' '}
                    {asRecord.productCode || '-'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    제품명: {asRecord.productName || '-'} / 제작사이즈:{' '}
                    {asRecord.productionDimensions || '-'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    AS 상태: {asRecord.status} / 비용:{' '}
                    {asRecord.cost
                      ? `${asRecord.cost.toLocaleString()}원`
                      : '비용 없음'}
                  </Typography>
                </Box>
              </Box>
            )}
            {/* 문제점 상세 */}
            {visibleSections.issue && (
              <Box
                sx={{
                  background: '#fff8e1',
                  borderRadius: 3,
                  border: `1.5px solid #ffd6e1`,
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#ffd6e1',
                    color: themeColors.red,
                    width: 36,
                    height: 36,
                  }}
                >
                  <Warning />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: themeColors.red, fontWeight: 700 }}
                  >
                    문제점 상세
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.black }}>
                    {asRecord.issue}
                  </Typography>
                  {asRecord.solution && (
                    <Typography
                      variant="body2"
                      sx={{ color: themeColors.red, mt: 1 }}
                    >
                      해결방안: {asRecord.solution}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            {/* 추가 메모 */}
            {visibleSections.note && asRecord.note && (
              <Box
                sx={{
                  background: themeColors.sectionBg,
                  borderRadius: 3,
                  border: `1.5px solid ${themeColors.sectionBorder}`,
                  p: 3,
                  mb: 3,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ color: themeColors.red, fontWeight: 700 }}
                >
                  추가 메모
                </Typography>
                <Typography variant="body2" sx={{ color: themeColors.black }}>
                  {asRecord.note}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      <DialogActions
        sx={{
          background: themeColors.card,
          borderTop: `2px solid ${themeColors.pink}`,
          p: 3,
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: themeColors.pink,
            fontWeight: 700,
            borderRadius: 3,
            px: 4,
            py: 1.5,
            border: `2px solid ${themeColors.pink}`,
          }}
        >
          취소
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            sx={{
              background: 'linear-gradient(90deg, #ffb6c1 0%, #ff4b6e 100%)',
              color: themeColors.white,
              borderRadius: 3,
              fontWeight: 700,
              px: 4,
              py: 1.5,
              boxShadow: '0 2px 8px rgba(255, 75, 110, 0.15)',
              '&:hover': {
                background: 'linear-gradient(90deg, #ff4b6e 0%, #ffb6c1 100%)',
              },
            }}
            startIcon={<ImageIcon />}
            onClick={handleDownloadJPG}
          >
            JPG 다운로드
          </Button>
          <Button
            variant="contained"
            sx={{
              background: 'linear-gradient(90deg, #ff4b6e 0%, #ffb6c1 100%)',
              color: themeColors.white,
              borderRadius: 3,
              fontWeight: 700,
              px: 4,
              py: 1.5,
              boxShadow: '0 2px 8px rgba(255, 75, 110, 0.15)',
              '&:hover': {
                background: 'linear-gradient(90deg, #ffb6c1 0%, #ff4b6e 100%)',
              },
            }}
            startIcon={<PdfIcon />}
            onClick={handleDownloadPDF}
          >
            PDF 다운로드
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CuteASApplicationModal;
