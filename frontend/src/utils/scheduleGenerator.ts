import type { Attendance, Constraint, GeneratedMatch } from '../types';

interface GenerationOptions {
  attendees: Attendance[];
  constraints?: Constraint[];
  startTime: string; // "10:00" 형식
}

/**
 * 테니스 경기 스케줄 자동 생성 알고리즘
 *
 * 6경기, 각 경기당 2코트(A, B), 각 코트당 4명 (2 vs 2)
 * 총 필요 인원: 경기당 8명
 */
export function generateSchedule(options: GenerationOptions): GeneratedMatch[] {
  const { attendees, constraints = [], startTime } = options;
  const totalAttendees = attendees.length;

  if (totalAttendees < 4) {
    throw new Error('최소 4명 이상의 참석자가 필요합니다.');
  }

  // 시간 계산 헬퍼
  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  // 제약조건 파싱
  const excludeLastMatchMemberIds = constraints
    .filter(c => c.constraint_type === 'exclude_last_match')
    .map(c => c.member_id_1)
    .filter((id): id is number => id !== undefined);

  const partnerPairs = constraints
    .filter(c => c.constraint_type === 'partner_pair')
    .map(c => [c.member_id_1, c.member_id_2])
    .filter((pair): pair is [number, number] =>
      pair[0] !== undefined && pair[1] !== undefined
    );

  const excludeMatchMap = new Map<number, number[]>();
  constraints
    .filter(c => c.constraint_type === 'exclude_match')
    .forEach(c => {
      if (c.member_id_1 && c.match_number) {
        const existing = excludeMatchMap.get(c.member_id_1) || [];
        excludeMatchMap.set(c.member_id_1, [...existing, c.match_number]);
      }
    });

  // 참석자별 경기 참여 횟수 추적
  const participationCount = new Map<number, number>();
  attendees.forEach(a => participationCount.set(a.id, 0));

  // 생성된 경기 목록
  const matches: GeneratedMatch[] = [];

  // 6경기 생성
  for (let matchNum = 1; matchNum <= 6; matchNum++) {
    const matchStartTime = addMinutes(startTime, (matchNum - 1) * 30);

    // 이 경기에 참여 가능한 참석자 필터링
    let availableAttendees = attendees.filter(a => {
      const memberId = a.member_id;

      // 마지막 경기 제외 제약
      if (matchNum === 6 && memberId && excludeLastMatchMemberIds.includes(memberId)) {
        return false;
      }

      // 특정 경기 제외 제약
      if (memberId && excludeMatchMap.has(memberId)) {
        const excludedMatches = excludeMatchMap.get(memberId)!;
        if (excludedMatches.includes(matchNum)) {
          return false;
        }
      }

      return true;
    });

    // 파트너 페어 우선 배정
    const assignedPairs: [Attendance, Attendance][] = [];
    partnerPairs.forEach(([member1Id, member2Id]) => {
      const member1 = availableAttendees.find(a => a.member_id === member1Id);
      const member2 = availableAttendees.find(a => a.member_id === member2Id);

      if (member1 && member2) {
        assignedPairs.push([member1, member2]);
        availableAttendees = availableAttendees.filter(
          a => a.id !== member1.id && a.id !== member2.id
        );
      }
    });

    // 참여 횟수가 적은 순으로 정렬
    availableAttendees.sort((a, b) => {
      const countA = participationCount.get(a.id) || 0;
      const countB = participationCount.get(b.id) || 0;
      return countA - countB;
    });

    // 코트 A, B에 배정할 선수 선택
    const courtAPlayers: Attendance[] = [];
    const courtBPlayers: Attendance[] = [];

    // 파트너 페어 배정
    if (assignedPairs.length > 0) {
      courtAPlayers.push(...assignedPairs[0]);
    }
    if (assignedPairs.length > 1) {
      courtBPlayers.push(...assignedPairs[1]);
    }

    // 나머지 선수 배정
    let playerIndex = 0;
    while (courtAPlayers.length < 4 && playerIndex < availableAttendees.length) {
      courtAPlayers.push(availableAttendees[playerIndex]);
      playerIndex++;
    }
    while (courtBPlayers.length < 4 && playerIndex < availableAttendees.length) {
      courtBPlayers.push(availableAttendees[playerIndex]);
      playerIndex++;
    }

    // 인원이 부족한 경우 처리
    if (courtAPlayers.length < 4) {
      // 이미 배정된 사람 중에서 추가 배정 (중복 참여)
      const additionalPlayers = attendees
        .filter(a => !courtAPlayers.some(p => p.id === a.id))
        .slice(0, 4 - courtAPlayers.length);
      courtAPlayers.push(...additionalPlayers);
    }

    // 경기 생성
    if (courtAPlayers.length >= 4) {
      matches.push({
        match_number: matchNum,
        court: 'A',
        start_time: matchStartTime,
        team1: [courtAPlayers[0], courtAPlayers[1]],
        team2: [courtAPlayers[2], courtAPlayers[3]]
      });

      // 참여 횟수 업데이트
      courtAPlayers.forEach(p => {
        const count = participationCount.get(p.id) || 0;
        participationCount.set(p.id, count + 1);
      });
    }

    if (courtBPlayers.length >= 4) {
      matches.push({
        match_number: matchNum,
        court: 'B',
        start_time: matchStartTime,
        team1: [courtBPlayers[0], courtBPlayers[1]],
        team2: [courtBPlayers[2], courtBPlayers[3]]
      });

      // 참여 횟수 업데이트
      courtBPlayers.forEach(p => {
        const count = participationCount.get(p.id) || 0;
        participationCount.set(p.id, count + 1);
      });
    }
  }

  return matches;
}

/**
 * 생성된 매치를 DB 형식으로 변환
 */
export function convertMatchesToDbFormat(
  matches: GeneratedMatch[],
  scheduleId: number
) {
  return matches.map(match => ({
    schedule_id: scheduleId,
    match_number: match.match_number,
    court: match.court,
    start_time: match.start_time,
    player1_id: match.team1[0].id,
    player2_id: match.team1[1].id,
    player3_id: match.team2[0].id,
    player4_id: match.team2[1].id
  }));
}
