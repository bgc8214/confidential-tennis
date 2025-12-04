import { useState } from 'react';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { MatchSettings } from '../types';

interface AdvancedScheduleSettingsProps {
  settings: MatchSettings;
  onSettingsChange: (settings: MatchSettings) => void;
}

const matchTypeEmojis = {
  mixed: '👨👩',
  mens: '👨👨',
  womens: '👩👩',
};

export default function AdvancedScheduleSettings({
  settings,
  onSettingsChange,
}: AdvancedScheduleSettingsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTotalMatchesChange = (value: string) => {
    const totalMatches = parseInt(value, 10);
    const newMatchTypes = Array(totalMatches).fill('mixed').map((_, i) =>
      settings.matchTypes[i] || 'mixed'
    ) as ('mixed' | 'mens' | 'womens')[];

    // 총 시간을 유지하면서 경기당 시간을 재계산
    const totalDuration = calculateTotalDuration();
    const matchDuration = Math.floor(totalDuration / totalMatches);

    onSettingsChange({
      ...settings,
      totalMatches,
      matchDuration,
      matchTypes: newMatchTypes,
    });
  };

  const handleMatchDurationChange = (value: string) => {
    const totalMinutes = parseInt(value, 10);
    const matchDuration = Math.floor(totalMinutes / settings.totalMatches);

    onSettingsChange({
      ...settings,
      matchDuration,
    });
  };

  const handleCourtCountChange = (value: string) => {
    const newCourtCount = parseInt(value, 10);
    // 코트 수가 변경되면 코트별 타입 배열도 조정
    let newCourtTypes = settings.courtTypes;

    if (newCourtTypes) {
      if (Array.isArray(newCourtTypes[0])) {
        // 2D 배열인 경우
        newCourtTypes = (newCourtTypes as ('mixed' | 'mens' | 'womens')[][]).map(
          matchCourtTypes => matchCourtTypes.slice(0, newCourtCount)
        );
      } else {
        // 1D 배열인 경우
        newCourtTypes = (newCourtTypes as ('mixed' | 'mens' | 'womens')[]).slice(0, newCourtCount);
      }
    }

    onSettingsChange({
      ...settings,
      courtCount: newCourtCount,
      courtTypes: newCourtTypes,
    });
  };

  const handleCourtTypeChange = (
    matchIndex: number | undefined,
    courtIndex: number,
    value: 'mixed' | 'mens' | 'womens'
  ) => {
    if (matchIndex === undefined) {
      // 1D 배열 모드 (모든 경기 동일)
      const newCourtTypes = (settings.courtTypes as ('mixed' | 'mens' | 'womens')[]) ||
        Array(settings.courtCount).fill('mixed');
      newCourtTypes[courtIndex] = value;
      onSettingsChange({
        ...settings,
        courtTypes: newCourtTypes,
      });
    } else {
      // 2D 배열 모드 (경기별로 다름)
      const newCourtTypes = (settings.courtTypes as ('mixed' | 'mens' | 'womens')[][]) ||
        Array.from({ length: settings.totalMatches }, () =>
          Array(settings.courtCount).fill('mixed') as ('mixed' | 'mens' | 'womens')[]
        );
      newCourtTypes[matchIndex][courtIndex] = value;
      onSettingsChange({
        ...settings,
        courtTypes: newCourtTypes,
      });
    }
  };

  const applyCourtTypeToAll = (type: 'mixed' | 'mens' | 'womens') => {
    onSettingsChange({
      ...settings,
      courtTypes: Array(settings.courtCount).fill(type) as ('mixed' | 'mens' | 'womens')[],
    });
  };

  const handleMatchTypeChange = (index: number, value: 'mixed' | 'mens' | 'womens') => {
    const newMatchTypes = [...settings.matchTypes];
    newMatchTypes[index] = value;
    onSettingsChange({
      ...settings,
      matchTypes: newMatchTypes,
    });
  };

  const applyTypeToAll = (type: 'mixed' | 'mens' | 'womens') => {
    onSettingsChange({
      ...settings,
      matchTypes: Array(settings.totalMatches).fill(type) as ('mixed' | 'mens' | 'womens')[],
    });
  };

  const calculateTotalDuration = () => {
    return settings.totalMatches * settings.matchDuration;
  };

  const getCalculatedMatchDuration = () => {
    return Math.floor(calculateTotalDuration() / settings.totalMatches);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border-2 border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <span className="text-3xl">⚙️</span>
          <span>경기 설정</span>
        </h3>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm font-medium text-[#D4765A] hover:text-[#2E7D4E] transition-colors"
        >
          {showAdvanced ? '간편 설정으로' : '고급 설정 열기'}
        </button>
      </div>

      {/* 기본 설정 */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="total_duration" className="block text-sm font-medium text-gray-700 mb-2">
            코트 예약 시간 *
          </Label>
          <Select
            value={calculateTotalDuration().toString()}
            onValueChange={handleMatchDurationChange}
          >
            <SelectTrigger id="total_duration" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[60, 90, 120, 150, 180, 210, 240].map((minutes) => {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return (
                  <SelectItem key={minutes} value={minutes.toString()}>
                    {hours}시간{mins > 0 ? ` ${mins}분` : ''}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-2">
            총 {Math.floor(calculateTotalDuration() / 60)}시간 {calculateTotalDuration() % 60 > 0 ? `${calculateTotalDuration() % 60}분` : ''}
          </p>
        </div>

        <div>
          <Label htmlFor="total_matches" className="block text-sm font-medium text-gray-700 mb-2">
            총 경기 수 *
          </Label>
          <Select value={settings.totalMatches.toString()} onValueChange={handleTotalMatchesChange}>
            <SelectTrigger id="total_matches" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}경기
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-2">
            경기당 약 {settings.matchDuration}분
          </p>
        </div>

        <div>
          <Label htmlFor="court_count" className="block text-sm font-medium text-gray-700 mb-2">
            코트 수 *
          </Label>
          <Select value={settings.courtCount.toString()} onValueChange={handleCourtCountChange}>
            <SelectTrigger id="court_count" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}코트
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-2">
            경기당 {settings.courtCount}코트 운영
          </p>
        </div>
      </div>

      {/* 고급 설정: 경기별 타입 */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t-2 border-gray-100 animate-slide-in">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-gray-900">경기별 타입 설정</h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => applyTypeToAll('mixed')}
                className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                전체 혼복
              </button>
              <button
                type="button"
                onClick={() => applyTypeToAll('mens')}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                전체 남복
              </button>
              <button
                type="button"
                onClick={() => applyTypeToAll('womens')}
                className="text-xs px-3 py-1 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
              >
                전체 여복
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {settings.matchTypes.map((type, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-[#D4765A] transition-colors"
              >
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  경기 {index + 1}
                </Label>
                <Select
                  value={type}
                  onValueChange={(value: 'mixed' | 'mens' | 'womens') => handleMatchTypeChange(index, value)}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center space-x-2">
                      <span>{matchTypeEmojis[type]}</span>
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">
                      <div className="flex items-center space-x-2">
                        <span>👨👩</span>
                        <span>혼복</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="mens">
                      <div className="flex items-center space-x-2">
                        <span>👨👨</span>
                        <span>남복</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="womens">
                      <div className="flex items-center space-x-2">
                        <span>👩👩</span>
                        <span>여복</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* 타입별 통계 */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-100">
            <h5 className="text-sm font-bold text-gray-900 mb-2">경기 타입 분포</h5>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👨👩</span>
                <span className="font-medium">혼복:</span>
                <span className="text-purple-700 font-bold">
                  {settings.matchTypes.filter(t => t === 'mixed').length}경기
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👨👨</span>
                <span className="font-medium">남복:</span>
                <span className="text-blue-700 font-bold">
                  {settings.matchTypes.filter(t => t === 'mens').length}경기
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👩👩</span>
                <span className="font-medium">여복:</span>
                <span className="text-pink-700 font-bold">
                  {settings.matchTypes.filter(t => t === 'womens').length}경기
                </span>
              </div>
            </div>
          </div>

          {/* 코트별 타입 설정 */}
          <div className="space-y-4 pt-4 border-t-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">코트별 타입 설정 (선택사항)</h4>
                <p className="text-xs text-gray-500 mt-1">
                  설정하지 않으면 경기별 타입이 적용됩니다
                </p>
              </div>
              {settings.courtTypes && (
                <div className="flex gap-2">
                  {!Array.isArray(settings.courtTypes[0]) && (
                    <>
                      <button
                        type="button"
                        onClick={() => applyCourtTypeToAll('mixed')}
                        className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        전체 혼복
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCourtTypeToAll('mens')}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        전체 남복
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCourtTypeToAll('womens')}
                        className="text-xs px-3 py-1 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
                      >
                        전체 여복
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onSettingsChange({ ...settings, courtTypes: undefined })}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    설정 해제
                  </button>
                </div>
              )}
            </div>

            {!settings.courtTypes ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onSettingsChange({
                      ...settings,
                      courtTypes: Array(settings.courtCount).fill('mixed') as ('mixed' | 'mens' | 'womens')[],
                    });
                  }}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl border-2 border-dashed border-gray-300 text-gray-700 font-medium transition-colors"
                >
                  + 모든 경기에 동일하게 적용 (간편 모드)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSettingsChange({
                      ...settings,
                      courtTypes: Array.from({ length: settings.totalMatches }, () =>
                        Array(settings.courtCount).fill('mixed') as ('mixed' | 'mens' | 'womens')[]
                      ),
                    });
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 rounded-xl border-2 border-dashed border-purple-300 text-purple-700 font-medium transition-colors"
                >
                  + 경기별로 다르게 설정 (고급 모드)
                </button>
              </div>
            ) : Array.isArray(settings.courtTypes[0]) ? (
              // 2D 모드: 경기별로 다른 코트 설정
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-sm text-purple-900 font-medium">
                    🎯 고급 모드: 각 경기마다 코트별 타입을 개별 설정할 수 있습니다
                  </p>
                </div>
                {settings.matchTypes.map((_, matchIndex) => (
                  <div
                    key={matchIndex}
                    className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200"
                  >
                    <h5 className="text-md font-bold text-gray-900 mb-3">
                      경기 {matchIndex + 1}
                    </h5>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.from({ length: settings.courtCount }, (_, courtIndex) => {
                        const courtType = (settings.courtTypes as ('mixed' | 'mens' | 'womens')[][])[matchIndex]?.[courtIndex] || 'mixed';
                        return (
                          <div
                            key={courtIndex}
                            className="bg-white rounded-lg p-3 border border-gray-200 hover:border-[#D4765A] transition-colors"
                          >
                            <Label className="block text-xs font-medium text-gray-700 mb-2">
                              코트 {String.fromCharCode(65 + courtIndex)}
                            </Label>
                            <Select
                              value={courtType}
                              onValueChange={(value: 'mixed' | 'mens' | 'womens') =>
                                handleCourtTypeChange(matchIndex, courtIndex, value)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <div className="flex items-center space-x-2">
                                  <span>{matchTypeEmojis[courtType]}</span>
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mixed">
                                  <div className="flex items-center space-x-2">
                                    <span>👨👩</span>
                                    <span>혼복</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="mens">
                                  <div className="flex items-center space-x-2">
                                    <span>👨👨</span>
                                    <span>남복</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="womens">
                                  <div className="flex items-center space-x-2">
                                    <span>👩👩</span>
                                    <span>여복</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 1D 모드: 모든 경기에 동일한 코트 설정
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium">
                    📋 간편 모드: 모든 경기에 동일한 코트 타입이 적용됩니다
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: settings.courtCount }, (_, index) => {
                    const courtType = (settings.courtTypes as ('mixed' | 'mens' | 'womens')[])[index] || 'mixed';
                    return (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-[#D4765A] transition-colors"
                      >
                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                          코트 {String.fromCharCode(65 + index)}
                        </Label>
                        <Select
                          value={courtType}
                          onValueChange={(value: 'mixed' | 'mens' | 'womens') =>
                            handleCourtTypeChange(undefined, index, value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <div className="flex items-center space-x-2">
                              <span>{matchTypeEmojis[courtType]}</span>
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mixed">
                              <div className="flex items-center space-x-2">
                                <span>👨👩</span>
                                <span>혼복</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="mens">
                              <div className="flex items-center space-x-2">
                                <span>👨👨</span>
                                <span>남복</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="womens">
                              <div className="flex items-center space-x-2">
                                <span>👩👩</span>
                                <span>여복</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
