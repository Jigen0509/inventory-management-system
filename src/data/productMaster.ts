// 商品マスタデータベース（JANコード → 商品情報のマッピング）
export interface ProductMaster {
  barcode: string;
  name: string;
  category: string;
  defaultPrice?: number;
  defaultCost?: number;
  description?: string;
  manufacturer?: string;
}

export const productMasterDatabase: Record<string, ProductMaster> = {
  // 飲み物
  '4901777313026': { barcode: '4901777313026', name: 'いろはす 555ml', category: '飲み物', defaultPrice: 108, defaultCost: 70, manufacturer: 'コカ・コーラ' },
  '4902102079792': { barcode: '4902102079792', name: '爽健美茶 600ml', category: '飲み物', defaultPrice: 140, defaultCost: 90, manufacturer: 'コカ・コーラ' },
  '4902102077798': { barcode: '4902102077798', name: 'アクエリアス 500ml', category: '飲み物', defaultPrice: 140, defaultCost: 90, manufacturer: 'コカ・コーラ' },
  '4902102072458': { barcode: '4902102072458', name: 'ファンタグレープ 500ml', category: '飲み物', defaultPrice: 140, defaultCost: 85, manufacturer: 'コカ・コーラ' },
  '4902102072441': { barcode: '4902102072441', name: 'ファンタオレンジ 500ml', category: '飲み物', defaultPrice: 140, defaultCost: 85, manufacturer: 'コカ・コーラ' },
  '4902102115117': { barcode: '4902102115117', name: 'コカ・コーラ 500ml', category: '飲み物', defaultPrice: 140, defaultCost: 85, manufacturer: 'コカ・コーラ' },
  '4902102113595': { barcode: '4902102113595', name: 'コカ・コーラゼロ 500ml', category: '飲み物', defaultPrice: 140, defaultCost: 85, manufacturer: 'コカ・コーラ' },
  
  // サントリー
  '4901777289208': { barcode: '4901777289208', name: '伊右衛門 525ml', category: '飲み物', defaultPrice: 140, defaultCost: 88, manufacturer: 'サントリー' },
  '4901777243767': { barcode: '4901777243767', name: 'ボス レインボーマウンテン 185g', category: '飲み物', defaultPrice: 130, defaultCost: 80, manufacturer: 'サントリー' },
  '4901777289192': { barcode: '4901777289192', name: '烏龍茶 525ml', category: '飲み物', defaultPrice: 140, defaultCost: 88, manufacturer: 'サントリー' },
  
  // アサヒ飲料
  '4514603333619': { barcode: '4514603333619', name: '三ツ矢サイダー 500ml', category: '飲み物', defaultPrice: 140, defaultCost: 85, manufacturer: 'アサヒ飲料' },
  '4514603348934': { barcode: '4514603348934', name: 'カルピスウォーター 500ml', category: '飲み物', defaultPrice: 140, defaultCost: 90, manufacturer: 'アサヒ飲料' },
  '4514603406016': { barcode: '4514603406016', name: '十六茶 600ml', category: '飲み物', defaultPrice: 140, defaultCost: 88, manufacturer: 'アサヒ飲料' },
  
  // キリンビバレッジ
  '4909411065997': { barcode: '4909411065997', name: '午後の紅茶 ストレートティー 500ml', category: '飲み物', defaultPrice: 140, defaultCost: 88, manufacturer: 'キリンビバレッジ' },
  '4909411066000': { barcode: '4909411066000', name: '午後の紅茶 レモンティー 500ml', category: '飲み物', defaultPrice: 140, defaultCost: 88, manufacturer: 'キリンビバレッジ' },
  '4909411066017': { barcode: '4909411066017', name: '午後の紅茶 ミルクティー 500ml', category: '飲み物', defaultPrice: 140, defaultCost: 88, manufacturer: 'キリンビバレッジ' },
  '4909411044930': { barcode: '4909411044930', name: '生茶 525ml', category: '飲み物', defaultPrice: 140, defaultCost: 88, manufacturer: 'キリンビバレッジ' },
  
  // パン類
  '4901820124233': { barcode: '4901820124233', name: 'ヤマザキ ランチパック ピーナッツ', category: 'パン類', defaultPrice: 130, defaultCost: 80, manufacturer: '山崎製パン' },
  '4901820124240': { barcode: '4901820124240', name: 'ヤマザキ ランチパック たまご', category: 'パン類', defaultPrice: 130, defaultCost: 80, manufacturer: '山崎製パン' },
  '4901820125087': { barcode: '4901820125087', name: 'ヤマザキ 薄皮つぶあんぱん', category: 'パン類', defaultPrice: 120, defaultCost: 70, manufacturer: '山崎製パン' },
  '4901820125094': { barcode: '4901820125094', name: 'ヤマザキ 薄皮クリームパン', category: 'パン類', defaultPrice: 120, defaultCost: 70, manufacturer: '山崎製パン' },
  '4901820270015': { barcode: '4901820270015', name: 'ヤマザキ ダブルソフト 6枚切', category: 'パン類', defaultPrice: 230, defaultCost: 150, manufacturer: '山崎製パン' },
  
  // Pasco（パスコ）
  '4901820001024': { barcode: '4901820001024', name: 'パスコ 超熟食パン 6枚切', category: 'パン類', defaultPrice: 220, defaultCost: 145, manufacturer: 'Pasco' },
  '4901820088157': { barcode: '4901820088157', name: 'パスコ スナックパン', category: 'パン類', defaultPrice: 110, defaultCost: 68, manufacturer: 'Pasco' },
  
  // 乳製品
  '4902705001411': { barcode: '4902705001411', name: '明治おいしい牛乳 900ml', category: '乳製品', defaultPrice: 280, defaultCost: 190, manufacturer: '明治' },
  '4902705119406': { barcode: '4902705119406', name: '明治 ブルガリアヨーグルト 400g', category: '乳製品', defaultPrice: 150, defaultCost: 100, manufacturer: '明治' },
  '4902705124400': { barcode: '4902705124400', name: '明治 R-1 ドリンク 112ml', category: '乳製品', defaultPrice: 140, defaultCost: 95, manufacturer: '明治' },
  '4902720117746': { barcode: '4902720117746', name: 'メグミルク 牛乳 1000ml', category: '乳製品', defaultPrice: 250, defaultCost: 170, manufacturer: '雪印メグミルク' },
  '4903111260416': { barcode: '4903111260416', name: 'ナチュレ 恵 ヨーグルト 400g', category: '乳製品', defaultPrice: 160, defaultCost: 105, manufacturer: '雪印メグミルク' },
  
  // チーズ
  '4902720101899': { barcode: '4902720101899', name: '雪印 スライスチーズ 7枚入', category: '乳製品', defaultPrice: 260, defaultCost: 175, manufacturer: '雪印メグミルク' },
  '4902705215702': { barcode: '4902705215702', name: '明治 北海道十勝スマートチーズ', category: '乳製品', defaultPrice: 320, defaultCost: 220, manufacturer: '明治' },
  
  // 主食（米、パスタなど）
  '4902110335095': { barcode: '4902110335095', name: 'サトウのごはん 新潟県産コシヒカリ 200g×3', category: '主食', defaultPrice: 380, defaultCost: 260, manufacturer: 'サトウ食品' },
  '4902110354409': { barcode: '4902110354409', name: 'サトウのごはん 銀シャリ 200g×5', category: '主食', defaultPrice: 600, defaultCost: 420, manufacturer: 'サトウ食品' },
  '4902110331905': { barcode: '4902110331905', name: 'サトウのごはん 北海道産ななつぼし 200g', category: '主食', defaultPrice: 140, defaultCost: 95, manufacturer: 'サトウ食品' },
  
  // パスタ
  '4902110357196': { barcode: '4902110357196', name: 'マ・マー スパゲティ 1.6mm 500g', category: '主食', defaultPrice: 280, defaultCost: 180, manufacturer: '日清製粉' },
  
  // 冷凍食品
  '4902170103016': { barcode: '4902170103016', name: '味の素 冷凍餃子 12個入', category: '冷凍食品', defaultPrice: 330, defaultCost: 220, manufacturer: '味の素' },
  '4902170091337': { barcode: '4902170091337', name: '味の素 冷凍チャーハン 600g', category: '冷凍食品', defaultPrice: 450, defaultCost: 300, manufacturer: '味の素' },
  '4902170141605': { barcode: '4902170141605', name: '味の素 ギョーザ 12個入', category: '冷凍食品', defaultPrice: 280, defaultCost: 185, manufacturer: '味の素' },
  '4901990315883': { barcode: '4901990315883', name: 'ニチレイ 唐揚げ 300g', category: '冷凍食品', defaultPrice: 380, defaultCost: 250, manufacturer: 'ニチレイ' },
  '4901990313452': { barcode: '4901990313452', name: 'ニチレイ えびピラフ 450g', category: '冷凍食品', defaultPrice: 420, defaultCost: 280, manufacturer: 'ニチレイ' },
  
  // お菓子
  '4901330534738': { barcode: '4901330534738', name: 'カルビー ポテトチップス うすしお味 60g', category: 'お菓子', defaultPrice: 120, defaultCost: 75, manufacturer: 'カルビー' },
  '4901330534745': { barcode: '4901330534745', name: 'カルビー ポテトチップス コンソメパンチ 60g', category: 'お菓子', defaultPrice: 120, defaultCost: 75, manufacturer: 'カルビー' },
  '4901330534752': { barcode: '4901330534752', name: 'カルビー ポテトチップス のりしお 60g', category: 'お菓子', defaultPrice: 120, defaultCost: 75, manufacturer: 'カルビー' },
  '4901330540753': { barcode: '4901330540753', name: 'カルビー じゃがりこ サラダ', category: 'お菓子', defaultPrice: 150, defaultCost: 95, manufacturer: 'カルビー' },
  '4901330540760': { barcode: '4901330540760', name: 'カルビー じゃがりこ チーズ', category: 'お菓子', defaultPrice: 150, defaultCost: 95, manufacturer: 'カルビー' },
  
  // 湖池屋
  '4901335101010': { barcode: '4901335101010', name: '湖池屋 ポテトチップス のり塩 60g', category: 'お菓子', defaultPrice: 120, defaultCost: 75, manufacturer: '湖池屋' },
  '4901335111019': { barcode: '4901335111019', name: '湖池屋 カラムーチョ ホットチリ味 55g', category: 'お菓子', defaultPrice: 120, defaultCost: 75, manufacturer: '湖池屋' },
  
  // 亀田製菓
  '4901313018965': { barcode: '4901313018965', name: '亀田の柿の種 200g', category: 'お菓子', defaultPrice: 280, defaultCost: 180, manufacturer: '亀田製菓' },
  '4901313021514': { barcode: '4901313021514', name: 'ハッピーターン 108g', category: 'お菓子', defaultPrice: 180, defaultCost: 115, manufacturer: '亀田製菓' },
  
  // チョコレート・キャンディー
  '4902888213830': { barcode: '4902888213830', name: '明治 ミルクチョコレート 50g', category: 'お菓子', defaultPrice: 100, defaultCost: 63, manufacturer: '明治' },
  '4902705105485': { barcode: '4902705105485', name: '明治 アーモンドチョコ 88g', category: 'お菓子', defaultPrice: 220, defaultCost: 140, manufacturer: '明治' },
  '4902888545443': { barcode: '4902888545443', name: 'キットカット ミニ 14枚', category: 'お菓子', defaultPrice: 350, defaultCost: 230, manufacturer: 'ネスレ日本' },
  
  // 調味料
  '4901515123184': { barcode: '4901515123184', name: 'キッコーマン しょうゆ 1L', category: '調味料', defaultPrice: 380, defaultCost: 250, manufacturer: 'キッコーマン' },
  '4901515001857': { barcode: '4901515001857', name: 'キッコーマン 本つゆ 500ml', category: '調味料', defaultPrice: 350, defaultCost: 230, manufacturer: 'キッコーマン' },
  '4902402000014': { barcode: '4902402000014', name: '味の素 味の素 70g', category: '調味料', defaultPrice: 180, defaultCost: 115, manufacturer: '味の素' },
  '4902402851050': { barcode: '4902402851050', name: '味の素 ほんだし 8g×20袋', category: '調味料', defaultPrice: 450, defaultCost: 300, manufacturer: '味の素' },
  '4902402850053': { barcode: '4902402850053', name: '味の素 Cook Do 回鍋肉用 3-4人前', category: '調味料', defaultPrice: 230, defaultCost: 150, manufacturer: '味の素' },
  
  // マヨネーズ・ドレッシング
  '4902402827192': { barcode: '4902402827192', name: 'キューピー マヨネーズ 450g', category: '調味料', defaultPrice: 380, defaultCost: 250, manufacturer: 'キューピー' },
  '4902402827208': { barcode: '4902402827208', name: 'キューピー ハーフ 300g', category: '調味料', defaultPrice: 350, defaultCost: 230, manufacturer: 'キューピー' },
  
  // ソース
  '4901592901013': { barcode: '4901592901013', name: 'ブルドッグ 中濃ソース 500ml', category: '調味料', defaultPrice: 280, defaultCost: 180, manufacturer: 'ブルドッグソース' },
  '4901592901020': { barcode: '4901592901020', name: 'ブルドッグ ウスターソース 500ml', category: '調味料', defaultPrice: 280, defaultCost: 180, manufacturer: 'ブルドッグソース' },
  
  // カップ麺
  '4902105001035': { barcode: '4902105001035', name: '日清 カップヌードル', category: '主食', defaultPrice: 230, defaultCost: 150, manufacturer: '日清食品' },
  '4902105001042': { barcode: '4902105001042', name: '日清 カップヌードル シーフード', category: '主食', defaultPrice: 230, defaultCost: 150, manufacturer: '日清食品' },
  '4902105001059': { barcode: '4902105001059', name: '日清 カップヌードル カレー', category: '主食', defaultPrice: 230, defaultCost: 150, manufacturer: '日清食品' },
  '4902105113486': { barcode: '4902105113486', name: '日清 どん兵衛 きつねうどん', category: '主食', defaultPrice: 220, defaultCost: 145, manufacturer: '日清食品' },
  '4902105113493': { barcode: '4902105113493', name: '日清 どん兵衛 天ぷらそば', category: '主食', defaultPrice: 220, defaultCost: 145, manufacturer: '日清食品' },
  
  // 東洋水産
  '4901990343619': { barcode: '4901990343619', name: 'マルちゃん 赤いきつねうどん', category: '主食', defaultPrice: 220, defaultCost: 145, manufacturer: '東洋水産' },
  '4901990343626': { barcode: '4901990343626', name: 'マルちゃん 緑のたぬき天そば', category: '主食', defaultPrice: 220, defaultCost: 145, manufacturer: '東洋水産' },
  
  // サンヨー食品
  '4901734011011': { barcode: '4901734011011', name: 'サッポロ一番 塩らーめん', category: '主食', defaultPrice: 130, defaultCost: 85, manufacturer: 'サンヨー食品' },
  '4901734011028': { barcode: '4901734011028', name: 'サッポロ一番 みそらーめん', category: '主食', defaultPrice: 130, defaultCost: 85, manufacturer: 'サンヨー食品' },
  '4901734011035': { barcode: '4901734011035', name: 'サッポロ一番 しょうゆ味', category: '主食', defaultPrice: 130, defaultCost: 85, manufacturer: 'サンヨー食品' },
};

// バーコードから商品情報を検索する関数
export const searchProductByBarcode = (barcode: string): ProductMaster | null => {
  return productMasterDatabase[barcode] || null;
};

// カテゴリ一覧を取得
export const getCategories = (): string[] => {
  const categories = new Set<string>();
  Object.values(productMasterDatabase).forEach(product => {
    categories.add(product.category);
  });
  return Array.from(categories).sort();
};

// メーカー一覧を取得
export const getManufacturers = (): string[] => {
  const manufacturers = new Set<string>();
  Object.values(productMasterDatabase).forEach(product => {
    if (product.manufacturer) {
      manufacturers.add(product.manufacturer);
    }
  });
  return Array.from(manufacturers).sort();
};
