export function ProductArt({ kind, name }: { kind: string; name: string }) {
  const bag = ["rice", "soap"].includes(kind);
  const carton = kind === "milk";
  const color =
    (
      {
        cola: "#ab2632",
        can: "#cb3341",
        green: "#377950",
        water: "#81bacb",
        rice: "#be864d",
        milk: "#417dba",
        soap: "#bc749b",
        clean: "#e1b443",
      } as Record<string, string>
    )[kind] ?? "#ab2632";
  return (
    <div
      className={`product-art art-${kind}`}
      role="img"
      aria-label={`Ilustração de ${name}`}
    >
      <svg viewBox="0 0 180 170" aria-hidden="true">
        <ellipse cx="90" cy="148" rx="43" ry="9" fill="#000" opacity=".06" />
        {bag ? (
          <path
            d="M57 24 Q90 30 123 24 L133 142 Q90 151 47 142 Z"
            fill="#f5ead8"
            stroke={color}
            strokeWidth="2"
          />
        ) : carton ? (
          <path
            d="M62 22 H108 L123 41 V144 H57 V41 Z"
            fill="#f4f8ff"
            stroke={color}
            strokeWidth="2"
          />
        ) : (
          <>
            <rect x="76" y="14" width="28" height="15" rx="4" fill={color} />
            <path
              d="M76 29 H104 V42 Q118 51 118 69 V137 Q118 146 108 146 H72 Q62 146 62 137 V69 Q62 51 76 42 Z"
              fill={kind === "cola" ? "#3a2523" : color}
            />
          </>
        )}
        <rect
          x={bag ? 51 : 60}
          y="70"
          width={bag ? 78 : 60}
          height="45"
          rx="3"
          fill={color}
        />
        <text
          x="90"
          y="90"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
        >
          {
            (
              {
                cola: "COLA",
                can: "COLA",
                green: "FRESCOR",
                water: "ÁGUA",
                rice: "ARROZ",
                milk: "LEITE",
                soap: "SUAVE",
                clean: "LIMPEZA",
              } as Record<string, string>
            )[kind]
          }
        </text>
        <text x="90" y="106" textAnchor="middle" fill="white" fontSize="8">
          MERCADO
        </text>
        <path
          d="M68 51 V65"
          stroke="white"
          opacity=".4"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
