import type { Attendance, Constraint, GeneratedMatch } from '../types';

interface GenerationOptions {
  attendees: Attendance[];
  constraints?: Constraint[];
  startTime: string; // "10:00" 형식
  totalMatches?: number; // 총 경기 수 (기본값: 6)
  matchDuration?: number; // 경기당 시간 (분, 기본값: 30)
  courtCount?: number; // 코트 수 (기본값: 2)
  matchTypes?: ('mixed' | 'mens' | 'womens')[]; // 경기별 타입 (기본값: 모두 mixed)
  courtTypes?: ('mixed' | 'mens' | 'womens')[] | ('mixed' | 'mens' | 'womens')[][]; // 코트별 타입: 1D(모든 경기 동일) 또는 2D(경기별로 다름)
  matchType?: 'mixed' | 'mens' | 'womens'; // 하위 호환성을 위한 단일 타입 (deprecated)
}

// 코트 레이블 생성 헬퍼 (A, B, C, ...)
const getCourtLabel = (index: number): string => {
  return String.fromCharCode(65 + index); // 65 = 'A'
};

// 참석자의 성별 가져오기
const getGender = (attendee: Attendance): 'male' | 'female' | 'guest' => {
  if (attendee.is_guest) return 'guest';
  return attendee.member?.gender || 'guest';
};

// 경기 타입에 따라 유효한 참석자 필터링
const filterAttendeesByType = (
  attendees: Attendance[],
  type: 'mixed' | 'mens' | 'womens'
): Attendance[] => {
  if (type === 'mens') {
    return attendees.filter(a => {
      const gender = getGender(a);
      return gender === 'male' || gender === 'guest';
    });
  } else if (type === 'womens') {
    return attendees.filter(a => {
      const gender = getGender(a);
      return gender === 'female' || gender === 'guest';
    });
  }
  return attendees; // mixed는 전체
};

// 혼복: 반드시 남여 vs 남여 구성
const formMixedTeams = (
  players: Attendance[]
): { team1: [Attendance, Attendance]; team2: [Attendance, Attendance] } | null => {
  const males = players.filter(p => getGender(p) === 'male');
  const females = players.filter(p => getGender(p) === 'female');
  const guests = players.filter(p => getGender(p) === 'guest');

  // 최소 남자 2명, 여자 2명 필요 (게스트는 어디든 가능)
  if (males.length + guests.length >= 2 && females.length + guests.length >= 2) {
    let team1Male: Attendance | undefined;
    let team1Female: Attendance | undefined;
    let team2Male: Attendance | undefined;
    let team2Female: Attendance | undefined;

    // 남자 배정
    if (males.length >= 2) {
      team1Male = males[0];
      team2Male = males[1];
    } else if (males.length === 1 && guests.length >= 1) {
      team1Male = males[0];
      team2Male = guests[0];
    } else if (males.length === 0 && guests.length >= 2) {
      team1Male = guests[0];
      team2Male = guests[1];
    }

    // 여자 배정
    const remainingGuests = guests.filter(g => g !== team1Male && g !== team2Male);
    if (females.length >= 2) {
      team1Female = females[0];
      team2Female = females[1];
    } else if (females.length === 1 && remainingGuests.length >= 1) {
      team1Female = females[0];
      team2Female = remainingGuests[0];
    } else if (females.length === 0 && remainingGuests.length >= 2) {
      team1Female = remainingGuests[0];
      team2Female = remainingGuests[1];
    }

    if (team1Male && team1Female && team2Male && team2Female) {
      return {
        team1: [team1Male, team1Female],
        team2: [team2Male, team2Female]
      };
    }
  }

  return null;
};

// 남복/여복: 동성끼리만 구성
const formSameGenderTeams = (
  players: Attendance[]
): { team1: [Attendance, Attendance]; team2: [Attendance, Attendance] } | null => {
  if (players.length >= 4) {
    return {
      team1: [players[0], players[1]],
      team2: [players[2], players[3]]
    };
  }
  return null;
};

