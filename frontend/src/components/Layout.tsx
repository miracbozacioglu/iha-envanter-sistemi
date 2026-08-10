import { LogOut, Menu, Radio, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { aktifNavItem, NAV_GROUPS } from '../lib/navigation';
import type { Kullanici } from '../types';
import { BrandMark } from './ui/BrandMark';

export function Layout() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAcik, setMenuAcik] = useState(false);

  const aktif = aktifNavItem(location.pathname);

  function cikisYap() {
    logout();
    navigate('/login', { replace: true });
  }

  // Kullanıcının göremeyeceği öğeleri baştan ele; boşalan grupları da at.
  const gruplar = NAV_GROUPS.map((grup) => ({
    ...grup,
    items: grup.items.filter((item) => hasRole(item.roller)),
  })).filter((grup) => grup.items.length > 0);

  return (
    <div className="flex h-full bg-ink-950">
      {/* Mobil çekmece arka planı */}
      {menuAcik && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMenuAcik(false)}
          className="fixed inset-0 z-30 bg-ink-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-ink-700 bg-ink-900 transition-transform duration-200 lg:static lg:translate-x-0 ${
          menuAcik ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-ink-700 px-5">
          <span className="grid size-9 place-items-center rounded-lg border border-signal-500/30 bg-signal-900/50 text-signal-400">
            <BrandMark className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mono text-[0.9375rem] font-semibold tracking-[0.14em] text-fog-100">
              İHA ENVANTER
            </span>
            <span className="label-micro block pt-1 text-[0.625rem] text-fog-700">
              Bakım &amp; Lojistik
            </span>
          </span>
          <button
            type="button"
            onClick={() => setMenuAcik(false)}
            aria-label="Menüyü kapat"
            className="-mr-1 rounded-md p-1.5 text-fog-500 transition hover:bg-ink-800 hover:text-fog-100 lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {gruplar.map((grup) => (
            <div key={grup.baslik} className="mb-6 last:mb-0">
              <p className="label-micro px-3 pb-2.5">{grup.baslik}</p>
              <ul className="space-y-0.5">
                {grup.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      // Mobil çekmece, gidilen sayfanın üstünde açık kalmasın.
                      onClick={() => setMenuAcik(false)}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-lg py-2.5 pr-3 pl-4 text-sm transition ${
                          isActive
                            ? 'bg-signal-500/10 font-medium text-fog-100'
                            : 'text-fog-500 hover:bg-ink-800 hover:text-fog-300'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Aktif göstergesi: sol kenarda ince sinyal çubuğu */}
                          <span
                            aria-hidden="true"
                            className={`absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r bg-signal-400 transition-opacity ${
                              isActive ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          <item.icon
                            className={`size-[1.125rem] shrink-0 transition-colors ${
                              isActive ? 'text-signal-400' : 'text-fog-700 group-hover:text-fog-500'
                            }`}
                            strokeWidth={1.75}
                          />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-ink-700 px-5 py-3.5">
          <Radio className="size-3.5 shrink-0 text-signal-400 hud-pulse" strokeWidth={2} />
          <span className="label-micro text-[0.625rem]">Sistem çevrimiçi</span>
          <span className="ml-auto font-mono text-[0.625rem] text-fog-700">v0.7</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-ink-700 bg-ink-950/85 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setMenuAcik(true)}
            aria-label="Menüyü aç"
            className="rounded-md p-2 text-fog-500 transition hover:bg-ink-800 hover:text-fog-100 lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[0.9375rem] font-semibold text-fog-100">
              {aktif?.label ?? 'İHA Envanter'}
            </h1>
            <p className="hidden truncate text-xs text-fog-700 sm:block">{aktif?.aciklama}</p>
          </div>

          <Saat />

          {user && <KullaniciRozeti user={user} />}

          <button
            type="button"
            onClick={cikisYap}
            title="Çıkış yap"
            className="flex items-center gap-2 rounded-lg border border-ink-700 px-2.5 py-2 text-sm text-fog-500 transition hover:border-danger-500/40 hover:bg-danger-900/30 hover:text-danger-400"
          >
            <LogOut className="size-4" strokeWidth={1.75} />
            <span className="sr-only sm:not-sr-only sm:text-xs">Çıkış</span>
          </button>
        </header>

        <main className="hud-grid flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function KullaniciRozeti({ user }: { user: Kullanici }) {
  const yonetici = user.rol === 'YONETICI';
  const basHarfler = `${user.ad.charAt(0)}${user.soyad.charAt(0)}`.toUpperCase();

  return (
    <div className="flex items-center gap-3 border-l border-ink-700 pl-3 sm:pl-4">
      <div className="hidden text-right leading-tight sm:block">
        <p className="truncate text-sm font-medium text-fog-100">
          {user.ad} {user.soyad}
        </p>
        <p
          className={`font-mono text-[0.625rem] tracking-[0.12em] uppercase ${
            yonetici ? 'text-alert-400' : 'text-signal-400'
          }`}
        >
          {yonetici ? 'Yönetici' : 'Teknisyen'}
          {user.unvan ? <span className="text-fog-700"> · {user.unvan}</span> : null}
        </p>
      </div>
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-lg border font-mono text-xs font-semibold ${
          yonetici
            ? 'border-alert-400/30 bg-alert-400/10 text-alert-400'
            : 'border-signal-500/30 bg-signal-900/50 text-signal-400'
        }`}
      >
        {basHarfler}
      </span>
    </div>
  );
}

/** Komuta paneli hissi için canlı yerel saat. */
function Saat() {
  const [simdi, setSimdi] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setSimdi(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="hidden text-right leading-tight md:block">
      <p className="font-mono text-sm tabular-nums text-fog-300">
        {simdi.toLocaleTimeString('tr-TR', { hour12: false })}
      </p>
      <p className="label-micro text-[0.5625rem] text-fog-700">
        {simdi.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}
