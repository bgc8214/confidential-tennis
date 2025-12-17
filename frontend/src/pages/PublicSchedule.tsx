import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { publicScheduleService } from '../services/publicScheduleService';
import type { Schedule, Match, Attendance, GeneratedMatch } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar, Clock, Users, LogIn, Download } from 'lucide-react';
import MatchCard from '../components/MatchCard';
import CompactScheduleView from '../components/CompactScheduleView';

export default function PublicSchedule() {
  const { publicLink } = useParams<{ publicLink: string }>();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const compactViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (publicLink) {
      loadSchedule();
    }
  }, [publicLink]);

  const loadSchedule = async () => {
    if (!publicLink) return;

    try {
      setLoading(true);
      setError(null);

      const scheduleData = await publicScheduleService.getScheduleByPublicLink(publicLink);

      if (!scheduleData) {
        setError('스케줄을 찾을 수 없습니다. 링크가 올바른지 확인해주세요.');
        setLoading(false);
        return;
      }

      setSchedule(scheduleData);

      // 참석자 및 경기 데이터 로드
      try {
        const [attendancesData, matchesData] = await Promise.all([
          publicScheduleService.getAttendances(scheduleData.id).catch(() => []),
          publicScheduleService.getMatches(scheduleData.id).catch(() => []),
        ]);

        setAttendances(Array.isArray(attendancesData) ? attendancesData : []);
        setMatches(Array.isArray(matchesData) ? matchesData : []);
      } catch (err) {
        console.error('참석자/경기 데이터 로딩 에러:', err);
        // 에러가 발생해도 빈 배열로 설정하여 페이지는 표시되도록 함
        setAttendances([]);
        setMatches([]);
      }
    } catch (err: any) {
      setError(err.message || '스케줄을 불러오는데 실패했습니다.');
      console.error('스케줄 로딩 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  };

  const formatMatchType = (matchType: string) => {
    const typeMap: Record<string, { label: string; emoji: string }> = {
      mixed: { label: '혼복', emoji: '👨👩' },
      mens: { label: '남복', emoji: '👨👨' },
      womens: { label: '여복', emoji: '👩👩' }
    };
    return typeMap[matchType] || { label: matchType, emoji: '🎾' };
  };

  const handleDownloadImage = async () => {
    if (!compactViewRef.current || !schedule) return;

    try {
      const canvas = await html2canvas(compactViewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        windowWidth: 1200,
        windowHeight: 800,
      });

      const link = document.createElement('a');
      const dateStr = new Date(schedule.date).toISOString().split('T')[0];
      link.download = `테니스-스케줄-${dateStr}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('이미지 다운로드 실패:', err);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2E7D4E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">오류</CardTitle>
            <CardDescription>{error || '스케줄을 찾을 수 없습니다.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="mr-2 w-4 h-4" />
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 간단한 헤더 */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
                <span className="text-xl sm:text-2xl">🎾</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Tennis Club</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Schedule Manager</p>
              </div>
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/login')}>
                <LogIn className="mr-2 w-4 h-4" />
                로그인
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                홈으로
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-6 py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">경기 스케줄</h1>
            <p className="text-gray-600">공개 링크로 공유된 스케줄입니다</p>
          </div>
          <Button
            onClick={handleDownloadImage}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            이미지 저장
          </Button>
        </div>

      {/* Schedule Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                {formatDate(schedule.date)}
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {schedule.start_time} - {schedule.end_time}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <span>{formatMatchType(schedule.match_type).emoji}</span>
                  <span>{formatMatchType(schedule.match_type).label}</span>
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>참석자: {attendances && Array.isArray(attendances) ? attendances.length : 0}명</span>
            </div>
            <div>
              <span>경기 수: {matches && Array.isArray(matches) ? matches.length : 0}경기</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches */}
      {matches && Array.isArray(matches) && matches.length > 0 ? (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">경기 일정</h2>
          {/* 경기 번호별로 그룹화 */}
          {Array.from({ length: 6 }, (_, i) => i + 1).map((matchNumber) => {
            const matchesForNumber = matches.filter(m => m.match_number === matchNumber);
            if (matchesForNumber.length === 0) return null;

            return (
              <div key={matchNumber} className="space-y-4">
                {/* 경기 번호 헤더 */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {matchNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">경기 {matchNumber}</h3>
                      {matchesForNumber[0]?.match_type && (
                        <span className={`px-3 py-1 rounded-lg font-medium text-sm border-2 flex items-center gap-1 ${
                          matchesForNumber[0].match_type === 'mixed' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          matchesForNumber[0].match_type === 'mens' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-pink-100 text-pink-700 border-pink-200'
                        }`}>
                          <span>{matchesForNumber[0].match_type === 'mixed' ? '🎾' : matchesForNumber[0].match_type === 'mens' ? '👨‍🦱' : '👩‍🦱'}</span>
                          <span>{matchesForNumber[0].match_type === 'mixed' ? '혼복' : matchesForNumber[0].match_type === 'mens' ? '남복' : '여복'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {matchesForNumber[0]?.start_time}
                    </p>
                  </div>
                </div>
                
                {/* 해당 경기 번호의 모든 코트 경기 */}
                <div className="grid gap-4 md:grid-cols-2">
                  {matchesForNumber.map((match, index) => {
                    // Match 타입을 GeneratedMatch 형식으로 변환
                    // player1, player2는 team1, player3, player4는 team2
                    const team1 = [match.player1, match.player2].filter((p): p is Attendance => !!p);
                    const team2 = [match.player3, match.player4].filter((p): p is Attendance => !!p);
                    
                    // team1과 team2가 모두 2명씩 있어야 함
                    if (team1.length === 2 && team2.length === 2) {
                      const generatedMatch: GeneratedMatch = {
                        match_number: match.match_number,
                        court: match.court,
                        start_time: match.start_time,
                        match_type: match.match_type,
                        team1: [team1[0], team1[1]] as [Attendance, Attendance],
                        team2: [team2[0], team2[1]] as [Attendance, Attendance],
                      };
                      return (
                        <MatchCard key={match.id || `${matchNumber}-${match.court}-${index}`} match={generatedMatch} />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">아직 경기가 생성되지 않았습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* 숨겨진 CompactScheduleView - 이미지 다운로드용 */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }} ref={compactViewRef}>
        {schedule && matches.length > 0 && (
          <CompactScheduleView
            matches={matches.map(m => ({
              match_number: m.match_number,
              court: m.court,
              start_time: m.start_time,
              match_type: m.match_type,
              team1: [m.player1, m.player2].filter((p): p is Attendance => !!p) as [Attendance, Attendance],
              team2: [m.player3, m.player4].filter((p): p is Attendance => !!p) as [Attendance, Attendance],
            }))}
            date={schedule.date}
            startTime={schedule.start_time}
            endTime={schedule.end_time}
          />
        )}
      </div>
      </div>
    </div>
  );
}

