import { useState } from 'react';
import { Button } from './ui/button';

interface ShareButtonProps {
  title: string;
  description: string;
  url?: string;
}

export default function ShareButton({ title, description, url }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const shareUrl = url || window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('링크가 복사되었습니다!');
      setShowMenu(false);
    } catch (err) {
      console.error('링크 복사 실패:', err);
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleKakaoShare = () => {
    // 카카오톡 SDK가 로드되어 있고 초기화되었는지 확인
    if (typeof window.Kakao === 'undefined' || !window.Kakao.isInitialized()) {
      alert('카카오톡 공유 기능을 사용할 수 없습니다. 링크 복사를 이용해주세요.');
      return;
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: title,
          description: description,
          imageUrl: 'https://mud-kage.kakao.com/dn/NTmhS/btqfEUdFAUf/FjKzkZsnoeE4o19klTOVI1/openlink_640x640s.jpg',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl
          }
        },
        buttons: [
          {
            title: '스케줄 보기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl
            }
          }
        ]
      });
      setShowMenu(false);
    } catch (err) {
      console.error('카카오톡 공유 실패:', err);
      alert('카카오톡 공유에 실패했습니다. 링크 복사를 이용해주세요.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: shareUrl
        });
        setShowMenu(false);
      } catch (err) {
        // 사용자가 취소한 경우는 에러로 처리하지 않음
        if ((err as Error).name !== 'AbortError') {
          console.error('공유 실패:', err);
        }
      }
    } else {
      // Native Share API를 지원하지 않으면 링크 복사
      handleCopyLink();
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-gradient-to-r from-[#F4CE6A] to-[#E0BA5B] text-gray-900 hover:from-[#E0BA5B] hover:to-[#D4A84A] shadow-lg flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span>공유하기</span>
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          ></div>

          {/* Share Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 z-50 overflow-hidden animate-scale-in">
            <div className="p-4 border-b bg-gradient-to-r from-[#F4CE6A]/20 to-[#E0BA5B]/20">
              <h3 className="font-bold text-gray-900">공유하기</h3>
              <p className="text-xs text-gray-600 mt-1">친구들과 스케줄을 공유하세요</p>
            </div>

            <div className="p-2 space-y-1">
              {/* 카카오톡 공유 */}
              {typeof window !== 'undefined' && typeof window.Kakao !== 'undefined' && window.Kakao.isInitialized() && (
                <button
                  onClick={handleKakaoShare}
                  className="w-full px-4 py-3 rounded-xl hover:bg-yellow-50 transition-colors flex items-center space-x-3 text-left"
                >
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-xl">💬</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">카카오톡</p>
                    <p className="text-xs text-gray-500">카카오톡으로 공유</p>
                  </div>
                </button>
              )}

              {/* 링크 복사 */}
              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center space-x-3 text-left"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">링크 복사</p>
                  <p className="text-xs text-gray-500">URL 복사하기</p>
                </div>
              </button>

              {/* 네이티브 공유 (모바일) */}
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full px-4 py-3 rounded-xl hover:bg-green-50 transition-colors flex items-center space-x-3 text-left"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">기타 앱</p>
                    <p className="text-xs text-gray-500">다른 앱으로 공유</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
