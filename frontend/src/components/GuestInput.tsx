import { useState } from 'react';

interface GuestInputProps {
  guests: string[];
  onAddGuest: (guestName: string) => void;
  onRemoveGuest: (guestName: string) => void;
}

export default function GuestInput({
  guests,
  onAddGuest,
  onRemoveGuest
}: GuestInputProps) {
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      setError('게스트 이름을 입력해주세요.');
      return;
    }

    if (guests.includes(guestName.trim())) {
      setError('이미 추가된 게스트입니다.');
      return;
    }

    if (guests.length >= 12) {
      setError('최대 12명까지 추가 가능합니다.');
      return;
    }

    onAddGuest(guestName.trim());
    setGuestName('');
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        게스트 추가
      </h3>

      {/* Guest Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={guestName}
          onChange={(e) => {
            setGuestName(e.target.value);
            setError(null);
          }}
          placeholder="게스트 이름 입력"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          추가
        </button>
      </form>

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
              <div className="flex items-center">
                <span className="text-gray-700 font-medium">{guest}</span>
                <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                  게스트
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveGuest(guest)}
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
        <p className="text-sm text-gray-600">
          게스트 수: <span className="font-bold text-gray-900">{guests.length}</span>명
        </p>
      </div>
    </div>
  );
}
