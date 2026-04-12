import { useLocation } from 'preact-iso';
import { Icon } from './Icon.jsx';

const TABS = [
  { path: '/', icon: 'home', label: 'Home' },
  { path: '/editor/new', icon: 'add_circle', label: 'New Beat' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
];

export function BottomNav() {
  const { path, route } = useLocation();

  const hidden = path === '/login' || path === '/signup';
  if (hidden) return null;

  return (
    <div class="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[max(12px,env(safe-area-inset-bottom))] px-4 pointer-events-none">
      <nav class="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]">
        {TABS.map((tab) => {
          const active = tab.path === '/'
            ? path === '/' || path === ''
            : path.startsWith(tab.path);
          return (
            <a
              key={tab.path}
              href={tab.path}
              onClick={(e) => {
                e.preventDefault();
                route(tab.path);
              }}
              class={`flex flex-col items-center justify-center px-5 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-primary/20 text-primary-light shadow-[0_0_16px_rgba(99,102,241,0.2)]'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.08] active:scale-95'
              }`}
            >
              <Icon name={tab.icon} filled={active} size="text-[22px]" />
              <span class="font-body font-semibold text-[9px] mt-0.5 tracking-wide">
                {tab.label}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
