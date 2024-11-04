import React, { useState, useEffect } from 'react';
import { Play, X } from 'lucide-react';

const AdContentLayout = ({ children }) => {
  const [showContent, setShowContent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // サイド広告のダミーデータ
  const sideAds = [
    { id: 1, title: '注目の広告', image: '/api/placeholder/300/250', link: '#' },
    { id: 2, title: 'おすすめ商品', image: '/api/placeholder/300/250', link: '#' },
    { id: 3, title: '期間限定セール', image: '/api/placeholder/300/250', link: '#' }
  ];

  useEffect(() => {
    let timer;
    if (isWatchingAd && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setShowContent(true);
      setIsWatchingAd(false);
    }
    return () => clearInterval(timer);
  }, [isWatchingAd, timeRemaining]);

  const startWatchingAd = () => {
    setIsWatchingAd(true);
  };

  const AdOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">動画広告</h3>
          {timeRemaining === 0 && (
            <button 
              onClick={() => setIsWatchingAd(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center mb-4">
          <img 
            src="/api/placeholder/640/360" 
            alt="広告動画" 
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="text-center">
          {timeRemaining > 0 ? (
            <p className="text-gray-600">広告終了まで {timeRemaining} 秒</p>
          ) : (
            <button
              onClick={() => setShowContent(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              コンテンツを見る
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const SideAd = ({ ad }) => (
    <a 
      href={ad.link}
      className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
    >
      <img src={ad.image} alt={ad.title} className="w-full h-auto" />
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900">{ad.title}</p>
        <p className="text-xs text-gray-500 mt-1">PR</p>
      </div>
    </a>
  );

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* メインコンテンツエリア */}
        <div className="flex-1">
          {!showContent ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h2 className="text-xl font-bold mb-4">プレミアムコンテンツ</h2>
              <p className="text-gray-600 mb-4">
                このコンテンツを見るには、15秒の広告視聴が必要です。
              </p>
              <button
                onClick={startWatchingAd}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center justify-center mx-auto"
              >
                <Play className="h-5 w-5 mr-2" />
                広告を視聴する
              </button>
            </div>
          ) : (
            children
          )}
        </div>

        {/* サイド広告エリア */}
        <div className="w-full md:w-80 space-y-4">
          {sideAds.map(ad => (
            <SideAd key={ad.id} ad={ad} />
          ))}
        </div>
      </div>

      {/* 動画広告オーバーレイ */}
      {isWatchingAd && <AdOverlay />}
    </div>
  );
};

export default AdContentLayout;