"use client";

interface Props {
  number: number;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
  bonus?: boolean;
}

function ballColor(n: number): string {
  if (n <= 10) return "bg-yellow-400 text-yellow-900";
  if (n <= 20) return "bg-blue-500 text-white";
  if (n <= 30) return "bg-red-500 text-white";
  if (n <= 40) return "bg-gray-600 text-white";
  return "bg-green-500 text-white";
}

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
};

export function NumberBall({ number, size = "md", highlight, bonus }: Props) {
  const sizeClass = sizes[size];
  const colorClass = ballColor(number);
  const ring = highlight ? "ring-2 ring-offset-1 ring-white" : "";
  const opacity = bonus ? "opacity-70" : "";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold select-none
        ${sizeClass} ${colorClass} ${ring} ${opacity}`}
      title={bonus ? `보너스: ${number}` : String(number)}
    >
      {number}
    </span>
  );
}
