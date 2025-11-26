export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  cost: number;
  barcode: string;
}

export const allProducts: Product[] = [
  // 飲み物
  { id: 1, name: 'コーラ', category: '飲み物', price: 120, cost: 60, barcode: '4901234567890' },
  { id: 2, name: 'オレンジジュース', category: '飲み物', price: 150, cost: 80, barcode: '4901234567891' },
  { id: 3, name: 'コーヒー', category: '飲み物', price: 200, cost: 100, barcode: '4901234567892' },
  { id: 4, name: '紅茶', category: '飲み物', price: 180, cost: 90, barcode: '4901234567893' },
  { id: 5, name: '緑茶', category: '飲み物', price: 100, cost: 50, barcode: '4901234567894' },
  { id: 6, name: 'ウーロン茶', category: '飲み物', price: 120, cost: 60, barcode: '4901234567895' },
  { id: 7, name: 'ミネラルウォーター', category: '飲み物', price: 80, cost: 40, barcode: '4901234567896' },
  { id: 8, name: 'スポーツドリンク', category: '飲み物', price: 140, cost: 70, barcode: '4901234567897' },
  { id: 9, name: '牛乳', category: '飲み物', price: 160, cost: 80, barcode: '4901234567898' },
  { id: 10, name: '豆乳', category: '飲み物', price: 180, cost: 90, barcode: '4901234567899' },
  
  // パン類
  { id: 11, name: '食パン', category: 'パン類', price: 200, cost: 100, barcode: '4901234567900' },
  { id: 12, name: 'クロワッサン', category: 'パン類', price: 150, cost: 75, barcode: '4901234567901' },
  { id: 13, name: 'メロンパン', category: 'パン類', price: 120, cost: 60, barcode: '4901234567902' },
  { id: 14, name: 'あんパン', category: 'パン類', price: 100, cost: 50, barcode: '4901234567903' },
  { id: 15, name: 'ジャムパン', category: 'パン類', price: 110, cost: 55, barcode: '4901234567904' },
  { id: 16, name: 'チョコパン', category: 'パン類', price: 130, cost: 65, barcode: '4901234567905' },
  { id: 17, name: 'フランスパン', category: 'パン類', price: 180, cost: 90, barcode: '4901234567906' },
  { id: 18, name: 'ベーグル', category: 'パン類', price: 160, cost: 80, barcode: '4901234567907' },
  { id: 19, name: 'ドーナツ', category: 'パン類', price: 140, cost: 70, barcode: '4901234567908' },
  { id: 20, name: 'マフィン', category: 'パン類', price: 170, cost: 85, barcode: '4901234567909' },
  
  // 乳製品
  { id: 21, name: 'ヨーグルト', category: '乳製品', price: 120, cost: 60, barcode: '4901234567910' },
  { id: 22, name: 'チーズ', category: '乳製品', price: 300, cost: 150, barcode: '4901234567911' },
  { id: 23, name: 'バター', category: '乳製品', price: 250, cost: 125, barcode: '4901234567912' },
  { id: 24, name: 'マーガリン', category: '乳製品', price: 200, cost: 100, barcode: '4901234567913' },
  { id: 25, name: '生クリーム', category: '乳製品', price: 180, cost: 90, barcode: '4901234567914' },
  { id: 26, name: 'アイスクリーム', category: '乳製品', price: 150, cost: 75, barcode: '4901234567915' },
  { id: 27, name: 'プリン', category: '乳製品', price: 100, cost: 50, barcode: '4901234567916' },
  { id: 28, name: 'カスタード', category: '乳製品', price: 160, cost: 80, barcode: '4901234567917' },
  { id: 29, name: 'スキムミルク', category: '乳製品', price: 140, cost: 70, barcode: '4901234567918' },
  { id: 30, name: '練乳', category: '乳製品', price: 120, cost: 60, barcode: '4901234567919' },
  
  // 主食
  { id: 31, name: '白米', category: '主食', price: 300, cost: 150, barcode: '4901234567920' },
  { id: 32, name: '玄米', category: '主食', price: 400, cost: 200, barcode: '4901234567921' },
  { id: 33, name: 'うどん', category: '主食', price: 200, cost: 100, barcode: '4901234567922' },
  { id: 34, name: 'そば', category: '主食', price: 250, cost: 125, barcode: '4901234567923' },
  { id: 35, name: 'ラーメン', category: '主食', price: 180, cost: 90, barcode: '4901234567924' },
  { id: 36, name: 'パスタ', category: '主食', price: 220, cost: 110, barcode: '4901234567925' },
  { id: 37, name: 'スパゲッティ', category: '主食', price: 200, cost: 100, barcode: '4901234567926' },
  { id: 38, name: 'マカロニ', category: '主食', price: 150, cost: 75, barcode: '4901234567927' },
  { id: 39, name: 'ビーフン', category: '主食', price: 160, cost: 80, barcode: '4901234567928' },
  { id: 40, name: '春雨', category: '主食', price: 140, cost: 70, barcode: '4901234567929' },
  
  // 冷凍食品
  { id: 41, name: '冷凍餃子', category: '冷凍食品', price: 300, cost: 150, barcode: '4901234567930' },
  { id: 42, name: '冷凍シュウマイ', category: '冷凍食品', price: 280, cost: 140, barcode: '4901234567931' },
  { id: 43, name: '冷凍ピザ', category: '冷凍食品', price: 400, cost: 200, barcode: '4901234567932' },
  { id: 44, name: '冷凍ハンバーグ', category: '冷凍食品', price: 350, cost: 175, barcode: '4901234567933' },
  { id: 45, name: '冷凍唐揚げ', category: '冷凍食品', price: 320, cost: 160, barcode: '4901234567934' },
  { id: 46, name: '冷凍エビフライ', category: '冷凍食品', price: 380, cost: 190, barcode: '4901234567935' },
  { id: 47, name: '冷凍コロッケ', category: '冷凍食品', price: 250, cost: 125, barcode: '4901234567936' },
  { id: 48, name: '冷凍天ぷら', category: '冷凍食品', price: 300, cost: 150, barcode: '4901234567937' },
  { id: 49, name: '冷凍春巻き', category: '冷凍食品', price: 280, cost: 140, barcode: '4901234567938' },
  { id: 50, name: '冷凍チャーハン', category: '冷凍食品', price: 200, cost: 100, barcode: '4901234567939' },
  
  // お菓子
  { id: 51, name: 'チョコレート', category: 'お菓子', price: 100, cost: 50, barcode: '4901234567940' },
  { id: 52, name: 'クッキー', category: 'お菓子', price: 150, cost: 75, barcode: '4901234567941' },
  { id: 53, name: 'ケーキ', category: 'お菓子', price: 300, cost: 150, barcode: '4901234567942' },
  { id: 54, name: 'キャンディ', category: 'お菓子', price: 80, cost: 40, barcode: '4901234567943' },
  { id: 55, name: 'ガム', category: 'お菓子', price: 60, cost: 30, barcode: '4901234567944' },
  { id: 56, name: 'ポテトチップス', category: 'お菓子', price: 120, cost: 60, barcode: '4901234567945' },
  { id: 57, name: 'せんべい', category: 'お菓子', price: 100, cost: 50, barcode: '4901234567946' },
  { id: 58, name: 'あられ', category: 'お菓子', price: 90, cost: 45, barcode: '4901234567947' },
  { id: 59, name: 'ようかん', category: 'お菓子', price: 200, cost: 100, barcode: '4901234567948' },
  { id: 60, name: 'まんじゅう', category: 'お菓子', price: 150, cost: 75, barcode: '4901234567949' },
  
  // 調味料
  { id: 61, name: '醤油', category: '調味料', price: 200, cost: 100, barcode: '4901234567950' },
  { id: 62, name: '味噌', category: '調味料', price: 250, cost: 125, barcode: '4901234567951' },
  { id: 63, name: '塩', category: '調味料', price: 100, cost: 50, barcode: '4901234567952' },
  { id: 64, name: '砂糖', category: '調味料', price: 150, cost: 75, barcode: '4901234567953' },
  { id: 65, name: '酢', category: '調味料', price: 120, cost: 60, barcode: '4901234567954' },
  { id: 66, name: '油', category: '調味料', price: 300, cost: 150, barcode: '4901234567955' },
  { id: 67, name: 'マヨネーズ', category: '調味料', price: 180, cost: 90, barcode: '4901234567956' },
  { id: 68, name: 'ケチャップ', category: '調味料', price: 160, cost: 80, barcode: '4901234567957' },
  { id: 69, name: 'ソース', category: '調味料', price: 140, cost: 70, barcode: '4901234567958' },
  { id: 70, name: '胡椒', category: '調味料', price: 200, cost: 100, barcode: '4901234567959' },
  
  // インスタント
  { id: 71, name: 'カップラーメン', category: 'インスタント', price: 120, cost: 60, barcode: '4901234567960' },
  { id: 72, name: 'インスタントラーメン', category: 'インスタント', price: 100, cost: 50, barcode: '4901234567961' },
  { id: 73, name: 'カップスープ', category: 'インスタント', price: 80, cost: 40, barcode: '4901234567962' },
  { id: 74, name: 'インスタント味噌汁', category: 'インスタント', price: 60, cost: 30, barcode: '4901234567963' },
  { id: 75, name: 'レトルトカレー', category: 'インスタント', price: 200, cost: 100, barcode: '4901234567964' },
  { id: 76, name: 'レトルトハンバーグ', category: 'インスタント', price: 250, cost: 125, barcode: '4901234567965' },
  { id: 77, name: 'レトルトシチュー', category: 'インスタント', price: 180, cost: 90, barcode: '4901234567966' },
  { id: 78, name: 'インスタントコーヒー', category: 'インスタント', price: 300, cost: 150, barcode: '4901234567967' },
  { id: 79, name: 'インスタント紅茶', category: 'インスタント', price: 200, cost: 100, barcode: '4901234567968' },
  { id: 80, name: 'フリーズドライ食品', category: 'インスタント', price: 400, cost: 200, barcode: '4901234567969' },
  
  // 野菜
  { id: 81, name: '玉ねぎ', category: '野菜', price: 100, cost: 50, barcode: '4901234567970' },
  { id: 82, name: '人参', category: '野菜', price: 120, cost: 60, barcode: '4901234567971' },
  { id: 83, name: 'じゃがいも', category: '野菜', price: 150, cost: 75, barcode: '4901234567972' },
  { id: 84, name: 'キャベツ', category: '野菜', price: 200, cost: 100, barcode: '4901234567973' },
  { id: 85, name: 'レタス', category: '野菜', price: 180, cost: 90, barcode: '4901234567974' },
  { id: 86, name: 'トマト', category: '野菜', price: 250, cost: 125, barcode: '4901234567975' },
  { id: 87, name: 'きゅうり', category: '野菜', price: 120, cost: 60, barcode: '4901234567976' },
  { id: 88, name: 'なす', category: '野菜', price: 200, cost: 100, barcode: '4901234567977' },
  { id: 89, name: 'ピーマン', category: '野菜', price: 150, cost: 75, barcode: '4901234567978' },
  { id: 90, name: 'ほうれん草', category: '野菜', price: 180, cost: 90, barcode: '4901234567979' },
  
  // 肉類
  { id: 91, name: '牛肉', category: '肉類', price: 800, cost: 400, barcode: '4901234567980' },
  { id: 92, name: '豚肉', category: '肉類', price: 600, cost: 300, barcode: '4901234567981' },
  { id: 93, name: '鶏肉', category: '肉類', price: 500, cost: 250, barcode: '4901234567982' },
  { id: 94, name: 'ハム', category: '肉類', price: 400, cost: 200, barcode: '4901234567983' },
  { id: 95, name: 'ソーセージ', category: '肉類', price: 350, cost: 175, barcode: '4901234567984' },
  { id: 96, name: 'ベーコン', category: '肉類', price: 450, cost: 225, barcode: '4901234567985' },
  { id: 97, name: 'ウインナー', category: '肉類', price: 300, cost: 150, barcode: '4901234567986' },
  { id: 98, name: 'サラミ', category: '肉類', price: 500, cost: 250, barcode: '4901234567987' },
  { id: 99, name: 'コンビーフ', category: '肉類', price: 200, cost: 100, barcode: '4901234567988' },
  { id: 100, name: 'ツナ缶', category: '肉類', price: 150, cost: 75, barcode: '4901234567989' }
];