import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 20); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="content">
      <div className="logo">
        <img
          src="./src/assets/logo-vista.png" // Replace with your wallet image URL
          alt="Logo studentské koleje Vista"
          className="logo-image-vista"
        />
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

export default App;