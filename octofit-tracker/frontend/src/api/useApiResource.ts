import { useEffect, useState } from 'react';

export type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: T };

// `key` identifies the request; the loader runs again whenever it changes.
export function useApiResource<T>(load: () => Promise<T>, key: string): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load()
      .then((data) => {
        if (active) setState({ status: 'success', data });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [key]);

  return state;
}
