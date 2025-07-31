import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogActions,
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
  Share,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ASRecord } from '../utils/deliveryStore';

interface CompanyInfo {
  id: number;
  name: string;
  contact: string;
  address: string;
  type?: string; // 회사 타입 (우리회사, 거래처 등)
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
    type: '우리회사',
  },
  {
    id: 2,
    name: '우리회사2',
    contact: '010-1111-2222',
    address: '서울시 강남구 봉은사로 456',
    type: '우리회사',
  },
];

const sectionList = [
  { key: 'company', label: '발신자 (신청) 정보' },
  { key: 'customer', label: '고객 정보' },
  { key: 'vendor', label: '수신자 정보' },
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
  const [title, setTitle] = useState('AS 신청서');
  const [newCompany, setNewCompany] = useState<CompanyInfo | null>(null);

  // 강제로 라이트 테마 CSS 변수 설정
  useEffect(() => {
    if (open) {
      // CSS 변수를 강제로 설정
      document.documentElement.style.setProperty('--background-color', '#ffffff');
      document.documentElement.style.setProperty('--surface-color', '#f8f9fa');
      document.documentElement.style.setProperty('--text-color', '#333333');
      document.documentElement.style.setProperty('--text-secondary-color', '#666666');
      document.documentElement.style.setProperty('--border-color', '#e0e0e0');
      document.documentElement.style.setProperty('--hover-color', '#f5f5f5');
      document.documentElement.style.setProperty('--primary-color', '#1976d2');
      document.documentElement.style.setProperty('--primary-hover-color', '#42a5f5');
      
      // 전역 스타일 강제 적용
      const style = document.createElement('style');
      style.id = 'force-light-theme';
      style.textContent = `
        /* 모든 다이얼로그 요소 강제 스타일링 */
        .MuiDialog-root,
        .MuiDialog-root *,
        .MuiDialog-root *::before,
        .MuiDialog-root *::after {
          color: #333333 !important;
          background-color: #ffffff !important;
          -webkit-text-fill-color: #333333 !important;
          text-fill-color: #333333 !important;
        }
        
        /* 입력 필드 강제 스타일링 */
        .MuiDialog-root input,
        .MuiDialog-root input[type="text"],
        .MuiDialog-root input[type="email"],
        .MuiDialog-root input[type="tel"],
        .MuiDialog-root textarea {
          color: #333333 !important;
          -webkit-text-fill-color: #333333 !important;
          text-fill-color: #333333 !important;
          background-color: #ffffff !important;
        }
        
        /* 라벨 강제 스타일링 */
        .MuiDialog-root label,
        .MuiDialog-root .MuiInputLabel-root,
        .MuiDialog-root .MuiFormLabel-root {
          color: #666666 !important;
          -webkit-text-fill-color: #666666 !important;
          text-fill-color: #666666 !important;
        }
        
        /* 셀렉트 박스 강제 스타일링 */
        .MuiDialog-root .MuiSelect-select,
        .MuiDialog-root .MuiSelect-select.MuiSelect-select {
          color: #333333 !important;
          -webkit-text-fill-color: #333333 !important;
          text-fill-color: #333333 !important;
        }
        
        /* 체크박스 라벨 강제 스타일링 */
        .MuiDialog-root .MuiFormControlLabel-label,
        .MuiDialog-root .MuiFormControlLabel-label span {
          color: #333333 !important;
          -webkit-text-fill-color: #333333 !important;
          text-fill-color: #333333 !important;
        }
        
        /* 버튼 텍스트 강제 스타일링 */
        .MuiDialog-root button,
        .MuiDialog-root button span {
          color: inherit !important;
          -webkit-text-fill-color: inherit !important;
          text-fill-color: inherit !important;
        }
        
        /* 타이포그래피 강제 스타일링 */
        .MuiDialog-root .MuiTypography-root,
        .MuiDialog-root p,
        .MuiDialog-root div,
        .MuiDialog-root span {
          color: #333333 !important;
          -webkit-text-fill-color: #333333 !important;
          text-fill-color: #333333 !important;
        }
        
        /* 메뉴 아이템 강제 스타일링 */
        .MuiDialog-root .MuiMenuItem-root,
        .MuiDialog-root .MuiMenuItem-root span {
          color: #333333 !important;
          -webkit-text-fill-color: #333333 !important;
          text-fill-color: #333333 !important;
        }
        
        /* 플레이스홀더 강제 스타일링 */
        .MuiDialog-root input::placeholder,
        .MuiDialog-root textarea::placeholder {
          color: #999999 !important;
          -webkit-text-fill-color: #999999 !important;
          text-fill-color: #999999 !important;
        }
        
        /* 포커스 상태 강제 스타일링 */
        .MuiDialog-root input:focus,
        .MuiDialog-root textarea:focus,
        .MuiDialog-root .MuiInputBase-root:focus-within {
          color: #333333 !important;
          -webkit-text-fill-color: #333333 !important;
          text-fill-color: #333333 !important;
        }
      `;
      document.head.appendChild(style);

      // DOM 요소 직접 조작 (더 강력한 방법)
      setTimeout(() => {
        const dialog = document.querySelector('.MuiDialog-root');
        if (dialog) {
          // 모든 입력 요소 찾기
          const inputs = dialog.querySelectorAll('input, textarea, select');
          inputs.forEach((input: any) => {
            input.style.color = '#333333';
            input.style.webkitTextFillColor = '#333333';
            input.style.textFillColor = '#333333';
            input.style.backgroundColor = '#ffffff';
          });

          // 모든 라벨 요소 찾기
          const labels = dialog.querySelectorAll('label, .MuiInputLabel-root, .MuiFormLabel-root');
          labels.forEach((label: any) => {
            label.style.color = '#666666';
            label.style.webkitTextFillColor = '#666666';
            label.style.textFillColor = '#666666';
          });

          // 모든 텍스트 요소 찾기
          const textElements = dialog.querySelectorAll('p, div, span, .MuiTypography-root');
          textElements.forEach((element: any) => {
            if (element.tagName !== 'BUTTON' && element.tagName !== 'INPUT') {
              element.style.color = '#333333';
              element.style.webkitTextFillColor = '#333333';
              element.style.textFillColor = '#333333';
            }
          });

          // 셀렉트 박스 요소 찾기
          const selects = dialog.querySelectorAll('.MuiSelect-select');
          selects.forEach((select: any) => {
            select.style.color = '#333333';
            select.style.webkitTextFillColor = '#333333';
            select.style.textFillColor = '#333333';
          });

          // 체크박스 라벨 찾기
          const checkboxLabels = dialog.querySelectorAll('.MuiFormControlLabel-label');
          checkboxLabels.forEach((label: any) => {
            label.style.color = '#333333';
            label.style.webkitTextFillColor = '#333333';
            label.style.textFillColor = '#333333';
          });

          // MutationObserver를 사용하여 동적으로 추가되는 요소들도 스타일링
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach((node: any) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  // 새로 추가된 요소들에 스타일 적용
                  const inputs = node.querySelectorAll ? node.querySelectorAll('input, textarea, select') : [];
                  inputs.forEach((input: any) => {
                    input.style.color = '#333333';
                    input.style.webkitTextFillColor = '#333333';
                    input.style.textFillColor = '#333333';
                    input.style.backgroundColor = '#ffffff';
                  });

                  const labels = node.querySelectorAll ? node.querySelectorAll('label, .MuiInputLabel-root, .MuiFormLabel-root') : [];
                  labels.forEach((label: any) => {
                    label.style.color = '#666666';
                    label.style.webkitTextFillColor = '#666666';
                    label.style.textFillColor = '#666666';
                  });

                  const textElements = node.querySelectorAll ? node.querySelectorAll('p, div, span, .MuiTypography-root') : [];
                  textElements.forEach((element: any) => {
                    if (element.tagName !== 'BUTTON' && element.tagName !== 'INPUT') {
                      element.style.color = '#333333';
                      element.style.webkitTextFillColor = '#333333';
                      element.style.textFillColor = '#333333';
                    }
                  });

                  const selects = node.querySelectorAll ? node.querySelectorAll('.MuiSelect-select') : [];
                  selects.forEach((select: any) => {
                    select.style.color = '#333333';
                    select.style.webkitTextFillColor = '#333333';
                    select.style.textFillColor = '#333333';
                  });

                  const checkboxLabels = node.querySelectorAll ? node.querySelectorAll('.MuiFormControlLabel-label') : [];
                  checkboxLabels.forEach((label: any) => {
                    label.style.color = '#333333';
                    label.style.webkitTextFillColor = '#333333';
                    label.style.textFillColor = '#333333';
                  });
                }
              });
            });
          });

          // 다이얼로그 내의 모든 변경사항을 관찰
          observer.observe(dialog, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
          });

          // observer를 정리하기 위해 전역 변수로 저장
          (window as any).modalObserver = observer;
        }
      }, 100); // 모달이 완전히 렌더링된 후 실행
    }

    return () => {
      // 컴포넌트가 언마운트될 때 스타일 제거
      const existingStyle = document.getElementById('force-light-theme');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // MutationObserver 정리
      if ((window as any).modalObserver) {
        (window as any).modalObserver.disconnect();
        (window as any).modalObserver = null;
      }
    };
  }, [open]);

  useEffect(() => {
    // localStorage에서 companyInfo 불러오기
    try {
      const saved = localStorage.getItem('companyInfo');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length > 0) {
          setCompanies(arr);
          
          // 우리회사 찾기 (이름에 "우리회사"가 포함된 회사들)
          const ourCompanies = arr.filter((company: any) => {
            // type이 '우리회사'인 경우 또는 이름에 '우리회사'가 포함된 경우
            return company.type === '우리회사' || 
                   (company.name && company.name.includes('우리회사'));
          });
          
          if (ourCompanies.length > 0) {
            // 첫 번째 우리회사를 선택
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
      type: '우리회사', // 타입을 우리회사로 설정
    });
  };

  // 회사 저장 핸들러
  const handleSaveCompany = () => {
    if (!newCompany) return;
    // 타입이 설정되지 않은 경우 우리회사로 설정
    const companyToSave = {
      ...newCompany,
      type: newCompany.type || '우리회사'
    };
    const updated = [...companies, companyToSave];
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

  // 카카오톡 공유 기능
  const handleKakaoShare = () => {
    if (!asRecord) return;
    
    const selectedCompany = companies[selectedCompanyIndex];
    const today = new Date().toLocaleDateString('ko-KR');
    
    // AS 신청서 내용을 텍스트로 구성
    const shareText = `📋 AS 신청서

📅 작성일: ${today}
🏢 발신자: ${selectedCompany?.name || '미선택'}
📞 연락처: ${selectedCompany?.contact || '미입력'}
📍 주소: ${selectedCompany?.address || '미입력'}

👤 고객명: ${asRecord.customerName}
📞 고객연락처: ${asRecord.contact || '미입력'}
📍 고객주소: ${asRecord.address || '미입력'}

🏭 제품명: ${asRecord.productName}
🔧 문제점: ${asRecord.issue || '미입력'}
📝 추가메모: ${asRecord.note || '미입력'}

#AS신청서 #윈도우ERP`;

    // Kakao SDK가 로드되었는지 확인
    if (typeof window !== 'undefined' && window.Kakao) {
      // Kakao SDK 초기화 (이미 초기화되어 있지 않은 경우)
      if (!window.Kakao.isInitialized()) {
        // 실제 앱에서는 발급받은 JavaScript 키를 사용해야 합니다
        // 여기서는 데모용으로 임시 키를 사용합니다
        window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');
      }

      // 카카오톡 공유
      window.Kakao.Link.sendDefault({
        objectType: 'text',
        text: shareText,
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      });
    } else {
      // Kakao SDK가 로드되지 않은 경우 대체 방법
      const encodedText = encodeURIComponent(shareText);
      const kakaoTalkUrl = `https://story.kakao.com/share?url=${encodeURIComponent(window.location.href)}&text=${encodedText}`;
      window.open(kakaoTalkUrl, '_blank', 'width=600,height=600');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ 
        sx: { 
          background: '#ffffff !important',
          color: '#333333 !important',
          zIndex: 9999,
          '& *': {
            background: '#ffffff !important',
            color: '#333333 !important',
            zIndex: 9999,
          }
        } 
      }}
    >
      <Box sx={{ display: 'flex', minHeight: 600, zIndex: 9999 }}>
                 {/* 좌측 패널: 회사 선택, 출력정보 선택 */}
                  <Box
            sx={{
              width: 320,
              background: '#f8f9fa !important',
              color: '#333333 !important',
              p: 3,
              borderRight: '2px solid #1976d2 !important',
              zIndex: 9999,
              position: 'relative',
              // 모든 하위 요소에 대한 강력한 스타일 오버라이드
              '& *': {
                color: '#333333 !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              // MUI 컴포넌트별 강력한 오버라이드
              '& .MuiInputBase-root': {
                background: '#ffffff !important',
                color: '#333333 !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiFormControl-root': {
                background: '#ffffff !important',
                color: '#333333 !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiInputBase-input': {
                color: '#333333 !important',
                background: '#ffffff !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
                '&::placeholder': {
                  color: '#999999 !important',
                  WebkitTextFillColor: '#999999 !important',
                }
              },
              '& .MuiInputLabel-root': {
                color: '#666666 !important',
                background: '#ffffff !important',
                WebkitTextFillColor: '#666666 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiSelect-select': {
                color: '#333333 !important',
                background: '#ffffff !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiFormControlLabel-label': {
                color: '#333333 !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiCheckbox-root': {
                color: '#1976d2 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e0e0e0 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiOutlinedInput-root': {
                background: '#ffffff !important',
                color: '#333333 !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiFormControl-root .MuiInputBase-root': {
                background: '#ffffff !important',
                color: '#333333 !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiFormControl-root .MuiInputBase-input': {
                color: '#333333 !important',
                background: '#ffffff !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiFormControl-root .MuiInputLabel-root': {
                color: '#666666 !important',
                background: '#ffffff !important',
                WebkitTextFillColor: '#666666 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiFormControl-root .MuiSelect-select': {
                color: '#333333 !important',
                background: '#ffffff !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              // 추가 강력한 오버라이드
              '& input': {
                color: '#333333 !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& label': {
                color: '#666666 !important',
                WebkitTextFillColor: '#666666 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiSelect-select.MuiSelect-select': {
                color: '#333333 !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              // 더 강력한 오버라이드
              '& input[type="text"]': {
                color: '#333333 !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              '& .MuiInputBase-input.MuiInputBase-input': {
                color: '#333333 !important',
                WebkitTextFillColor: '#333333 !important',
                zIndex: 9999,
                position: 'relative',
              },
              // 전역 스타일 오버라이드
              '& .MuiInputBase-input, & .MuiInputLabel-root, & .MuiSelect-select': {
                color: '#333333 !important !important !important',
                WebkitTextFillColor: '#333333 !important !important !important',
                zIndex: 9999,
                position: 'relative',
                '&::before, &::after': {
                  display: 'none !important',
                }
              }
            }}
          >
                     <Typography
             variant="h6"
             sx={{ 
               color: '#1976d2 !important', 
               mb: 3, 
               fontWeight: 700,
               fontSize: 'calc(1.25rem + 1.5px)', // h6 기본 크기 + 1.5px
             }}
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
                  '& .MuiInputBase-input': { 
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                    WebkitTextFillColor: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiInputLabel-root': { 
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                    WebkitTextFillColor: '#666666 !important',
                    zIndex: 9999,
                    position: 'relative',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  '& .MuiOutlinedInput-root': {
                    background: '#ffffff !important',
                    color: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  '& .MuiFormControl-root': {
                    background: '#ffffff !important',
                    color: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  '& .MuiFormControl-root .MuiInputBase-root': {
                    background: '#ffffff !important',
                    color: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  '& .MuiFormControl-root .MuiInputBase-input': {
                    color: '#333333 !important',
                    background: '#ffffff !important',
                    WebkitTextFillColor: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  '& .MuiFormControl-root .MuiInputLabel-root': {
                    color: '#666666 !important',
                    background: '#ffffff !important',
                    WebkitTextFillColor: '#666666 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  // 추가 강력한 오버라이드
                  '& input': {
                    color: '#333333 !important',
                    WebkitTextFillColor: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  '& label': {
                    color: '#666666 !important',
                    WebkitTextFillColor: '#666666 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                }}
                InputProps={{
                  style: {
                    color: '#333333',
                    WebkitTextFillColor: '#333333',
                    zIndex: 9999,
                    position: 'relative',
                  }
                }}
                InputLabelProps={{
                  style: {
                    color: '#666666',
                    WebkitTextFillColor: '#666666',
                    zIndex: 9999,
                    position: 'relative',
                  }
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
                       sx={{ 
                         color: '#1976d2 !important',
                       }}
                     />
                  }
                                                                           label={sec.label}
                    sx={{ 
                      color: '#333333 !important', 
                      mb: 1,
                      fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                      '& .MuiFormControlLabel-label': {
                        color: '#333333 !important',
                        WebkitTextFillColor: '#333333 !important',
                        fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                      },
                      '& span': {
                        color: '#333333 !important',
                        WebkitTextFillColor: '#333333 !important',
                      }
                    }}
                />
            ))}
          </Box>
          <Divider sx={{ my: 2, borderColor: '#1976d2 !important' }} />
                     <Typography
             variant="subtitle2"
             sx={{ 
               color: '#1976d2 !important', 
               mb: 1, 
               fontWeight: 700,
               fontSize: 'calc(0.875rem + 1.5px)', // subtitle2 기본 크기 + 1.5px
             }}
           >
             신청 회사 정보 선택
           </Typography>
          <Button
            variant="outlined"
            size="small"
                         sx={{
               mb: 2,
               color: '#1976d2 !important',
               borderColor: '#1976d2 !important',
               borderRadius: 2,
               fontWeight: 700,
               background: '#ffffff !important',
               fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
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
                 background: '#ffffff !important',
                 borderRadius: 2,
                 border: '1.5px solid #e0e0e0 !important',
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
                  '& .MuiInputBase-input': { 
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiInputLabel-root': { 
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0 !important',
                  },
                  '& .MuiOutlinedInput-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-input': {
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputLabel-root': {
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                  },
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
                  '& .MuiInputBase-input': { 
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiInputLabel-root': { 
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0 !important',
                  },
                  '& .MuiOutlinedInput-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-input': {
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputLabel-root': {
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                  },
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
                  '& .MuiInputBase-input': { 
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiInputLabel-root': { 
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0 !important',
                  },
                  '& .MuiOutlinedInput-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-input': {
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputLabel-root': {
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    background: '#1976d2 !important',
                    color: '#ffffff !important',
                    fontWeight: 700,
                    fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
                  }}
                  onClick={handleSaveCompany}
                >
                  저장
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ 
                    color: '#333333 !important', 
                    borderColor: '#333333 !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
                  }}
                  onClick={() => setNewCompany(null)}
                >
                  취소
                </Button>
              </Box>
            </Box>
          )}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                         <InputLabel sx={{ 
               color: '#1976d2 !important',
               fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
             }}>회사 선택</InputLabel>
                                                   <Select
                value={companies.length > 0 ? selectedCompanyIndex : ''}
                label="회사 선택"
                onChange={e => setSelectedCompanyIndex(Number(e.target.value))}
                sx={{
                  color: '#333333 !important',
                  background: '#ffffff !important',
                  borderRadius: 2,
                  zIndex: 9999,
                  position: 'relative',
                  '& .MuiSelect-select': {
                    color: '#333333 !important',
                    background: '#ffffff !important',
                    WebkitTextFillColor: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  '& .MuiOutlinedInput-root': {
                    background: '#ffffff !important',
                    color: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  '& .MuiInputBase-root': {
                    background: '#ffffff !important',
                    color: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  '& .MuiInputBase-input': {
                    color: '#333333 !important',
                    background: '#ffffff !important',
                    WebkitTextFillColor: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                  },
                  '& *': {
                    background: '#ffffff !important',
                    color: '#333333 !important',
                    WebkitTextFillColor: '#333333 !important',
                    zIndex: 9999,
                    position: 'relative',
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      backgroundColor: '#ffffff',
                      color: '#333333',
                      zIndex: 9999,
                    }
                  }
                }}
              >
                             {companies.length > 0 ? (
                 companies.map((c, idx) => (
                   <MenuItem key={c.id} value={idx} sx={{
                     background: '#ffffff !important',
                     color: '#333333 !important !important',
                   }}>
                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                       <Box>
                         <Typography sx={{ 
                           color: '#333333 !important !important',
                           fontWeight: c.type === '우리회사' || c.name.includes('우리회사') ? 'bold' : 'normal',
                           fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                         }}>
                           {c.name}
                         </Typography>
                         {c.type === '우리회사' || c.name.includes('우리회사') ? (
                           <Typography sx={{ 
                             fontSize: 'calc(0.75rem + 1.5px)', // 기본 크기 + 1.5px
                             color: '#1976d2 !important',
                             fontWeight: 'bold'
                           }}>
                             우리회사
                           </Typography>
                         ) : null}
                       </Box>
                       <Button
                         size="small"
                         sx={{ 
                           color: '#333333 !important !important',
                           background: '#ffffff !important',
                           fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
                         }}
                         onClick={e => {
                           e.stopPropagation();
                           handleDeleteCompany(c.id);
                         }}
                       >
                         삭제
                       </Button>
                     </Box>
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
                 background: '#ffffff !important',
                 borderRadius: 2,
                 border: '1.5px solid #e0e0e0 !important',
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
                  '& .MuiInputBase-input': { 
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiInputLabel-root': { 
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0 !important',
                  },
                  '& .MuiOutlinedInput-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-input': {
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputLabel-root': {
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                  },
                }}
                InputLabelProps={{ style: { color: '#666666 !important' } }}
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
                  '& .MuiInputBase-input': { 
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiInputLabel-root': { 
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0 !important',
                  },
                  '& .MuiOutlinedInput-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-input': {
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputLabel-root': {
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                  },
                }}
                InputLabelProps={{ style: { color: '#666666 !important' } }}
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
                  '& .MuiInputBase-input': { 
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiInputLabel-root': { 
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(1rem + 1.5px)', // 기본 크기 + 1.5px
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0 !important',
                  },
                  '& .MuiOutlinedInput-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-root': {
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputBase-input': {
                    color: '#333333 !important !important',
                    background: '#ffffff !important',
                  },
                  '& .MuiFormControl-root .MuiInputLabel-root': {
                    color: '#666666 !important !important',
                    background: '#ffffff !important',
                  },
                }}
                InputLabelProps={{ style: { color: '#666666 !important' } }}
                placeholder="주소"
              />
            </Box>
          )}
        </Box>
        {/* 우측 미리보기 */}
        <Box
          sx={{ 
            flex: 1, 
            p: 4, 
            overflowY: 'auto', 
            background: '#ffffff !important',
            color: '#333333 !important',
            '& *': {
              background: '#ffffff !important',
              color: '#333333 !important',
            }
          }}
        >
          <Box
            ref={printRef}
            sx={{
              maxWidth: 800,
              mx: 'auto',
              background: '#ffffff !important',
              borderRadius: 4,
              boxShadow: '0 4px 24px rgba(0,0,0,0.1) !important',
              border: '2px solid #e0e0e0 !important',
              p: 4,
              '& *': {
                background: '#ffffff !important',
                color: '#333333 !important',
              }
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: '#333333 !important',
                fontWeight: 900,
                textAlign: 'center',
                letterSpacing: 2,
                mb: 2,
                fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
                background: '#ffffff !important',
                fontSize: 'calc(2.125rem + 1.5px)', // h4 기본 크기 + 1.5px
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ 
                color: '#1976d2 !important', 
                textAlign: 'center', 
                mb: 4,
                background: '#ffffff !important',
                fontSize: 'calc(0.875rem + 1.5px)', // subtitle2 기본 크기 + 1.5px
              }}
            >
              작성일: {today}
            </Typography>
            {/* 신청 회사 정보 */}
            {visibleSections.company && (
              <Box
                sx={{
                  background: '#ffffff !important',
                  borderRadius: 3,
                  border: '1.5px solid #e0e0e0 !important',
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '& *': {
                    background: '#ffffff !important',
                    color: '#333333 !important',
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#1976d2 !important',
                    color: '#ffffff !important',
                    width: 36,
                    height: 36,
                  }}
                >
                  <Business />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ 
                      color: '#333333 !important', 
                      fontWeight: 700,
                      background: '#ffffff !important',
                      fontSize: 'calc(1rem + 1.5px)', // subtitle1 기본 크기 + 1.5px
                    }}
                  >
                    신청 회사 정보
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
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
                  background: '#ffffff !important',
                  borderRadius: 3,
                  border: '1.5px solid #e0e0e0 !important',
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '& *': {
                    background: '#ffffff !important',
                    color: '#333333 !important',
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#1976d2 !important',
                    color: '#ffffff !important',
                    width: 36,
                    height: 36,
                  }}
                >
                  <Person />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ 
                      color: '#333333 !important', 
                      fontWeight: 700,
                      background: '#ffffff !important',
                      fontSize: 'calc(1rem + 1.5px)', // subtitle1 기본 크기 + 1.5px
                    }}
                  >
                    고객 정보
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
                    고객명: {asRecord.customerName} / 프로젝트:{' '}
                    {asRecord.contractNo}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
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
                  background: '#fff8e1 !important',
                  borderRadius: 3,
                  border: '1.5px solid #ffd6e1 !important',
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '& *': {
                    background: '#fff8e1 !important',
                    color: '#333333 !important',
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#ffd6e1 !important',
                    color: '#333333 !important',
                    width: 36,
                    height: 36,
                  }}
                >
                  <Store />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ 
                      color: '#333333 !important', 
                      fontWeight: 700,
                      background: '#fff8e1 !important',
                      fontSize: 'calc(1rem + 1.5px)', // subtitle1 기본 크기 + 1.5px
                    }}
                  >
                    거래처(발주처) 정보
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#fff8e1 !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
                    거래처명: {asRecord.vendorName || '정보 없음'} / 거래처ID:{' '}
                    {asRecord.vendorId || '정보 없음'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#fff8e1 !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
                    연락처: {asRecord.vendorContact || '정보 없음'} / 이메일:{' '}
                    {asRecord.vendorEmail || '정보 없음'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#fff8e1 !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
                    주소: {asRecord.vendorAddress || '정보 없음'}
                  </Typography>
                </Box>
              </Box>
            )}
            {/* 제품 정보 */}
            {visibleSections.product && (
              <Box
                sx={{
                  background: '#ffffff !important',
                  borderRadius: 3,
                  border: '1.5px solid #e0e0e0 !important',
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '& *': {
                    background: '#ffffff !important',
                    color: '#333333 !important',
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#1976d2 !important',
                    color: '#ffffff !important',
                    width: 36,
                    height: 36,
                  }}
                >
                  <Inventory2 />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ 
                      color: '#333333 !important', 
                      fontWeight: 700,
                      background: '#ffffff !important',
                      fontSize: 'calc(1rem + 1.5px)', // subtitle1 기본 크기 + 1.5px
                    }}
                  >
                    제품 정보
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
                    AS 접수일: {asRecord.date} / 시공/납품일자: {'정보 없음'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
                    공간: {asRecord.space || '-'} / 제품코드:{' '}
                    {asRecord.productCode || '-'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
                    제품명: {asRecord.productName || '-'} / 제작사이즈:{' '}
                    {asRecord.productionDimensions || '-'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#ffffff !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
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
                  background: '#fff8e1 !important',
                  borderRadius: 3,
                  border: '1.5px solid #ffd6e1 !important',
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '& *': {
                    background: '#fff8e1 !important',
                    color: '#333333 !important',
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#ffd6e1 !important',
                    color: '#333333 !important',
                    width: 36,
                    height: 36,
                  }}
                >
                  <Warning />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ 
                      color: '#333333 !important', 
                      fontWeight: 700,
                      background: '#fff8e1 !important',
                      fontSize: 'calc(1rem + 1.5px)', // subtitle1 기본 크기 + 1.5px
                    }}
                  >
                    문제점 상세
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#333333 !important',
                    background: '#fff8e1 !important',
                    fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                  }}>
                    {asRecord.issue}
                  </Typography>
                  {asRecord.solution && (
                    <Typography
                      variant="body2"
                      sx={{ 
                        color: '#1976d2 !important', 
                        mt: 1,
                        background: '#fff8e1 !important',
                        fontSize: 'calc(0.875rem + 1.5px)', // body2 기본 크기 + 1.5px
                      }}
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
                  background: '#ffffff !important',
                  borderRadius: 3,
                  border: '1.5px solid #e0e0e0 !important',
                  p: 3,
                  mb: 3,
                  '& *': {
                    background: '#ffffff !important',
                    color: '#333333 !important',
                  }
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ 
                    color: '#333333 !important', 
                    fontWeight: 700,
                    background: '#ffffff !important',
                  }}
                >
                  추가 메모
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#333333 !important',
                  background: '#ffffff !important',
                }}>
                  {asRecord.note}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
             <DialogActions
         sx={{
           background: '#f8f9fa !important',
           borderTop: '2px solid #1976d2 !important',
           p: 3,
           justifyContent: 'space-between',
           '& *': {
             background: '#f8f9fa !important',
             color: '#333333 !important',
             WebkitTextFillColor: '#333333 !important',
           }
         }}
       >
         <Button
           variant="outlined"
           sx={{
             color: '#1976d2 !important',
             borderColor: '#1976d2 !important',
             background: '#f8f9fa !important',
             borderRadius: 3,
             fontWeight: 700,
             px: 4,
             py: 1.5,
             border: '2px solid #1976d2 !important',
             WebkitTextFillColor: '#1976d2 !important',
             zIndex: 9999,
             position: 'relative',
             fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
             '& span': {
               color: '#1976d2 !important',
               WebkitTextFillColor: '#1976d2 !important',
               zIndex: 9999,
               position: 'relative',
               fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
             }
           }}
           style={{
             color: '#1976d2',
             WebkitTextFillColor: '#1976d2',
             zIndex: 9999,
             position: 'relative',
             fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
           }}
         >
           취소
         </Button>
         <Box sx={{ display: 'flex', gap: 2 }}>
           <Button
             variant="contained"
             sx={{
               background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%) !important',
               color: '#ffffff !important',
               borderRadius: 3,
               fontWeight: 700,
               px: 4,
               py: 1.5,
               boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15) !important',
               WebkitTextFillColor: '#ffffff !important',
               zIndex: 9999,
               position: 'relative',
               fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
               '& span': {
                 color: '#ffffff !important',
                 WebkitTextFillColor: '#ffffff !important',
                 zIndex: 9999,
                 position: 'relative',
                 fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
               },
               '&:hover': {
                 background: 'linear-gradient(90deg, #42a5f5 0%, #1976d2 100%) !important',
               },
             }}
             style={{
               color: '#ffffff',
               WebkitTextFillColor: '#ffffff',
               zIndex: 9999,
               position: 'relative',
               fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
             }}
             startIcon={<ImageIcon />}
             onClick={handleDownloadJPG}
           >
             JPG 다운로드
           </Button>
           <Button
             variant="contained"
             sx={{
               background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%) !important',
               color: '#ffffff !important',
               borderRadius: 3,
               fontWeight: 700,
               px: 4,
               py: 1.5,
               boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15) !important',
               WebkitTextFillColor: '#ffffff !important',
               zIndex: 9999,
               position: 'relative',
               fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
               '& span': {
                 color: '#ffffff !important',
                 WebkitTextFillColor: '#ffffff !important',
                 zIndex: 9999,
                 position: 'relative',
                 fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
               },
               '&:hover': {
                 background: 'linear-gradient(90deg, #42a5f5 0%, #1976d2 100%) !important',
               },
             }}
             style={{
               color: '#ffffff',
               WebkitTextFillColor: '#ffffff',
               zIndex: 9999,
               position: 'relative',
               fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
             }}
             startIcon={<PdfIcon />}
             onClick={handleDownloadPDF}
           >
             PDF 다운로드
           </Button>
           <Button
             variant="contained"
             sx={{
               background: 'linear-gradient(90deg, #FEE500 0%, #FFD700 100%) !important',
               color: '#3C1E1E !important',
               borderRadius: 3,
               fontWeight: 700,
               px: 4,
               py: 1.5,
               boxShadow: '0 2px 8px rgba(254, 229, 0, 0.15) !important',
               WebkitTextFillColor: '#3C1E1E !important',
               zIndex: 9999,
               position: 'relative',
               fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
               '& span': {
                 color: '#3C1E1E !important',
                 WebkitTextFillColor: '#3C1E1E !important',
                 zIndex: 9999,
                 position: 'relative',
                 fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
               },
               '&:hover': {
                 background: 'linear-gradient(90deg, #FFD700 0%, #FEE500 100%) !important',
               },
             }}
             style={{
               color: '#3C1E1E',
               WebkitTextFillColor: '#3C1E1E',
               zIndex: 9999,
               position: 'relative',
               fontSize: 'calc(0.875rem + 1.5px)', // 기본 크기 + 1.5px
             }}
             startIcon={<Share />}
             onClick={handleKakaoShare}
           >
             카카오톡 공유
           </Button>
         </Box>
       </DialogActions>
    </Dialog>
  );
};

export default CuteASApplicationModal;
