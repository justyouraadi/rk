import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from '@/components/ScrollToTop';

// Layout & Auth
import AdminLayout from '@/components/AdminLayout';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminLeads from '@/pages/admin/AdminLeads';
import AdminCustomers from '@/pages/admin/AdminCustomers';
import AdminQuotations from '@/pages/admin/AdminQuotations';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminCatalogue from '@/pages/admin/AdminCatalogue';
import AdminIndustries from '@/pages/admin/AdminIndustries';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminServices from '@/pages/admin/AdminServices';
import AdminBulkImport from '@/pages/admin/AdminBulkImport';
import AdminBulkImages from '@/pages/admin/AdminBulkImages';
import AdminMediaLibrary from '@/pages/admin/AdminMediaLibrary';
import AdminImportHistory from '@/pages/admin/AdminImportHistory';
import AdminInventory from '@/pages/admin/AdminInventory';
import AdminPayments from '@/pages/admin/AdminPayments';
import AdminDelivery from '@/pages/admin/AdminDelivery';
import AdminPortfolio from '@/pages/admin/AdminPortfolio';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminOffers from '@/pages/admin/AdminOffers';
import AdminBlog from '@/pages/admin/AdminBlog';
import AdminSettings from '@/pages/admin/AdminSettings';

export default function App() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
                <Router>
                    <ScrollToTop />
                    <Routes>
                        {/* Auth */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />

                        {/* Admin routes with /admin prefix */}
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="leads" element={<AdminLeads />} />
                            <Route path="customers" element={<AdminCustomers />} />
                            <Route path="quotations" element={<AdminQuotations />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route path="catalogue" element={<AdminCatalogue />} />
                            <Route path="industries" element={<AdminIndustries />} />
                            <Route path="categories" element={<AdminCategories />} />
                            <Route path="products" element={<AdminProducts />} />
                            <Route path="services" element={<AdminServices />} />
                            <Route path="bulk-import" element={<AdminBulkImport />} />
                            <Route path="bulk-images" element={<AdminBulkImages />} />
                            <Route path="media-library" element={<AdminMediaLibrary />} />
                            <Route path="import-history" element={<AdminImportHistory />} />
                            <Route path="inventory" element={<AdminInventory />} />
                            <Route path="payments" element={<AdminPayments />} />
                            <Route path="delivery" element={<AdminDelivery />} />
                            <Route path="portfolio" element={<AdminPortfolio />} />
                            <Route path="reviews" element={<AdminReviews />} />
                            <Route path="offers" element={<AdminOffers />} />
                            <Route path="blog" element={<AdminBlog />} />
                            <Route path="settings" element={<AdminSettings />} />
                        </Route>

                        {/* Direct root redirect to /admin */}
                        <Route path="/" element={<Navigate to="/admin" replace />} />
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                    <Toaster />
                </Router>
            </QueryClientProvider>
        </AuthProvider>
    );
}

