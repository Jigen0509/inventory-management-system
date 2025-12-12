// Yahoo!ショッピングAPI v3 商品検索（JANコード検索）
// 必要: .envにYAHOO_APP_IDを設定

const YAHOO_API_ENDPOINT = '/yahoo-proxy/ShoppingWebService/V3/itemSearch';


export async function fetchYahooProductByJAN(janCode: string) {
  const appId = import.meta.env.VITE_YAHOO_APP_ID;
  if (!appId) {
    throw new Error('Yahoo!ショッピングAPIのアプリケーションIDが設定されていません');
  }

  const params = new URLSearchParams({
    appid: appId,
    jan_code: janCode,
    results: '1',
    sort: '-score',
  });

  const url = `${YAHOO_API_ENDPOINT}?${params.toString()}`;
  
  // これでブラウザは「自分のサーバー(/yahoo-proxy)」にアクセスし、
  // サーバーが裏で「Yahoo」にアクセスしてくれるようになります（CORS回避）
  const res = await fetch(url);
  
  if (!res.ok) throw new Error('Yahoo! APIリクエスト失敗');
  const data = await res.json();
  if (!data.hits || data.hits.length === 0) return null;
  return data.hits[0];
}