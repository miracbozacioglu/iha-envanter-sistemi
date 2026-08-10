import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { parcaKeys } from './useParcalar';
import type { Depo, HareketDetay, HareketTipi, PaginatedResponse, StokKalemDetay } from '../types';

export const stokKeys = {
  hepsi: ['stok'] as const,
  kalemler: (depoId?: number) => ['stok', 'kalemler', depoId ?? null] as const,
  hareketler: (filtreler: HareketFiltreleri) => ['stok', 'hareketler', filtreler] as const,
};

export interface HareketFiltreleri {
  parcaId?: number;
  depoId?: number;
  tip?: HareketTipi;
  page?: number;
  limit?: number;
}

export function useStokKalemleri(depoId?: number) {
  return useQuery({
    queryKey: stokKeys.kalemler(depoId),
    queryFn: async () => {
      const { data } = await api.get<StokKalemDetay[]>('/stok', {
        params: depoId ? { depoId } : undefined,
      });
      return data;
    },
  });
}

/**
 * Depo listesi. Backend ada göre sıralı döner ve hiç stok kaydı olmayan
 * depolar da listede yer alır — yeni açılan boş bir depoya ilk giriş bu
 * sayede yapılabiliyor.
 */
export function useDepolar() {
  return useQuery({
    queryKey: ['depolar'],
    queryFn: async () => {
      const { data } = await api.get<Depo[]>('/depolar');
      return data;
    },
    // Tanım listesi; nadiren değişir.
    staleTime: 5 * 60_000,
  });
}

function temizle(filtreler: HareketFiltreleri): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  if (filtreler.parcaId) params.parcaId = filtreler.parcaId;
  if (filtreler.depoId) params.depoId = filtreler.depoId;
  if (filtreler.tip) params.tip = filtreler.tip;
  if (filtreler.page) params.page = filtreler.page;
  if (filtreler.limit) params.limit = filtreler.limit;

  return params;
}

export function useStokHareketleri(filtreler: HareketFiltreleri) {
  return useQuery({
    queryKey: stokKeys.hareketler(filtreler),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<HareketDetay>>('/stok/hareketler', {
        params: temizle(filtreler),
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

/* ------------------------------------------------------------------ */
/* Giriş / çıkış                                                       */
/* ------------------------------------------------------------------ */

export interface StokGirisDto {
  parcaId: number;
  depoId: number;
  miktar: number;
  aciklama?: string;
  rafKodu?: string;
}

export type StokCikisDto = Omit<StokGirisDto, 'rafKodu'>;

/**
 * Stok hareketi parça verisini de etkiler (detaydaki depo stokları, listedeki
 * kritik rozetleri), o yüzden iki kök anahtarı da tazeliyoruz.
 */
function tazeleyici(queryClient: ReturnType<typeof useQueryClient>) {
  return () => {
    void queryClient.invalidateQueries({ queryKey: stokKeys.hepsi });
    void queryClient.invalidateQueries({ queryKey: parcaKeys.hepsi });
  };
}

export function useStokGiris() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: StokGirisDto) => {
      const { data } = await api.post<StokKalemDetay>('/stok/giris', dto);
      return data;
    },
    onSuccess: tazeleyici(queryClient),
  });
}

export function useStokCikis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: StokCikisDto) => {
      const { data } = await api.post<StokKalemDetay>('/stok/cikis', dto);
      return data;
    },
    onSuccess: tazeleyici(queryClient),
  });
}
