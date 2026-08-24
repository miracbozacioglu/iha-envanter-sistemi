import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { IstatistikOzeti } from '../types';

export function useIstatistik() {
  return useQuery({
    queryKey: ['istatistik', 'ozet'],
    queryFn: async () => {
      const { data } = await api.get<IstatistikOzeti>('/istatistik/ozet');
      return data;
    },
    // Dashboard sık açılıyor; kısa süre taze sayıp gereksiz istek atmıyoruz.
    staleTime: 60_000,
  });
}
