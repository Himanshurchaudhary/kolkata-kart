import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Store, Box, Layers } from 'lucide-react';

const tabs = [
  { to: '/admin/Order-list',               icon: <ShoppingCart size={22} />, label: 'Orders'     },
  { to: '/admin/sellers',                  icon: <Store size={22} />,        label: 'Sellers'    },
  { to: '/admin/seller-products-approval', icon: <Box size={22} />,          label: 'Approvals'  },
  { to: '/admin/category',                 icon: <Layers size={22} />,       label: 'Categories' },
];

export default function MobileAdminBottomBar() {
  const { pathname } = useLocation();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[999] bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      {tabs.map(tab => {
        const active = pathname === tab.to;
        return (
          <Link key={tab.to} to={tab.to}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            style={{ color: active ? '#00B14F' : '#64748B' }}
          >
            <span style={{ color: active ? '#00B14F' : '#64748B' }}>{tab.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700 }}>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}