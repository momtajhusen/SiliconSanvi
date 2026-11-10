import { useCallback, useEffect, useState } from 'react';
import api, { apiError } from '../lib/api';
import { cleanParams } from '../lib/format';

/** GET `path` (relative to /api) and re-fetch whenever `params` change. Pass `null` to skip. */
export function useApi(path, params) {
  const query = JSON.stringify(cleanParams(params));
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: '' });
      return undefined;
    }
    let alive = true;
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    api
      .get(path, { params: JSON.parse(query) })
      .then((response) => alive && setState({ data: response.data, loading: false, error: '' }))
      .catch((error) => alive && setState((prev) => ({ ...prev, loading: false, error: apiError(error) })));
    return () => {
      alive = false;
    };
  }, [path, query, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  return { ...state, reload };
}

export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
