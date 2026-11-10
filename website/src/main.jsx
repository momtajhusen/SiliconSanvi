import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import RootProviders from './providers/RootProviders';
import { applyCachedCompany, refreshCompany } from './lib/company';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

function render(version) {
  root.render(
    <React.StrictMode>
      <RootProviders>
        <RouterProvider key={version} router={router} />
      </RootProviders>
    </React.StrictMode>,
  );
}

if (applyCachedCompany()) {
  render(0);
  refreshCompany()
    .then((changed) => changed && render(1))
    .catch(() => {});
} else {
  refreshCompany()
    .catch(() => {})
    .finally(() => render(0));
}
