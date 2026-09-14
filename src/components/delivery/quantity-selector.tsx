import { Minus, Plus } from "lucide-react";
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  label = "produto",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  label?: string;
}) {
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label={`Diminuir quantidade de ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={16} />
      </button>
      <output aria-label={`Quantidade de ${label}`}>{value}</output>
      <button
        type="button"
        aria-label={`Aumentar quantidade de ${label}`}
        disabled={value >= 99}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
