import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TeamApplicationForm = ({ competitionId, user, onSuccess, onCancel }) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isIncomplete, setIsIncomplete] = useState(false);
  const [requiredMembers, setRequiredMembers] = useState('');
  const [rolesNeeded, setRolesNeeded] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, name')
          .eq('captain_user_id', user.id);

        if (error) throw error;
        setTeams(data || []);
      } catch (error) {
        console.error('Ошибка при загрузке команд:', error.message);
        setError('Не удалось загрузить список команд.');
      }
    };

    fetchTeams();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedTeamId) {
        throw new Error('Выберите команду.');
      }

      const { data: existingApplication, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('competition_id', competitionId)
        .eq('applicant_team_id', selectedTeamId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      if (existingApplication) {
        throw new Error('Заявка от этой команды уже подана.');
      }

      const applicationData = {
        competition_id: competitionId,
        applicant_team_id: selectedTeamId,
        applicant_user_id: null,
        application_type: 'командная',
        submitted_by_user_id: user.id,
        status: isIncomplete ? 'формируется' : 'на_рассмотрении',
        submitted_at: new Date().toISOString(),
        additional_data: isIncomplete
          ? JSON.stringify({
              required_members: requiredMembers,
              roles_needed: rolesNeeded,
            })
          : null,
      };

      const { error: insertError } = await supabase
        .from('applications')
        .insert([applicationData]);

      if (insertError) throw insertError;

      alert('Заявка успешно подана!');
      onSuccess();
    } catch (error) {
      console.error('Ошибка при подаче заявки:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Подача командной заявки</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Выберите команду *</label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Выберите команду</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={isIncomplete}
              onChange={(e) => setIsIncomplete(e.target.checked)}
              className="form-checkbox text-blue-500"
            />
            <span className="ml-2">Команда не полностью сформирована</span>
          </label>
        </div>

        {isIncomplete && (
          <>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Количество требуемых участников</label>
              <input
                type="number"
                value={requiredMembers}
                onChange={(e) => setRequiredMembers(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                placeholder="Например, 2"
                min="1"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Требуемые роли</label>
              <textarea
                value={rolesNeeded}
                onChange={(e) => setRolesNeeded(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                placeholder="Опишите, какие роли нужны (например, разработчик, дизайнер)"
                rows="3"
              />
            </div>
          </>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900 text-white rounded">
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            disabled={loading}
          >
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamApplicationForm;