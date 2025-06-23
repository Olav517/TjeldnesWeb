import { useAuth } from 'react-oidc-context';

const SCOREBOARD_API_URL =  'https://api.test.tjeldnes.com/scoreboard'
  

export const useScoreboardApi = () => {
  const auth = useAuth();

  const getAuthHeaders = () => {
    if (!auth.user?.access_token) {
      throw new Error('No access token available');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.user.access_token}`,
    };
  };

  const incrementWinCount = async (): Promise<{ wins: number }> => {
    try {
      const response = await fetch(SCOREBOARD_API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error incrementing win count:', error);
      throw error;
    }
  };

  const getWinCount = async (): Promise<{ wins: number }> => {
    try {
      const response = await fetch(SCOREBOARD_API_URL, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting win count:', error);
      throw error;
    }
  };

  return {
    incrementWinCount,
    getWinCount,
    isAuthenticated: auth.isAuthenticated,
  };
}; 