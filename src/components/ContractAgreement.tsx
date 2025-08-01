import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import SignatureCanvas from './SignatureCanvas';
import ContractTemplate from './ContractTemplate';
import { Contract } from './ContractTemplate';

interface ContractAgreementProps {
  contract: Contract;
  onComplete: (data: AgreementData) => void;
}

export interface AgreementData {
  isAgreed: boolean;
  signatureData?: string;
  agreementMethod: 'signature' | 'checkbox';
  agreementDate: string;
}

const defaultAgreementItems = [
  '본 계약의 모든 내용을 숙지하였습니다.',
  '계약금 납부 후 계약이 확정됨을 이해하였습니다.',
  '취소 및 환불 규정에 동의합니다.',
  '제품의 설치 및 시공 일정은 협의 후 진행됨을 이해하였습니다.',
  '제품의 품질보증 기간 및 조건을 확인하였습니다.',
];

const ContractAgreement: React.FC<ContractAgreementProps> = ({
  contract,
  onComplete,
}) => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [signature, setSignature] = useState<string>();
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [agreementItems, setAgreementItems] = useState(defaultAgreementItems);
  const [editingItem, setEditingItem] = useState<{
    index: number;
    text: string;
  } | null>(null);
  const [newItem, setNewItem] = useState('');
  const [agreementConfirmed, setAgreementConfirmed] = useState(false);
  const [contractTemplateOpen, setContractTemplateOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );

  const handleAgree = () => {
    setIsAgreed(true);
  };

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
    setShowSignaturePad(false);
    setAgreementConfirmed(true);
  };

  const handleAgreementConfirm = () => {
    setAgreementConfirmed(true);
  };

  const handleComplete = (method: 'signature' | 'checkbox') => {
    onComplete({
      isAgreed: true,
      signatureData: method === 'signature' ? signature : undefined,
      agreementMethod: method,
      agreementDate: new Date().toISOString(),
    });
  };

  const handleEditItem = (index: number) => {
    setEditingItem({ index, text: agreementItems[index] });
  };

  const handleSaveEdit = () => {
    if (editingItem) {
      const newItems = [...agreementItems];
      newItems[editingItem.index] = editingItem.text;
      setAgreementItems(newItems);
      setEditingItem(null);
    }
  };

  const handleDeleteItem = (index: number) => {
    const newItems = agreementItems.filter((_, i) => i !== index);
    setAgreementItems(newItems);
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setAgreementItems([...agreementItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleResetToDefault = () => {
    setAgreementItems(defaultAgreementItems);
  };

  const handlePrint = () => {
    setSelectedContract(contract);
    setContractTemplateOpen(true);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        width: '100%',
        maxWidth: 600,
        backgroundColor: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
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
        <Typography variant="h6" sx={{ color: 'var(--text-color)' }}>
          계약 동의
        </Typography>
        <IconButton
          onClick={() => setShowSettingsDialog(true)}
          sx={{ color: 'var(--text-color)' }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>

      <Box sx={{ my: 2 }}>
        <Typography variant="body1" paragraph sx={{ color: 'var(--text-color)' }}>
          계약 내용에 대한 동의
        </Typography>
        {agreementItems.map((item, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{ color: 'var(--text-secondary-color)' }}
            paragraph
          >
            {index + 1}. {item}
          </Typography>
        ))}
      </Box>

      <Divider sx={{ my: 2, borderColor: 'var(--border-color)' }} />

      {agreementConfirmed && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: 'var(--primary-color)',
            borderRadius: 1,
            border: '1px solid var(--border-color)',
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-color)', textAlign: 'center' }}
          >
            ✓ 동의가 확인되었습니다. 계약 완료 버튼을 눌러 계약을 완료하세요.
          </Typography>
        </Box>
      )}

      <Box sx={{ my: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={isAgreed}
              onChange={handleAgree}
              sx={{
                color: 'var(--primary-color)',
                '&.Mui-checked': { color: 'var(--primary-color)' },
              }}
            />
          }
          label="위 내용에 동의합니다"
          sx={{ color: 'var(--text-color)' }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setShowSignaturePad(true)}
          disabled={!isAgreed}
          sx={{
            color: 'var(--text-color)',
            borderColor: 'var(--border-color)',
            '&:hover': { backgroundColor: 'var(--hover-color)', borderColor: 'var(--hover-color)' },
            '&:disabled': { color: 'var(--text-secondary-color)', borderColor: 'var(--border-color)' },
          }}
        >
          서명하기
        </Button>
        <Button
          variant="contained"
          onClick={handleAgreementConfirm}
          disabled={!isAgreed}
          sx={{
            backgroundColor: 'var(--primary-color)',
            color: 'var(--text-color)',
            '&:hover': { backgroundColor: 'var(--hover-color)' },
            '&:disabled': { backgroundColor: 'var(--text-secondary-color)', color: 'var(--text-color)' },
          }}
        >
          동의 확인
        </Button>
        {agreementConfirmed && (
          <Button
            variant="contained"
            onClick={() => handleComplete(signature ? 'signature' : 'checkbox')}
            sx={{
              backgroundColor: 'var(--primary-color)',
              color: 'var(--text-color)',
              '&:hover': { backgroundColor: 'var(--hover-color)' },
            }}
          >
            계약 완료
          </Button>
        )}
        <Button 
          onClick={handlePrint} 
          startIcon={<PrintIcon />}
          sx={{
            color: 'var(--text-color)',
            '&:hover': { backgroundColor: 'var(--hover-color)' },
          }}
        >
          계약서 출력
        </Button>
      </Box>

      {/* 서명 다이얼로그 */}
      <Dialog
        open={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
        disableAutoFocus
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }}>전자 서명</DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
          <SignatureCanvas
            onSave={handleSignatureSave}
            onClear={() => setSignature(undefined)}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
          <Button
            onClick={() => setShowSignaturePad(false)}
            sx={{ color: 'var(--text-color)' }}
          >
            취소
          </Button>
        </DialogActions>
      </Dialog>

      {/* 동의 항목 설정 다이얼로그 */}
      <Dialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-color)', backgroundColor: 'var(--surface-color)' }}>계약 동의 항목 설정</DialogTitle>
        <DialogContent sx={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
          <List>
            {agreementItems.map((item, index) => (
              <ListItem key={index} sx={{ borderBottom: '1px solid var(--border-color)' }}>
                {editingItem?.index === index ? (
                  <TextField
                    fullWidth
                    value={editingItem.text}
                    onChange={e =>
                      setEditingItem({ ...editingItem, text: e.target.value })
                    }
                    sx={{
                      '& .MuiInputBase-input': { color: 'var(--text-color)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'var(--border-color)' },
                        '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                      },
                    }}
                  />
                ) : (
                  <ListItemText
                    primary={`${index + 1}. ${item}`}
                    sx={{ color: 'var(--text-color)' }}
                  />
                )}
                <ListItemSecondaryAction>
                  {editingItem?.index === index ? (
                    <Button onClick={handleSaveEdit} sx={{ color: 'var(--primary-color)' }}>
                      저장
                    </Button>
                  ) : (
                    <>
                      <IconButton
                        edge="end"
                        onClick={() => handleEditItem(index)}
                        sx={{ color: 'var(--primary-color)', mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteItem(index)}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="새로운 동의 항목 추가"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              sx={{
                '& .MuiInputBase-input': { color: 'var(--text-color)' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'var(--border-color)' },
                  '&:hover fieldset': { borderColor: 'var(--hover-color)' },
                  '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'var(--text-secondary-color)',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddItem}
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: 'var(--primary-color)',
                color: 'var(--text-color)',
                '&:hover': { backgroundColor: 'var(--hover-color)' },
              }}
            >
              추가
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border-color)', p: 2, backgroundColor: 'var(--surface-color)' }}>
          <Button onClick={handleResetToDefault} sx={{ color: '#f44336' }}>
            기본값으로 초기화
          </Button>
          <Button
            onClick={() => setShowSettingsDialog(false)}
            sx={{ color: 'var(--text-color)' }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {selectedContract && (
        <ContractTemplate
          contract={selectedContract}
          open={contractTemplateOpen}
          onClose={() => setContractTemplateOpen(false)}
        />
      )}
    </Paper>
  );
};

export default ContractAgreement;
