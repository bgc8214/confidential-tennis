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

  // 카카오톡 인앱 브라우저인 경우 카카오톡 전용 URL scheme 사용
  if (isKakaoInAppBrowser()) {
    window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(currentUrl);
    return;
  }

  // 네이버 앱인 경우
  if (navigator.userAgent.toLowerCase().includes('naver')) {
    window.location.href = 'naversearchapp://openexternal?url=' + encodeURIComponent(currentUrl);
    return;
  }

  // 기타 인앱 브라우저는 일반적인 방법 시도
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
      <AlertTitle>카카오톡 앱에서는 로그인할 수 없습니다</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Google 보안 정책으로 인해 카카오톡 앱 내에서는 로그인이 제한됩니다.
          <br />
          <strong>아래 버튼을 눌러 Safari 또는 Chrome에서 열어주세요.</strong>
        </p>
        <Button
          onClick={openInExternalBrowser}
          variant="default"
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <ExternalLink className="h-5 w-5 mr-2" />
          Safari/Chrome에서 열기
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          버튼을 누르면 자동으로 외부 브라우저가 실행됩니다.
        </p>
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
