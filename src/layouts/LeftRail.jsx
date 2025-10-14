import React from 'react';

export default function LeftRail({ pageTitle, children }) {
  return (
    <div className="en-cd-left-inner">
      {pageTitle ? (
        <div className="en-cd-left-head" data-testid="left-rail-head">
          <h2
            className="en-cd-left-pagetitle"
            title={String(pageTitle)}
          >
            {pageTitle}
          </h2>
        </div>
      ) : null}
      {children}
    </div>
  );
}
