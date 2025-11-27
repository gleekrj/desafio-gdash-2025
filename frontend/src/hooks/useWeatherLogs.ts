import { useState, useCallback } from 'react';
import {
  getWeatherLogsPaginated,
  WeatherLog,
  PaginatedWeatherLogs,
} from '../services/api';
import { extractArrayFromPaginated } from '../utils/array-helpers';

/**
 * Hook para gerenciar estado e fetch de logs climáticos
 */
export function useWeatherLogs() {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [pagination, setPagination] = useState<PaginatedWeatherLogs | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      city?: string,
      startDate?: string,
      endDate?: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const data = await getWeatherLogsPaginated(
          page,
          limit,
          city,
          startDate,
          endDate
        );

        console.log('[frontend] Fetched paginated data:', data);

        const { data: logsArray, pagination: paginationData } =
          extractArrayFromPaginated<WeatherLog>(data);

        setLogs(logsArray);
        setPagination(
          paginationData && typeof paginationData === 'object' && 'page' in paginationData
            ? (paginationData as PaginatedWeatherLogs)
            : null
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao buscar logs';
        setError(errorMessage);
        console.error('[frontend] Error fetching logs:', err);
        setLogs([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    logs,
    pagination,
    loading,
    error,
    fetchLogs,
    setLogs,
  };
}

