import React, { useState } from 'react';
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

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState('general');

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

  const messages = [
    {
      id: 1,
      sender: '田中 太郎',
      content: 'おはようございます！今日の在庫状況はいかがでしょうか？',
      time: '09:00',
      isOwn: false,
      avatar: '👨‍💼'
    },
    {
      id: 2,
      sender: '佐藤 花子',
      content: 'おはようございます！りんごジュースが少なくなってきました。',
      time: '09:05',
      isOwn: false,
      avatar: '👩‍💼'
    },
    {
      id: 3,
      sender: 'あなた',
      content: 'ありがとうございます。午後に補充の予定です。',
      time: '09:10',
      isOwn: true,
      avatar: '👤'
    },
    {
      id: 4,
      sender: '山田 次郎',
      content: '食パンも残り2個になっています。明日の朝の分を確保したいです。',
      time: '09:15',
      isOwn: false,
      avatar: '👨‍🍳'
    },
    {
      id: 5,
      sender: 'あなた',
      content: '了解です。パン工房さんに追加発注しておきます。',
      time: '09:20',
      isOwn: true,
      avatar: '👤'
    },
    {
      id: 6,
      sender: '佐藤 花子',
      content: 'ありがとうございます！助かります🙏',
      time: '09:22',
      isOwn: false,
      avatar: '👩‍💼'
    }
  ];

  const quickActions = [
    { icon: '📦', text: '在庫確認依頼' },
    { icon: '🚚', text: '配送状況確認' },
    { icon: '⚠️', text: '緊急事項報告' },
    { icon: '📝', text: '作業完了報告' }
  ];

  const sendMessage = () => {
    if (message.trim()) {
      // メッセージ送信の処理（Supabase実装時に追加）
      setMessage('');
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
                    {room.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{room.name}</p>
                    <p className="text-xs text-gray-500">{room.members}人のメンバー</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{room.lastTime}</p>
                  {room.unread > 0 && (
                    <span className="inline-block w-5 h-5 bg-red-500 text-white text-xs rounded-full text-center leading-5 mt-1">
                      {room.unread}
                    </span>
                  )}
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
                {chatRooms.find(room => room.id === activeChat)?.members}人のメンバー • オンライン
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
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex space-x-2 max-w-xs lg:max-w-md ${msg.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                  {msg.avatar}
                </div>
                <div>
                  <div className={`px-4 py-2 rounded-lg ${
                    msg.isOwn 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div className="flex items-center mt-1 space-x-1">
                    <p className="text-xs text-gray-500">{msg.sender} • {msg.time}</p>
                    {msg.isOwn && <CheckCheck className="h-3 w-3 text-blue-600" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="メッセージを入力..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button 
              onClick={sendMessage}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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