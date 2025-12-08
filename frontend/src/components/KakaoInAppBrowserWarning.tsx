import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';

/**
 * 카카오톡 인앱 브라우저 감지
 */
export function isKakaoInAppBrowser(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('kakaotalk');
}

/**
 * 기타 인앱 브라우저 감지 (네이버, 페이스북 등)
 */
export function isInAppBrowser(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('kakaotalk') ||
    userAgent.includes('naver') ||
    userAgent.includes('fbav') || // Facebook
    userAgent.includes('fban') || // Facebook
    userAgent.includes('instagram')
  );
}

/**
 * 현재 URL을 외부 브라우저에서 열기
 */
function openInExternalBrowser() {
  const currentUrl = window.location.href;

  // iOS Safari로 열기
  if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
    window.location.href = currentUrl;
  } else {
    // Android Chrome으로 열기
    const intent = `intent://${currentUrl.replace(/https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intent;
  }
}

/**
 * 카카오톡 인앱 브라우저 경고 컴포넌트
 */
export function KakaoInAppBrowserWarning() {
  if (!isKakaoInAppBrowser()) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>카카오톡 인앱 브라우저에서는 로그인이 제한됩니다</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Google 보안 정책으로 인해 카카오톡 앱 내에서는 로그인할 수 없습니다.
          <br />
          아래 버튼을 눌러 외부 브라우저(Safari, Chrome)에서 열어주세요.
        </p>
        <div className="space-y-2">
          <Button
            onClick={openInExternalBrowser}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            외부 브라우저에서 열기
          </Button>
          <div className="text-xs text-muted-foreground mt-2">
            <p className="font-semibold mb-1">또는 직접 열기:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>화면 우측 상단 <strong>⋯</strong> (더보기) 버튼 클릭</li>
              <li><strong>다른 브라우저로 열기</strong> 또는 <strong>Safari에서 열기</strong> 선택</li>
            </ul>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * 일반 인앱 브라우저 경고 컴포넌트
 */
export function InAppBrowserWarning() {
  if (!isInAppBrowser() || isKakaoInAppBrowser()) {
    return null;
  }

  return (
    <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        인앱 브라우저에서는 일부 기능이 제한될 수 있습니다
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        <p className="mb-2">
          로그인 문제가 발생하면 Chrome, Safari 등 일반 브라우저에서 접속해주세요.
        </p>
        <Button
          onClick={openInExternalBrowser}
          variant="outline"
          className="w-full"
          size="sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          외부 브라우저에서 열기
        </Button>
      </AlertDescription>
    </Alert>
  );
}
