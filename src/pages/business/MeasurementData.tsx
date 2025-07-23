import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MeasurementRowData } from '../../components/MeasurementForm';
import { API_BASE } from '../../utils/auth';
import { measurementService } from '../../utils/firebaseDataService';

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
      id={`measurement-tabpanel-${index}`}
      aria-labelledby={`measurement-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface MeasurementEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  customerName: string;
  estimateNo: string;
  measurementData: MeasurementRowData[];
  createdAt: string;
  updatedAt: string;
  address?: string;
  description?: string;
  type: string;
  projectType?: string;
  projectName?: string;
}

interface ProjectMeasurement {
  id: string;
  projectType: string;
  space: string;
  standardWidth: string;
  standardHeight: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  memo?: string;
  isRepresentative?: boolean;
}

interface ProjectFolder {
  projectName: string;
  types: ProjectType[];
}

interface ProjectType {
  typeName: string;
  measurements: ProjectMeasurement[];
}

const MeasurementData: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [projectTabValue, setProjectTabValue] = useState(0); // 프로젝트 실측정보 하위 탭
  const [measurementEvents, setMeasurementEvents] = useState<
    MeasurementEvent[]
  >([]);
  const [projectMeasurements, setProjectMeasurements] = useState<
    ProjectMeasurement[]
  >([]);
  const [selectedEvent, setSelectedEvent] = useState<MeasurementEvent | null>(
    null
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] =
    useState<ProjectMeasurement | null>(null);
  const [newProject, setNewProject] = useState<Partial<ProjectMeasurement>>({
    projectType: '',
    space: '',
    standardWidth: '',
    standardHeight: '',
    description: '',
    memo: '',
  });
  const [projectFolders, setProjectFolders] = useState<ProjectFolder[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 실측 이벤트 데이터 로드
  useEffect(() => {
    loadMeasurementEvents();
    loadProjectMeasurements();
  }, []);

  const loadMeasurementEvents = async () => {
    try {
      console.log('Firebase에서 실측 데이터 로드 시작');
      const data = await measurementService.getMeasurements();
      console.log('Firebase에서 실측 데이터 로드 완료:', data.length, '개');
      
      const measurementEvents = data.filter(
        (event: any) =>
          event.type === '실측' &&
          event.measurementData &&
          event.measurementData.length > 0
      );

      // 견적서 정보와 연결하여 프로젝트 타입 정보 추가
      const savedEstimates = JSON.parse(
        localStorage.getItem('saved_estimates') || '[]'
      );
      const enrichedEvents = measurementEvents.map((event: any) => {
        const relatedEstimate = savedEstimates.find(
          (est: any) => est.estimateNo === event.estimateNo
        );
        return {
          ...event,
          projectType: relatedEstimate?.type || '-',
          projectName: relatedEstimate?.projectName || '-',
        };
      });

      setMeasurementEvents(enrichedEvents);
    } catch (error) {
      console.error('실측 이벤트 로드 오류:', error);
      setMeasurementEvents([]);
    }
  };

  const loadProjectMeasurements = () => {
    try {
      const data = JSON.parse(
        localStorage.getItem('project_measurements') || '[]'
      );
      console.log('프로젝트 실측정보 데이터:', data);
      setProjectMeasurements(data);

      // 프로젝트별로 그룹화하여 폴더 구조 생성
      const projectMap = new Map<string, Map<string, ProjectMeasurement[]>>();

      data.forEach((measurement: ProjectMeasurement) => {
        // 프로젝트명 추출 - description에서 첫 번째 부분을 프로젝트명으로 사용
        let projectName = '기타';
        if (measurement.description) {
          const parts = measurement.description.split(' - ');
          if (parts.length > 0 && parts[0].trim()) {
            projectName = parts[0].trim();
          }
        }

        console.log(
          `측정항목 ${measurement.id}: description="${measurement.description}", 추출된 프로젝트명="${projectName}"`
        );

        const typeName = measurement.projectType || '기타';

        if (!projectMap.has(projectName)) {
          projectMap.set(projectName, new Map());
        }

        const typeMap = projectMap.get(projectName)!;
        if (!typeMap.has(typeName)) {
          typeMap.set(typeName, []);
        }

        typeMap.get(typeName)!.push(measurement);
      });

      const folders: ProjectFolder[] = Array.from(projectMap.entries()).map(
        ([projectName, typeMap]) => ({
          projectName,
          types: Array.from(typeMap.entries()).map(
            ([typeName, measurements]) => ({
              typeName,
              measurements,
            })
          ),
        })
      );

      console.log('생성된 폴더 구조:', folders);
      setProjectFolders(folders);
    } catch (error) {
      console.error('프로젝트 실측정보 로드 오류:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEventDoubleClick = (event: MeasurementEvent) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };

  // 견적서 번호 생성 함수
  const generateEstimateNo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time =
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0');
    return `E${year}${month}${day}-${time}`;
  };

  const handleCreateEstimate = (event: MeasurementEvent) => {
    console.log('실측목록에서 견적서 작성 시작:', event);

    // 제품 데이터 로드 (제품종류 찾기용)
    const loadProducts = () => {
      try {
        const data = localStorage.getItem('productList');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    };
    const productOptions = loadProducts();
    console.log('로드된 제품 데이터:', productOptions.length, '개');

    // 실측 데이터를 견적서 행 데이터로 변환
    const estimateRows = event.measurementData.map(data => {
      // 제품명을 기반으로 제품종류 찾기 (개선된 로직 사용)
      const productType = getProductTypeFromName(data.productName);

      // 제품 데이터에서 추가 정보 찾기 (제품명이 있을 때만)
      let matchedProduct = null;
      if (data.productName && data.productName.trim() !== '') {
        // 정확한 제품명 매칭 시도
        matchedProduct = productOptions.find(
          (p: any) =>
            p.productName &&
            p.productName.trim().toLowerCase() ===
              data.productName.trim().toLowerCase()
        );

        // 정확한 매칭이 없으면 부분 매칭 시도
        if (!matchedProduct) {
          matchedProduct = productOptions.find(
            (p: any) =>
              p.productName &&
              p.productName
                .toLowerCase()
                .includes(data.productName.toLowerCase())
          );
        }
      }

      const row = {
        id: Date.now() + Math.random(), // 고유 ID 생성
        type: 'product' as const,
        vendor: '', // 사용자가 직접 선택
        brand: '', // 사용자가 직접 선택
        space: data.space,
        productCode: '', // 사용자가 직접 선택
        productType: '', // 제품종류도 사용자가 직접 선택
        curtainType: '',
        pleatType: '',
        productName: '', // 제품명을 빈값으로 설정하여 사용자가 선택하도록 함
        width: '',
        details: '', // 세부내용은 사용자가 직접 입력
        widthMM: parseInt(data.measuredWidth) || 0,
        heightMM: parseInt(data.measuredHeight) || 0,
        area: 0, // 금액 계산 함수가 자동으로 계산하도록 0으로 설정
        lineDir: data.lineDirection || '',
        lineLen: 0,
        pleatAmount: '',
        widthCount: 0,
        quantity: 1,
        totalPrice: 0,
        salePrice: 0,
        cost: 0,
        purchaseCost: 0,
        margin: 0,
        note: '',
        options: [],
      };
      console.log('생성된 견적서 행:', row);
      return row;
    });

    // 저장할 견적서 데이터 생성
    const estimateData = {
      id: Date.now(),
      name: `견적서-${generateEstimateNo()}`,
      estimateNo: generateEstimateNo(),
      estimateDate: new Date().toISOString().split('T')[0],
      customerName: event.customerName,
      contact: '',
      emergencyContact: '',
      projectName: event.description || '프로젝트명 없음',
      type: event.projectType || '기타',
      address: event.address || '',
      rows: estimateRows,
      savedAt: new Date().toISOString(),
    };

    console.log('저장할 견적서 데이터:', estimateData);

    // 저장된 견적서 목록에 추가
    try {
      const savedEstimates = JSON.parse(
        localStorage.getItem('saved_estimates') || '[]'
      );
      savedEstimates.push(estimateData);
      localStorage.setItem('saved_estimates', JSON.stringify(savedEstimates));
      console.log('견적서 저장 완료');
    } catch (error) {
      console.error('견적서 저장 오류:', error);
    }

    // 견적관리 페이지로 이동
    console.log('견적관리 페이지로 이동 중...');
    navigate('/business/estimate');

    setSnackbar({
      open: true,
      message: `${event.measurementData.length}개의 실측 항목으로 견적서가 생성되었습니다. 저장된 견적서에서 확인하세요.`,
      severity: 'success',
    });
  };

  const handleSaveProjectMeasurement = async () => {
    if (
      !newProject.projectType ||
      !newProject.space ||
      !newProject.standardWidth ||
      !newProject.standardHeight
    ) {
      setSnackbar({
        open: true,
        message: '필수 항목을 모두 입력해주세요.',
        severity: 'warning',
      });
      return;
    }

    const projectMeasurement: ProjectMeasurement = {
      id: editingProject ? editingProject.id : Date.now().toString(),
      projectType: newProject.projectType!,
      space: newProject.space!,
      standardWidth: newProject.standardWidth!,
      standardHeight: newProject.standardHeight!,
      description: newProject.description || '',
      memo: newProject.memo || '',
      createdAt: editingProject
        ? editingProject.createdAt
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingProject) {
        // 편집 모드
        const updatedProjects = projectMeasurements.map(p =>
          p.id === editingProject.id ? projectMeasurement : p
        );
        setProjectMeasurements(updatedProjects);
        localStorage.setItem(
          'project_measurements',
          JSON.stringify(updatedProjects)
        );
        
        // Firebase에 업데이트
        await measurementService.updateMeasurement(editingProject.id, projectMeasurement);
        
        setSnackbar({
          open: true,
          message: '프로젝트 실측정보가 수정되었습니다.',
          severity: 'success',
        });
      } else {
        // 추가 모드
        const updatedProjects = [...projectMeasurements, projectMeasurement];
        setProjectMeasurements(updatedProjects);
        localStorage.setItem(
          'project_measurements',
          JSON.stringify(updatedProjects)
        );
        
        // Firebase에 저장
        await measurementService.saveMeasurement(projectMeasurement);
        
        setSnackbar({
          open: true,
          message: '프로젝트 실측정보가 추가되었습니다.',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Firebase 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
        severity: 'error',
      });
      return;
    }

    // 폴더 구조 업데이트
    loadProjectMeasurements();

    // 모달 닫기 및 초기화
    setProjectDialogOpen(false);
    setEditingProject(null);
    setNewProject({
      projectType: '',
      space: '',
      standardWidth: '',
      standardHeight: '',
      description: '',
      memo: '',
    });
  };

  const handleEditProject = (project: ProjectMeasurement) => {
    setEditingProject(project);
    setNewProject({
      projectType: project.projectType,
      space: project.space,
      standardWidth: project.standardWidth,
      standardHeight: project.standardHeight,
      description: project.description,
      memo: project.memo || '',
    });
    setProjectDialogOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projectMeasurements.find(p => p.id === projectId);
    if (!project) return;

    if (project.isRepresentative) {
      setSnackbar({
        open: true,
        message: '대표 사이즈는 삭제할 수 없습니다.',
        severity: 'warning',
      });
      return;
    }

    if (window.confirm('이 프로젝트 실측정보를 삭제하시겠습니까?')) {
      try {
        const updatedProjects = projectMeasurements.filter(
          p => p.id !== projectId
        );
        setProjectMeasurements(updatedProjects);
        localStorage.setItem(
          'project_measurements',
          JSON.stringify(updatedProjects)
        );
        
        // Firebase에서 삭제
        await measurementService.deleteMeasurement(projectId);
        
        loadProjectMeasurements(); // 폴더 구조 업데이트
      } catch (error) {
        console.error('Firebase 삭제 실패:', error);
        setSnackbar({
          open: true,
          message: '삭제 중 오류가 발생했습니다. 다시 시도해주세요.',
          severity: 'error',
        });
      }
    }
  };

  const handleDeleteProjectFolder = (projectName: string) => {
    // 대표 사이즈가 있는지 확인
    const hasRepresentative = projectMeasurements.some(p => {
      const projectNameFromDesc = p.description.split(' - ')[0] || '';
      return projectNameFromDesc === projectName && p.isRepresentative;
    });

    if (hasRepresentative) {
      setSnackbar({
        open: true,
        message: '대표 사이즈가 포함된 프로젝트는 삭제할 수 없습니다.',
        severity: 'warning',
      });
      return;
    }

    if (
      window.confirm(
        `"${projectName}" 프로젝트의 모든 실측정보를 삭제하시겠습니까?`
      )
    ) {
      const updatedProjects = projectMeasurements.filter(p => {
        const projectNameFromDesc = p.description.split(' - ')[0] || '';
        return projectNameFromDesc !== projectName;
      });
      setProjectMeasurements(updatedProjects);
      localStorage.setItem(
        'project_measurements',
        JSON.stringify(updatedProjects)
      );
      loadProjectMeasurements(); // 폴더 구조 업데이트
      setSnackbar({
        open: true,
        message: `"${projectName}" 프로젝트가 삭제되었습니다.`,
        severity: 'success',
      });
    }
  };

  const handleDeleteProjectType = (projectName: string, typeName: string) => {
    // 대표 사이즈가 있는지 확인
    const hasRepresentative = projectMeasurements.some(p => {
      const projectNameFromDesc = p.description.split(' - ')[0] || '';
      return (
        projectNameFromDesc === projectName &&
        p.projectType === typeName &&
        p.isRepresentative
      );
    });

    if (hasRepresentative) {
      setSnackbar({
        open: true,
        message: '대표 사이즈가 포함된 타입은 삭제할 수 없습니다.',
        severity: 'warning',
      });
      return;
    }

    if (
      window.confirm(
        `"${projectName}" 프로젝트의 "${typeName}" 타입의 모든 실측정보를 삭제하시겠습니까?`
      )
    ) {
      const updatedProjects = projectMeasurements.filter(p => {
        const projectNameFromDesc = p.description.split(' - ')[0] || '';
        return !(
          projectNameFromDesc === projectName && p.projectType === typeName
        );
      });
      setProjectMeasurements(updatedProjects);
      localStorage.setItem(
        'project_measurements',
        JSON.stringify(updatedProjects)
      );
      loadProjectMeasurements(); // 폴더 구조 업데이트
      setSnackbar({
        open: true,
        message: `"${projectName}" 프로젝트의 "${typeName}" 타입이 삭제되었습니다.`,
        severity: 'success',
      });
    }
  };

  const handleSetRepresentative = (projectId: string) => {
    const project = projectMeasurements.find(p => p.id === projectId);
    if (!project) return;

    const productName =
      project.description.split(' - ')[1]?.split(' (')[0] || '';
    const projectName = project.description.split(' - ')[0] || '';

    // 같은 프로젝트+타입+공간+제품종류의 다른 항목들의 대표 설정 해제
    const updatedProjects = projectMeasurements.map(p => {
      const pProductName = p.description.split(' - ')[1]?.split(' (')[0] || '';
      const pProjectName = p.description.split(' - ')[0] || '';

      if (
        p.projectType === project.projectType &&
        p.space === project.space &&
        pProjectName === projectName &&
        pProductName === productName
      ) {
        return { ...p, isRepresentative: p.id === projectId };
      }
      return p;
    });

    setProjectMeasurements(updatedProjects);
    localStorage.setItem(
      'project_measurements',
      JSON.stringify(updatedProjects)
    );
    loadProjectMeasurements(); // 폴더 구조 업데이트
    setSnackbar({
      open: true,
      message: '대표 사이즈가 설정되었습니다.',
      severity: 'success',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleDeleteMeasurement = async (eventId: string) => {
    if (window.confirm('이 실측 데이터를 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`${API_BASE}/schedules/${eventId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setMeasurementEvents(prev =>
            prev.filter(event => event.id !== eventId)
          );
          setSnackbar({
            open: true,
            message: '실측 데이터가 삭제되었습니다.',
            severity: 'success',
          });
        } else {
          const errorData = await response.json();
          setSnackbar({
            open: true,
            message: `삭제 실패: ${errorData.error}`,
            severity: 'error',
          });
        }
      } catch (error) {
        console.error('실측 데이터 삭제 오류:', error);
        setSnackbar({
          open: true,
          message: '서버 연결 오류가 발생했습니다.',
          severity: 'error',
        });
      }
    }
  };

  const handleCopyMeasurement = (event: MeasurementEvent) => {
    const measurementText = event.measurementData
      .map(
        data =>
          `공간: ${data.space}\n제품명: ${data.productName}\n실측가로: ${data.measuredWidth}mm\n실측세로: ${data.measuredHeight}mm\n줄방향: ${data.lineDirection}\n줄길이: ${data.lineLength}\n메모: ${data.memo || ''}`
      )
      .join('\n\n');

    const fullText = `고객명: ${event.customerName}\n견적서번호: ${event.estimateNo}\n실측일시: ${formatDate(event.date)} ${event.time}\n\n${measurementText}`;

    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        setSnackbar({
          open: true,
          message: '실측 데이터가 클립보드에 복사되었습니다.',
          severity: 'success',
        });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: '클립보드 복사에 실패했습니다.',
          severity: 'error',
        });
      });
  };

  const handleProjectExpand = (projectName: string) => {
    setExpandedProjects(prev =>
      prev.includes(projectName)
        ? prev.filter(p => p !== projectName)
        : [...prev, projectName]
    );
  };

  const handleTypeSelect = (projectName: string, typeName: string) => {
    setSelectedProject(projectName);
    setSelectedType(typeName);
    setSelectedItems([]); // 타입 변경 시 선택 항목 초기화
  };

  // 체크박스 선택/해제 핸들러
  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // 전체 선택/해제 핸들러
  const handleSelectAll = () => {
    const currentItems =
      projectFolders
        .find(f => f.projectName === selectedProject)
        ?.types.find(t => t.typeName === selectedType)
        ?.measurements.map(item => item.id) || [];

    setSelectedItems(prev =>
      prev.length === currentItems.length ? [] : currentItems
    );
  };

  const handleSaveToProjectMeasurement = (event: MeasurementEvent) => {
    // projectType과 projectName이 없거나 '-'인 경우 기본값 사용
    const projectType =
      event.projectType && event.projectType !== '-'
        ? event.projectType
        : '기타';

    // 프로젝트명 추출 - description에서 첫 번째 부분을 프로젝트명으로 사용
    let projectName = '기타';
    if (event.description) {
      const parts = event.description.split(' - ');
      if (parts.length > 0 && parts[0].trim()) {
        projectName = parts[0].trim();
      }
    }

    // description이 없거나 프로젝트명을 추출할 수 없는 경우 고객명 사용
    if (projectName === '기타') {
      projectName = event.customerName;
    }

    // 실측 데이터를 프로젝트 실측정보로 변환
    const projectMeasurementsToAdd: ProjectMeasurement[] =
      event.measurementData.map((data, index) => ({
        id: `from-measurement-${event.id}-${index}`,
        projectType: projectType,
        space: data.space,
        standardWidth: data.measuredWidth.toString(),
        standardHeight: data.measuredHeight.toString(),
        description: `${projectName} - ${data.productName} (${event.customerName})`,
        memo: data.memo || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

    // 중복 체크 및 업데이트 로직 - 같은 프로젝트+타입+공간+제품종류별로 3개까지 허용
    let updatedProjectMeasurements = [...projectMeasurements];
    let addedCount = 0;
    let updatedCount = 0;

    projectMeasurementsToAdd.forEach(newMeasurement => {
      const productName =
        newMeasurement.description.split(' - ')[1]?.split(' (')[0] || '';

      // 같은 프로젝트+타입+공간+제품종류의 기존 데이터들 찾기
      const existingItems = updatedProjectMeasurements.filter(existing => {
        const existingProjectName = existing.description.split(' - ')[0] || '';
        const existingProductName =
          existing.description.split(' - ')[1]?.split(' (')[0] || '';

        return (
          existing.projectType === newMeasurement.projectType &&
          existing.space === newMeasurement.space &&
          existingProjectName === newMeasurement.description.split(' - ')[0] &&
          existingProductName === productName
        );
      });

      // 3개 미만이면 추가, 3개 이상이면 가장 오래된 것 업데이트
      if (existingItems.length < 3) {
        // 새로운 데이터 추가
        updatedProjectMeasurements.push(newMeasurement);
        addedCount++;
      } else {
        // 가장 오래된 데이터 찾아서 업데이트
        const oldestItem = existingItems.reduce((oldest, current) =>
          new Date(current.createdAt) < new Date(oldest.createdAt)
            ? current
            : oldest
        );

        const oldestIndex = updatedProjectMeasurements.findIndex(
          item => item.id === oldestItem.id
        );
        if (oldestIndex !== -1) {
          updatedProjectMeasurements[oldestIndex] = {
            ...updatedProjectMeasurements[oldestIndex],
            standardWidth: newMeasurement.standardWidth,
            standardHeight: newMeasurement.standardHeight,
            description: newMeasurement.description,
            memo: newMeasurement.memo,
            updatedAt: new Date().toISOString(),
          };
          updatedCount++;
        }
      }
    });

    setProjectMeasurements(updatedProjectMeasurements);

    // localStorage에 저장
    localStorage.setItem(
      'project_measurements',
      JSON.stringify(updatedProjectMeasurements)
    );

    // 폴더 구조 업데이트
    loadProjectMeasurements();

    // 결과 메시지 생성
    let message = '';
    if (addedCount > 0 && updatedCount > 0) {
      message = `${addedCount}개 추가, ${updatedCount}개 업데이트되었습니다.`;
    } else if (addedCount > 0) {
      message = `${addedCount}개의 프로젝트 실측정보가 추가되었습니다.`;
    } else if (updatedCount > 0) {
      message = `${updatedCount}개의 프로젝트 실측정보가 업데이트되었습니다.`;
    } else {
      message = '변경사항이 없습니다.';
    }

    setSnackbar({
      open: true,
      message,
      severity: 'success',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 제품명을 기반으로 제품종류를 찾는 함수
  const getProductTypeFromName = (productName: string) => {
    try {
      // 품목관리에서 저장된 제품 데이터 로드
      const productData = localStorage.getItem('productList');
      const products = productData ? JSON.parse(productData) : [];

      if (!productName || productName.trim() === '') {
        return '기타';
      }

      // 정확한 제품명 매칭 시도
      let matchedProduct = products.find(
        (p: any) =>
          p.productName &&
          p.productName.trim().toLowerCase() ===
            productName.trim().toLowerCase()
      );

      // 정확한 매칭이 없으면 부분 매칭 시도
      if (!matchedProduct) {
        matchedProduct = products.find(
          (p: any) =>
            p.productName &&
            p.productName.toLowerCase().includes(productName.toLowerCase())
        );
      }

      // 부분 매칭도 없으면 제품명에 포함된 키워드로 매칭 시도
      if (!matchedProduct) {
        const keywords = productName
          .toLowerCase()
          .split(/[\s\-_]+/)
          .filter(k => k.length > 1);
        matchedProduct = products.find(
          (p: any) =>
            p.productName &&
            keywords.some(keyword =>
              p.productName.toLowerCase().includes(keyword)
            )
        );
      }

      console.log(
        `제품명 "${productName}" 매칭 결과:`,
        matchedProduct ? matchedProduct.category : '기타'
      );
      return matchedProduct ? matchedProduct.category : '기타';
    } catch (error) {
      console.error('제품종류 찾기 오류:', error);
      return '기타';
    }
  };

  const handleCreateEstimateFromProject = (project: ProjectMeasurement) => {
    console.log('프로젝트 실측정보에서 견적서 작성 시작:', project);

    // 선택된 항목들이 있으면 선택된 항목들만, 없으면 현재 항목만 사용
    const itemsToUse =
      selectedItems.length > 0
        ? projectMeasurements.filter(p => selectedItems.includes(p.id))
        : [project];

    console.log('사용할 항목들:', itemsToUse);

    if (itemsToUse.length === 0) {
      setSnackbar({
        open: true,
        message: '견적서 작성할 항목을 선택해주세요.',
        severity: 'warning',
      });
      return;
    }

    // 제품 데이터 로드 (제품종류 찾기용)
    const loadProducts = () => {
      try {
        const data = localStorage.getItem('productList');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    };
    const productOptions = loadProducts();
    console.log('로드된 제품 데이터:', productOptions.length, '개');

    // 선택된 프로젝트 실측정보를 견적서 행 데이터로 변환
    const estimateRows = itemsToUse.map(project => {
      const productName =
        project.description.split(' - ')[1]?.split(' (')[0] || '';
      const customerName =
        project.description.split(' - ')[1]?.split(' (')[1]?.split(')')[0] ||
        '고객명 없음';

      console.log('프로젝트 정보:', { productName, customerName, project });

      // 제품명을 기반으로 제품종류 찾기 (개선된 로직 사용)
      const productType = getProductTypeFromName(productName);

      // 제품 데이터에서 추가 정보 찾기 (제품명이 있을 때만)
      let matchedProduct = null;
      if (productName && productName.trim() !== '') {
        // 정확한 제품명 매칭 시도
        matchedProduct = productOptions.find(
          (p: any) =>
            p.productName &&
            p.productName.trim().toLowerCase() ===
              productName.trim().toLowerCase()
        );

        // 정확한 매칭이 없으면 부분 매칭 시도
        if (!matchedProduct) {
          matchedProduct = productOptions.find(
            (p: any) =>
              p.productName &&
              p.productName.toLowerCase().includes(productName.toLowerCase())
          );
        }
      }

      const row = {
        id: Date.now() + Math.random(), // 고유 ID 생성
        type: 'product' as const,
        vendor: '', // 사용자가 직접 선택
        brand: '', // 사용자가 직접 선택
        space: project.space,
        productCode: '', // 사용자가 직접 선택
        productType: '', // 제품종류도 사용자가 직접 선택
        curtainType: '',
        pleatType: '',
        productName: '', // 제품명을 빈값으로 설정하여 사용자가 선택하도록 함
        width: '',
        details: '', // 세부내용은 사용자가 직접 입력
        widthMM: parseInt(project.standardWidth) || 0,
        heightMM: parseInt(project.standardHeight) || 0,
        area: 0, // 금액 계산 함수가 자동으로 계산하도록 0으로 설정
        lineDir: '',
        lineLen: 0,
        pleatAmount: '',
        widthCount: 0,
        quantity: 1,
        totalPrice: 0,
        salePrice: 0,
        cost: 0,
        purchaseCost: 0,
        margin: 0,
        note: '',
        options: [],
      };
      console.log('생성된 견적서 행:', row);
      return row;
    });

    // 견적서에 적용할 데이터 준비
    const estimateData = {
      id: Date.now(),
      name: `견적서-${generateEstimateNo()}`,
      estimateNo: generateEstimateNo(),
      estimateDate: new Date().toISOString().split('T')[0],
      customerName: '', // 기타 표준사이즈 견적서 생성 시 빈 문자열로 저장
      contact: '',
      emergencyContact: '',
      projectName: '', // 기타 표준사이즈 견적서 생성 시 빈 문자열로 저장
      type: itemsToUse[0]?.projectType || '기타',
      address: '', // ProjectMeasurement에는 address 속성이 없으므로 빈 문자열로 설정
      rows: estimateRows,
      savedAt: new Date().toISOString(),
    };

    console.log('저장할 견적서 데이터:', estimateData);

    // 저장된 견적서 목록에 추가
    try {
      const savedEstimates = JSON.parse(
        localStorage.getItem('saved_estimates') || '[]'
      );
      savedEstimates.push(estimateData);
      localStorage.setItem('saved_estimates', JSON.stringify(savedEstimates));
      console.log('견적서 저장 완료');
    } catch (error) {
      console.error('견적서 저장 오류:', error);
    }

    // 견적관리 페이지로 이동
    console.log('견적관리 페이지로 이동 중...');
    navigate('/business/estimate');

    setSnackbar({
      open: true,
      message: `${itemsToUse.length}개의 항목이 견적서에 적용되었습니다. 저장된 견적서에서 확인하세요.`,
      severity: 'success',
    });
  };

  const handleCreateEstimateFromSelectedItems = () => {
    if (selectedItems.length === 0) {
      setSnackbar({
        open: true,
        message: '견적서 작성할 항목을 선택해주세요.',
        severity: 'warning',
      });
      return;
    }

    const selectedProjects = projectMeasurements.filter(p =>
      selectedItems.includes(p.id)
    );

    // 제품 데이터 로드 (제품종류 찾기용)
    const loadProducts = () => {
      try {
        const data = localStorage.getItem('productList');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    };
    const productOptions = loadProducts();

    // 선택된 프로젝트 실측정보를 견적서 행 데이터로 변환
    const estimateRows = selectedProjects.map(project => {
      const productName =
        project.description.split(' - ')[1]?.split(' (')[0] || '제품명 없음';
      const customerName =
        project.description.split(' - ')[1]?.split(' (')[1]?.split(')')[0] ||
        '고객명 없음';

      // 제품명을 기반으로 제품종류 찾기 (개선된 로직 사용)
      const productType = getProductTypeFromName(productName);

      // 제품 데이터에서 추가 정보 찾기
      let matchedProduct = null;
      if (productName && productName.trim() !== '') {
        // 정확한 제품명 매칭 시도
        matchedProduct = productOptions.find(
          (p: any) =>
            p.productName &&
            p.productName.trim().toLowerCase() ===
              productName.trim().toLowerCase()
        );

        // 정확한 매칭이 없으면 부분 매칭 시도
        if (!matchedProduct) {
          matchedProduct = productOptions.find(
            (p: any) =>
              p.productName &&
              p.productName.toLowerCase().includes(productName.toLowerCase())
          );
        }
      }

      return {
        id: Date.now() + Math.random(), // 고유 ID 생성
        type: 'product' as const,
        vendor: '', // 사용자가 직접 선택
        brand: '', // 사용자가 직접 선택
        space: project.space,
        productCode: '', // 사용자가 직접 선택
        productType: productType, // 제품종류는 유지 (커튼/블라인드 구분용)
        curtainType: '',
        pleatType: '',
        productName: '', // 제품명을 빈값으로 설정하여 사용자가 선택하도록 함
        width: '',
        details: '', // 세부내용은 사용자가 직접 입력
        widthMM: parseInt(project.standardWidth) || 0,
        heightMM: parseInt(project.standardHeight) || 0,
        area: 0, // 금액 계산 함수가 자동으로 계산하도록 0으로 설정
        lineDir: '',
        lineLen: 0,
        pleatAmount: '',
        widthCount: 0,
        quantity: 1,
        totalPrice: 0,
        salePrice: 0,
        cost: 0,
        purchaseCost: 0,
        margin: 0,
        note: '',
        options: [],
      };
    });

    // 견적서에 적용할 데이터 준비
    const estimateData = {
      id: Date.now(),
      name: `견적서-${generateEstimateNo()}`,
      estimateNo: generateEstimateNo(),
      estimateDate: new Date().toISOString().split('T')[0],
      customerName: '', // 기타 표준사이즈 견적서 생성 시 빈 문자열로 저장
      contact: '',
      emergencyContact: '',
      projectName: '', // 기타 표준사이즈 견적서 생성 시 빈 문자열로 저장
      type: selectedProjects[0]?.projectType || '기타',
      address: '', // ProjectMeasurement에는 address 속성이 없으므로 빈 문자열로 설정
      rows: estimateRows,
      savedAt: new Date().toISOString(),
    };

    // 저장된 견적서 목록에 추가
    try {
      const savedEstimates = JSON.parse(
        localStorage.getItem('saved_estimates') || '[]'
      );
      savedEstimates.push(estimateData);
      localStorage.setItem('saved_estimates', JSON.stringify(savedEstimates));
      console.log('견적서 저장 완료');
    } catch (error) {
      console.error('견적서 저장 오류:', error);
    }

    // 견적관리 페이지로 이동
    console.log('견적관리 페이지로 이동 중...');
    navigate('/business/estimate');

    setSnackbar({
      open: true,
      message: `${selectedItems.length}개의 항목이 견적서에 적용되었습니다. 저장된 견적서에서 확인하세요.`,
      severity: 'success',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'var(--text-color)' }}>
        실측데이터 관리
      </Typography>

      <Paper sx={{ backgroundColor: 'var(--surface-color)' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: 'var(--text-color)',
              '&.Mui-selected': { color: 'var(--primary-color)' },
            },
            '& .MuiTabs-indicator': { backgroundColor: 'var(--primary-color)' },
          }}
        >
          <Tab label="실측목록" />
          <Tab label="프로젝트 실측정보" />
        </Tabs>

        {/* 실측목록 탭 */}
        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'var(--text-color)' }}>
              실측 데이터 목록 ({measurementEvents.length}건)
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: 'var(--background-color)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      color: 'var(--text-color)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      py: 1,
                    }}
                  >
                    날짜
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'var(--text-color)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      py: 1,
                    }}
                  >
                    고객명
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'var(--text-color)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      py: 1,
                    }}
                  >
                    견적서번호
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'var(--text-color)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      py: 1,
                    }}
                  >
                    주소
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'var(--text-color)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      py: 1,
                    }}
                  >
                    프로젝트
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'var(--text-color)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      py: 1,
                    }}
                  >
                    타입
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'var(--text-color)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      py: 1,
                    }}
                  >
                    실측항목
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'var(--text-color)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      py: 1,
                    }}
                  >
                    작성일
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'var(--text-color)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      py: 1,
                    }}
                  >
                    작업
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {measurementEvents.map(event => (
                  <TableRow
                    key={event.id}
                    onDoubleClick={() => handleEventDoubleClick(event)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'var(--hover-color)' },
                    }}
                  >
                    <TableCell
                      sx={{ color: 'var(--text-color)', fontSize: '14px', py: 1 }}
                    >
                      {formatDate(event.date)} {event.time}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'var(--text-color)', fontSize: '14px', py: 1 }}
                    >
                      {event.customerName}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'var(--primary-color)', fontSize: '14px', py: 1 }}
                    >
                      {event.estimateNo}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'var(--text-color)', fontSize: '14px', py: 1 }}
                    >
                      {event.address || '-'}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'var(--text-color)', fontSize: '14px', py: 1 }}
                    >
                      {event.description || '-'}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'var(--text-color)', fontSize: '14px', py: 1 }}
                    >
                      <Chip
                        label={event.projectType || '-'}
                        size="small"
                        sx={{
                          backgroundColor: event.projectType
                            ? 'var(--surface-color)'
                            : 'var(--text-secondary-color)',
                          color: 'var(--text-color)',
                          fontSize: '12px',
                          border: '1px solid var(--primary-color)',
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{ color: 'var(--text-color)', fontSize: '14px', py: 1 }}
                    >
                      {event.measurementData.length}개 항목
                    </TableCell>
                    <TableCell
                      sx={{ color: 'var(--text-color)', fontSize: '14px', py: 1 }}
                    >
                      {formatDate(event.createdAt)}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleEventDoubleClick(event);
                          }}
                          sx={{ color: '#40c4ff' }}
                          title="실측 내용 보기"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleCopyMeasurement(event);
                          }}
                          sx={{ color: '#ff9800' }}
                          title="실측 데이터 복사"
                        >
                          <CopyIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleSaveToProjectMeasurement(event);
                          }}
                          sx={{ color: '#9c27b0' }}
                          title="프로젝트 실측정보로 저장"
                        >
                          <SaveIcon />
                        </IconButton>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={e => {
                            e.stopPropagation();
                            handleCreateEstimate(event);
                          }}
                          sx={{
                            backgroundColor: '#4caf50',
                            '&:hover': { backgroundColor: '#45a049' },
                            fontSize: '12px',
                            py: 0.5,
                            px: 1,
                          }}
                        >
                          견적서 작성
                        </Button>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteMeasurement(event.id);
                          }}
                          sx={{ color: '#f44336' }}
                          title="삭제"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* 프로젝트 실측정보 탭 */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#e0e6ed', mb: 2 }}>
              프로젝트별 표준 사이즈 관리
            </Typography>

            {/* 프로젝트 실측정보 하위 탭 */}
            <Paper sx={{ backgroundColor: '#232a36' }}>
              <Tabs
                value={projectTabValue}
                onChange={(e, newValue) => setProjectTabValue(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    color: '#e0e6ed',
                    '&.Mui-selected': { color: '#40c4ff' },
                  },
                  '& .MuiTabs-indicator': { backgroundColor: '#40c4ff' },
                }}
              >
                <Tab label="프로젝트 폴더" />
                <Tab label="타입별 보기" />
                <Tab label="전체 목록" />
              </Tabs>

              {/* 프로젝트 폴더 탭 */}
              <TabPanel value={projectTabValue} index={0}>
                <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#e0e6ed' }}>
                    프로젝트별 폴더 구조 ({projectFolders.length}개 프로젝트)
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setProjectDialogOpen(true)}
                    sx={{ backgroundColor: '#40c4ff' }}
                  >
                    프로젝트 추가
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {/* 프로젝트 폴더 목록 */}
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        backgroundColor: '#232a36',
                        p: 2,
                        maxHeight: '600px',
                        overflow: 'auto',
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#e0e6ed', mb: 2 }}>
                        프로젝트 목록
                      </Typography>
                      {projectFolders.map(folder => (
                        <Box key={folder.projectName} sx={{ mb: 1 }}>
                          <Box
                            onClick={() =>
                              handleProjectExpand(folder.projectName)
                            }
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1,
                              cursor: 'pointer',
                              backgroundColor: expandedProjects.includes(
                                folder.projectName
                              )
                                ? '#2e3a4a'
                                : 'transparent',
                              borderRadius: 1,
                              '&:hover': { backgroundColor: '#2e3a4a' },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#e0e6ed',
                                fontWeight: 'bold',
                                flex: 1,
                              }}
                            >
                              📁 {folder.projectName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: '#b0b8c1', mr: 1 }}
                            >
                              {folder.types.length}개 타입
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteProjectFolder(folder.projectName);
                              }}
                              sx={{
                                color: '#f44336',
                                '&:hover': { backgroundColor: '#f4433620' },
                              }}
                              title="프로젝트 삭제"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          {expandedProjects.includes(folder.projectName) && (
                            <Box sx={{ ml: 2, mt: 1 }}>
                              {folder.types.map(type => (
                                <Box
                                  key={type.typeName}
                                  onClick={() =>
                                    handleTypeSelect(
                                      folder.projectName,
                                      type.typeName
                                    )
                                  }
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 1,
                                    cursor: 'pointer',
                                    backgroundColor:
                                      selectedProject === folder.projectName &&
                                      selectedType === type.typeName
                                        ? '#40c4ff20'
                                        : 'transparent',
                                    borderRadius: 1,
                                    '&:hover': { backgroundColor: '#40c4ff10' },
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: '#e0e6ed',
                                      fontSize: '13px',
                                      fontWeight: 'bold',
                                      flex: 1,
                                    }}
                                  >
                                    📄 {type.typeName}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: '#b0b8c1', mr: 1 }}
                                  >
                                    {type.measurements.length}개
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteProjectType(
                                        folder.projectName,
                                        type.typeName
                                      );
                                    }}
                                    sx={{
                                      color: '#f44336',
                                      '&:hover': {
                                        backgroundColor: '#f4433620',
                                      },
                                    }}
                                    title="타입 삭제"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Paper>
                  </Grid>

                  {/* 선택된 타입의 실측정보 목록 */}
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ backgroundColor: '#232a36', p: 2 }}>
                      {selectedProject && selectedType ? (
                        <>
                          <Typography
                            variant="h6"
                            sx={{ color: '#e0e6ed', mb: 2 }}
                          >
                            {selectedProject} - {selectedType} 표준 사이즈
                            {selectedItems.length > 0 && (
                              <Typography
                                component="span"
                                sx={{
                                  color: '#40c4ff',
                                  ml: 2,
                                  fontSize: '0.9em',
                                }}
                              >
                                ({selectedItems.length}개 선택됨)
                              </Typography>
                            )}
                          </Typography>
                          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                            {selectedItems.length > 0 && (
                              <Button
                                variant="contained"
                                startIcon={<AssignmentIcon />}
                                onClick={handleCreateEstimateFromSelectedItems}
                                sx={{
                                  backgroundColor: '#4caf50',
                                  '&:hover': { backgroundColor: '#45a049' },
                                }}
                              >
                                선택된 항목으로 견적서 작성 (
                                {selectedItems.length}개)
                              </Button>
                            )}
                          </Box>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                      width: 50,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={(() => {
                                        const currentItems =
                                          projectFolders
                                            .find(
                                              f =>
                                                f.projectName ===
                                                selectedProject
                                            )
                                            ?.types.find(
                                              t => t.typeName === selectedType
                                            )
                                            ?.measurements.map(
                                              item => item.id
                                            ) || [];
                                        return (
                                          currentItems.length > 0 &&
                                          selectedItems.length ===
                                            currentItems.length
                                        );
                                      })()}
                                      onChange={handleSelectAll}
                                      style={{ cursor: 'pointer' }}
                                    />
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    공간
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    제품종류
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    표준 가로(mm)
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    표준 세로(mm)
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    기타정보
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    작업
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {projectFolders
                                  .find(f => f.projectName === selectedProject)
                                  ?.types.find(t => t.typeName === selectedType)
                                  ?.measurements.map(project => (
                                    <TableRow key={project.id}>
                                      <TableCell>
                                        <input
                                          type="checkbox"
                                          checked={selectedItems.includes(
                                            project.id
                                          )}
                                          onChange={() =>
                                            handleItemSelect(project.id)
                                          }
                                          style={{ cursor: 'pointer' }}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {project.space}
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {(() => {
                                          const productName =
                                            project.description
                                              .split(' - ')[1]
                                              ?.split(' (')[0] || '';
                                          return getProductTypeFromName(
                                            productName
                                          );
                                        })()}
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {project.standardWidth}
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {project.standardHeight}
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {project.memo || '-'}
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleSetRepresentative(
                                                project.id
                                              )
                                            }
                                            sx={{
                                              color: project.isRepresentative
                                                ? '#ffd700'
                                                : '#b0b8c1',
                                              '&:hover': {
                                                backgroundColor: '#ffd70020',
                                              },
                                            }}
                                            title={
                                              project.isRepresentative
                                                ? '대표 사이즈'
                                                : '대표 사이즈로 설정'
                                            }
                                          >
                                            {project.isRepresentative ? (
                                              <StarIcon />
                                            ) : (
                                              <StarBorderIcon />
                                            )}
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleEditProject(project)
                                            }
                                            sx={{ color: '#40c4ff' }}
                                            title="편집"
                                          >
                                            <EditIcon />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleCreateEstimateFromProject(
                                                project
                                              )
                                            }
                                            sx={{ color: '#4caf50' }}
                                            title="견적서 작성"
                                          >
                                            <AssignmentIcon />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleDeleteProject(project.id)
                                            }
                                            sx={{ color: '#f44336' }}
                                            title="삭제"
                                          >
                                            <DeleteIcon />
                                          </IconButton>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body1" sx={{ color: '#b0b8c1' }}>
                            왼쪽에서 프로젝트와 타입을 선택해주세요
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* 타입별 보기 탭 */}
              <TabPanel value={projectTabValue} index={1}>
                <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#e0e6ed' }}>
                    타입별 표준 사이즈
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setProjectDialogOpen(true)}
                    sx={{ backgroundColor: '#40c4ff' }}
                  >
                    프로젝트 추가
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {/* 타입 목록 */}
                  <Grid item xs={12} md={3}>
                    <Paper
                      sx={{
                        backgroundColor: '#232a36',
                        p: 2,
                        maxHeight: '600px',
                        overflow: 'auto',
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#e0e6ed', mb: 2 }}>
                        타입 목록
                      </Typography>
                      {Array.from(
                        new Set(projectMeasurements.map(p => p.projectType))
                      ).map(type => (
                        <Box
                          key={type}
                          onClick={() => {
                            setSelectedType(type);
                            setSelectedProject('');
                            setSelectedItems([]);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1,
                            cursor: 'pointer',
                            backgroundColor:
                              selectedType === type
                                ? '#40c4ff20'
                                : 'transparent',
                            borderRadius: 1,
                            mb: 1,
                            '&:hover': { backgroundColor: '#40c4ff10' },
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#e0e6ed',
                              fontWeight: 'bold',
                              flex: 1,
                            }}
                          >
                            📄 {type}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: '#b0b8c1', mr: 1 }}
                          >
                            {
                              projectMeasurements.filter(
                                p => p.projectType === type
                              ).length
                            }
                            개
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              // 해당 타입의 모든 프로젝트 실측정보 삭제
                              if (
                                window.confirm(
                                  `"${type}" 타입의 모든 실측정보를 삭제하시겠습니까?`
                                )
                              ) {
                                const updatedProjects =
                                  projectMeasurements.filter(
                                    p => p.projectType !== type
                                  );
                                setProjectMeasurements(updatedProjects);
                                localStorage.setItem(
                                  'project_measurements',
                                  JSON.stringify(updatedProjects)
                                );
                                loadProjectMeasurements(); // 폴더 구조 업데이트
                                setSnackbar({
                                  open: true,
                                  message: `"${type}" 타입이 삭제되었습니다.`,
                                  severity: 'success',
                                });
                              }
                            }}
                            sx={{
                              color: '#f44336',
                              '&:hover': { backgroundColor: '#f4433620' },
                            }}
                            title="타입 삭제"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Paper>
                  </Grid>

                  {/* 선택된 타입의 실측정보 목록 */}
                  <Grid item xs={12} md={9}>
                    <Paper sx={{ backgroundColor: '#232a36', p: 2 }}>
                      {selectedType ? (
                        <>
                          <Typography
                            variant="h6"
                            sx={{ color: '#e0e6ed', mb: 2 }}
                          >
                            {selectedType} 타입 표준 사이즈
                            {selectedItems.length > 0 && (
                              <Typography
                                component="span"
                                sx={{
                                  color: '#40c4ff',
                                  ml: 2,
                                  fontSize: '0.9em',
                                }}
                              >
                                ({selectedItems.length}개 선택됨)
                              </Typography>
                            )}
                          </Typography>
                          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                            {selectedItems.length > 0 && (
                              <Button
                                variant="contained"
                                startIcon={<AssignmentIcon />}
                                onClick={handleCreateEstimateFromSelectedItems}
                                sx={{
                                  backgroundColor: '#4caf50',
                                  '&:hover': { backgroundColor: '#45a049' },
                                }}
                              >
                                선택된 항목으로 견적서 작성 (
                                {selectedItems.length}개)
                              </Button>
                            )}
                          </Box>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                      width: 50,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={(() => {
                                        const currentItems = projectMeasurements
                                          .filter(
                                            p => p.projectType === selectedType
                                          )
                                          .map(item => item.id);
                                        return (
                                          currentItems.length > 0 &&
                                          selectedItems.length ===
                                            currentItems.length
                                        );
                                      })()}
                                      onChange={handleSelectAll}
                                      style={{ cursor: 'pointer' }}
                                    />
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    프로젝트
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    공간
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    제품종류
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    표준 가로(mm)
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    표준 세로(mm)
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    기타정보
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: '#e0e6ed',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    작업
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {projectMeasurements
                                  .filter(p => p.projectType === selectedType)
                                  .map(project => (
                                    <TableRow key={project.id}>
                                      <TableCell>
                                        <input
                                          type="checkbox"
                                          checked={selectedItems.includes(
                                            project.id
                                          )}
                                          onChange={() =>
                                            handleItemSelect(project.id)
                                          }
                                          style={{ cursor: 'pointer' }}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {project.description.split(' - ')[0] ||
                                          '-'}
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {project.space}
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {(() => {
                                          const productName =
                                            project.description
                                              .split(' - ')[1]
                                              ?.split(' (')[0] || '';
                                          return getProductTypeFromName(
                                            productName
                                          );
                                        })()}
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {project.standardWidth}
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {project.standardHeight}
                                      </TableCell>
                                      <TableCell sx={{ color: '#e0e6ed' }}>
                                        {project.memo || '-'}
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleSetRepresentative(
                                                project.id
                                              )
                                            }
                                            sx={{
                                              color: project.isRepresentative
                                                ? '#ffd700'
                                                : '#b0b8c1',
                                              '&:hover': {
                                                backgroundColor: '#ffd70020',
                                              },
                                            }}
                                            title={
                                              project.isRepresentative
                                                ? '대표 사이즈'
                                                : '대표 사이즈로 설정'
                                            }
                                          >
                                            {project.isRepresentative ? (
                                              <StarIcon />
                                            ) : (
                                              <StarBorderIcon />
                                            )}
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleEditProject(project)
                                            }
                                            sx={{ color: '#40c4ff' }}
                                            title="편집"
                                          >
                                            <EditIcon />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleCreateEstimateFromProject(
                                                project
                                              )
                                            }
                                            sx={{ color: '#4caf50' }}
                                            title="견적서 작성"
                                          >
                                            <AssignmentIcon />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleDeleteProject(project.id)
                                            }
                                            sx={{ color: '#f44336' }}
                                            title="삭제"
                                          >
                                            <DeleteIcon />
                                          </IconButton>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body1" sx={{ color: '#b0b8c1' }}>
                            왼쪽에서 타입을 선택해주세요
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* 전체 목록 탭 */}
              <TabPanel value={projectTabValue} index={2}>
                <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#e0e6ed' }}>
                    전체 표준 사이즈 목록 ({projectMeasurements.length}개)
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setProjectDialogOpen(true)}
                    sx={{ backgroundColor: '#40c4ff' }}
                  >
                    프로젝트 추가
                  </Button>
                </Box>

                <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                  {selectedItems.length > 0 && (
                    <Button
                      variant="contained"
                      startIcon={<AssignmentIcon />}
                      onClick={handleCreateEstimateFromSelectedItems}
                      sx={{
                        backgroundColor: '#4caf50',
                        '&:hover': { backgroundColor: '#45a049' },
                      }}
                    >
                      선택된 항목으로 견적서 작성 ({selectedItems.length}개)
                    </Button>
                  )}
                </Box>

                <Paper sx={{ backgroundColor: '#232a36', p: 2 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              color: '#e0e6ed',
                              fontWeight: 'bold',
                              width: 50,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                projectMeasurements.length > 0 &&
                                selectedItems.length ===
                                  projectMeasurements.length
                              }
                              onChange={handleSelectAll}
                              style={{ cursor: 'pointer' }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                          >
                            프로젝트
                          </TableCell>
                          <TableCell
                            sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                          >
                            타입
                          </TableCell>
                          <TableCell
                            sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                          >
                            공간
                          </TableCell>
                          <TableCell
                            sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                          >
                            제품종류
                          </TableCell>
                          <TableCell
                            sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                          >
                            표준 가로(mm)
                          </TableCell>
                          <TableCell
                            sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                          >
                            표준 세로(mm)
                          </TableCell>
                          <TableCell
                            sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                          >
                            기타정보
                          </TableCell>
                          <TableCell
                            sx={{ color: '#e0e6ed', fontWeight: 'bold' }}
                          >
                            작업
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projectMeasurements.map(project => (
                          <TableRow key={project.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(project.id)}
                                onChange={() => handleItemSelect(project.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#e0e6ed' }}>
                              {project.description.split(' - ')[0] || '-'}
                            </TableCell>
                            <TableCell sx={{ color: '#e0e6ed' }}>
                              <Chip
                                label={project.projectType}
                                size="small"
                                sx={{
                                  backgroundColor: '#2e3a4a',
                                  color: '#e0e6ed',
                                  fontSize: '12px',
                                  border: '1px solid #40c4ff',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#e0e6ed' }}>
                              {project.space}
                            </TableCell>
                            <TableCell sx={{ color: '#e0e6ed' }}>
                              {(() => {
                                const productName =
                                  project.description
                                    .split(' - ')[1]
                                    ?.split(' (')[0] || '';
                                return getProductTypeFromName(productName);
                              })()}
                            </TableCell>
                            <TableCell sx={{ color: '#e0e6ed' }}>
                              {project.standardWidth}
                            </TableCell>
                            <TableCell sx={{ color: '#e0e6ed' }}>
                              {project.standardHeight}
                            </TableCell>
                            <TableCell sx={{ color: '#e0e6ed' }}>
                              {project.memo || '-'}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleSetRepresentative(project.id)
                                  }
                                  sx={{
                                    color: project.isRepresentative
                                      ? '#ffd700'
                                      : '#b0b8c1',
                                    '&:hover': { backgroundColor: '#ffd70020' },
                                  }}
                                  title={
                                    project.isRepresentative
                                      ? '대표 사이즈'
                                      : '대표 사이즈로 설정'
                                  }
                                >
                                  {project.isRepresentative ? (
                                    <StarIcon />
                                  ) : (
                                    <StarBorderIcon />
                                  )}
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditProject(project)}
                                  sx={{ color: '#40c4ff' }}
                                  title="편집"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleCreateEstimateFromProject(project)
                                  }
                                  sx={{ color: '#4caf50' }}
                                  title="견적서 작성"
                                >
                                  <AssignmentIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDeleteProject(project.id)
                                  }
                                  sx={{ color: '#f44336' }}
                                  title="삭제"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </TabPanel>
            </Paper>
          </Box>
        </TabPanel>
      </Paper>

      {/* 실측 상세보기 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: '#1e2633',
            color: '#e0e6ed',
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              height: '100%',
            }),
          },
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#1e2633',
          borderBottom: 1,
          borderColor: '#2e3a4a',
          position: 'relative'
        }}>
          {isMobile && (
            <IconButton
              onClick={() => setDetailDialogOpen(false)}
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
            실측 데이터 상세보기
          </Typography>
          {selectedEvent && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1, 
                color: '#b0b8c1',
                fontSize: isMobile ? '0.9rem' : '0.875rem',
                textAlign: isMobile ? 'center' : 'left',
              }}
            >
              {selectedEvent.customerName} - {selectedEvent.date}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ 
          p: isMobile ? 2 : 3,
          backgroundColor: '#1e2633',
          '& .MuiDialogContent-root': {
            backgroundColor: '#1e2633',
          }
        }}>
          {selectedEvent && (
            <Box>
              <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#b0bec5' }}>
                    고객명
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#e0e6ed' }}>
                    {selectedEvent.customerName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#b0bec5' }}>
                    견적서번호
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#40c4ff' }}>
                    {selectedEvent.estimateNo}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#b0bec5' }}>
                    실측일시
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#e0e6ed' }}>
                    {formatDate(selectedEvent.date)} {selectedEvent.time}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#b0bec5' }}>
                    실측항목
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#e0e6ed' }}>
                    {selectedEvent.measurementData.length}개
                  </Typography>
                </Grid>
              </Grid>

              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  color: '#40c4ff',
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: 600,
                }}
              >
                실측 데이터
              </Typography>
              <TableContainer
                component={Paper}
                sx={{ 
                  backgroundColor: '#2e3a4a',
                  maxHeight: isMobile ? '60vh' : '400px',
                  overflow: 'auto',
                }}
              >
                <Table size={isMobile ? "medium" : "small"}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#e0e6ed' }}>공간</TableCell>
                      <TableCell sx={{ color: '#e0e6ed' }}>제품명</TableCell>
                      <TableCell sx={{ color: '#e0e6ed' }}>
                        실측가로(mm)
                      </TableCell>
                      <TableCell sx={{ color: '#e0e6ed' }}>
                        실측세로(mm)
                      </TableCell>
                      <TableCell sx={{ color: '#e0e6ed' }}>줄방향</TableCell>
                      <TableCell sx={{ color: '#e0e6ed' }}>줄길이</TableCell>
                      <TableCell sx={{ color: '#e0e6ed' }}>메모</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedEvent.measurementData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ color: '#e0e6ed' }}>
                          {data.space}
                        </TableCell>
                        <TableCell sx={{ color: '#e0e6ed' }}>
                          {data.productName}
                        </TableCell>
                        <TableCell sx={{ color: '#e0e6ed' }}>
                          {data.measuredWidth}
                        </TableCell>
                        <TableCell sx={{ color: '#e0e6ed' }}>
                          {data.measuredHeight}
                        </TableCell>
                        <TableCell sx={{ color: '#e0e6ed' }}>
                          {data.lineDirection}
                        </TableCell>
                        <TableCell sx={{ color: '#e0e6ed' }}>
                          {data.lineLength}
                        </TableCell>
                        <TableCell sx={{ color: '#e0e6ed' }}>
                          {data.memo}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
              onClick={() => selectedEvent && handleCreateEstimate(selectedEvent)}
              variant="contained"
              sx={{ 
                backgroundColor: '#4caf50',
                '&:hover': {
                  backgroundColor: '#388e3c'
                }
              }}
            >
              견적서 작성
            </Button>
            <Button
              onClick={() => setDetailDialogOpen(false)}
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
        
        {/* 모바일에서 버튼들 */}
        {isMobile && (
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1,
            borderTop: 1, 
            borderColor: '#2e3a4a', 
            backgroundColor: '#1e2633'
          }}>
            <Button
              onClick={() => selectedEvent && handleCreateEstimate(selectedEvent)}
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#4caf50',
                minHeight: '48px',
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: '#388e3c'
                }
              }}
            >
              견적서 작성
            </Button>
          </Box>
        )}
      </Dialog>

      {/* 프로젝트 실측정보 추가/편집 다이얼로그 */}
      <Dialog
        open={projectDialogOpen}
        onClose={() => {
          setProjectDialogOpen(false);
          setEditingProject(null);
          setNewProject({
            projectType: '',
            space: '',
            standardWidth: '',
            standardHeight: '',
            description: '',
            memo: '',
          });
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: '#1e2633',
            color: '#e0e6ed',
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              height: '100%',
            }),
          },
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#1e2633',
          borderBottom: 1,
          borderColor: '#2e3a4a',
          position: 'relative'
        }}>
          {isMobile && (
            <IconButton
              onClick={() => {
                setProjectDialogOpen(false);
                setEditingProject(null);
                setNewProject({
                  projectType: '',
                  space: '',
                  standardWidth: '',
                  standardHeight: '',
                  description: '',
                  memo: '',
                });
              }}
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
            {editingProject ? '프로젝트 실측정보 편집' : '프로젝트 실측정보 추가'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ 
          p: isMobile ? 2 : 3,
          backgroundColor: '#1e2633',
          '& .MuiDialogContent-root': {
            backgroundColor: '#1e2633',
          }
        }}>
          <Grid container spacing={isMobile ? 1 : 2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>프로젝트 타입</InputLabel>
                <Select
                  value={newProject.projectType}
                  onChange={e =>
                    setNewProject(prev => ({
                      ...prev,
                      projectType: e.target.value,
                    }))
                  }
                  label="프로젝트 타입"
                >
                  <MenuItem value="아파트">아파트</MenuItem>
                  <MenuItem value="빌라">빌라</MenuItem>
                  <MenuItem value="상가">상가</MenuItem>
                  <MenuItem value="주택">주택</MenuItem>
                  <MenuItem value="사무실">사무실</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="공간"
                value={newProject.space}
                onChange={e =>
                  setNewProject(prev => ({ ...prev, space: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="표준 가로(mm)"
                type="number"
                value={newProject.standardWidth}
                onChange={e =>
                  setNewProject(prev => ({
                    ...prev,
                    standardWidth: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="표준 세로(mm)"
                type="number"
                value={newProject.standardHeight}
                onChange={e =>
                  setNewProject(prev => ({
                    ...prev,
                    standardHeight: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="기타정보"
                multiline
                rows={3}
                value={newProject.memo || ''}
                onChange={e =>
                  setNewProject(prev => ({ ...prev, memo: e.target.value }))
                }
                placeholder="메모나 기타 정보를 입력하세요"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="설명"
                multiline
                rows={3}
                value={newProject.description}
                onChange={e =>
                  setNewProject(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        {!isMobile && (
          <DialogActions sx={{ 
            borderTop: 1, 
            borderColor: '#2e3a4a', 
            p: 2,
            backgroundColor: '#1e2633'
          }}>
            <Button
              onClick={handleSaveProjectMeasurement}
              variant="contained"
              sx={{ 
                backgroundColor: '#40c4ff',
                '&:hover': {
                  backgroundColor: '#33a3cc'
                }
              }}
            >
              저장
            </Button>
            <Button
              onClick={() => {
                setProjectDialogOpen(false);
                setEditingProject(null);
                setNewProject({
                  projectType: '',
                  space: '',
                  standardWidth: '',
                  standardHeight: '',
                  description: '',
                  memo: '',
                });
              }}
              sx={{ 
                color: '#b0b8c1',
                '&:hover': {
                  backgroundColor: '#2e3a4a'
                }
              }}
            >
              취소
            </Button>
          </DialogActions>
        )}
        
        {/* 모바일에서 버튼들 */}
        {isMobile && (
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1,
            borderTop: 1, 
            borderColor: '#2e3a4a', 
            backgroundColor: '#1e2633'
          }}>
            <Button
              onClick={handleSaveProjectMeasurement}
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#40c4ff',
                minHeight: '48px',
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: '#33a3cc'
                }
              }}
            >
              저장
            </Button>
          </Box>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MeasurementData;
