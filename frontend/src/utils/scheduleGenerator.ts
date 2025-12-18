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

// 참석자의 성별 가져오기 (게스트도 성별이 있음)
const getGender = (attendee: Attendance): 'male' | 'female' => {
  if (attendee.is_guest) {
    // 게스트도 성별이 있음 (guest_gender 필드)
    return attendee.guest_gender || 'male';
  }
  return attendee.member?.gender || 'male';
};

// 경기 타입에 따라 유효한 참석자 필터링
const filterAttendeesByType = (
  attendees: Attendance[],
  type: 'mixed' | 'mens' | 'womens'
): Attendance[] => {
  if (type === 'mens') {
    return attendees.filter(a => getGender(a) === 'male');
  } else if (type === 'womens') {
    return attendees.filter(a => getGender(a) === 'female');
  }
  return attendees; // mixed는 전체
};

// 혼복: 남여 vs 남여 구성 (최대한 시도)
const formMixedTeams = (
  players: Attendance[]
): { team1: [Attendance, Attendance]; team2: [Attendance, Attendance] } | null => {
  if (players.length < 4) return null;

  const males = players.filter(p => getGender(p) === 'male');
  const females = players.filter(p => getGender(p) === 'female');

  console.log('formMixedTeams 입력:', {
    총인원: players.length,
    남자: males.length,
    여자: females.length,
    players: players.map(p => ({
      name: p.is_guest ? p.guest_name : p.member?.name,
      gender: getGender(p),
      isGuest: p.is_guest
    }))
  });

  // 이상적인 혼복: 남자 2명, 여자 2명
  if (males.length >= 2 && females.length >= 2) {
    return {
      team1: [males[0], females[0]],
      team2: [males[1], females[1]]
    };
  }

  // 혼복 구성이 불가능한 경우 (예: 남자 1명, 여자 3명)
  // 폴백: 그냥 순서대로 배정
  console.warn('혼복 구성 불가능, 순서대로 배정:', {
    males: males.length,
    females: females.length
  });

  return {
    team1: [players[0], players[1]],
    team2: [players[2], players[3]]
  };
};

