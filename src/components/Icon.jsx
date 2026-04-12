export function Icon({ name, filled, className = '', size = 'text-2xl' }) {
  const style = filled
    ? { fontVariationSettings: "'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 48" }
    : undefined;
  return (
    <span class={`material-symbols-outlined ${size} ${className}`} style={style}>
      {name}
    </span>
  );
}
