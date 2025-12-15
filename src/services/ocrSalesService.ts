// OCR売上登録サービス

import { OCRResult, MenuMatchCandidate } from '../types/sales';

// OpenAI型定義（オプショナル依存）
interface OpenAIClient {
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: Array<{
          role: string;
          content: Array<{
            type: string;
            text?: string;
            image_url?: { url: string };
          }>;
        }>;
        max_tokens: number;
      }) => Promise<{
        choices: Array<{
          message?: {
            content?: string;
          };
        }>;
      }>;
    };
  };
}

interface ParsedReceiptItem {
  name: string;
  quantity?: number;
  unit_price?: number;
  subtotal?: number;
}

interface ParsedReceipt {
  items: ParsedReceiptItem[];
  total_amount: number;
  receipt_date: string;
}

interface RecipeItem {
  product_id: string;
  product_name: string;
  quantity_required: number;
}

interface InventoryTransactionData {
  store_id: string;
  product_id: string;
  quantity: number;
  type: string;
  reference_type: string;
  reference_id: string;
  previous_quantity: number;
  new_quantity: number;
  notes: string;
}

/**
 * OCRサービスクラス
 * 技術選定: OpenAI Vision API (GPT-4 Vision)
 * 
 * 選定理由:
 * 1. 高精度な日本語認識（特に手書き・印字混在レシート）
 * 2. 構造化データ抽出（JSON形式で直接取得可能）
 * 3. 文脈理解能力（略語・俗称の補完）
 * 4. コスト効率（Google Cloud Vision比で同等以下）
 */
export class OCRService {
  private openai: OpenAIClient | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  private async getClient(): Promise<OpenAIClient> {
    if (this.openai) return this.openai;
    try {
      // OpenAI は別途インストールが必要: npm install openai
      const OpenAI = (await (Function('return import("openai")')() as Promise<{ default: new (config: { apiKey: string }) => OpenAIClient }>)).default;
      this.openai = new OpenAI({ apiKey: this.apiKey });
      return this.openai;
    } catch {
      throw new Error('OpenAI module is not installed. Please run: npm install openai');
    }
  }

  /**
   * レシート画像からOCR解析
   */
  async analyzeReceipt(imageBase64: string): Promise<OCRResult> {
    try {
      const client = await this.getClient();
      const response = await client.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `以下のレシート画像から、販売された商品情報を抽出してください。
                
                抽出してほしい情報:
                - 商品名
                - 数量
                - 単価
                - 小計
                - 合計金額
                - 日付（可能であれば）
                
                JSON形式で以下の構造で返してください:
                {
                  "items": [
                    {
                      "name": "商品名",
                      "quantity": 数量,
                      "unit_price": 単価,
                      "subtotal": 小計
                    }
                  ],
                  "total_amount": 合計金額,
                  "receipt_date": "YYYY-MM-DD"
                }
                
                注意事項:
                - 略語や俗称も正式名称に変換してください（例: ポテサラ → ポテトサラダ）
                - 税込/税抜の区別が不明な場合は税込として扱ってください
                - 不明な項目はnullとしてください`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OCR解析結果が取得できませんでした');
      }

      // JSONパース
      const parsed = JSON.parse(content) as ParsedReceipt;
      
      return {
        raw_text: content,
        items: parsed.items.map((item: ParsedReceiptItem) => ({
          name: item.name,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          subtotal: item.subtotal ?? item.unit_price ?? 0,
          confidence: 0.9 // Vision APIは信頼度を返さないため固定値
        })),
        total_amount: parsed.total_amount,
        receipt_date: parsed.receipt_date,
        confidence: 0.9
      };
    } catch (error) {
      console.error('OCR解析エラー:', error);
      throw new Error('レシートの解析に失敗しました');
    }
  }

  /**
   * 代替案: Google Cloud Vision API
   * より詳細な位置情報や信頼度が必要な場合に使用
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async analyzeReceiptWithGoogleVision(_imageBase64: string): Promise<OCRResult> {
    // Google Cloud Vision APIの実装例
    // const vision = require('@google-cloud/vision');
    // const client = new vision.ImageAnnotatorClient();
    // ...
    throw new Error('Google Vision APIは未実装');
  }
}

/**
 * メニュー名寄せサービス
 */