// 남복/여복: 동성끼리만 구성
// 이미 필터링된 players가 들어오므로 그대로 배정
// (남복이면 이미 남자만, 여복이면 이미 여자만 필터링되어 들어옴)
const formSameGenderTeams = (
  players: Attendance[]
): { team1: [Attendance, Attendance]; team2: [Attendance, Attendance] } | null => {
  if (players.length >= 4) {
    // 성별 확인 (디버깅용)
    console.log('formSameGenderTeams - players:', players.map(p => ({
      name: p.is_guest ? p.guest_name : p.member?.name,
      gender: getGender(p)
    })));

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

  // KDK (Keep Different Partners) - 파트너 이력 추적
  const partnerHistory = new Map<number, Set<number>>();
  attendees.forEach(a => partnerHistory.set(a.id, new Set<number>()));

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

  // 개인별 목표 경기 수 (match_number 필드에 저장됨)
  const targetMatchCounts = new Map<number, number>();
  constraints
    .filter(c => c.constraint_type === 'match_count')
    .forEach(c => {
      if (c.member_id_1 && c.match_number) {
        targetMatchCounts.set(c.member_id_1, c.match_number);
      }
    });

  // 전체 평균 경기 수 계산
  const totalSlots = totalMatches * courtCount * 4;
  const baseExpected = Math.floor(totalSlots / attendees.length);

  // 생성된 경기 목록
  const matches: GeneratedMatch[] = [];

  // 경기 생성 (경기 번호별로 순회)
  for (let matchNum = 1; matchNum <= totalMatches; matchNum++) {
    const matchStartTime = addMinutes(startTime, (matchNum - 1) * matchDuration);

    // 이번 경기 회차에서 이미 배정된 참석자 추적 (같은 시간대 중복 방지)
    const usedInThisMatch = new Set<number>();

    // 각 코트별로 경기 생성
    for (let courtIdx = 0; courtIdx < courtCount; courtIdx++) {
      // 코트별 타입 결정
      let courtType: 'mixed' | 'mens' | 'womens' = finalMatchTypes[matchNum - 1] || 'mixed';

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

      // 코트 타입에 맞는 참석자 필터링
      let filteredAttendees = filterAttendeesByType(attendees, courtType);

      // 이 경기에 참여 가능한 참석자 필터링
      let availableAttendees = filteredAttendees.filter(a => {
        const memberId = a.member_id;

        // 이번 경기 회차에 이미 배정된 참석자 제외 (같은 시간대 중복 방지)
        if (usedInThisMatch.has(a.id)) {
          return false;
        }

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

      // 참석자가 부족한 경우, 경기 타입을 mixed로 폴백
      if (availableAttendees.length < 4 && courtType !== 'mixed') {
        console.warn(`경기 ${matchNum} 코트 ${getCourtLabel(courtIdx)} (${courtType}): 참석자 부족 (${availableAttendees.length}명) - mixed로 변경`);
        courtType = 'mixed';
        filteredAttendees = filterAttendeesByType(attendees, courtType);
        availableAttendees = filteredAttendees.filter(a => {
          const memberId = a.member_id;
          if (usedInThisMatch.has(a.id)) {
            return false;
          }
          if (matchNum === totalMatches && memberId && excludeLastMatchMemberIds.includes(memberId)) {
            return false;
          }
          if (memberId && excludeMatchMap.has(memberId)) {
            const excludedMatches = excludeMatchMap.get(memberId)!;
            if (excludedMatches.includes(matchNum)) {
              return false;
            }
          }
          return true;
        });
      }

      // 참여 횟수가 적은 순으로 정렬 (목표 경기 수 및 KDK 고려)
      availableAttendees.sort((a, b) => {
        const countA = participationCount.get(a.id) || 0;
        const countB = participationCount.get(b.id) || 0;
        const memberIdA = a.member_id;
        const memberIdB = b.member_id;

        // 목표 경기 수 가져오기
        const targetA = memberIdA ? targetMatchCounts.get(memberIdA) : undefined;
        const targetB = memberIdB ? targetMatchCounts.get(memberIdB) : undefined;

        // 특정 경기 제외 제약조건이 있는 회원의 남은 기회 계산
        const excludedMatchesListA = memberIdA && excludeMatchMap.has(memberIdA)
          ? excludeMatchMap.get(memberIdA)!
          : [];
        const excludedMatchesListB = memberIdB && excludeMatchMap.has(memberIdB)
          ? excludeMatchMap.get(memberIdB)!
          : [];

        // 남은 경기 중에서 제외되지 않은 경기 수 계산 (코트 타입도 고려)
        const calculateRemainingOpportunities = (attendee: Attendance, excludedList: number[]) => {
          const gender = getGender(attendee);
          let remaining = 0;

          for (let futureMatch = matchNum; futureMatch <= totalMatches; futureMatch++) {
            // 제외된 경기는 스킵
            if (excludedList.includes(futureMatch)) {
              continue;
            }

            // 해당 경기의 코트 타입들 확인
            let canParticipate = false;

            for (let futureCourtIdx = 0; futureCourtIdx < courtCount; futureCourtIdx++) {
              let futureCourtType: 'mixed' | 'mens' | 'womens' = finalMatchTypes[futureMatch - 1] || 'mixed';

              // courtTypes가 설정되어 있으면 적용
              if (courtTypes) {
                if (Array.isArray(courtTypes[0])) {
                  const courtTypesForMatch = (courtTypes as ('mixed' | 'mens' | 'womens')[][])[futureMatch - 1];
                  if (courtTypesForMatch && courtTypesForMatch[futureCourtIdx]) {
                    futureCourtType = courtTypesForMatch[futureCourtIdx];
                  }
                } else {
                  const courtTypesArray = courtTypes as ('mixed' | 'mens' | 'womens')[];
                  if (courtTypesArray[futureCourtIdx]) {
                    futureCourtType = courtTypesArray[futureCourtIdx];
                  }
                }
              }

              // 성별이 해당 코트 타입에 참여 가능한지 확인
              if (futureCourtType === 'mixed') {
                canParticipate = true;
                break;
              } else if (futureCourtType === 'mens' && gender === 'male') {
                canParticipate = true;
                break;
              } else if (futureCourtType === 'womens' && gender === 'female') {
                canParticipate = true;
                break;
              }
            }

            if (canParticipate) {
              remaining++;
            }
          }

          return remaining;
        };

        const remainingOpportunitiesA = calculateRemainingOpportunities(a, excludedMatchesListA);
        const remainingOpportunitiesB = calculateRemainingOpportunities(b, excludedMatchesListB);

        // 0순위: 평균 대비 -2 이상 부족한 사람 최우선 (2경기 차이 방지)
        const gapA = baseExpected - countA;
        const gapB = baseExpected - countB;

        const maxPossibleA = countA + remainingOpportunitiesA;
        const maxPossibleB = countB + remainingOpportunitiesB;

        // 제약조건 여부 확인
        const hasConstraintA = excludedMatchesListA.length > 0;
        const hasConstraintB = excludedMatchesListB.length > 0;

        // critical 조건:
        // 1. 평균보다 2경기 이상 부족
        // 2. 남은 모든 기회를 써도 평균 미달
        // 3. 제약조건이 있고, (남은 기회 - 현재 부족량) < 1 (여유가 없음)
        const marginA = hasConstraintA ? remainingOpportunitiesA - gapA : Infinity;
        const marginB = hasConstraintB ? remainingOpportunitiesB - gapB : Infinity;

        const criticalA = gapA >= 2 ||
                         (maxPossibleA < baseExpected && remainingOpportunitiesA > 0) ||
                         (hasConstraintA && marginA < 1 && gapA > 0);
        const criticalB = gapB >= 2 ||
                         (maxPossibleB < baseExpected && remainingOpportunitiesB > 0) ||
                         (hasConstraintB && marginB < 1 && gapB > 0);

        if (criticalA && !criticalB) return -1;
        if (!criticalA && criticalB) return 1;

        // 둘 다 critical이면 더 긴급한 사람 우선
        if (criticalA && criticalB) {
          // margin이 더 적을수록 (여유가 없을수록) 우선
          if (marginA !== marginB) {
            return marginA - marginB;
          }
          // gap이 더 클수록 우선
          if (gapA !== gapB) {
            return gapB - gapA;
          }
        }

        // 1순위: 제약조건으로 남은 기회가 부족한 회원 우선
        if (excludedMatchesListA.length > 0 || excludedMatchesListB.length > 0) {
          const netOpportunityA = remainingOpportunitiesA - countA;
          const netOpportunityB = remainingOpportunitiesB - countB;

          // 남은 기회가 평균보다 부족한 경우 긴급
          const urgentA = netOpportunityA < baseExpected && netOpportunityA >= 0;
          const urgentB = netOpportunityB < baseExpected && netOpportunityB >= 0;

          if (urgentA && !urgentB) return -1;
          if (!urgentA && urgentB) return 1;

          // 둘 다 긴급한 경우, 남은 기회가 더 적은 사람 우선 (시간이 없음)
          if (urgentA && urgentB) {
            if (remainingOpportunitiesA !== remainingOpportunitiesB) {
              return remainingOpportunitiesA - remainingOpportunitiesB;
            }
            // 남은 기회도 같으면 netOpportunity로 비교
            if (netOpportunityA !== netOpportunityB) {
              return netOpportunityA - netOpportunityB;
            }
          }
        }

        // 2순위: 평균 대비 부족한 사람 우선
        if (gapA !== gapB) {
          return gapB - gapA;
        }

        // 2.5순위: 제약조건이 있는 사람은 margin에 따라 조정
        // margin이 0 이하면 매우 긴급 (여유가 전혀 없음), 그 외에는 보수적으로 배정
        if (hasConstraintA || hasConstraintB) {
          // margin 0 이하: 매우 긴급 (남은 기회가 부족량 이하)
          const veryUrgentA = hasConstraintA && marginA <= 0;
          const veryUrgentB = hasConstraintB && marginB <= 0;

          if (veryUrgentA && !veryUrgentB) return -1;
          if (!veryUrgentA && veryUrgentB) return 1;

          // 둘 다 긴급하면 margin 비교
          if (veryUrgentA && veryUrgentB && marginA !== marginB) {
            return marginA - marginB;
          }

          // 둘 다 긴급하지 않은데 제약조건이 있으면, 일반인에게 양보
          // 단, gap이 같을 때만 (gap이 다르면 위에서 이미 처리됨)
          if (!veryUrgentA && !veryUrgentB && gapA === gapB) {
            if (hasConstraintA && !hasConstraintB) return 1;  // B 우선
            if (!hasConstraintA && hasConstraintB) return -1; // A 우선
          }
        }

        // 3순위: 개인별 설정된 목표 경기 수 미달 회원 우선
        const underTargetA = targetA !== undefined && countA < targetA;
        const underTargetB = targetB !== undefined && countB < targetB;

        if (underTargetA && !underTargetB) return -1; // A 우선
        if (!underTargetA && underTargetB) return 1;  // B 우선

        // 둘 다 목표 미달이면, 더 부족한 사람 우선
        if (underTargetA && underTargetB && targetA && targetB) {
          const targetGapA = targetA - countA;
          const targetGapB = targetB - countB;
          if (targetGapA !== targetGapB) return targetGapB - targetGapA;
        }

        // 4순위: 목표 초과 회원은 후순위
        const overTargetA = targetA !== undefined && countA >= targetA;
        const overTargetB = targetB !== undefined && countB >= targetB;

        if (overTargetA && !overTargetB) return 1;  // B 우선
        if (!overTargetA && overTargetB) return -1; // A 우선

        // 5순위: 참여 횟수가 적은 사람 우선
        if (countA !== countB) return countA - countB;

        // 6순위: 파트너 이력이 적은 사람 우선 (다양한 사람과 경기)
        const partnersA = partnerHistory.get(a.id)?.size || 0;
        const partnersB = partnerHistory.get(b.id)?.size || 0;
        if (partnersA !== partnersB) return partnersA - partnersB;

        // 7순위: 랜덤
        return Math.random() - 0.5;
      });

      // 여전히 부족하면 경기 건너뛰기
      if (availableAttendees.length < 4) {
        console.warn(`경기 ${matchNum} 코트 ${getCourtLabel(courtIdx)}: 참석자 부족 (${availableAttendees.length}명) - 경기 생성 불가`);
        continue;
      }

      // 파트너 페어 처리
      const usedPairMembers = new Set<number>();
      const selectedPlayers: Attendance[] = [];

      // 파트너 페어 확인 및 적용
      partnerPairs.forEach(([member1Id, member2Id]) => {
        if (selectedPlayers.length >= 4) return;

        const member1 = availableAttendees.find(a => a.member_id === member1Id);
        const member2 = availableAttendees.find(a => a.member_id === member2Id);

        if (member1 && member2 && !usedPairMembers.has(member1Id) && !usedPairMembers.has(member2Id)) {
          const gender1 = getGender(member1);
          const gender2 = getGender(member2);

          // 코트 타입에 따라 페어 적용 가능 여부 확인
          let canApplyPair = false;

          if (courtType === 'mixed') {
            canApplyPair = (
              (gender1 === 'male' && gender2 === 'female') ||
              (gender1 === 'female' && gender2 === 'male')
            );
          } else if (courtType === 'mens') {
            canApplyPair = (gender1 === 'male' && gender2 === 'male');
          } else if (courtType === 'womens') {
            canApplyPair = (gender1 === 'female' && gender2 === 'female');
          }

          if (canApplyPair) {
            const count1 = participationCount.get(member1.id) || 0;
            const count2 = participationCount.get(member2.id) || 0;
            const avgCount = (count1 + count2) / 2;

            const allCounts = availableAttendees.map(a => participationCount.get(a.id) || 0);
            const overallAvg = allCounts.reduce((sum, c) => sum + c, 0) / allCounts.length;

            if (avgCount <= overallAvg + 0.5) {
              selectedPlayers.push(member1, member2);
              usedPairMembers.add(member1Id);
              usedPairMembers.add(member2Id);
            }
          }
        }
      });

      // 나머지 선수 배정
      const nonPairAttendees = availableAttendees.filter(
        a => !usedPairMembers.has(a.member_id!)
      );

      console.log(`경기 ${matchNum} 코트 ${getCourtLabel(courtIdx)}: selectedPlayers=${selectedPlayers.length}, nonPairAttendees=${nonPairAttendees.length}`);

      // 혼복인 경우, 성별 밸런스를 고려하여 선수 선택
      if (courtType === 'mixed' && selectedPlayers.length < 4 && nonPairAttendees.length > 0) {
        // 현재 선택된 선수들의 성별 카운트
        const currentMales = selectedPlayers.filter(p => getGender(p) === 'male').length;
        const currentFemales = selectedPlayers.filter(p => getGender(p) === 'female').length;
        const needed = 4 - selectedPlayers.length;

        // 이상적으로는 남자 2명, 여자 2명이어야 함
        const neededMales = Math.max(0, 2 - currentMales);
        const neededFemales = Math.max(0, 2 - currentFemales);

        // 성별별로 분류
        const maleAttendees = nonPairAttendees.filter(a => getGender(a) === 'male');
        const femaleAttendees = nonPairAttendees.filter(a => getGender(a) === 'female');
        const guestAttendees = nonPairAttendees.filter(a => getGender(a) === 'guest');

        // 필요한 성별 우선 선택
        for (let i = 0; i < neededMales && maleAttendees.length > 0; i++) {
          selectedPlayers.push(maleAttendees.shift()!);
        }
        for (let i = 0; i < neededFemales && femaleAttendees.length > 0; i++) {
          selectedPlayers.push(femaleAttendees.shift()!);
        }

        // 아직 부족하면 남은 인원 중에서 선택
        const remaining = [...maleAttendees, ...femaleAttendees, ...guestAttendees];
        while (selectedPlayers.length < 4 && remaining.length > 0) {
          selectedPlayers.push(remaining.shift()!);
        }
      } else {
        // 혼복이 아니거나 다른 경우, 순서대로 선택
        while (selectedPlayers.length < 4 && nonPairAttendees.length > 0) {
          selectedPlayers.push(nonPairAttendees.shift()!);
        }
      }

      console.log(`경기 ${matchNum} 코트 ${getCourtLabel(courtIdx)}: 최종 selectedPlayers=${selectedPlayers.length}`);

      // 인원이 부족하면 중복 허용
      if (selectedPlayers.length < 4) {
        const additionalPlayers = availableAttendees
          .filter(a => !selectedPlayers.some(p => p.id === a.id))
          .slice(0, 4 - selectedPlayers.length);
        selectedPlayers.push(...additionalPlayers);
      }

      // 팀 구성
      if (selectedPlayers.length >= 4) {
        let teams: { team1: [Attendance, Attendance]; team2: [Attendance, Attendance] } | null = null;

        if (courtType === 'mixed') {
          teams = formMixedTeams(selectedPlayers);
        } else {
          teams = formSameGenderTeams(selectedPlayers);
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

          // 이번 경기 회차에 배정된 참석자 기록
          selectedPlayers.forEach(p => {
            usedInThisMatch.add(p.id);
          });

          // 참여 횟수 업데이트
          selectedPlayers.forEach(p => {
            const count = participationCount.get(p.id) || 0;
            participationCount.set(p.id, count + 1);
          });

          // KDK: 파트너 이력 업데이트
          const [p1, p2] = teams.team1;
          const [p3, p4] = teams.team2;

          // team1 파트너 기록
          partnerHistory.get(p1.id)?.add(p2.id);
          partnerHistory.get(p2.id)?.add(p1.id);

          // team2 파트너 기록
          partnerHistory.get(p3.id)?.add(p4.id);
          partnerHistory.get(p4.id)?.add(p3.id);
        }
      }
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
    match_type: match.match_type,
    player1_id: match.team1[0].id,
    player2_id: match.team1[1].id,
    player3_id: match.team2[0].id,
    player4_id: match.team2[1].id
  }));
}
