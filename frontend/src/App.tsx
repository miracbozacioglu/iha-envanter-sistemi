import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import type { Rol } from './types';

const YONETICI: readonly Rol[] = ['YONETICI'];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 401'i interceptor zaten oturum düşmesi olarak işliyor; tekrar denemeyelim.
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />

              <Route
                path="parcalar"
                element={
                  <PlaceholderPage
                    baslik="Parça Kataloğu"
                    aciklama="Parça listesi, kategori filtreleri, kritik seviye uyarıları ve İHA modeli uyumlulukları burada yer alacak."
                  />
                }
              />

              <Route
                path="talepler"
                element={
                  <PlaceholderPage
                    baslik="Parça Talepleri"
                    aciklama="Talep açma, onay/red akışı ve durum takibi (BEKLIYOR → ONAYLANDI → SIPARIS_VERILDI → TESLIM_ALINDI) burada yönetilecek."
                  />
                }
              />

              <Route
                path="araclar"
                element={
                  <PlaceholderPage
                    baslik="Araçlar & Bakım"
                    aciklama="İHA araçlarının kuyruk numarası bazında listesi, bakım geçmişi ve parça değiştir/tamir kayıtları burada olacak."
                    gun="Gün 9"
                  />
                }
              />

              {/* Yalnızca yönetici */}
              <Route
                path="stok"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <PlaceholderPage
                      baslik="Stok Yönetimi"
                      aciklama="Depo bazlı stok mevcutları, giriş/çıkış işlemleri ve hareket geçmişi burada yönetilecek."
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="siparisler"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <PlaceholderPage
                      baslik="Siparişler"
                      aciklama="Onaylanmış taleplerden sipariş oluşturma, tedarikçi seçimi ve teslim alma adımları burada olacak."
                      gun="Gün 9"
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="tanimlamalar"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <PlaceholderPage
                      baslik="Tanımlamalar"
                      aciklama="Kategori, depo, İHA modeli ve tedarikçi tanımlarının yönetimi burada toplanacak."
                      gun="Gün 10"
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="kullanicilar"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <PlaceholderPage
                      baslik="Kullanıcılar"
                      aciklama="Kullanıcı hesapları, rol atama ve hesap aktif/pasif yönetimi burada olacak."
                      gun="Gün 10"
                    />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
