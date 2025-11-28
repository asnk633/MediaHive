import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ForgotPassword from './ForgotPassword';
import VerifyEmail from './VerifyEmail';

import Home from './Home';
import Tasks from './Tasks';
import Events from './Events';
import Calendar from './Calendar';
import Reports from './Reports';
import Profile from './Profile';
import Settings from './Settings';
import RoleManager from './RoleManager';
import CreateNotification from './CreateNotification';

import Protected from './Protected';
import AdminOnly from './AdminOnly';

import { AnimatePresence } from 'framer-motion';

function RoutesWithAnimation() {
  const location = useLocation();
  return (
    <AnimatePresence mode='wait'>
      <Routes location={location} key={location.pathname}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/forgot' element={<ForgotPassword />} />
        <Route path='/verify' element={<VerifyEmail />} />

        <Route element={<Protected />}>
          <Route element={<Layout />}>
            <Route path='/' element={<Home />} />
            <Route path='/tasks' element={<Tasks />} />
            <Route path='/events' element={<Events />} />
            <Route path='/calendar' element={<Calendar />} />
            <Route path='/reports' element={<Reports />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='/settings' element={<Settings />} />
            <Route path='/admin/roles' element={<AdminOnly><RoleManager /></AdminOnly>} />
            <Route path='/create-notif' element={<AdminOnly><CreateNotification /></AdminOnly>} />
          </Route>
        </Route>

      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RoutesWithAnimation />
    </BrowserRouter>
  );
}
