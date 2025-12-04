import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { GeneratedMatch } from '../types';

interface DraggableMatchCardProps {
  match: GeneratedMatch;
  matchIndex: number;
}

export default function DraggableMatchCard({ match, matchIndex }: DraggableMatchCardProps) {
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className={`px-4 py-2 rounded-xl font-bold text-lg shadow-md ${
          match.court === 'A'
            ? 'bg-gradient-to-r from-[#D4765A] to-[#B85C3D] text-white'
            : 'bg-gradient-to-r from-[#2E7D4E] to-[#1F5A35] text-white'
        }`}>
          코트 {match.court}
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-lg font-medium text-sm border-2 flex items-center gap-1 ${getMatchTypeColor(match.match_type)}`}>
            <span>{getMatchTypeEmoji(match.match_type)}</span>
            <span>{getMatchTypeLabel(match.match_type)}</span>
          </div>
          <span className="text-xs text-gray-500 font-medium">드래그하여 교체</span>
        </div>
      </div>

      {/* Team 1 */}
      <div className="mb-3 sm:mb-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Team 1</div>
        <div className="space-y-1.5 sm:space-y-2">
          {match.team1.map((player, idx) => (
            <DraggablePlayer
              key={`${matchIndex}-${match.court}-${idx}`}
              player={player}
              playerId={`match-${matchIndex}-${match.court}-player-${idx}`}
              teamColor="bg-blue-50 border-blue-200"
            />
          ))}
        </div>
      </div>

      {/* VS Divider */}
      <div className="relative my-3 sm:my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 sm:px-4 bg-white text-xs sm:text-sm font-bold text-gray-500">VS</span>
        </div>
      </div>

      {/* Team 2 */}
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Team 2</div>
        <div className="space-y-1.5 sm:space-y-2">
          {match.team2.map((player, idx) => (
            <DraggablePlayer
              key={`${matchIndex}-${match.court}-${idx + 2}`}
              player={player}
              playerId={`match-${matchIndex}-${match.court}-player-${idx + 2}`}
              teamColor="bg-red-50 border-red-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DraggablePlayerProps {
  player: any;
  playerId: string;
  teamColor: string;
}

function DraggablePlayer({ player, playerId, teamColor }: DraggablePlayerProps) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: playerId,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: playerId,
  });

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
      return 'bg-gray-200 text-gray-700';
    }
    const gender = attendance.member?.gender;
    switch (gender) {
      case 'male': return 'bg-blue-100 text-blue-700';
      case 'female': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={style}
      className={`
        group relative flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border-2
        transition-all duration-200 cursor-grab active:cursor-grabbing touch-none
        ${teamColor}
        ${isDragging ? 'opacity-50 scale-105 shadow-2xl z-50 ring-4 ring-[#F4CE6A]' : ''}
        ${isOver ? 'ring-2 ring-[#D4765A] scale-105' : ''}
        hover:shadow-lg hover:scale-102
      `}
      {...attributes}
      {...listeners}
    >
      {/* Drag Handle Icon */}
      <div className="absolute left-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 10 0 4 2 2 0 000-4zm6 0a2 2 0 10 0 4 2 2 0 000-4zM7 8a2 2 0 10 0 4 2 2 0 000-4zm6 0a2 2 0 10 0 4 2 2 0 000-4zM7 14a2 2 0 10 0 4 2 2 0 000-4zm6 0a2 2 0 10 0 4 2 2 0 000-4z" />
        </svg>
      </div>

      <div className="flex-1 ml-3 sm:ml-4">
        <span className="font-semibold text-sm sm:text-base text-gray-900">{getPlayerName(player)}</span>
      </div>

      <span className={`text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-medium ${getPlayerLabelColor(player)}`}>
        {getPlayerLabel(player)}
      </span>

      {/* Hover Effect */}
      {!isDragging && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
      )}
    </div>
  );
}
