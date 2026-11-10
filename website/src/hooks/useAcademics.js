import { useApi } from './useApi';

export function useCourseOptions({ includeInactive = false } = {}) {
  const { data } = useApi('/admin/courses', includeInactive ? {} : { status: 'active' });
  return data?.items || [];
}

export function useOpenBatches() {
  const { data, reload } = useApi('/admin/batches', { status: 'upcoming,active' });
  return { batches: data?.items || [], reloadBatches: reload };
}
