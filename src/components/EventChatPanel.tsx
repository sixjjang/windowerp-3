import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { fcmService } from '../utils/firebaseDataService';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface EventChatPanelProps {
  eventId: string;
  user: User;
  title?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
}

const EventChatPanel: React.FC<EventChatPanelProps> = ({ eventId, user, title }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // 실시간 구독
  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    const commentsRef = collection(db, 'schedules', eventId, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar,
          message: data.message,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        });
      });
      setMessages(msgs);
      setLoading(false);
      // 스크롤 맨 아래로
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    });
    return () => unsubscribe();
  }, [eventId]);

  // 메시지 전송
  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      // 푸시 알림이 포함된 스케줄 채팅 메시지 전송
      await fcmService.sendScheduleChatMessageWithNotification(
        user.name,
        newMessage.trim(),
        user.id,
        eventId,
        title
      );
      setNewMessage('');
    } catch (error) {
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Paper sx={{ mt: 3, p: 2, backgroundColor: '#1e2634', borderRadius: 2, border: '1px solid #2e3a4a', maxHeight: 400, display: 'flex', flexDirection: 'column', height: 400 }}>
      <Typography variant="h6" sx={{ mb: 2, color: '#40c4ff' }}>
        {title || '채팅'}
      </Typography>
      <Box ref={chatScrollRef} sx={{ flex: 1, overflowY: 'auto', mb: 2, pr: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : messages.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#b0b8c1', textAlign: 'center', mt: 2 }}>메시지가 없습니다.</Typography>
        ) : (
          messages.map(msg => (
            <Box key={msg.id} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: '#2e3a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#40c4ff', fontSize: 18 }}>
                {msg.userAvatar ? <img src={msg.userAvatar} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%' }} /> : msg.userName[0]}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#b0b8c1' }}>{msg.userName}</Typography>
                <Typography variant="body2" sx={{ color: '#e0e6ed', whiteSpace: 'pre-line' }}>{msg.message}</Typography>
                <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7em' }}>{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}</Typography>
              </Box>
            </Box>
          ))
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="메시지를 입력하세요"
          size="small"
          fullWidth
          multiline
          minRows={1}
          maxRows={3}
          sx={{ background: '#232a36', color: '#e0e6ed', borderRadius: 1, '& .MuiInputBase-input': { color: '#e0e6ed' } }}
          disabled={sending}
        />
        <Button variant="contained" onClick={handleSend} disabled={sending || !newMessage.trim()} sx={{ minWidth: 64 }}>
          전송
        </Button>
      </Box>
    </Paper>
  );
};

export default EventChatPanel; 