export function PageHeader({ eyebrow, title, description, children }) {
    return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>{children && <div className="flex shrink-0 items-center gap-2">{children}</div>}</div>;
}