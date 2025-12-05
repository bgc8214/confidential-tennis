import { useState, useEffect } from 'react';
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

interface Template {
  name: string;
  settings: MatchSettings;
  createdAt: string;
}

export default function AdvancedScheduleSettings({
  settings,
  onSettingsChange,
}: AdvancedScheduleSettingsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // 템플릿 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem('scheduleTemplates');
      if (saved) {
        setTemplates(JSON.parse(saved));
      }
    } catch (error) {
      console.error('템플릿 불러오기 실패:', error);
    }
  }, []);

  // 템플릿 저장
  const saveTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('템플릿 이름을 입력해주세요.');
      return;
    }

    const newTemplate: Template = {
      name: newTemplateName.trim(),
      settings: { ...settings },
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('scheduleTemplates', JSON.stringify(updatedTemplates));

    setNewTemplateName('');
    setShowTemplateModal(false);
    alert(`템플릿 "${newTemplate.name}"이 저장되었습니다!`);
  };

  // 템플릿 불러오기
  const loadTemplate = (template: Template) => {
    onSettingsChange(template.settings);
    alert(`템플릿 "${template.name}"을 불러왔습니다!`);
  };

  // 템플릿 삭제
  const deleteTemplate = (templateName: string) => {
    if (!confirm(`템플릿 "${templateName}"을 삭제하시겠습니까?`)) return;

    const updatedTemplates = templates.filter(t => t.name !== templateName);
    setTemplates(updatedTemplates);
    localStorage.setItem('scheduleTemplates', JSON.stringify(updatedTemplates));
    alert(`템플릿 "${templateName}"이 삭제되었습니다.`);
  };

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

  // 프리셋 적용 함수
  const applyPreset = (presetName: string) => {
    const totalMatches = settings.totalMatches;

    if (presetName === 'all-mixed') {
      // 전체 혼복
      onSettingsChange({
        ...settings,
        matchTypes: Array(totalMatches).fill('mixed') as ('mixed' | 'mens' | 'womens')[],
        courtTypes: undefined
      });
    } else if (presetName === 'split-from-3') {
      // 3경기부터 남여 분리 (당신이 자주 쓰는 패턴)
      const newCourtTypes: ('mixed' | 'mens' | 'womens')[][] = [];
      for (let i = 0; i < totalMatches; i++) {
        if (i < 2) {
          // 경기 1, 2: 혼복
          newCourtTypes.push(['mixed', 'mixed']);
        } else {
          // 경기 3~6: 코트 A 남복, 코트 B 여복
          newCourtTypes.push(['mens', 'womens']);
        }
      }
      onSettingsChange({
        ...settings,
        matchTypes: Array(totalMatches).fill('mixed') as ('mixed' | 'mens' | 'womens')[],
        courtTypes: newCourtTypes
      });
    } else if (presetName === 'alternate') {
      // 홀수 혼복, 짝수 분리
      const newCourtTypes: ('mixed' | 'mens' | 'womens')[][] = [];
      for (let i = 0; i < totalMatches; i++) {
        if (i % 2 === 0) {
          // 홀수 경기 (0, 2, 4...): 혼복
          newCourtTypes.push(['mixed', 'mixed']);
        } else {
          // 짝수 경기 (1, 3, 5...): 남여 분리
          newCourtTypes.push(['mens', 'womens']);
        }
      }
      onSettingsChange({
        ...settings,
        matchTypes: Array(totalMatches).fill('mixed') as ('mixed' | 'mens' | 'womens')[],
        courtTypes: newCourtTypes
      });
    }
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

      {/* 빠른 프리셋 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>⚡</span>
          <span>빠른 프리셋</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('all-mixed')}
            className="px-4 py-2 bg-white hover:bg-purple-50 border-2 border-purple-300 text-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            👨👩 전체 혼복
          </button>
          <button
            type="button"
            onClick={() => applyPreset('split-from-3')}
            className="px-4 py-2 bg-white hover:bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            🎯 3경기부터 남여 분리
          </button>
          <button
            type="button"
            onClick={() => applyPreset('alternate')}
            className="px-4 py-2 bg-white hover:bg-green-50 border-2 border-green-300 text-green-700 rounded-lg text-sm font-medium transition-colors"
          >
            🔄 홀수 혼복, 짝수 분리
          </button>
        </div>
      </div>

      {/* 템플릿 관리 */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span>💾</span>
            <span>내 템플릿</span>
          </h4>
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
          >
            + 현재 설정 저장
          </button>
        </div>

        {templates.length === 0 ? (
          <p className="text-sm text-gray-500">저장된 템플릿이 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <div
                key={template.name}
                className="flex items-center gap-1 px-3 py-2 bg-white border-2 border-orange-300 rounded-lg text-sm"
              >
                <button
                  type="button"
                  onClick={() => loadTemplate(template)}
                  className="text-orange-700 hover:text-orange-900 font-medium"
                >
                  {template.name}
                </button>
                <button
                  type="button"
                  onClick={() => deleteTemplate(template.name)}
                  className="ml-1 text-red-500 hover:text-red-700"
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 템플릿 저장 모달 */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">템플릿 저장</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  템플릿 이름
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveTemplate()}
                  placeholder="예: 토요일 기본 패턴"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveTemplate}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setNewTemplateName('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
