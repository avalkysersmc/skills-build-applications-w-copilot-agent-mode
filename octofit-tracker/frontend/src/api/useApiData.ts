import { useEffect, useState } from 'react';
import { getJson } from './client.js';

type ApiDataState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useApiData<T>(path: string): ApiDataState<T> {
  const [state, setState] = useState<ApiDataState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });

    getJson<T>(path)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unknown request error';
        setState({ data: null, loading: false, error: message });
      });

    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
