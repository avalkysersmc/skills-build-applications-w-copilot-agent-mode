import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyMessage: string;
  children: ReactNode;
};

export function CapabilityCard({ title, description, loading, error, empty, emptyMessage, children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? <p role="status">Loading {title.toLowerCase()}...</p>
          : error ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
            : empty ? <p role="status">{emptyMessage}</p>
              : children}
      </div>
    </section>
  );
}
