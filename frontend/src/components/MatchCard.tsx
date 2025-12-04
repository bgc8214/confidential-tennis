import type { GeneratedMatch } from '../types';

interface MatchCardProps {
  match: GeneratedMatch;
}

export default function MatchCard({ match }: MatchCardProps) {
  const getPlayerName = (attendance: any): string => {
    if (attendance.is_guest) {
      return attendance.guest_name || '게스트';
    }
    return attendance.member?.name || '알 수 없음';
  };

  const getPlayerLabel = (attendance: any): string => {
    if (attendance.is_guest) {
      return '게스트';
    }
    const gender = attendance.member?.gender;
    switch (gender) {
      case 'male': return '남';
      case 'female': return '여';
      default: return '';
    }
  };

  const getPlayerLabelColor = (attendance: any): string => {
    if (attendance.is_guest) {
      return 'bg-gray-100 text-gray-600';
    }
    const gender = attendance.member?.gender;
    switch (gender) {
      case 'male': return 'bg-blue-100 text-blue-700';
      case 'female': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getMatchTypeLabel = (type: 'mixed' | 'mens' | 'womens'): string => {
    switch (type) {
      case 'mixed': return '혼복';
      case 'mens': return '남복';
      case 'womens': return '여복';
      default: return '혼복';
    }
  };

  const getMatchTypeColor = (type: 'mixed' | 'mens' | 'womens'): string => {
    switch (type) {
      case 'mixed': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'mens': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'womens': return 'bg-pink-100 text-pink-700 border-pink-200';
      default: return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const getMatchTypeEmoji = (type: 'mixed' | 'mens' | 'womens'): string => {
    switch (type) {
      case 'mixed': return '🎾';
      case 'mens': return '👨‍🦱';
      case 'womens': return '👩‍🦱';
      default: return '🎾';
    }
  };

  return (
    <div className="relative border-2 border-[#2E7D4E]/20 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Court Label and Match Type */}
      <div className="flex items-center justify-between mb-4">
        <div className={`px-4 py-2 rounded-xl font-bold text-lg shadow-md ${
          match.court === 'A'
            ? 'bg-gradient-to-r from-[#D4765A] to-[#B85C3D] text-white'
            : 'bg-gradient-to-r from-[#2E7D4E] to-[#1F5A35] text-white'
        }`}>
          코트 {match.court}
        </div>
        <div className={`px-3 py-1 rounded-lg font-medium text-sm border-2 flex items-center gap-1 ${getMatchTypeColor(match.match_type)}`}>
          <span>{getMatchTypeEmoji(match.match_type)}</span>
          <span>{getMatchTypeLabel(match.match_type)}</span>
        </div>
      </div>

      {/* Team 1 */}
      <div className="mb-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Team 1</div>
        <div className="space-y-2">
          {match.team1.map((player, idx) => (
            <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-xl border-2 bg-blue-50 border-blue-200">
              <span className="font-semibold text-gray-900">{getPlayerName(player)}</span>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlayerLabelColor(player)}`}>
                {getPlayerLabel(player)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* VS Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-white text-sm font-bold text-gray-500">VS</span>
        </div>
      </div>

      {/* Team 2 */}
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Team 2</div>
        <div className="space-y-2">
          {match.team2.map((player, idx) => (
            <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-xl border-2 bg-red-50 border-red-200">
              <span className="font-semibold text-gray-900">{getPlayerName(player)}</span>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlayerLabelColor(player)}`}>
                {getPlayerLabel(player)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
