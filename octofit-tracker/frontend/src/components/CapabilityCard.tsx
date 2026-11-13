import type { ReactNode } from 'react';
import type { ResourceState } from '../api/useApiResource.js';

type Props<T> = {
  title: string;
  description: string;
  resource: ResourceState<T>;
  loadingText: string;
  errorText: string;
  emptyText: string;
  isEmpty: (data: T) => boolean;
  children: (data: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, resource, loadingText, errorText, emptyText, isEmpty, children }: Props<T>) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {resource.status === 'loading' && <p role="status">{loadingText}</p>}
        {resource.status === 'error' && <p role="alert" className="text-danger">{errorText}</p>}
        {resource.status === 'success' && (isEmpty(resource.data) ? <p>{emptyText}</p> : children(resource.data))}
      </div>
    </section>
  );
}
