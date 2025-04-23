// src/components/Profile.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

// Основной компонент профиля
const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regions, setRegions] = useState([]);
  const [editing, setEditing] = useState(false);
  
  // Состояние для редактирования
  const [formData, setFormData] = useState({
    full_name: '',
    bio: ''
  });
  
  // Получение текущего пользователя
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    
    fetchUser();
  }, []);
  
  // Загрузка профиля пользователя и справочных данных
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Загрузка профиля
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select(`
            id,
            full_name,
            email,
            role,
            region_id,
            bio,
            created_at,
            regions(name)
          `)
          .eq('id', user.id)
          .single();
          
        // Если профиль не найден, создаем его
        if (profileError && profileError.code === 'PGRST116') {
          console.log('Профиль не найден, создаем новый');
          
          const { data: newProfileData, error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || '',
                created_at: new Date()
              }
            ])
            .select()
            .single();
            
          if (insertError) {
            console.error('Ошибка при создании профиля:', insertError);
            throw new Error('Не удалось создать профиль пользователя');
          }
          
          setProfile(newProfileData);
          setFormData({
            full_name: newProfileData.full_name || '',
            bio: newProfileData.bio || ''
          });
        } else if (profileError) {
          throw profileError;
        } else {
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || '',
            bio: profileData.bio || ''
          });
        }
        
        // Загрузка регионов для выпадающего списка
        const { data: regionsData, error: regionsError } = await supabase
          .from('regions')
          .select('id, name');
          
        if (regionsError) throw regionsError;
        setRegions(regionsData || []);
        
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error.message);
        setError('Не удалось загрузить профиль. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Обработчик сохранения профиля
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          bio: formData.bio
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Обновление профиля в состоянии
      setProfile({
        ...profile,
        full_name: formData.full_name,
        bio: formData.bio
      });
      
      setEditing(false);
      alert('Профиль успешно обновлен!');
      
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error.message);
      setError('Не удалось обновить профиль. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };
  
  // Показ индикатора загрузки
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Навигация */}
      <Navbar user={user} />
      
      {/* Основной контент */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-0">Профиль пользователя</h1>
          
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition w-full sm:w-auto text-center"
            >
              Редактировать профиль
            </button>
          )}
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-900 text-white rounded">
            <p>{error}</p>
          </div>
        )}
        
        {/* Профиль или форма редактирования */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6">
          {editing ? (
            // Форма редактирования
            <div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1">Полное имя</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Введите ваше полное имя"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 mb-1">О себе</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                  rows="4"
                  placeholder="Расскажите о себе и своем опыте"
                ></textarea>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition w-full sm:w-auto text-center"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition w-full sm:w-auto text-center"
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          ) : (
            // Просмотр профиля
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Личная информация</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="mb-4">
                      <span className="block text-gray-400 text-sm">Полное имя</span>
                      <span className="text-lg">{profile?.full_name || 'Не указано'}</span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="block text-gray-400 text-sm">Email</span>
                      <span className="text-lg">{profile?.email}</span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="block text-gray-400 text-sm">Роль</span>
                      <span className="text-lg">
                        {profile?.role === 'athlete' ? 'Спортсмен' : 
                         profile?.role === 'regional_rep' ? 'Региональный представитель' : 
                         'Администратор ФСП'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4">
                      <span className="block text-gray-400 text-sm">Регион</span>
                      <span className="text-lg">{profile?.regions?.name || 'Не указан'}</span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="block text-gray-400 text-sm">Дата регистрации</span>
                      <span className="text-lg">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : 'Не указана'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">О себе</h2>
                <p className="text-gray-300 whitespace-pre-line">
                  {profile?.bio || 'Информация не указана'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Временно: Заглушка для истории участия */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">История участия</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-center py-4">
              В разработке: Здесь будет отображаться ваша история участия в соревнованиях
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;