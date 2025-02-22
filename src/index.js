import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.css';  // main.css를 사용하는 경우
// import './index.css';  // index.css를 사용하는 경우

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
