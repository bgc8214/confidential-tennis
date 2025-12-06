import type { GeneratedMatch, Attendance } from '../types';

interface CompactScheduleViewProps {
  matches: GeneratedMatch[];
  date: string;
  startTime: string;
  endTime: string;
  clubName?: string;
}

export default function CompactScheduleView({ matches, date, startTime, endTime, clubName = '테니스 클럽' }: CompactScheduleViewProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayOfWeek = days[d.getDay()];
    return `${month}/${day} (${dayOfWeek})`;
  };

  const getPlayerName = (attendance: Attendance | null | undefined): string => {
    if (!attendance) return '미배정';
    if (attendance.is_guest) {
      return attendance.guest_name || '게스트';
    }
    return attendance.member?.name || '알 수 없음';
  };

  // 경기 번호별로 그룹화 (1-6)
  const matchesByNumber = Array.from({ length: 6 }, (_, i) => i + 1).map(matchNum => ({
    matchNumber: matchNum,
    courtA: matches.find(m => m.match_number === matchNum && m.court === 'A'),
    courtB: matches.find(m => m.match_number === matchNum && m.court === 'B')
  }));

  // 혼복/남복/여복 판별
  const getMatchTypeInfo = (match: GeneratedMatch | undefined) => {
    if (!match) return { label: '', color: '' };

    switch (match.match_type) {
      case 'mixed':
        return { label: '혼복', color: '#f3e8ff' }; // 보라색
      case 'mens':
        return { label: '남복', color: '#dbeafe' }; // 파란색
      case 'womens':
        return { label: '여복', color: '#fce7f3' }; // 분홍색
      default:
        return { label: '혼복', color: '#f3e8ff' };
    }
  };

  return (
    <div style={{
      width: '1200px',
      padding: '40px',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* 헤더 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        borderBottom: '3px solid #2E7D4E',
        paddingBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          margin: '0 0 10px 0',
          color: '#1f2937'
        }}>
          {formatDate(date)} {startTime}-{endTime}, {clubName}
        </h1>
      </div>

      {/* 테이블 */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '2px solid #1f2937'
      }}>
        <thead>
          <tr>
            <th style={{
              border: '2px solid #1f2937',
              padding: '14px',
              backgroundColor: '#f9fafb',
              fontSize: '20px',
              fontWeight: 'bold',
              width: '80px',
              textAlign: 'center'
            }}>
              세트
            </th>
            <th style={{
              border: '2px solid #1f2937',
              padding: '14px',
              backgroundColor: '#fff4e6',
              fontSize: '20px',
              fontWeight: 'bold',
              textAlign: 'center'
            }} colSpan={3}>
              A코트
            </th>
            <th style={{
              border: '2px solid #1f2937',
              padding: '14px',
              backgroundColor: '#e0f2fe',
              fontSize: '20px',
              fontWeight: 'bold',
              textAlign: 'center'
            }} colSpan={3}>
              B코트
            </th>
          </tr>
        </thead>
        <tbody>
          {matchesByNumber.map(({ matchNumber, courtA, courtB }) => {
            const matchTypeA = getMatchTypeInfo(courtA);
            const matchTypeB = getMatchTypeInfo(courtB);

            return (
              <tr key={matchNumber}>
                {/* 세트 번호 */}
                <td style={{
                  border: '2px solid #1f2937',
                  padding: '20px 12px',
                  textAlign: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  backgroundColor: '#f9fafb'
                }}>
                  {matchNumber}
                </td>

                {/* A코트 - 경기 타입 */}
                <td style={{
                  border: '2px solid #1f2937',
                  padding: '16px 12px',
                  backgroundColor: matchTypeA.color,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  width: '60px'
                }}>
                  {courtA ? matchTypeA.label : ''}
                </td>

                {/* A코트 - 팀1 */}
                <td style={{
                  border: '2px solid #1f2937',
                  padding: '16px',
                  backgroundColor: matchTypeA.color,
                  fontSize: '20px',
                  fontWeight: '600',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  {courtA ? `${getPlayerName(courtA.team1[0])} ${getPlayerName(courtA.team1[1])}` : '미배정'}
                </td>

                {/* A코트 - 팀2 */}
                <td style={{
                  border: '2px solid #1f2937',
                  padding: '16px',
                  backgroundColor: matchTypeA.color,
                  fontSize: '20px',
                  fontWeight: '600',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  {courtA ? `${getPlayerName(courtA.team2[0])} ${getPlayerName(courtA.team2[1])}` : '미배정'}
                </td>

                {/* B코트 - 경기 타입 */}
                <td style={{
                  border: '2px solid #1f2937',
                  padding: '16px 12px',
                  backgroundColor: matchTypeB.color,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  width: '60px'
                }}>
                  {courtB ? matchTypeB.label : ''}
                </td>

                {/* B코트 - 팀1 */}
                <td style={{
                  border: '2px solid #1f2937',
                  padding: '16px',
                  backgroundColor: matchTypeB.color,
                  fontSize: '20px',
                  fontWeight: '600',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  {courtB ? `${getPlayerName(courtB.team1[0])} ${getPlayerName(courtB.team1[1])}` : '미배정'}
                </td>

                {/* B코트 - 팀2 */}
                <td style={{
                  border: '2px solid #1f2937',
                  padding: '16px',
                  backgroundColor: matchTypeB.color,
                  fontSize: '20px',
                  fontWeight: '600',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  {courtB ? `${getPlayerName(courtB.team2[0])} ${getPlayerName(courtB.team2[1])}` : '미배정'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
