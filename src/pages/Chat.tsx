import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Search, 
  Phone, 
  Video, 
  MoreVertical,
  Plus,
  Users,
  MessageCircle,
  Image,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { db } from '../lib/supabase';
import toast from 'react-hot-toast';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const { currentStore } = useStore();
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState('general');
  const [messages, setMessages] = useState<any[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatRooms = [
    {
      id: 'general',
      name: '全体チャット',
      members: 5,
      lastMessage: '在庫の確認をお願いします',
      lastTime: '14:30',
      unread: 2,
      online: true
    },
    {
      id: 'inventory',
      name: '在庫管理グループ',
      members: 3,
      lastMessage: 'りんごジュースの追加発注済み',
      lastTime: '12:45',
      unread: 0,
      online: true
    },
    {
      id: 'orders',
      name: '注文処理チーム',
      members: 4,
      lastMessage: '午後の配送準備完了です',
      lastTime: '11:20',
      unread: 1,
      online: false
    },
    {
      id: 'urgent',
      name: '緊急連絡',
      members: 5,
      lastMessage: '期限切れ商品の処理について',
      lastTime: '昨日',
      unread: 0,
      online: false
    }
  ];

  // メッセージをデータベースから取得
  useEffect(() => {
    loadMessages();
    loadOnlineMembers();
  }, [activeChat, currentStore?.id]);

  // メッセージが表示されたら自動で既読を登録
  useEffect(() => {
    const markAsRead = async () => {
      if (!user?.id) return;

      for (const msg of messages) {
        if (msg.sender_id !== user.id) {
          // 自分以外のメッセージを既読にする
          try {
            await db.markMessageAsRead(msg.id, user.id);
          } catch (err) {
            // 既に既読済みの場合はエラーになるため無視
          }
        }
      }
    };

    markAsRead();
  }, [messages, user?.id]);

  const loadMessages = async () => {
    if (!currentStore?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await db.getChatMessages(currentStore.id, 50);
      
      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      if (data) {
        setMessages(data);
        // メッセージをスクロール
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOnlineMembers = async () => {
    if (!currentStore?.id) return;

    try {
      const { data, error } = await db.getOnlineMembers(currentStore.id);

      if (error) {
        console.error('Error loading online members:', error);
        return;
      }

      if (data) {
        setOnlineMembers(data);
      }
    } catch (error) {
      console.error('Error loading online members:', error);
    }
  };

  const quickActions = [
    { icon: '📦', text: '在庫確認依頼' },
    { icon: '🚚', text: '配送状況確認' },
    { icon: '⚠️', text: '緊急事項報告' },
    { icon: '📝', text: '作業完了報告' }
  ];

  const sendMessage = async () => {
    if (!message.trim() || !user?.id || !currentStore?.id) return;

    const messageText = message;
    setMessage('');

    try {
      const { data: newMessage, error } = await db.sendChatMessage({
        store_id: currentStore.id,
        sender_id: user.id,
        message: messageText,
        is_system: false
      });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('メッセージ送信に失敗しました');
        setMessage(messageText); // 元に戻す
        return;
      }

      // 送信者自身の既読を登録
      if (newMessage?.id) {
        try {
          await db.markMessageAsRead(newMessage.id, user.id);
        } catch (err) {
          // 既読登録のエラーは無視
        }
      }

      // メッセージを再読み込み
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('メッセージ送信中にエラーが発生しました');
      setMessage(messageText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* サイドバー - チャットルーム一覧 */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* ヘッダー */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">チャット</h2>
            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="チャットを検索..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* チャットルーム一覧 */}
        <div className="flex-1 overflow-y-auto">
          {chatRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => setActiveChat(room.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                activeChat === room.id ? 'bg-blue-50 border-r-4 border-r-blue-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    {onlineMembers.length > 0 && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{room.name}</p>
                    <p className="text-xs text-gray-500">{onlineMembers.length}人がオンライン</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{room.lastTime}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 truncate">{room.lastMessage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* メインチャット画面 */}
      <div className="flex-1 flex flex-col">
        {/* チャットヘッダー */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {chatRooms.find(room => room.id === activeChat)?.name}
              </h3>
              <p className="text-sm text-green-600">
                {onlineMembers.length}人がオンライン
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Phone className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Video className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* メッセージ一覧 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">メッセージを読み込み中...</p>
            </div>
          )}
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">メッセージはまだありません</p>
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            const senderName = msg.sender?.name || '不明なユーザー';
            const createdTime = new Date(msg.created_at).toLocaleTimeString('ja-JP', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm text-white font-bold">
                    {senderName.charAt(0)}
                  </div>
                  <div>
                    <div className={`px-4 py-2 rounded-lg ${
                      isOwn 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <div className="flex items-center mt-1 space-x-1">
                      <p className="text-xs text-gray-500">{senderName} • {createdTime}</p>
                      {isOwn && <CheckCheck className="h-3 w-3 text-blue-600" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* クイックアクション */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2 mb-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
              >
                {action.icon} {action.text}
              </button>
            ))}
          </div>

          {/* メッセージ入力 */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Paperclip className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Image className="h-5 w-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="メッセージを入力... (Shift+Enterで改行)"
                rows={1}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <button 
              onClick={sendMessage}
              disabled={!message.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;