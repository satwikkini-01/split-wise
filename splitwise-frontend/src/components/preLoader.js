import React, { useEffect } from "react";
import { preLoaderAnim } from "../animations";
import './preLoader.css'

const PreLoader = () => {
  useEffect(() => {
    preLoaderAnim();
  }, []);
  return (
    <div className="preloader">
      <div className="texts-container">
        <span>Welcome</span>
        <span>To</span>
        <span>Splitwise</span>
      </div>
    </div>
  );
};

export default PreLoader;