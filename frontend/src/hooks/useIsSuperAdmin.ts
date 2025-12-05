import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export function useIsSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSuperAdmin = async () => {
      try {
        const result = await adminService.isSuperAdmin();
        if (mounted) {
          setIsSuperAdmin(result);
        }
      } catch (error) {
        console.error('슈퍼 어드민 확인 실패:', error);
        if (mounted) {
          setIsSuperAdmin(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSuperAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  return { isSuperAdmin, loading };
}
