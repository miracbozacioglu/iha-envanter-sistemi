import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { SiparisDetay, TalepDetay, TalepDurumu, TalepOzet } from '../types';

export const talepKeys = {
  hepsi: ['talepler'] as const,
  liste: (durum?: TalepDurumu) => ['talepler', 'liste', durum ?? null] as const,
  detay: (id: number) => ['talepler', 'detay', id] as const,
};

export const siparisKeys = {
  hepsi: ['siparisler'] as const,
};

/**
 * Talep akışı stok ve parça verilerine de dokunuyor (teslim alma stok girişi
 * yapıyor), o yüzden aksiyon sonrası tüm sorgular tazeleniyor. Seyrek yapılan
 * işlemler oldukları için maliyeti önemsiz.
 */
function tumunuTazele(queryClient: ReturnType<typeof useQueryClient>) {
  return () => {
    void queryClient.invalidateQueries();
  };
}

export function useTalepler(durum?: TalepDurumu) {
  return useQuery({
    queryKey: talepKeys.liste(durum),
    queryFn: async () => {
      const { data } = await api.get<TalepOzet[]>('/talepler', {
        params: durum ? { durum } : undefined,
      });
      return data;
    },
  });
}

export function useTalep(id: number | undefined) {
  return useQuery({
    queryKey: talepKeys.detay(id ?? 0),
    queryFn: async () => {
      const { data } = await api.get<TalepDetay>(`/talepler/${id}`);
      return data;
    },
    enabled: typeof id === 'number' && Number.isFinite(id),
  });
}

export interface TalepOlusturDto {
  parcaId: number;
  miktar: number;
  aciklama?: string;
}

export function useTalepOlustur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: TalepOlusturDto) => {
      const { data } = await api.post<TalepOzet>('/talepler', dto);
      return data;
    },
    onSuccess: tumunuTazele(queryClient),
  });
}

export function useTalepOnayla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<TalepOzet>(`/talepler/${id}/onayla`);
      return data;
    },
    onSuccess: tumunuTazele(queryClient),
  });
}

export function useTalepReddet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, redSebebi }: { id: number; redSebebi: string }) => {
      const { data } = await api.patch<TalepOzet>(`/talepler/${id}/reddet`, { redSebebi });
      return data;
    },
    onSuccess: tumunuTazele(queryClient),
  });
}

/* ------------------------------------------------------------------ */
/* Siparişler                                                          */
/* ------------------------------------------------------------------ */

export function useSiparisler() {
  return useQuery({
    queryKey: siparisKeys.hepsi,
    queryFn: async () => {
      const { data } = await api.get<SiparisDetay[]>('/siparisler');
      return data;
    },
  });
}

export interface SiparisOlusturDto {
  talepId: number;
  tedarikciId: number;
  miktar: number;
  birimFiyat?: number;
}

export function useSiparisOlustur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: SiparisOlusturDto) => {
      const { data } = await api.post<SiparisDetay>('/siparisler', dto);
      return data;
    },
    onSuccess: tumunuTazele(queryClient),
  });
}

export function useSiparisTeslimAl() {
  const queryClient = useQueryClient();

  return useMutation({
    // depoId opsiyonel: tek depo varsa backend kendisi seçiyor, birden
    // fazlaysa zorunlu hale geliyor.
    mutationFn: async ({ id, depoId }: { id: number; depoId?: number }) => {
      const { data } = await api.patch<SiparisDetay>(
        `/siparisler/${id}/teslim-al`,
        depoId ? { depoId } : {},
      );
      return data;
    },
    onSuccess: tumunuTazele(queryClient),
  });
}
