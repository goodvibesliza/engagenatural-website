// src/components/community/ProGate.jsx
import { useEffect, useRef } from 'react';
import COPY from '../../i18n/community.copy';

export default function ProGate({ onRequestVerify }) {
  const headingRef = useRef(null);

  useEffect(() => {
    // Focus the heading when the gate appears for accessibility
    if (headingRef.current) headingRef.current.focus();
  }, []);

  return (
    <div
      className="space-y-4"
      id="panel-pro"
      role="tabpanel"
      aria-labelledby="tab-pro"
    >
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-heading font-semibold mb-1"
        >
          {COPY.gate.title}
        </h2>
        <p className="text-sm">{COPY.gate.subcopy}</p>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onRequestVerify?.()}
            className="px-4 py-2 bg-deep-moss text-white rounded-md text-sm hover:bg-sage-dark"
          >
            {COPY.gate.cta}
          </button>
          <button
            type="button"
            onClick={() => window.open('/staff/verification', '_self')}
            className="text-sm underline text-amber-900 hover:text-amber-950"
          >
            Learn why verification matters
          </button>
        </div>
      </div>
    </div>
  );
}
