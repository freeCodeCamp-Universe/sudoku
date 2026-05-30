import { BrowserRouter } from 'react-router-dom';
import { Layout } from '@/app/Layout';
import { ThemeProvider } from '@/app/ThemeProvider';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </ThemeProvider>
    </BrowserRouter>
  );
}
