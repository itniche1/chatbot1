import type { ReactNode } from "react";

/** Settings section: title + description on the left, fields on the right (stacks on small screens). */
export function FormSection({ title, description, children, footer }: { title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="card form-section">
      <div className="form-section__head">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className="form-section__body">{children}</div>
      {footer && <div className="card__footer">{footer}</div>}
    </section>
  );
}

export function SaveBar({ children }: { children: ReactNode }) {
  return <div className="save-bar">{children}</div>;
}