export class MenuMatchingService {
  /**
   * 名寄せロジック: レーベンシュタイン距離 + カナ変換 + 部分一致
   */
  async matchMenuNames(
    detectedName: string,
    menuList: { id: string; name: string; price: number }[]
  ): Promise<MenuMatchCandidate[]> {
    const candidates: MenuMatchCandidate[] = [];

    for (const menu of menuList) {
      const similarity = this.calculateSimilarity(detectedName, menu.name);
      
      if (similarity > 0.6) { // 60%以上の類似度
        candidates.push({
          menu_id: menu.id,
          menu_name: menu.name,
          detected_name: detectedName,
          similarity_score: similarity,
          price_match: false, // 価格比較は別途実施
          suggested_match: similarity > 0.8
        });
      }
    }

    // 類似度順にソート
    return candidates.sort((a, b) => b.similarity_score - a.similarity_score);
  }

  /**
   * 文字列類似度計算（レーベンシュタイン距離ベース）
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // カタカナ・ひらがな正規化
    const normalized1 = this.normalizeString(str1);
    const normalized2 = this.normalizeString(str2);

    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    return 1 - distance / maxLength;
  }

  /**
   * 文字列正規化（カナ統一、スペース削除など）
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[\u3041-\u3096]/g, (match) => 
        String.fromCharCode(match.charCodeAt(0) + 0x60) // ひらがな→カタカナ
      )
      .replace(/\s+/g, '') // スペース削除
      .replace(/[ー−]/g, '') // 長音削除
      .trim();
  }

  /**
   * レーベンシュタイン距離計算
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // 置換
            matrix[i][j - 1] + 1,     // 挿入
            matrix[i - 1][j] + 1      // 削除
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

/**
 * 在庫減算サービス
 */
export class InventoryDeductionService {
  /**
   * 売上に基づいて在庫を減算
   * エラーハンドリング: マイナス在庫を許容
   */
  async deductInventoryFromSales(
    salesDetailId: string,
    menuId: string,
    quantitySold: number,
    storeId: string
  ): Promise<{
    success: boolean;
    warnings: string[];
    transactions: InventoryTransactionData[];
  }> {
    const warnings: string[] = [];
    const transactions: InventoryTransactionData[] = [];

    try {
      // レシピ取得
      const recipes = await this.getRecipes(menuId);

      if (recipes.length === 0) {
        warnings.push(`メニュー「${menuId}」のレシピが未登録です。在庫減算をスキップしました。`);
        return { success: false, warnings, transactions };
      }

      // 各材料の在庫を減算
      for (const recipe of recipes) {
        const requiredQuantity = recipe.quantity_required * quantitySold;
        const currentStock = await this.getCurrentStock(recipe.product_id, storeId);
        const newStock = currentStock - requiredQuantity;

        // マイナス在庫を許容（警告のみ）
        if (newStock < 0) {
          warnings.push(
            `材料「${recipe.product_name}」の在庫が不足しています（現在: ${currentStock}、必要: ${requiredQuantity}）`
          );
        }

        // 在庫トランザクション記録
        const transaction = await this.createInventoryTransaction({
          store_id: storeId,
          product_id: recipe.product_id,
          quantity: -requiredQuantity,
          type: 'sales',
          reference_type: 'sales_detail',
          reference_id: salesDetailId,
          previous_quantity: currentStock,
          new_quantity: newStock,
          notes: `売上による自動減算（メニュー: ${menuId}、販売数: ${quantitySold}）`
        });

        transactions.push(transaction);

        // 在庫更新
        await this.updateProductStock(recipe.product_id, storeId, newStock);
      }

      return { success: true, warnings, transactions };
    } catch (error) {
      console.error('在庫減算エラー:', error);
      throw new Error('在庫減算処理に失敗しました');
    }
  }

  // ダミーメソッド（実装は db.ts に委譲）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getRecipes(_menuId: string): Promise<RecipeItem[]> {
    // 実装: データベースからレシピ取得
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getCurrentStock(_productId: string, _storeId: string): Promise<number> {
    // 実装: 現在の在庫数を取得
    return 0;
  }

  private async createInventoryTransaction(data: InventoryTransactionData): Promise<InventoryTransactionData> {
    // 実装: 在庫トランザクション作成
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async updateProductStock(_productId: string, _storeId: string, _newStock: number): Promise<void> {
    // 実装: 在庫数更新
  }
}
