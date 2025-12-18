import { useState } from 'react';

export interface Guest {
  name: string;
  gender: 'male' | 'female';
}

interface GuestInputProps {
  guests: Guest[];
  onAddGuest: (guest: Guest) => void;
  onRemoveGuest: (guestName: string) => void;
}

export default function GuestInput({
  guests,
  onAddGuest,
  onRemoveGuest
}: GuestInputProps) {
  const [guestName, setGuestName] = useState('');
  const [guestGender, setGuestGender] = useState<'male' | 'female'>('male');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      setError('게스트 이름을 입력해주세요.');
      return;
    }

    if (guests.some(g => g.name === guestName.trim())) {
      setError('이미 추가된 게스트입니다.');
      return;
    }

    if (guests.length >= 12) {
      setError('최대 12명까지 추가 가능합니다.');
      return;
    }

    onAddGuest({ name: guestName.trim(), gender: guestGender });
    setGuestName('');
    setGuestGender('male');
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        게스트 추가
      </h3>

      {/* Guest Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={guestName}
          onChange={(e) => {
            setGuestName(e.target.value);
            setError(null);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="게스트 이름 입력"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={guestGender}
          onChange={(e) => setGuestGender(e.target.value as 'male' | 'female')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="male">남성</option>
          <option value="female">여성</option>
        </select>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          추가
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Guest List */}
      {guests.length > 0 ? (
        <div className="space-y-2">
          {guests.map((guest, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">{guest.name}</span>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                  게스트
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  guest.gender === 'male'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-pink-100 text-pink-700'
                }`}>
                  {guest.gender === 'male' ? '남성' : '여성'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveGuest(guest.name)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-lg">
          추가된 게스트가 없습니다.
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            게스트 수: <span className="font-bold text-gray-900">{guests.length}</span>명
          </div>
          {guests.length > 0 && (
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-600">남자 <span className="font-bold text-blue-700">{guests.filter(g => g.gender === 'male').length}</span>명</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-pink-500"></span>
                <span className="text-gray-600">여자 <span className="font-bold text-pink-700">{guests.filter(g => g.gender === 'female').length}</span>명</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
