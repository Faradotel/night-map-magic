import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUserRole() {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPro(false);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    supabase
      .from('user_roles' as any)
      .select('role')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const roles = (data as any[] | null)?.map((r: any) => r.role) ?? [];
        setIsPro(roles.includes('pro') || roles.includes('admin'));
        setIsAdmin(roles.includes('admin'));
        setLoading(false);
      });
  }, [user]);

  return { isPro, isAdmin, loading };
}
