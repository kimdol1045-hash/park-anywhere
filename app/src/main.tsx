import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TDSMobileProvider } from '@toss/tds-mobile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { storage } from './utils/storage';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

storage.init().then(() => {
  createRoot(document.getElementById('root')!).render(
    <TDSMobileProvider
      userAgent={{
        isIOS: /iPhone|iPad/.test(navigator.userAgent),
        isAndroid: /Android/.test(navigator.userAgent),
        fontScale: undefined,
        fontA11y: undefined,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </TDSMobileProvider>
  );
});
