import { supabase } from '../lib/supabase';

/**
 * 스케줄 상태를 자동으로 업데이트
 * - 현재 시각이 end_time을 지난 스케줄을 'completed'로 변경
 */
export async function updateExpiredSchedules(clubId: number): Promise<void> {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

    // 오늘 날짜의 'planned' 상태 스케줄 중 end_time이 지난 것들 조회
    const { data: expiredSchedules, error: fetchError } = await supabase
      .from('schedules')
      .select('id, end_time')
      .eq('club_id', clubId)
      .eq('date', today)
      .eq('status', 'planned')
      .lt('end_time', currentTime);

    if (fetchError) {
      console.error('스케줄 조회 에러:', fetchError);
      return;
    }

    if (!expiredSchedules || expiredSchedules.length === 0) {
      return; // 업데이트할 스케줄 없음
    }

    // 상태를 'completed'로 업데이트
    const scheduleIds = expiredSchedules.map(s => s.id);
    const { error: updateError } = await supabase
      .from('schedules')
      .update({ status: 'completed' })
      .in('id', scheduleIds);

    if (updateError) {
      console.error('스케줄 상태 업데이트 에러:', updateError);
      return;
    }

    console.log(`${scheduleIds.length}개 스케줄이 자동으로 완료 처리되었습니다.`);
  } catch (error) {
    console.error('스케줄 상태 업데이트 중 에러:', error);
  }
}

/**
 * 과거 날짜의 모든 'planned' 스케줄을 'completed'로 변경
 */
export async function updatePastSchedules(clubId: number): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 오늘 이전 날짜의 'planned' 상태 스케줄 조회
    const { data: pastSchedules, error: fetchError } = await supabase
      .from('schedules')
      .select('id')
      .eq('club_id', clubId)
      .eq('status', 'planned')
      .lt('date', today);

    if (fetchError) {
      console.error('과거 스케줄 조회 에러:', fetchError);
      return;
    }

    if (!pastSchedules || pastSchedules.length === 0) {
      return; // 업데이트할 스케줄 없음
    }

    // 상태를 'completed'로 업데이트
    const scheduleIds = pastSchedules.map(s => s.id);
    const { error: updateError } = await supabase
      .from('schedules')
      .update({ status: 'completed' })
      .in('id', scheduleIds);

    if (updateError) {
      console.error('과거 스케줄 상태 업데이트 에러:', updateError);
      return;
    }

    console.log(`${scheduleIds.length}개 과거 스케줄이 자동으로 완료 처리되었습니다.`);
  } catch (error) {
    console.error('과거 스케줄 상태 업데이트 중 에러:', error);
  }
}
