import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AracDetayPage } from './pages/AracDetayPage';
import { AraclarPage } from './pages/AraclarPage';
import { BakimPage } from './pages/BakimPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { KullanicilarPage } from './pages/KullanicilarPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ParcaDetayPage } from './pages/ParcaDetayPage';
import { ParcaFormPage } from './pages/ParcaFormPage';
import { ParcalarPage } from './pages/ParcalarPage';
import { SiparislerPage } from './pages/SiparislerPage';
import { StokHareketleriPage } from './pages/StokHareketleriPage';
import { StokPage } from './pages/StokPage';
import { TalepDetayPage } from './pages/TalepDetayPage';
import { TalepFormPage } from './pages/TalepFormPage';
import { TaleplerPage } from './pages/TaleplerPage';
import { TanimlamalarPage } from './pages/TanimlamalarPage';
import type { Rol } from './types';

const YONETICI: readonly Rol[] = ['YONETICI'];
const TEKNISYEN: readonly Rol[] = ['TEKNISYEN'];

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

              {/* Görüntüleme her iki role açık. */}
              <Route path="parcalar" element={<ParcalarPage />} />

              {/*
                "yeni" statik segmenti ":id" den önce gelmeli; aksi halde parça
                numarası sanılır. (React Router statik segmenti zaten üstün
                sıralar, sıra burada okunabilirlik için de korunuyor.)
              */}
              <Route
                path="parcalar/yeni"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <ParcaFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="parcalar/:id/duzenle"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <ParcaFormPage />
                  </ProtectedRoute>
                }
              />
              <Route path="parcalar/:id" element={<ParcaDetayPage />} />

              {/* "yeni" statik segmenti ":id" den önce gelmeli. */}
              <Route path="talepler" element={<TaleplerPage />} />
              {/* Talep açmak backend'de yalnızca TEKNISYEN'e açık. */}
              <Route
                path="talepler/yeni"
                element={
                  <ProtectedRoute roller={TEKNISYEN}>
                    <TalepFormPage />
                  </ProtectedRoute>
                }
              />
              <Route path="talepler/:id" element={<TalepDetayPage />} />

              {/* Görüntüleme ve bakım işlemleri her iki role açık. */}
              <Route path="araclar" element={<AraclarPage />} />
              <Route path="araclar/:id" element={<AracDetayPage />} />
              <Route path="bakim" element={<BakimPage />} />

              {/* Yalnızca yönetici */}
              {/* "hareketler" statik segmenti, stok altındaki diğer yollardan önce. */}
              <Route
                path="stok/hareketler"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <StokHareketleriPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="stok"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <StokPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="siparisler"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <SiparislerPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="tanimlamalar"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <TanimlamalarPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="kullanicilar"
                element={
                  <ProtectedRoute roller={YONETICI}>
                    <KullanicilarPage />
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
