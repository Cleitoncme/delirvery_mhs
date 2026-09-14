import { ShoppingBag } from "lucide-react";
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <ShoppingBag size={40} className="mx-auto mb-4 text-primary" />
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
