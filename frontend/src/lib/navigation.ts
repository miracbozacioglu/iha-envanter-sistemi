import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  PlaneTakeoff,
  SlidersHorizontal,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import type { Rol } from '../types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Boş/tanımsız ise her role açık. */
  roller?: readonly Rol[];
  /** Başlıkta gösterilecek kısa açıklama. */
  aciklama: string;
}

export interface NavGroup {
  baslik: string;
  items: NavItem[];
}

const SADECE_YONETICI: readonly Rol[] = ['YONETICI'];

export const NAV_GROUPS: NavGroup[] = [
  {
    baslik: 'Operasyon',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        icon: LayoutDashboard,
        aciklama: 'Envanter ve bakım durumuna genel bakış',
      },
      {
        to: '/parcalar',
        label: 'Parçalar',
        icon: Boxes,
        aciklama: 'Parça kataloğu, kategoriler ve uyumluluklar',
      },
      {
        to: '/talepler',
        label: 'Talepler',
        icon: ClipboardList,
        aciklama: 'Parça talepleri ve onay akışı',
      },
      {
        to: '/araclar',
        label: 'Araçlar & Bakım',
        icon: PlaneTakeoff,
        aciklama: 'İHA araçları ve bakım kayıtları',
      },
    ],
  },
  {
    baslik: 'Yönetim',
    items: [
      {
        to: '/stok',
        label: 'Stok',
        icon: Warehouse,
        roller: SADECE_YONETICI,
        aciklama: 'Depo mevcutları ve stok hareketleri',
      },
      {
        to: '/siparisler',
        label: 'Siparişler',
        icon: Truck,
        roller: SADECE_YONETICI,
        aciklama: 'Tedarikçi siparişleri ve teslim alma',
      },
      {
        to: '/tanimlamalar',
        label: 'Tanımlamalar',
        icon: SlidersHorizontal,
        roller: SADECE_YONETICI,
        aciklama: 'Kategori, depo, İHA modeli ve tedarikçi tanımları',
      },
      {
        to: '/kullanicilar',
        label: 'Kullanıcılar',
        icon: Users,
        roller: SADECE_YONETICI,
        aciklama: 'Kullanıcı hesapları ve roller',
      },
    ],
  },
];

export const TUM_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((grup) => grup.items);

/** Aktif yola karşılık gelen menü öğesini bulur (en uzun eşleşme kazanır). */
export function aktifNavItem(pathname: string): NavItem | undefined {
  return TUM_NAV_ITEMS.filter(
    (item) => item.to === '/' ? pathname === '/' : pathname.startsWith(item.to),
  ).sort((a, b) => b.to.length - a.to.length)[0];
}
