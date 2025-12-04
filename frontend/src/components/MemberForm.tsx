import { useState, useEffect } from 'react';
import { memberService } from '../services/memberService';
import { useClub } from '../contexts/ClubContext';
import type { Member } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MemberForm({ open, onOpenChange, member, onSuccess, onCancel }: MemberFormProps) {
  const { currentClub } = useClub();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'none' as 'male' | 'female' | 'none'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        phone: member.phone || '',
        email: member.email || '',
        gender: member.gender || 'none'
      });
    } else {
      setFormData({ name: '', phone: '', email: '', gender: 'none' });
    }
    setError(null);
  }, [member, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentClub) {
      setError('클럽을 선택해주세요.');
      return;
    }

    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const memberData = {
        ...formData,
        gender: formData.gender === 'none' ? undefined : formData.gender,
      };

      if (member) {
        await memberService.update(member.id, memberData);
      } else {
        await memberService.create(currentClub.id, { ...memberData, is_active: true });
      }

      onSuccess();
    } catch (err) {
      setError(member ? '회원 수정에 실패했습니다.' : '회원 추가에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', phone: '', email: '', gender: 'none' });
    setError(null);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{member ? '회원 수정' : '회원 추가'}</DialogTitle>
          <DialogDescription>
            {member ? '회원 정보를 수정합니다.' : '새로운 회원을 추가합니다.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
                required
              />
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="010-1234-5678"
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
              />
            </div>

            {/* Gender */}
            <div className="grid gap-2">
              <Label htmlFor="gender">성별</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' | 'none' })}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="성별 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안 함</SelectItem>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : member ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
