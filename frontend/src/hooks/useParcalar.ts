import { keepPreviousData, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  KritikParca,
  PaginatedResponse,
  ParcaDetay,
  ParcaOzet,
  StokHareketi,
} from '../types';

export interface ParcaFiltreleri {
  search?: string;
  kategoriId?: number;
  ihaModeliId?: number;
  page?: number;
  limit?: number;
}

export const parcaKeys = {
  hepsi: ['parcalar'] as const,
  liste: (filtreler: ParcaFiltreleri) => ['parcalar', 'liste', filtreler] as const,
  kritik: () => ['parcalar', 'kritik'] as const,
  detay: (id: number) => ['parcalar', 'detay', id] as const,
  hareketler: (id: number, page: number, limit: number) =>
    ['parcalar', 'hareketler', id, page, limit] as const,
};

/** Boş string / undefined filtreleri query string'e hiç koyma. */
function temizle(filtreler: ParcaFiltreleri): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  if (filtreler.search?.trim()) params.search = filtreler.search.trim();
  if (filtreler.kategoriId) params.kategoriId = filtreler.kategoriId;
  if (filtreler.ihaModeliId) params.ihaModeliId = filtreler.ihaModeliId;
  if (filtreler.page) params.page = filtreler.page;
  if (filtreler.limit) params.limit = filtreler.limit;

  return params;
}

export function useParcalar(filtreler: ParcaFiltreleri) {
  return useQuery({
    queryKey: parcaKeys.liste(filtreler),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ParcaOzet>>('/parcalar', {
        params: temizle(filtreler),
      });
      return data;
    },
    // Sayfa değişirken tablo boşalıp zıplamasın.
    placeholderData: keepPreviousData,
  });
}

/**
 * Liste ucu depo stoklarını döndürmediği için toplamları buradan alıyoruz:
 * bu uç, stoğu kritik seviyenin altındaki her parçayı `toplamStok` ile verir.
 * Listede olmayan parçanın stoğu en az kritik seviyesi kadardır.
 */
export function useKritikParcalar() {
  return useQuery({
    queryKey: parcaKeys.kritik(),
    queryFn: async () => {
      const { data } = await api.get<KritikParca[]>('/parcalar/kritik');
      return data;
    },
    staleTime: 60_000,
  });
}

/** Hem useParca hem de listedeki hover ön-yüklemesi bunu kullanır. */
export async function parcaDetayGetir(id: number): Promise<ParcaDetay> {
  const { data } = await api.get<ParcaDetay>(`/parcalar/${id}`);
  return data;
}

export function useParca(id: number | undefined) {
  return useQuery({
    queryKey: parcaKeys.detay(id ?? 0),
    queryFn: () => parcaDetayGetir(id as number),
    enabled: typeof id === 'number' && Number.isFinite(id),
  });
}

/* ------------------------------------------------------------------ */
/* Yazma işlemleri (yalnızca YONETICI)                                  */
/* ------------------------------------------------------------------ */

export interface ParcaYazDto {
  kod: string;
  ad: string;
  aciklama?: string;
  birim?: string;
  kritikSeviye?: number;
  kategoriId: number;
}

/** PATCH gövdesi: hepsi opsiyonel, ek olarak arizali bayrağı var. */
export type ParcaGuncelleDto = Partial<ParcaYazDto> & { arizali?: boolean };

export function useParcaOlustur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: ParcaYazDto) => {
      const { data } = await api.post<ParcaOzet>('/parcalar', dto);
      return data;
    },
    onSuccess: () => {
      // Liste ve kritik özeti artık bayat.
      void queryClient.invalidateQueries({ queryKey: parcaKeys.hepsi });
    },
  });
}

export function useParcaGuncelle(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: ParcaGuncelleDto) => {
      const { data } = await api.patch<ParcaOzet>(`/parcalar/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      // Detay da dahil tüm parça sorgularını tazele.
      void queryClient.invalidateQueries({ queryKey: parcaKeys.hepsi });
    },
  });
}

export function useParcaHareketler(id: number | undefined, page = 1, limit = 10) {
  return useQuery({
    queryKey: parcaKeys.hareketler(id ?? 0, page, limit),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<StokHareketi>>(
        `/parcalar/${id}/hareketler`,
        { params: { page, limit } },
      );
      return data;
    },
    enabled: typeof id === 'number' && Number.isFinite(id),
    placeholderData: keepPreviousData,
  });
}
