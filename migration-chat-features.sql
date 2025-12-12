-- マイグレーション: チャット既読管理とオンラインメンバー機能
-- Supabaseのデータベースエディタで実行してください

-- 1. 既読状態管理テーブル
CREATE TABLE IF NOT EXISTS chat_message_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- 2. インデックス追加（クエリ性能向上）
CREATE INDEX idx_chat_message_reads_message ON chat_message_reads(message_id);
CREATE INDEX idx_chat_message_reads_user ON chat_message_reads(user_id);
CREATE INDEX idx_chat_message_reads_read_at ON chat_message_reads(read_at DESC);

-- 3. RLS ポリシー
ALTER TABLE chat_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reads" ON chat_message_reads 
  FOR SELECT USING (user_id = auth.uid() OR true);

CREATE POLICY "Users can create own reads" ON chat_message_reads 
  FOR INSERT WITH CHECK (user_id = auth.uid());
