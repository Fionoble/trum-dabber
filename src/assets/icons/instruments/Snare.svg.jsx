// Snare drum — shallow cylinder with snare wires underneath
export default () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="8" rx="9" ry="4" />
    <line x1="3" y1="8" x2="3" y2="14" />
    <line x1="21" y1="8" x2="21" y2="14" />
    <ellipse cx="12" cy="14" rx="9" ry="4" />
    <line x1="6" y1="17.5" x2="18" y2="10.5" strokeDasharray="2 2" strokeWidth="1" />
    <line x1="6" y1="10.5" x2="18" y2="17.5" strokeDasharray="2 2" strokeWidth="1" />
  </svg>
);
