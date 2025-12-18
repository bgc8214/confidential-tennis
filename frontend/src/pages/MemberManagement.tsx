import { useState, useEffect } from 'react';
import { memberService } from '../services/memberService';
import { useClub } from '../contexts/ClubContext';
import type { Member } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Pencil, Trash2, Users } from 'lucide-react';
import { MemberForm } from '@/components/MemberForm';
import { useToast } from '../hooks/use-toast';
import { useConfirm } from '../hooks/useConfirm';

export default function MemberManagement() {
  const { currentClub } = useClub();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Load members
  useEffect(() => {
    if (currentClub) {
      loadMembers();
    }
  }, [currentClub]);

  const loadMembers = async () => {
    if (!currentClub) return;
    
    try {
      setLoading(true);
      const data = await memberService.getAll(currentClub.id);
      setMembers(data);
      setError(null);
    } catch (err) {
      setError('회원 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: '회원 삭제',
      description: '정말 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      confirmVariant: 'destructive',
      icon: (
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
      ),
    });

    if (!confirmed) return;

    try {
      await memberService.delete(id);
      toast({
        title: '삭제 완료',
        description: '회원이 삭제되었습니다.',
      });
      await loadMembers();
    } catch (err) {
      console.error(err);
      toast({
        title: '삭제 실패',
        description: '회원 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = async () => {
    await loadMembers();
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const getSkillLevelLabel = (level: string | null) => {
    if (!level) return '-';
    switch (level) {
      case 'beginner':
        return '초급';
      case 'intermediate':
        return '중급';
      case 'advanced':
        return '상급';
      default:
        return level;
    }
  };

  const getGenderLabel = (gender: string | null | undefined) => {
    if (!gender) return '-';
    switch (gender) {
      case 'male':
        return '남성';
      case 'female':
        return '여성';
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">회원 관리</h2>
          <p className="text-muted-foreground mt-1">동아리 회원을 관리합니다</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="lg">
          <UserPlus className="mr-2 h-5 w-5" />
          회원 추가
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            회원 통계
          </CardTitle>
          <CardDescription>현재 등록된 회원 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {members.length}명
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            활성 회원
          </p>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>회원 목록</CardTitle>
          <CardDescription>
            {members.length === 0
              ? '등록된 회원이 없습니다. 회원을 추가해주세요.'
              : `총 ${members.length}명의 회원이 등록되어 있습니다.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>성별</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    등록된 회원이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.phone || '-'}</TableCell>
                    <TableCell>{member.email || '-'}</TableCell>
                    <TableCell>{getGenderLabel(member.gender)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(member)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          수정
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Member Form Dialog */}
      <MemberForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        member={editingMember}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
}
