import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Tanım kaynakları (kategoriler, depolar, tedarikçiler…) aynı REST desenini
 * paylaşıyor: GET /<yol>, POST /<yol>, PATCH /<yol>/:id, DELETE /<yol>/:id.
 * Beşini ayrı ayrı yazmak yerine tek bir jenerik katman kullanılıyor.
 */

export interface Kimlikli {
  id: number;
}

export function useKaynakListesi<T>(yol: string) {
  return useQuery({
    queryKey: [yol],
    queryFn: async () => {
      const { data } = await api.get<T[]>(`/${yol}`);
      return data;
    },
  });
}

export function useKaynakMutasyonlari<T extends Kimlikli, TDto>(yol: string) {
  const queryClient = useQueryClient();

  /**
   * Tanımlar başka ekranların içinde gömülü geliyor (parçanın kategorisi,
   * aracın modeli, stok satırının deposu…). Hangi sorgunun etkilendiğini tek
   * tek kovalamak yerine hepsini tazeliyoruz: tanım değişikliği seyrek bir
   * yönetici işlemi, maliyeti önemsiz.
   */
  const tazele = () => {
    void queryClient.invalidateQueries();
  };

  const olustur = useMutation({
    mutationFn: async (dto: TDto) => {
      const { data } = await api.post<T>(`/${yol}`, dto);
      return data;
    },
    onSuccess: tazele,
  });

  const guncelle = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: Partial<TDto> }) => {
      const { data } = await api.patch<T>(`/${yol}/${id}`, dto);
      return data;
    },
    onSuccess: tazele,
  });

  const sil = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete<T>(`/${yol}/${id}`);
      return data;
    },
    onSuccess: tazele,
  });

  return { olustur, guncelle, sil };
}
