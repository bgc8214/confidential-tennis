import type { Member } from '../types';

interface AttendeeSelectorProps {
  members: Member[];
  selectedMemberIds: number[];
  onMemberToggle: (memberId: number) => void;
}

export default function AttendeeSelector({
  members,
  selectedMemberIds,
  onMemberToggle
}: AttendeeSelectorProps) {
  const handleSelectAll = () => {
    if (selectedMemberIds.length === members.length) {
      // Deselect all
      members.forEach(member => {
        if (selectedMemberIds.includes(member.id)) {
          onMemberToggle(member.id);
        }
      });
    } else {
      // Select all
      members.forEach(member => {
        if (!selectedMemberIds.includes(member.id)) {
          onMemberToggle(member.id);
        }
      });
    }
  };

  // 선택된 회원의 성별별 인원 수 계산
  const selectedMembers = members.filter(m => selectedMemberIds.includes(m.id));
  const maleCount = selectedMembers.filter(m => m.gender === 'male').length;
  const femaleCount = selectedMembers.filter(m => m.gender === 'female').length;


  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          회원 선택
        </h3>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {selectedMemberIds.length === members.length ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          등록된 회원이 없습니다. 먼저 회원을 등록해주세요.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((member) => {
            const isSelected = selectedMemberIds.includes(member.id);
            return (
              <label
                key={member.id}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onMemberToggle(member.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">
                    {member.name}
                  </div>
                  {member.gender && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        member.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {member.gender === 'male' ? '남' : '여'}
                      </span>
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            선택된 회원: <span className="font-bold text-gray-900">{selectedMemberIds.length}</span>명
          </div>
          {selectedMemberIds.length > 0 && (
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-600">남자 <span className="font-bold text-blue-700">{maleCount}</span>명</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-pink-500"></span>
                <span className="text-gray-600">여자 <span className="font-bold text-pink-700">{femaleCount}</span>명</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
