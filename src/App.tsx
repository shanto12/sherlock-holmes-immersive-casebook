import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ScrollProvider, useLenis } from '@/scroll/ScrollProvider';
import { CaptionProvider } from '@/data/CaptionContext';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Casebook from '@/pages/Casebook';
import { AudioService } from '@/audio/AudioService';

/** Reset scroll on route change (Lenis owns the window scroll). */
function ScrollToTop() {
  const { pathname } = useLocation();
  const lenis = useLenis();
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname, lenis]);
  return null;
}

export default function App() {
  useEffect(() => {
    AudioService.init();
  }, []);

  return (
    <BrowserRouter>
      <ScrollProvider>
        <CaptionProvider>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/casebook" element={<Casebook />} />
            </Routes>
          </Layout>
        </CaptionProvider>
      </ScrollProvider>
    </BrowserRouter>
  );
}
