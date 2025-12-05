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

/**
 * 테니스 경기 스케줄 자동 생성 알고리즘
 *
 * 기본: 6경기, 각 경기당 2코트(A, B), 각 코트당 4명 (2 vs 2)
 * 유연한 설정: 1-10경기, 1-10코트, 경기당 시간 조절 가능, 경기별 타입 설정 가능
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
    courtTypes, // 코트별 타입 (선택사항)
    matchType // deprecated, 하위 호환성
  } = options;

  // 하위 호환성: matchType이 제공되면 모든 경기에 적용
  const finalMatchTypes = matchType
    ? Array(totalMatches).fill(matchType)
    : matchTypes;

  // 경기별 필터링을 위한 헬퍼 함수
  const filterAttendeesByType = (type: 'mixed' | 'mens' | 'womens'): Attendance[] => {
    if (type === 'mens') {
      return attendees.filter(a => {
        if (a.is_guest) return true; // 게스트는 포함 (성별 정보 없음)
        return a.member?.gender === 'male';
      });
    } else if (type === 'womens') {
      return attendees.filter(a => {
        if (a.is_guest) return true; // 게스트는 포함
        return a.member?.gender === 'female';
      });
    }
    return attendees; // mixed는 전체
  };

  // 참석자의 성별 가져오기
  const getGender = (attendee: Attendance): 'male' | 'female' | 'guest' => {
    if (attendee.is_guest) return 'guest';
    return attendee.member?.gender || 'guest';
  };

  // 경기 타입에 따른 팀 구성 함수
  const formTeamsByType = (
    players: Attendance[],
    type: 'mixed' | 'mens' | 'womens'
  ): { team1: [Attendance, Attendance]; team2: [Attendance, Attendance] } | null => {
    if (players.length < 4) return null;

    if (type === 'mixed') {
      // 혼복: 남-여 페어 구성
      // team1: [남, 여], team2: [남, 여] 형태로 구성
      const males: Attendance[] = [];
      const females: Attendance[] = [];
      const guests: Attendance[] = [];

      players.forEach(p => {
        const gender = getGender(p);
        if (gender === 'male') males.push(p);
        else if (gender === 'female') females.push(p);
        else guests.push(p);
      });

      // 남-여 페어를 최대한 만들기
      const minPairs = Math.min(males.length, females.length);
      
      // team1: [남, 여] 구성
      let team1Player1: Attendance | null = null;
      let team1Player2: Attendance | null = null;
      let team2Player1: Attendance | null = null;
      let team2Player2: Attendance | null = null;

      if (minPairs >= 2) {
        // 남-여 페어가 2개 이상이면 각 팀에 남-여 페어 배정
        team1Player1 = males[0];
        team1Player2 = females[0];
        team2Player1 = males[1];
        team2Player2 = females[1];
      } else if (minPairs === 1) {
        // 남-여 페어가 1개만 있으면 team1에 배정하고, team2는 나머지로 구성
        team1Player1 = males[0];
        team1Player2 = females[0];
        
        // 남은 선수들로 team2 구성
        const remainingMales = males.slice(1);
        const remainingFemales = females.slice(1);
        const allRemaining = [...remainingMales, ...remainingFemales, ...guests];
        
        if (allRemaining.length >= 2) {
          team2Player1 = allRemaining[0];
          team2Player2 = allRemaining[1];
        }
      } else {
        // 남-여 페어가 없으면 (게스트만 있거나 한 성별만 있으면) 랜덤 배정
        if (players.length >= 4) {
          team1Player1 = players[0];
          team1Player2 = players[1];
          team2Player1 = players[2];
          team2Player2 = players[3];
        }
      }

      // 게스트 처리: 게스트가 있으면 가능한 한 혼성 페어에 추가
      if (guests.length > 0 && (team1Player1 === null || team1Player2 === null || team2Player1 === null || team2Player2 === null)) {
        let guestIndex = 0;
        if (!team1Player1 && guestIndex < guests.length) {
          team1Player1 = guests[guestIndex++];
        }
        if (!team1Player2 && guestIndex < guests.length) {
          team1Player2 = guests[guestIndex++];
        }
        if (!team2Player1 && guestIndex < guests.length) {
          team2Player1 = guests[guestIndex++];
        }
        if (!team2Player2 && guestIndex < guests.length) {
          team2Player2 = guests[guestIndex++];
        }
      }

      if (team1Player1 && team1Player2 && team2Player1 && team2Player2) {
        return {
          team1: [team1Player1, team1Player2],
          team2: [team2Player1, team2Player2]
        };
      }

      // 기본: 랜덤 배정
      return {
        team1: [players[0], players[1]],
        team2: [players[2], players[3]]
      };
    } else if (type === 'mens') {
      // 남복: 남자끼리만 팀
      const validPlayers = players.filter(p => {
        const gender = getGender(p);
        return gender === 'male' || gender === 'guest'; // 게스트는 포함
      });

      if (validPlayers.length >= 4) {
        return {
          team1: [validPlayers[0], validPlayers[1]],
          team2: [validPlayers[2], validPlayers[3]]
        };
      }
    } else if (type === 'womens') {
      // 여복: 여자끼리만 팀
      const validPlayers = players.filter(p => {
        const gender = getGender(p);
        return gender === 'female' || gender === 'guest'; // 게스트는 포함
      });

      if (validPlayers.length >= 4) {
        return {
          team1: [validPlayers[0], validPlayers[1]],
          team2: [validPlayers[2], validPlayers[3]]
        };
      }
    }

    // 기본: 랜덤 배정
    return {
      team1: [players[0], players[1]],
      team2: [players[2], players[3]]
    };
  };

  // 최소 인원 체크 (가장 제한적인 경기 타입 기준)
  const minAttendees = Math.min(
    ...finalMatchTypes.map(type => filterAttendeesByType(type).length)
  );

  if (minAttendees < 4) {
    throw new Error(`일부 경기 타입에 최소 4명 이상의 참석자가 필요합니다. (현재 최소: ${minAttendees}명)`);
  }

  // 시간 계산 헬퍼
  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  // 전체 참석자 풀에서 참여 횟수 추적
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

  // 설정된 경기 수만큼 생성
  for (let matchNum = 1; matchNum <= totalMatches; matchNum++) {
    const matchStartTime = addMinutes(startTime, (matchNum - 1) * matchDuration);
    const currentMatchType = finalMatchTypes[matchNum - 1] || 'mixed';

    // 현재 경기 타입에 맞는 참석자 필터링
    const filteredAttendees = filterAttendeesByType(currentMatchType);

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

    // 파트너 페어 우선 배정 (경기 타입 고려)
    const assignedPairs: [Attendance, Attendance][] = [];
    partnerPairs.forEach(([member1Id, member2Id]) => {
      const member1 = availableAttendees.find(a => a.member_id === member1Id);
      const member2 = availableAttendees.find(a => a.member_id === member2Id);

      if (member1 && member2) {
        // 두 사람의 성별 확인
        const gender1 = getGender(member1);
        const gender2 = getGender(member2);

        // 경기 타입에 따라 페어 적용 여부 결정
        let canAssignPair = false;

        if (currentMatchType === 'mixed') {
          // 혼복: 남/여 페어만 가능 (게스트는 허용)
          canAssignPair = (
            (gender1 === 'male' && gender2 === 'female') ||
            (gender1 === 'female' && gender2 === 'male') ||
            gender1 === 'guest' ||
            gender2 === 'guest'
          );
        } else if (currentMatchType === 'mens') {
          // 남복: 남자끼리만 가능
          canAssignPair = (
            (gender1 === 'male' || gender1 === 'guest') &&
            (gender2 === 'male' || gender2 === 'guest')
          );
        } else if (currentMatchType === 'womens') {
          // 여복: 여자끼리만 가능
          canAssignPair = (
            (gender1 === 'female' || gender1 === 'guest') &&
            (gender2 === 'female' || gender2 === 'guest')
          );
        }

        // 페어 적용 가능하면 배정
        if (canAssignPair) {
          assignedPairs.push([member1, member2]);
          availableAttendees = availableAttendees.filter(
            a => a.id !== member1.id && a.id !== member2.id
          );
        }
      }
    });

    // 참여 횟수가 적은 순으로 정렬
    availableAttendees.sort((a, b) => {
      const countA = participationCount.get(a.id) || 0;
      const countB = participationCount.get(b.id) || 0;
      return countA - countB;
    });

    // 각 코트에 배정할 선수 배열 생성
    const courtPlayers: Attendance[][] = Array.from({ length: courtCount }, () => []);

    // 파트너 페어 우선 배정
    assignedPairs.forEach((pair, index) => {
      if (index < courtCount) {
        courtPlayers[index].push(...pair);
      }
    });

    // 나머지 선수 배정 (라운드 로빈 방식)
    let playerIndex = 0;
    for (let courtIndex = 0; courtIndex < courtCount; courtIndex++) {
      while (courtPlayers[courtIndex].length < 4 && playerIndex < availableAttendees.length) {
        courtPlayers[courtIndex].push(availableAttendees[playerIndex]);
        playerIndex++;
      }
    }

    // 인원이 부족한 코트 처리 (중복 참여)
    courtPlayers.forEach((players, courtIndex) => {
      if (players.length < 4) {
        const additionalPlayers = filteredAttendees
          .filter(a => !players.some(p => p.id === a.id))
          .slice(0, 4 - players.length);
        players.push(...additionalPlayers);
      }
    });

    // 각 코트별 경기 생성
    courtPlayers.forEach((players, courtIndex) => {
      if (players.length >= 4) {
        // 코트별 타입 결정
        let courtType = currentMatchType; // 기본값: 경기 타입

        if (courtTypes) {
          // courtTypes가 2D 배열인지 확인 (Array.isArray로 체크)
          if (Array.isArray(courtTypes[0])) {
            // 2D 배열: 경기별로 다른 코트 설정
            const courtTypesForMatch = (courtTypes as ('mixed' | 'mens' | 'womens')[][])[matchNum - 1];
            if (courtTypesForMatch && courtTypesForMatch[courtIndex]) {
              courtType = courtTypesForMatch[courtIndex];
            }
          } else {
            // 1D 배열: 모든 경기에 동일한 코트 설정
            const courtTypesArray = courtTypes as ('mixed' | 'mens' | 'womens')[];
            if (courtTypesArray[courtIndex]) {
              courtType = courtTypesArray[courtIndex];
            }
          }
        }

        // 경기 타입에 따른 팀 구성
        const teams = formTeamsByType(players, courtType);

        if (teams) {
          matches.push({
            match_number: matchNum,
            court: getCourtLabel(courtIndex),
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
