import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { POSPage } from './pages/POSPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsAdminPage } from './pages/ProductsAdminPage';
import { CreateProductPage } from './pages/CreateProductPage';
import { CartProvider } from './context/CartContext';

export function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<POSPage />} />
            <Route path="vendas" element={<SalesHistoryPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="produtos" element={<ProductsAdminPage />} />
            <Route path="cadastrar-produto" element={<CreateProductPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
