import { useState } from 'react';
import type { Member } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export interface ConstraintData {
  excludeLastMatch: number[]; // 마지막 경기 제외할 회원 ID 목록
  partnerPairs: Array<[number, number]>; // 파트너 페어 (회원 ID 쌍)
  excludeMatches: Array<{ memberId: number; matchNumber: number }>; // 특정 경기 제외
}

interface ConstraintPanelProps {
  members: Member[];
  selectedMemberIds: number[];
  constraints: ConstraintData;
  onConstraintsChange: (constraints: ConstraintData) => void;
}

export default function ConstraintPanel({
  members,
  selectedMemberIds,
  constraints,
  onConstraintsChange
}: ConstraintPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 선택된 회원만 필터링
  const selectedMembers = members.filter(m => selectedMemberIds.includes(m.id));

  // 마지막 경기 제외 토글
  const handleExcludeLastMatchToggle = (memberId: number) => {
    const newExcludeLastMatch = constraints.excludeLastMatch.includes(memberId)
      ? constraints.excludeLastMatch.filter(id => id !== memberId)
      : [...constraints.excludeLastMatch, memberId];

    onConstraintsChange({
      ...constraints,
      excludeLastMatch: newExcludeLastMatch
    });
  };

  // 파트너 페어 추가
  const [partner1, setPartner1] = useState<number | ''>('');
  const [partner2, setPartner2] = useState<number | ''>('');

  const handleAddPartnerPair = () => {
    if (partner1 && partner2 && partner1 !== partner2) {
      const pair: [number, number] = [Number(partner1), Number(partner2)];

      // 중복 체크
      const isDuplicate = constraints.partnerPairs.some(
        ([p1, p2]) =>
          (p1 === pair[0] && p2 === pair[1]) ||
          (p1 === pair[1] && p2 === pair[0])
      );

      if (!isDuplicate) {
        onConstraintsChange({
          ...constraints,
          partnerPairs: [...constraints.partnerPairs, pair]
        });
        setPartner1('');
        setPartner2('');
      }
    }
  };

  const handleRemovePartnerPair = (index: number) => {
    onConstraintsChange({
      ...constraints,
      partnerPairs: constraints.partnerPairs.filter((_, i) => i !== index)
    });
  };

  // 특정 경기 제외
  const [excludeMemberId, setExcludeMemberId] = useState<number | ''>('');
  const [excludeMatchNumber, setExcludeMatchNumber] = useState<number | ''>('');

  const handleAddExcludeMatch = () => {
    if (excludeMemberId && excludeMatchNumber) {
      const newExclude = {
        memberId: Number(excludeMemberId),
        matchNumber: Number(excludeMatchNumber)
      };

      // 중복 체크
      const isDuplicate = constraints.excludeMatches.some(
        e => e.memberId === newExclude.memberId && e.matchNumber === newExclude.matchNumber
      );

      if (!isDuplicate) {
        onConstraintsChange({
          ...constraints,
          excludeMatches: [...constraints.excludeMatches, newExclude]
        });
        setExcludeMemberId('');
        setExcludeMatchNumber('');
      }
    }
  };

  const handleRemoveExcludeMatch = (index: number) => {
    onConstraintsChange({
      ...constraints,
      excludeMatches: constraints.excludeMatches.filter((_, i) => i !== index)
    });
  };

  const getMemberName = (memberId: number) => {
    return members.find(m => m.id === memberId)?.name || '알 수 없음';
  };

  const totalConstraints =
    constraints.excludeLastMatch.length +
    constraints.partnerPairs.length +
    constraints.excludeMatches.length;

  return (
    <Card className="border-2 border-[#F4CE6A]/30">
      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">⚙️</span>
              <span>제약조건 설정</span>
              {totalConstraints > 0 && (
                <span className="px-3 py-1 bg-[#D4765A] text-white rounded-full text-sm font-medium">
                  {totalConstraints}개 적용
                </span>
              )}
            </CardTitle>
            <CardDescription>
              선택사항: 특정 회원에게 제약조건을 설정할 수 있습니다
            </CardDescription>
          </div>
          <svg
            className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-6 border-t">
          {selectedMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              먼저 참석자를 선택해주세요
            </div>
          ) : (
            <>
              {/* 1. 마지막 경기 제외 */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    🏁 마지막 경기 제외
                  </h4>
                  <p className="text-sm text-gray-600">
                    조기 퇴장이 필요한 회원을 선택하세요 (6번째 경기 제외)
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedMembers.map(member => (
                    <label
                      key={member.id}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                        constraints.excludeLastMatch.includes(member.id)
                          ? 'bg-[#D4765A]/10 border-[#D4765A] text-[#D4765A] font-medium'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={constraints.excludeLastMatch.includes(member.id)}
                        onChange={() => handleExcludeLastMatchToggle(member.id)}
                        className="w-4 h-4 text-[#D4765A] rounded focus:ring-[#D4765A]"
                      />
                      <span className="text-sm">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. 파트너 페어 지정 */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    🤝 파트너 페어 지정
                  </h4>
                  <p className="text-sm text-gray-600">
                    항상 같은 팀으로 배정할 두 명을 선택하세요
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <select
                    value={partner1}
                    onChange={(e) => setPartner1(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 min-w-[140px] px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2E7D4E]"
                  >
                    <option value="">선수 1 선택</option>
                    {selectedMembers.map(m => (
                      <option key={m.id} value={m.id} disabled={m.id === partner2}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <span className="flex items-center text-gray-400 font-bold">+</span>

                  <select
                    value={partner2}
                    onChange={(e) => setPartner2(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 min-w-[140px] px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2E7D4E]"
                  >
                    <option value="">선수 2 선택</option>
                    {selectedMembers.map(m => (
                      <option key={m.id} value={m.id} disabled={m.id === partner1}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    onClick={handleAddPartnerPair}
                    disabled={!partner1 || !partner2 || partner1 === partner2}
                    className="bg-[#2E7D4E] hover:bg-[#1F5A35]"
                  >
                    추가
                  </Button>
                </div>

                {constraints.partnerPairs.length > 0 && (
                  <div className="space-y-2">
                    {constraints.partnerPairs.map((pair, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-3 bg-[#2E7D4E]/10 border-2 border-[#2E7D4E]/30 rounded-xl"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {getMemberName(pair[0])} & {getMemberName(pair[1])}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePartnerPair(index)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. 특정 경기 제외 */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    ⏭️ 특정 경기 제외
                  </h4>
                  <p className="text-sm text-gray-600">
                    특정 회원이 특정 경기 번호에 참여하지 않도록 설정
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <select
                    value={excludeMemberId}
                    onChange={(e) => setExcludeMemberId(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 min-w-[140px] px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D4765A]"
                  >
                    <option value="">회원 선택</option>
                    {selectedMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>

                  <select
                    value={excludeMatchNumber}
                    onChange={(e) => setExcludeMatchNumber(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 min-w-[140px] px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D4765A]"
                  >
                    <option value="">경기 번호</option>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>경기 {num}</option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    onClick={handleAddExcludeMatch}
                    disabled={!excludeMemberId || !excludeMatchNumber}
                    className="bg-[#D4765A] hover:bg-[#B85C3D]"
                  >
                    추가
                  </Button>
                </div>

                {constraints.excludeMatches.length > 0 && (
                  <div className="space-y-2">
                    {constraints.excludeMatches.map((exclude, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-3 bg-[#D4765A]/10 border-2 border-[#D4765A]/30 rounded-xl"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {getMemberName(exclude.memberId)} - 경기 {exclude.matchNumber} 제외
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExcludeMatch(index)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
