import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames';

export default function BottomNav() {
  const loc = useLocation();
  const items = [
    { name: 'Home', path: '/' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Events', path: '/events' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Profile', path: '/profile' }
  ];

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-slate-800 text-xs h-[26px] flex items-center justify-around'>
      {items.map((item) => (
        <Link key={item.path} to={item.path} className={classNames('px-2', loc.pathname === item.path && 'text-yellow-400 font-bold')}>
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
