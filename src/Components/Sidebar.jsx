// src/components/Sidebar.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, ShoppingCart, Box,
  Layers, Tag, Zap, Megaphone,
  Ticket, ChevronDown, Maximize, User, Home,
  Bell, Newspaper, BarChart3,
  Gift, Truck, Users, Briefcase, MessageSquare,
  LogOut, Store, Menu, X
} from 'lucide-react';

const Sidebar = ({ sidebarOpen = true, onDesktopToggle, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive    = (path)  => location.pathname === path;
  const isAnyActive = (paths) => paths.some((p) => location.pathname === p);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const SidebarInner = ({ isMobile = false }) => (
    <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar">

      {/* Logo */}
      <div className="flex justify-center border-b border-white relative">
        <img src="/logo.jpg" alt="Logo" className="h-40" />
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-4 space-y-1">

        {/* Overview */}
        <Link to="/admin/dash" onClick={onMobileClose}>
          <div className={`rounded-xl p-3 flex items-center gap-3 cursor-pointer font-bold mb-4 transition-all
            ${isActive('/admin/dash') ? 'bg-[#D1F2D8] text-[#00B14F]' : 'text-[#64748B] hover:bg-gray-50'}`}>
            <LayoutGrid size={22} strokeWidth={2.5} />
            <span>Overview</span>
          </div>
        </Link>

        {/* ONLINE ORDERS */}
        <SectionHeader title="ONLINE ORDERS" />
        <NavItem to="/admin/Order-list" icon={<ShoppingCart size={20} />} label="Orders" active={isActive('/admin/Order-list')} onClick={onMobileClose} />

        {/* PRODUCT MANAGEMENT */}
        <SectionHeader title="PRODUCT MANAGEMENT" />
        <DropdownNavItem
          icon={<Box size={20} />} label="Product Management"
          defaultOpen={isAnyActive(['/admin/productList', '/admin/addProducts'])}
          items={[{ label: 'List Of Products', path: '/admin/productList' }, { label: 'Add Product', path: '/admin/addProducts' }]}
          isActive={isActive} onNav={onMobileClose}
        />
        <NavItem to="/admin/category" icon={<Layers size={20} />} label="Categories" active={isActive('/admin/category')} onClick={onMobileClose} />
        <NavItem to="/admin/brandpage" icon={<Tag size={20} />} label="Brands" active={isActive('/admin/brandpage')} onClick={onMobileClose} />

        {/* APPEARANCE */}
        <SectionHeader title="APPEARANCE" />
        <DropdownNavItem
          icon={<Megaphone size={20} />} label="Banner"
          defaultOpen={isAnyActive(['/admin/bannerList', '/admin/banner'])}
          items={[{ label: 'List Of Banners', path: '/admin/bannerList' }, { label: 'Add Banner', path: '/admin/banner' }]}
          isActive={isActive} onNav={onMobileClose}
        />

        {/* SALE MANAGEMENT */}
        <SectionHeader title="SALE MANAGEMENT" />
        <DropdownNavItem
          icon={<Zap size={20} />} label="Flash Sales"
          defaultOpen={isAnyActive(['/admin/viewflash', '/admin/addFlash'])}
          items={[{ label: 'List Of Flash-Sales', path: '/admin/viewflash' }, { label: 'Add Flash-Sales', path: '/admin/addFlash' }]}
          isActive={isActive} onNav={onMobileClose}
        />
        <DropdownNavItem
          icon={<Megaphone size={20} />} label="Ads"
          defaultOpen={isAnyActive(['/admin/adlist', '/admin/addad'])}
          items={[{ label: 'List Of Ads', path: '/admin/adlist' }, { label: 'Add Ads', path: '/admin/addad' }]}
          isActive={isActive} onNav={onMobileClose}
        />
        <DropdownNavItem
          icon={<Ticket size={20} />} label="Coupan"
          defaultOpen={isAnyActive(['/admin/coupanlist', '/admin/Addcoupan'])}
          items={[{ label: 'List Of Coupan', path: '/admin/coupanlist' }, { label: 'Add Coupan', path: '/admin/Addcoupan' }]}
          isActive={isActive} onNav={onMobileClose}
        />
        {/* <NavItem to="/admin/pusernotication" icon={<Bell size={20} />} label="Push Notification" active={isActive('/admin/pusernotication')} onClick={onMobileClose} /> */}
        <DropdownNavItem
          icon={<Newspaper size={20} />} label="Blogs"
          defaultOpen={isAnyActive(['/admin/listBlog', '/admin/addBlogs'])}
          items={[{ label: 'List Of Blogs', path: '/admin/listBlog' }, { label: 'Add Blogs', path: '/admin/addBlogs' }]}
          isActive={isActive} onNav={onMobileClose}
        />
        {/* <NavItem to="/admin/reports" icon={<BarChart3 size={20} />} label="Report" active={isActive('/admin/reports')} giftIcon onClick={onMobileClose} /> */}

        {/* MESSAGES */}
        <SectionHeader title="MESSAGES" />
        <NavItem to="/admin/support-tickets" icon={<MessageSquare size={20} />} label="Customer Query" active={isActive('/admin/support-tickets')} onClick={onMobileClose} />

        {/* USER MANAGEMENT */}
        <SectionHeader title="USER MANAGEMENT" />
        {/* <DropdownNavItem
           icon={<Truck size={20} />} label="Delivery Agent"
          defaultOpen={isAnyActive(['/admin/allDriver', '/admin/addDriver'])}
          items={[{ label: 'Delivery Agent', path: '/admin/allDriver' }, { label: 'Add Deliver Agent', path: '/admin/addDriver' }]}
          isActive={isActive} onNav={onMobileClose}
        /> */}
        <NavItem to="/admin/customers" icon={<Users size={20} />} label="Customers" active={isActive('/admin/customers')} onClick={onMobileClose} />

        {/* ── SELLER MANAGEMENT (NEW) ── */}
                <SectionHeader title="SELLER MANAGEMENT" />

        <NavItem
          to="/admin/sellers"
          icon={<Store size={20} />}
          label="Sellers"
          active={isActive('/admin/sellers')}
          onClick={onMobileClose}
        />
<NavItem
          to="/admin/seller-products-approval"
          icon={<Store size={20} />}
          label="Seller Products Approval"
          active={isActive('/admin/seller-products-approval')}
          onClick={onMobileClose}
        />

        {/* SETTINGS */}
        <SectionHeader title="SETTINGS" />
        <NavItem to="/admin/ticket_issue" icon={<Users size={20} />} label="Ticket Issue Type" active={isActive('/admin/ticket_issue')} onClick={onMobileClose} />
        <DropdownNavItem
          icon={<Briefcase size={20} />} label="Business Settings"
          defaultOpen={isAnyActive(['/admin/texs', '/admin/deliveryCharge'])}
          items={[{ label: 'Vat & taxes', path: '/admin/texs' }, { label: 'Delivery Charge', path: '/admin/deliveryCharge' }]}
          isActive={isActive} onNav={onMobileClose}
        />
        <DropdownNavItem
          icon={<Briefcase size={20} />} label="Configure Dependence"
          defaultOpen={isAnyActive(['/admin/paymentgateway','/admin/smsSetting','/admin/socialAuth','/admin/pusher','/admin/mailConfig','/admin/firebase'])}
          items={[
            { label: 'Payment Gateway', path: '/admin/paymentgateway' },
            { label: 'SMS Gateway', path: '/admin/smsSetting' },
            { label: 'Social Auth', path: '/admin/socialAuth' },
            { label: 'Pusher Setup', path: '/admin/pusher' },
            { label: 'Mail Config', path: '/admin/mailConfig' },
            { label: 'Firebase Notification', path: '/admin/firebase' },
          ]}
          isActive={isActive} onNav={onMobileClose}
        />

        {/* Logout */}
        <div className="pt-4 mt-2 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-all group"
          >
            <LogOut size={20} className="text-[#243746] group-hover:text-red-500 transition-colors" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 p-4 flex justify-between items-center bg-white sticky bottom-0 z-20">
        <Maximize size={20} className="text-[#243746] cursor-pointer hover:text-[#00B14F]" />
        <User size={20} className="text-[#243746] cursor-pointer hover:text-[#00B14F]" />
        <Home size={20} className="text-[#243746] cursor-pointer hover:text-[#00B14F]" />
        <span className="text-gray-400 text-[10px] font-bold tracking-tighter">v1.0.0</span>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div
        className={`hidden md:flex flex-col flex-shrink-0 h-screen bg-white border-r border-gray-100 overflow-y-auto custom-scrollbar transition-all duration-300
          ${sidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden border-0'}`}
      >
        {sidebarOpen && <SidebarInner isMobile={false} />}
      </div>

      {/* Desktop collapse button */}
      {sidebarOpen && (
        <button
          onClick={onDesktopToggle}
          className="fixed left-[268px] top-1/2 -translate-y-1/2 z-50 hidden md:flex
            w-8 h-8 rounded-full bg-[#00B14F] border-2 border-white
            items-center justify-center text-white shadow-md hover:bg-[#009944] transition-all"
        >
          <ChevronDown size={16} className="-rotate-90" />
        </button>
      )}
      {!sidebarOpen && (
        <button
          onClick={onDesktopToggle}
          className="fixed left-3 top-1/2 -translate-y-1/2 z-50 hidden md:flex
            w-8 h-8 rounded-full bg-[#00B14F] border-2 border-white
            items-center justify-center text-white shadow-md hover:bg-[#009944] transition-all"
        >
          <ChevronDown size={16} className="rotate-90" />
        </button>
      )}

      {/* ── Mobile drawer backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 shadow-2xl transition-transform duration-300 md:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarInner isMobile={true} />
      </div>
    </>
  );
};

/* ── Helper Components ── */
const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-2 mt-6 mb-2 px-2">
    <span className="text-[9px] font-black text-gray-400 tracking-widest whitespace-nowrap uppercase">{title}</span>
    <div className="h-[1px] w-full bg-gray-100" />
  </div>
);

const NavItem = ({ to, icon, label, active, giftIcon, onClick }) => (
  <Link to={to} onClick={onClick}>
    <div className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group
      ${active ? 'bg-[#D1F2D8] text-[#00B14F]' : 'text-[#64748B] hover:bg-gray-50'}`}>
      <div className="flex items-center gap-3">
        <span className={`transition-colors ${active ? 'text-[#00B14F]' : 'text-[#243746] group-hover:text-[#00B14F]'}`}>
          {icon}
        </span>
        <span className={`text-sm font-semibold ${active ? 'text-[#00B14F]' : 'group-hover:text-[#243746]'}`}>
          {label}
        </span>
      </div>
      {giftIcon && <Gift size={16} className="text-[#243746]/70" />}
    </div>
  </Link>
);

const DropdownNavItem = ({ icon, label, items, isActive, defaultOpen = false, onNav }) => {
  const [open, setOpen] = useState(defaultOpen);
  const parentActive    = items.some((item) => isActive(item.path));

  return (
    <div>
      <div
        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group
          ${parentActive || open ? 'bg-[#D1F2D8] text-[#00B14F]' : 'text-[#64748B] hover:bg-gray-50'}`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className={parentActive || open ? 'text-[#00B14F]' : 'text-[#243746] group-hover:text-[#00B14F]'}>
            {icon}
          </span>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? 'rotate-180 text-[#00B14F]' : 'text-gray-400'}`} />
      </div>

      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-[#D1F2D8] pl-3">
          {items.map((item) => (
            <Link key={item.path} to={item.path} onClick={onNav}>
              <div className={`text-sm rounded-lg px-3 py-2 cursor-pointer transition-all font-medium
                ${isActive(item.path) ? 'text-[#00B14F] bg-[#F0FBF4] font-semibold' : 'text-[#64748B] hover:text-[#00B14F] hover:bg-[#F0FBF4]'}`}>
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;