import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  BakimDetay,
  BakimGecmisi,
  BakimTipi,
  IhaAraci,
  PaginatedResponse,
} from '../types';

export const bakimKeys = {
  hepsi: ['bakim'] as const,
  liste: (filtreler: BakimFiltreleri) => ['bakim', 'liste', filtreler] as const,
  aracGecmisi: (ihaAraciId: number) => ['bakim', 'arac', ihaAraciId] as const,
};

export const aracKeys = {
  hepsi: ['iha-araclari'] as const,
  detay: (id: number) => ['iha-araclari', 'detay', id] as const,
};

export interface BakimFiltreleri {
  ihaAraciId?: number;
  tip?: BakimTipi;
  page?: number;
  limit?: number;
}

export function useAraclar() {
  return useQuery({
    queryKey: aracKeys.hepsi,
    queryFn: async () => {
      const { data } = await api.get<IhaAraci[]>('/iha-araclari');
      return data;
    },
  });
}

export function useArac(id: number | undefined) {
  return useQuery({
    queryKey: aracKeys.detay(id ?? 0),
    queryFn: async () => {
      const { data } = await api.get<IhaAraci>(`/iha-araclari/${id}`);
      return data;
    },
    enabled: typeof id === 'number' && Number.isFinite(id),
  });
}

function temizle(filtreler: BakimFiltreleri): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  if (filtreler.ihaAraciId) params.ihaAraciId = filtreler.ihaAraciId;
  if (filtreler.tip) params.tip = filtreler.tip;
  if (filtreler.page) params.page = filtreler.page;
  if (filtreler.limit) params.limit = filtreler.limit;

  return params;
}

/** Genel bakım listesi — sayfalı, araç bilgisiyle. */
export function useBakimKayitlari(filtreler: BakimFiltreleri) {
  return useQuery({
    queryKey: bakimKeys.liste(filtreler),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<BakimDetay>>('/bakim', {
        params: temizle(filtreler),
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

/** Tek aracın geçmişi — sayfasız düz dizi, araç alanı taşımaz. */
export function useAracBakimGecmisi(ihaAraciId: number | undefined) {
  return useQuery({
    queryKey: bakimKeys.aracGecmisi(ihaAraciId ?? 0),
    queryFn: async () => {
      const { data } = await api.get<BakimGecmisi[]>(`/bakim/arac/${ihaAraciId}`);
      return data;
    },
    enabled: typeof ihaAraciId === 'number' && Number.isFinite(ihaAraciId),
  });
}

/* ------------------------------------------------------------------ */
/* Bakım işlemleri                                                     */
/* ------------------------------------------------------------------ */

export interface DegistirDto {
  ihaAraciId: number;
  parcaId: number;
  depoId?: number;
  miktar?: number;
  aciklama?: string;
}

export interface TamirDto {
  ihaAraciId: number;
  parcaId: number;
  aciklama?: string;
}

/**
 * Parça değişimi stoğu da düşürüyor; bakım geçmişi, stok ve parça verileri
 * aynı işlemden etkilendiği için hepsini birden tazeliyoruz.
 */
function tumunuTazele(queryClient: ReturnType<typeof useQueryClient>) {
  return () => {
    void queryClient.invalidateQueries();
  };
}

export function useParcaDegistir() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: DegistirDto) => {
      const { data } = await api.post<BakimDetay>('/bakim/degistir', dto);
      return data;
    },
    onSuccess: tumunuTazele(queryClient),
  });
}

export function useTamirKaydi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: TamirDto) => {
      const { data } = await api.post<BakimDetay>('/bakim/tamir', dto);
      return data;
    },
    onSuccess: tumunuTazele(queryClient),
  });
}
