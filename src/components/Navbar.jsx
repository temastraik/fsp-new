// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Navbar = ({ user }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, role, region_id')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setUserProfile(data);
      } catch (error) {
        console.error('Ошибка при загрузке профиля:', error.message);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/login';
    } catch (error) {
      console.error('Ошибка при выходе:', error.message);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Логотип и кнопка меню (на мобильных) */}
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold text-blue-500">ФСП</Link>
            
            {/* Навигационные ссылки (на десктопе) */}
            <div className="hidden md:flex ml-10 space-x-4">
              <Link to="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                Главная
              </Link>
              <Link to="/competitions" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                Соревнования
              </Link>
              <Link to="/teams" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                Команды
              </Link>
            </div>
          </div>
          
          {/* Кнопка меню для мобильных устройств */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white p-2"
              aria-label="Открыть меню"
            >
              {menuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Профиль и кнопка выхода (на десктопе) */}
          <div className="hidden md:flex items-center">
            <Link to="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
              {userProfile?.full_name || user?.email}
            </Link>
            <button
              onClick={handleLogout}
              className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
        
        {/* Мобильное меню */}
        {menuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link 
                to="/dashboard" 
                className="block text-gray-300 hover:text-white px-3 py-2 rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                Главная
              </Link>
              <Link 
                to="/competitions" 
                className="block text-gray-300 hover:text-white px-3 py-2 rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                Соревнования
              </Link>
              <Link 
                to="/teams" 
                className="block text-gray-300 hover:text-white px-3 py-2 rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                Команды
              </Link>
              <Link 
                to="/profile" 
                className="block text-gray-300 hover:text-white px-3 py-2 rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                Профиль
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm"
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;