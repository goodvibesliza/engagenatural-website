// src/components/community/FeedTabs.jsx
import { useCallback } from 'react';
import COPY from '../../i18n/community.copy';

const TabButton = ({ id, isActive, onSelect, children, controls }) => (
  <button
    id={id}
    role="tab"
    aria-selected={isActive}
    aria-controls={controls}
    tabIndex={isActive ? 0 : -1}
    onClick={onSelect}
    className={`flex-1 text-center px-4 h-11 min-h-[44px] rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
      isActive ? 'bg-white text-deep-moss shadow-sm ring-deep-moss/30' : 'text-warm-gray hover:text-deep-moss'
    }`}
    type="button"
  >
    {children}
  </button>
);

export default function FeedTabs({ value = 'whatsGood', onChange }) {
  const handleKey = useCallback(
    (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const next = value === 'whatsGood' ? 'pro' : 'whatsGood';
      onChange?.(next);
    },
    [value, onChange]
  );

  return (
    <div
      role="tablist"
      aria-label="Community feeds"
      onKeyDown={handleKey}
      className="flex space-x-1 bg-oat-beige rounded-lg p-1"
    >
      <TabButton
        id="tab-whats-good"
        isActive={value === 'whatsGood'}
        onSelect={() => onChange?.('whatsGood')}
        controls="panel-whats-good"
      >
        {COPY.tabs.whatsGood}
      </TabButton>
      <TabButton
        id="tab-pro"
        isActive={value === 'pro'}
        onSelect={() => onChange?.('pro')}
        controls="panel-pro"
      >
        {COPY.tabs.pro}
      </TabButton>
    </div>
  );
}