/**
 * 테니스 경기 스케줄 자동 생성 알고리즘
 *
 * 절대 규칙:
 * 1. 혼복: 반드시 남여 vs 남여
 * 2. 남복: 반드시 남남 vs 남남
 * 3. 여복: 반드시 여여 vs 여여
 * 4. 모든 참석자가 최대한 동일한 경기 수
 * 5. 파트너 지정: 해당 인원이 경기에 들어갈 때만 파트너로 배치
 */
export function generateSchedule(options: GenerationOptions): GeneratedMatch[] {
  const {
    attendees,
    constraints = [],
    startTime,
    totalMatches = 6,
    matchDuration = 30,
    courtCount = 2,
    matchTypes = Array(totalMatches).fill('mixed'),
    courtTypes,
    matchType
  } = options;

  // 하위 호환성: matchType이 제공되면 모든 경기에 적용
  const finalMatchTypes = matchType
    ? Array(totalMatches).fill(matchType)
    : matchTypes;

  // 시간 계산 헬퍼
  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  // 참여 횟수 추적
  const participationCount = new Map<number, number>();
  attendees.forEach(a => participationCount.set(a.id, 0));

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

  // 생성된 경기 목록
  const matches: GeneratedMatch[] = [];

  // 경기 생성
  for (let matchNum = 1; matchNum <= totalMatches; matchNum++) {
    const matchStartTime = addMinutes(startTime, (matchNum - 1) * matchDuration);
    const currentMatchType = finalMatchTypes[matchNum - 1] || 'mixed';

    // 현재 경기 타입에 맞는 참석자 필터링
    const filteredAttendees = filterAttendeesByType(attendees, currentMatchType);

    // 이 경기에 참여 가능한 참석자 필터링
    let availableAttendees = filteredAttendees.filter(a => {
      const memberId = a.member_id;

      // 마지막 경기 제외 제약
      if (matchNum === totalMatches && memberId && excludeLastMatchMemberIds.includes(memberId)) {
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

    // 참여 횟수가 적은 순으로 정렬
    availableAttendees.sort((a, b) => {
      const countA = participationCount.get(a.id) || 0;
      const countB = participationCount.get(b.id) || 0;
      if (countA !== countB) return countA - countB;
      return Math.random() - 0.5; // 동점일 경우 랜덤
    });

    // 각 코트에 배정할 선수 배열 생성
    const courtPlayers: Attendance[][] = Array.from({ length: courtCount }, () => []);

    // 파트너 페어 처리
    const usedPairMembers = new Set<number>();
    const pairsForThisMatch: [Attendance, Attendance][] = [];

    partnerPairs.forEach(([member1Id, member2Id]) => {
      const member1 = availableAttendees.find(a => a.member_id === member1Id);
      const member2 = availableAttendees.find(a => a.member_id === member2Id);

      if (member1 && member2) {
        const gender1 = getGender(member1);
        const gender2 = getGender(member2);

        // 경기 타입에 따라 페어 적용 가능 여부 확인
        let canApplyPair = false;

        if (currentMatchType === 'mixed') {
          // 혼복: 남/여 페어만 가능
          canApplyPair = (
            (gender1 === 'male' && gender2 === 'female') ||
            (gender1 === 'female' && gender2 === 'male') ||
            gender1 === 'guest' ||
            gender2 === 'guest'
          );
        } else if (currentMatchType === 'mens') {
          // 남복: 남자끼리만
          canApplyPair = (
            (gender1 === 'male' || gender1 === 'guest') &&
            (gender2 === 'male' || gender2 === 'guest')
          );
        } else if (currentMatchType === 'womens') {
          // 여복: 여자끼리만
          canApplyPair = (
            (gender1 === 'female' || gender1 === 'guest') &&
            (gender2 === 'female' || gender2 === 'guest')
          );
        }

        // 페어가 적용 가능하고 아직 사용되지 않았으면 추가
        if (canApplyPair && !usedPairMembers.has(member1Id) && !usedPairMembers.has(member2Id)) {
          const count1 = participationCount.get(member1.id) || 0;
          const count2 = participationCount.get(member2.id) || 0;
          const avgCount = (count1 + count2) / 2;

          // 평균 참여 횟수가 다른 참석자들과 비슷하면 페어 적용
          const allCounts = availableAttendees.map(a => participationCount.get(a.id) || 0);
          const overallAvg = allCounts.reduce((sum, c) => sum + c, 0) / allCounts.length;

          // 페어의 평균 참여 횟수가 전체 평균보다 많지 않으면 적용
          if (avgCount <= overallAvg + 0.5) {
            pairsForThisMatch.push([member1, member2]);
            usedPairMembers.add(member1Id);
            usedPairMembers.add(member2Id);
          }
        }
      }
    });

    // 페어가 아닌 참석자 목록
    const nonPairAttendees = availableAttendees.filter(
      a => !usedPairMembers.has(a.member_id!)
    );

    // 각 코트에 선수 배정
    let courtIndex = 0;
    let pairIndex = 0;
    let nonPairIndex = 0;

    while (courtIndex < courtCount) {
      const currentCourt = courtPlayers[courtIndex];

      // 코트당 4명 필요
      while (currentCourt.length < 4) {
        // 먼저 페어 배정
        if (pairIndex < pairsForThisMatch.length && currentCourt.length <= 2) {
          const [p1, p2] = pairsForThisMatch[pairIndex];
          currentCourt.push(p1, p2);
          pairIndex++;
        }
        // 페어가 없거나 이미 배정했으면 비페어 참석자 배정
        else if (nonPairIndex < nonPairAttendees.length) {
          currentCourt.push(nonPairAttendees[nonPairIndex]);
          nonPairIndex++;
        }
        // 더 이상 배정할 사람이 없으면 중단
        else {
          break;
        }
      }

      courtIndex++;
    }

    // 인원이 부족한 코트 처리 (중복 참여 허용)
    courtPlayers.forEach((players, idx) => {
      if (players.length < 4) {
        const additionalPlayers = availableAttendees
          .filter(a => !players.some(p => p.id === a.id))
          .slice(0, 4 - players.length);
        players.push(...additionalPlayers);
      }
    });

    // 각 코트별 경기 생성
    courtPlayers.forEach((players, courtIdx) => {
      if (players.length >= 4) {
        // 코트별 타입 결정
        let courtType = currentMatchType;

        if (courtTypes) {
          if (Array.isArray(courtTypes[0])) {
            const courtTypesForMatch = (courtTypes as ('mixed' | 'mens' | 'womens')[][])[matchNum - 1];
            if (courtTypesForMatch && courtTypesForMatch[courtIdx]) {
              courtType = courtTypesForMatch[courtIdx];
            }
          } else {
            const courtTypesArray = courtTypes as ('mixed' | 'mens' | 'womens')[];
            if (courtTypesArray[courtIdx]) {
              courtType = courtTypesArray[courtIdx];
            }
          }
        }

        // 경기 타입에 따른 팀 구성
        let teams: { team1: [Attendance, Attendance]; team2: [Attendance, Attendance] } | null = null;

        if (courtType === 'mixed') {
          teams = formMixedTeams(players);
        } else {
          teams = formSameGenderTeams(players);
        }

        if (teams) {
          matches.push({
            match_number: matchNum,
            court: getCourtLabel(courtIdx),
            start_time: matchStartTime,
            match_type: courtType,
            team1: teams.team1,
            team2: teams.team2
          });

          // 참여 횟수 업데이트
          players.forEach(p => {
            const count = participationCount.get(p.id) || 0;
            participationCount.set(p.id, count + 1);
          });
        }
      }
    });
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
    match_type: match.match_type,
    player1_id: match.team1[0].id,
    player2_id: match.team1[1].id,
    player3_id: match.team2[0].id,
    player4_id: match.team2[1].id
  }));
}
