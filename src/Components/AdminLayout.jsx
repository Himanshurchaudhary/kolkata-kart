// src/components/AdminLayout.jsx
import { Routes, Route } from "react-router-dom";
import React, { useState } from 'react';
import { ChevronRight, Menu, ChevronLeft } from 'lucide-react';

import Sidebar from './Sidebar';
import AdminLay from './Admindashboard';
import ProductList from "./Product Management/ProductList";
import CategoryPage from "./Admin/Categorypage";
import BrandPage from "./Admin/Brandpage";
import AddProductPage from "./Admin/Addproductpage";
import CreateFlashSale from "./Admin/CreateFlashSale";
import FlashSaleApp from "./Admin/Flashsaleapp";
import AddNewAd from "./Admin/Addnewad";
import AdsListPage from "./Admin/Adslistpage";
import CouponListPage from "./Admin/Couponlistpage";
import AddCouponPage from "./Admin/Addcouponpage";
import AddBlogPage from "./Admin/Addblogpage";
import BlogListPage from "./Admin/Bloglistpage";
import AddDriver from "./Admin/Adddriver";
import AllDrivers from "./Admin/Alldrivers";
import TaxManagement from "./Admin/Taxmanagement";
import DeliveryChargePage from "./Admin/Deliverychargepage";
import PaymentGatewaysPage from "./Admin/Config Dependecy/Paymentgatewayspage";
import SmsConfigPage from "./Admin/Config Dependecy/Smsconfigpage";
import SocialAuthPage from "./Admin/Config Dependecy/Socialauthpage";
import PusherConfiguration from "./Admin/Config Dependecy/Pusherconfiguration";
import MailConfigurationPage from "./Admin/Config Dependecy/Mailconfigurationpage";
import FirebaseNotificationPage from "./Admin/Config Dependecy/Firebasenotificationpage";
import PushNotificationPage from "./Admin/Pushnotificationpage";
import TicketIssueTypes from "./Admin/Tickettype";
import AllHelpRequests from "./Admin/Allhelprequests";
import SupportTicketDetail from "./Admin/Supportticketdetail";
import OrdersList from "./Admin/Orderslist";
import BannerList from './Admin/BannerList';
import AddBanner from './Admin/AddBanner';
import Customers from '../Admin/Pages/Customers';
import CustomerOrders from '../Admin/Pages/Customerorders';
import SellerManagement from './Admin/SellerManagement'; // NEW
import SellerProductsApproval from './Admin/SellerProductsApproval'

const AdminLayout = () => {
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">

      {/* ── Single Sidebar — handles desktop + mobile internally ── */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        onDesktopToggle={() => setSidebarOpen(o => !o)}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <div className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => {
              if (window.innerWidth < 768) setMobileNavOpen(true);
              else setSidebarOpen(prev => !prev);
            }}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center
              justify-center text-gray-500 hover:bg-gray-50 transition-all"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-500">Admin Panel</span>
        </div>

        {/* Page Routes */}
        <main className="flex-1 p-4 md:p-10 overflow-y-auto">
          <Routes>
            <Route path="dash"                    element={<AdminLay />} />
            <Route path="productList"             element={<ProductList />} />
            <Route path="category"                element={<CategoryPage />} />
            <Route path="brandpage"               element={<BrandPage />} />
            <Route path="addProducts"             element={<AddProductPage />} />
            <Route path="addFlash"                element={<CreateFlashSale />} />
            <Route path="viewflash"               element={<FlashSaleApp />} />
            <Route path="addad"                   element={<AddNewAd />} />
            <Route path="adlist"                  element={<AdsListPage />} />
            <Route path="Addcoupan"               element={<AddCouponPage />} />
            <Route path="coupanlist"              element={<CouponListPage />} />
            <Route path="addBlogs"                element={<AddBlogPage />} />
            <Route path="listBlog"                element={<BlogListPage />} />
            <Route path="addDriver"               element={<AddDriver />} />
            <Route path="allDriver"               element={<AllDrivers />} />
            <Route path="texs"                    element={<TaxManagement />} />
            <Route path="deliveryCharge"          element={<DeliveryChargePage />} />
            <Route path="paymentgateway"          element={<PaymentGatewaysPage />} />
            <Route path="smsSetting"              element={<SmsConfigPage />} />
            <Route path="socialAuth"              element={<SocialAuthPage />} />
            <Route path="pusher"                  element={<PusherConfiguration />} />
            <Route path="mailConfig"              element={<MailConfigurationPage />} />
            <Route path="firebase"                element={<FirebaseNotificationPage />} />
            <Route path="pusernotication"         element={<PushNotificationPage />} />
            <Route path="ticket_issue"            element={<TicketIssueTypes />} />
            <Route path="support-tickets"         element={<AllHelpRequests />} />
            <Route path="support-tickets/:id"     element={<SupportTicketDetail />} />
            <Route path="Order-list"              element={<OrdersList />} />
            <Route path="bannerList"              element={<BannerList />} />
            <Route path="banner"                  element={<AddBanner />} />
            <Route path="customers"               element={<Customers />} />
            <Route path="customers/:id/orders"    element={<CustomerOrders />} />
            <Route path="sellers"                 element={<SellerManagement />} /> {/* NEW */}
            <Route path="seller-products-approval" element={<SellerProductsApproval />} /> {/* NEW */}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;