export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const className =
    size === "lg"
      ? "h-16 w-16 rounded-2xl text-3xl shadow-xl shadow-amber-400/25 md:h-20 md:w-20 md:text-4xl"
      : size === "sm"
        ? "h-7 w-7 rounded-md text-xs shadow-sm shadow-amber-400/20"
        : "h-9 w-9 rounded-xl text-base shadow-md shadow-amber-400/20";

  return (
    <div className={`${className} grid shrink-0 place-items-center bg-amber-400 font-bold tracking-tight text-neutral-950`}>
      A
    </div>
  );
}
