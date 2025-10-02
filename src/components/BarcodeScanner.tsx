import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  scannerId?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  scannerId = 'barcode-scanner'
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // スキャナーの初期化とクリーンアップ
  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return;
    }

    let mounted = true;
    let scanner: Html5Qrcode | null = null;
    let scannerElement: HTMLDivElement | null = null;

    const initScanner = async () => {
      try {
        console.log('Initializing scanner...');
        
        // コンテナ内にスキャナー用のdiv要素を動的に作成
        scannerElement = document.createElement('div');
        scannerElement.id = scannerId;
        scannerElement.style.width = '100%';
        scannerElement.style.height = '100%';
        scannerElement.style.position = 'absolute';
        scannerElement.style.top = '0';
        scannerElement.style.left = '0';
        containerRef.current?.appendChild(scannerElement);
        
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          throw new Error('カメラが見つかりませんでした');
        }

        let selectedCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        ) || devices[0];

        console.log('Selected camera:', selectedCamera);

        scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        // スキャンボックスのサイズをレスポンシブに設定
        const isMobileDevice = window.innerWidth < 768;
        const qrboxSize = isMobileDevice ? 
          { width: Math.min(300, window.innerWidth * 0.7), height: Math.min(300, window.innerWidth * 0.7) } : 
          { width: 250, height: 250 };

        await scanner.start(
          selectedCamera.id,
          { 
            fps: 10, 
            qrbox: qrboxSize,
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (mounted) {
              handleScanSuccess(decodedText);
            }
          },
          () => {}
        );

        if (mounted) {
          setIsScanning(true);
          console.log('Scanner started successfully');
        }
      } catch (error: any) {
        console.error('Scanner initialization failed:', error);
        if (mounted) {
          toast.error('カメラの起動に失敗しました: ' + (error.message || ''));
        }
      }
    };

    const timer = setTimeout(() => {
      if (mounted) {
        initScanner();
      }
    }, 300);

    // クリーンアップ関数
    return () => {
      mounted = false;
      clearTimeout(timer);

      const cleanup = async () => {
        if (scanner) {
          console.log('Cleaning up scanner...');
          try {
            await scanner.stop();
            console.log('Scanner stopped');
          } catch (err) {
            console.warn('Stop error:', err);
          }
        }

        // スキャナー要素をコンテナから削除
        if (scannerElement && containerRef.current) {
          try {
            containerRef.current.removeChild(scannerElement);
            console.log('Scanner element removed');
          } catch (err) {
            console.warn('Element removal error:', err);
          }
        }

        scannerRef.current = null;
        setIsScanning(false);
      };

      cleanup();
    };
  }, [isOpen, scannerId]);

  const handleScanSuccess = (barcode: string) => {
    if (lastScannedCode === barcode) {
      return;
    }

    setLastScannedCode(barcode);
    setScanHistory(prev => [barcode, ...prev.slice(0, 4)]);
    
    toast.success(`バーコードを読み取りました: ${barcode}`);
    onScan(barcode);
    
    setTimeout(() => {
      setLastScannedCode(null);
    }, 2000);
  };

  const handleManualInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const barcode = formData.get('barcode') as string;
    
    if (barcode.trim()) {
      handleScanSuccess(barcode.trim());
      e.currentTarget.reset();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black ${isMobile ? 'bg-opacity-95' : 'bg-opacity-75'} flex items-center justify-center z-50`}>
      {isMobile ? (
        // モバイル用フルスクリーン表示
        <div className="w-full h-full flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 bg-black text-white">
            <div className="flex items-center space-x-3">
              <Camera className="h-6 w-6" />
              <h2 className="text-lg font-semibold">バーコードスキャン</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* スキャナーエリア */}
          <div className="flex-1 relative overflow-hidden">
            <div 
              ref={containerRef}
              className="w-full h-full bg-black relative"
              style={{ minHeight: '400px' }}
            >
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center text-white z-10 pointer-events-none">
                  <div className="text-center">
                    <Camera className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">カメラを起動中...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* スキャンガイド */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="w-72 h-72 border-4 border-white rounded-lg opacity-70 shadow-lg relative">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-400"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-400"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-400"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-400"></div>
              </div>
            </div>
          </div>

          {/* コントロールパネル */}
          <div className="bg-black p-4 space-y-3">
            {!showManualInput ? (
              <>
                <button
                  onClick={() => setShowManualInput(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  手動入力
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <form onSubmit={handleManualInput} className="space-y-3">
                <input
                  name="barcode"
                  type="text"
                  placeholder="バーコードを手動で入力"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-black"
                  autoFocus
                />
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    追加
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualInput(false)}
                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    戻る
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        // デスクトップ用モーダル表示
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Camera className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">バーコードスキャン</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* スキャナーエリア */}
          <div className="mb-6">
            <div 
              ref={containerRef}
              className="w-full bg-gray-100 rounded-lg relative overflow-hidden"
              style={{ height: '400px' }}
            >
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-10 pointer-events-none">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <p>カメラを起動中...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 手動入力 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">手動入力</h3>
            <form onSubmit={handleManualInput} className="flex space-x-3">
              <input
                name="barcode"
                type="text"
                placeholder="バーコードを手動で入力"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                追加
              </button>
            </form>
          </div>

          {/* スキャン履歴 */}
          {scanHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">最近のスキャン</h3>
              <div className="space-y-2">
                {scanHistory.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-mono text-sm">{code}</span>
                    </div>
                    <button
                      onClick={() => onScan(code)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      再使用
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 使用方法 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">使用方法:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• カメラにバーコードを向けてください</li>
                  <li>• 自動で読み取りが行われます</li>
                  <li>• 読み取れない場合は手動入力も可能です</li>
                </ul>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
