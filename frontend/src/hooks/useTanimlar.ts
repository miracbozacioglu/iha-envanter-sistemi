import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { IhaModeli, Kategori } from '../types';

/** Tanım listeleri nadiren değişir; filtre dropdown'ları için uzun süre taze tut. */
const TANIM_STALE_TIME = 5 * 60_000;

export function useKategoriler() {
  return useQuery({
    queryKey: ['kategoriler'],
    queryFn: async () => {
      const { data } = await api.get<Kategori[]>('/kategoriler');
      return data;
    },
    staleTime: TANIM_STALE_TIME,
  });
}

export function useIhaModelleri() {
  return useQuery({
    queryKey: ['iha-modelleri'],
    queryFn: async () => {
      const { data } = await api.get<IhaModeli[]>('/iha-modelleri');
      return data;
    },
    staleTime: TANIM_STALE_TIME,
  });
}
