import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import FABMenu from './FABMenu';
import Sidebar from './Sidebar';
import Drawer from './Drawer';
import useWindowSize from '../hooks/useWindowSize';

export default function Layout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('sidebarCollapsed');
      return raw ? JSON.parse(raw) : false;
    } catch { return false; }
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const size = useWindowSize();

  useEffect(() => {
    if (size.width <= 768) setCollapsed(true);
  }, [size.width]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  return (
    <div className='flex min-h-screen'>
      <div className='hidden md:block'>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s)=>!s)} />
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className='flex-1 flex flex-col'>
        <TopBar />
        <main className='flex-1 p-4 max-w-6xl mx-auto w-full'>
          <div className='md:hidden mb-4'>
            <button className='px-3 py-2 bg-white/10 rounded' onClick={() => setDrawerOpen(true)}>Menu</button>
          </div>

          <Outlet />
        </main>

        <BottomNav />
        <FABMenu />
      </div>
    </div>
  );
}
