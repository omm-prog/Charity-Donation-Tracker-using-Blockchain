import React from "react";
import "../styles/DemoVideoSection.css";

const DemoVideoSection = () => {
  return (
    <div className="demo-video-section">
      <h2 className="section-title">Watch Our Platform in Action</h2>
      <div className="video-container">
        <iframe
          width="800"
          height="450"
          src="https://www.youtube.com/embed/your-demo-video-id"
          title="Demo Video"
          frameBorder="0"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default DemoVideoSection;