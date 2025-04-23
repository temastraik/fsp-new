// src/components/CompetitionDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from './Navbar';
import TeamApplicationForm from './TeamApplicationForm';
import TeamsLookingForMembers from './TeamsLookingForMembers'; 

const CompetitionDetails = () => {
  const { id } = useParams();
  const [competition, setCompetition] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userTeams, setUserTeams] = useState([]);
  const [showTeamApplicationModal, setShowTeamApplicationModal] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setLoading(true);
        
        const { data: competitionData, error: competitionError } = await supabase
          .from('competitions')
          .select(`
            *,
            disciplines(name),
            regions(name)
          `)
          .eq('id', id)
          .single();
          
        if (competitionError) throw competitionError;
        
        // Загрузка информации об организаторе
        if (competitionData) {
          const { data: organizerData, error: organizerError } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', competitionData.organizer_user_id)
            .single();
            
          if (!organizerError) {
            competitionData.organizer = organizerData;
          }
        }
        
        setCompetition(competitionData);
        
        // Отладка для проверки прав доступа
        if (competitionData && user) {
          console.log('Competition ID:', id);
          console.log('Competition organizer_user_id:', competitionData.organizer_user_id);
          console.log('Current user ID:', user.id);
          console.log('Is organizer:', competitionData.organizer_user_id === user.id);
        }
        
        if (user) {
          const { data: individualApplication } = await supabase
            .from('applications')
            .select('id, status')
            .eq('competition_id', id)
            .eq('applicant_user_id', user.id)
            .maybeSingle();
          
          const { data: teamsData, error: teamsError } = await supabase
            .from('teams')
            .select('id, name')
            .eq('captain_user_id', user.id);
            
          if (teamsError) throw teamsError;
          setUserTeams(teamsData || []);
          
          if (teamsData && teamsData.length > 0) {
            const teamIds = teamsData.map(team => team.id);
            
            const { data: teamApplications } = await supabase
              .from('applications')
              .select('id, applicant_team_id, status')
              .eq('competition_id', id)
              .in('applicant_team_id', teamIds)
              .maybeSingle();
              
            if (teamApplications) {
              setApplicationStatus(teamApplications.status);
            } else if (individualApplication) {
              setApplicationStatus(individualApplication.status);
            }
          } else if (individualApplication) {
            setApplicationStatus(individualApplication.status);
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке соревнования:', error.message);
        setError('Не удалось загрузить данные соревнования. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCompetition();
    }
  }, [id, user]);

  const handleTeamApplicationSuccess = async () => {
    setShowTeamApplicationModal(false);
    const { data: teamApplications } = await supabase
      .from('applications')
      .select('id, applicant_team_id, status')
      .eq('competition_id', id)
      .in('applicant_team_id', userTeams.map(team => team.id))
      .maybeSingle();

    if (teamApplications) {
      setApplicationStatus(teamApplications.status);
    }
  };

  if (loading && !competition) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  if (error && !competition) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

  const getCompetitionStatus = () => {
    if (!competition) return '';
    
    const now = new Date();
    const regStart = new Date(competition.registration_start_date);
    const regEnd = new Date(competition.registration_end_date);
    const compStart = new Date(competition.start_date);
    const compEnd = new Date(competition.end_date);
    
    if (now < regStart) {
      return 'скоро_открытие';
    } else if (now >= regStart && now <= regEnd) {
      return 'открыта_регистрация';
    } else if (now > regEnd && now < compStart) {
      return 'регистрация_закрыта';
    } else if (now >= compStart && now <= compEnd) {
      return 'идет_соревнование';
    } else {
      return 'завершено';
    }
  };

  const canApply = () => {
    if (!user || !competition) return false;
    
    const status = getCompetitionStatus();
    return status === 'открыта_регистрация' && !applicationStatus;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        {competition && (
          <>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{competition.name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    competition.type === 'открытое' ? 'bg-green-900 text-green-300' :
                    competition.type === 'региональное' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-blue-900 text-blue-300'
                  }`}>
                    {competition.type === 'открытое' ? 'Открытое' :
                    competition.type === 'региональное' ? 'Региональное' :
                    competition.type === 'федеральное' ? 'Федеральное' :
                    competition.type}
                  </span>
                  
                  <span className="px-2 py-1 bg-purple-900 text-purple-300 rounded-full text-xs">
                    {competition.disciplines?.name || 'Общая дисциплина'}
                  </span>
                  
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    getCompetitionStatus() === 'открыта_регистрация' ? 'bg-green-900 text-green-300' :
                    getCompetitionStatus() === 'идет_соревнование' ? 'bg-blue-900 text-blue-300' :
                    getCompetitionStatus() === 'завершено' ? 'bg-gray-700 text-gray-300' :
                    'bg-yellow-900 text-yellow-300'
                  }`}>
                    {getCompetitionStatus() === 'открыта_регистрация' ? 'Регистрация открыта' :
                     getCompetitionStatus() === 'идет_соревнование' ? 'Идет соревнование' :
                     getCompetitionStatus() === 'завершено' ? 'Завершено' :
                     getCompetitionStatus() === 'регистрация_закрыта' ? 'Регистрация закрыта' :
                     'Скоро открытие'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <Link
                  to="/competitions"
                  className="text-gray-300 hover:text-white mr-4"
                >
                  ← К списку соревнований
                </Link>

                {canApply() && (
                  <button
                    onClick={() => setShowTeamApplicationModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
                  >
                    Подать заявку командой
                  </button>
                )}
                
                {applicationStatus && (
                  <div className="mt-2 md:mt-0 md:ml-2 inline-block px-3 py-1 rounded-md bg-gray-800 text-sm">
                    Статус заявки: <span className="font-semibold">{applicationStatus}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Блок управления соревнованием для организатора */}
            {user && competition && (
              <div>
                {user.id === competition.organizer_user_id && (
                  <div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Управление соревнованием</h2>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/competitions/${id}/applications`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
                      >
                        Просмотр и управление заявками
                      </Link>
                      
                      <Link
                        to={`/competitions/${id}/edit`}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
                      >
                        Редактировать соревнование
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Описание</h2>
                  <p className="text-gray-300 whitespace-pre-line">{competition.description || 'Описание отсутствует'}</p>
                </div>
                
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Детали соревнования</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 mb-1">Организатор:</p>
                      <p>{competition.organizer?.full_name || competition.organizer?.email || 'Не указан'}</p>
                    </div>
                    
                    {competition.type === 'региональное' && (
                      <div>
                        <p className="text-gray-400 mb-1">Регион:</p>
                        <p>{competition.regions?.name || 'Не указан'}</p>
                      </div>
                    )}
                    
                    {competition.max_participants_or_teams && (
                      <div>
                        <p className="text-gray-400 mb-1">Максимум участников/команд:</p>
                        <p>{competition.max_participants_or_teams}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-gray-400 mb-1">Статус соревнования:</p>
                      <p>{competition.status}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Даты</h2>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 mb-1">Регистрация:</p>
                      <p className="text-green-400">{formatDate(competition.registration_start_date)}</p>
                      <p className="text-red-400 mt-1">{formatDate(competition.registration_end_date)}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 mb-1">Проведение:</p>
                      <p className="text-green-400">{formatDate(competition.start_date)}</p>
                      <p className="text-red-400 mt-1">{formatDate(competition.end_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Заменяем текущий раздел на компонент TeamsLookingForMembers */}
            {user && (
              <TeamsLookingForMembers competitionId={id} currentUser={user} />
            )}
            
            {showTeamApplicationModal && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg max-w-lg w-full p-6 mx-4">
                  <TeamApplicationForm
                    competitionId={id}
                    user={user}
                    onSuccess={handleTeamApplicationSuccess}
                    onCancel={() => setShowTeamApplicationModal(false)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompetitionDetails;