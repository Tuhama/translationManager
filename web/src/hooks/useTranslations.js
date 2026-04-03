import { useState, useEffect, useMemo } from 'react';
import TranslationService from '../services/api';

/**
 * Custom hook for translation management logic.
 */
export const useTranslations = () => {
  const [data, setData] = useState({
    translations: {},
    languages: [],
    allKeys: [],
    results: {},
    unused: [],
    maybeUsed: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const json = await TranslationService.fetchTranslations();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const actions = {
    refresh: fetchData,
    save: async (key, values) => {
      await TranslationService.saveTranslation(key, values);
      await fetchData();
    },
    deleteSingle: async (key) => {
      await TranslationService.deleteTranslation(key);
      await fetchData();
    },
    deleteMultiple: async (keys) => {
      await TranslationService.deleteMultiple(keys);
      await fetchData();
    },
    normalize: async () => {
      await TranslationService.normalize();
      await fetchData();
    }
  };

  return {
    data,
    isLoading,
    error,
    actions
  };
};
