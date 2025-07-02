import React, { useState } from "react";
import TpImport from "../assets/tp-import.png";
import TpIconPack from "../assets/tp-import-iconpack.png";
import TpPlugin from "../assets/tp-import-plugin.png";

export default function DownloadSuccessOverlay({ uniqueDependencies, onClose }) {
  const [showIconPackInstructions, setShowIconPackInstructions] = useState(false);
  const hasPlugins = uniqueDependencies?.some((dep) => dep.type === "plugin");

  return (
    <div className='success-page'>
      <div className='success-content'>
        <div className='close-overlay-btn-wrapper'>
          <button className='close-overlay-btn' onClick={onClose} aria-label='Close overlay'>
            ×
          </button>
        </div>
        <div>
          <div className='checkmark-wrapper'>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 98.5 98.5'>
              <path
                className='checkmark'
                fill='none'
                strokeWidth='8'
                strokeMiterlimit='10'
                d='M81.7,17.8C73.5,9.3,62,4,49.2,4
              C24.3,4,4,24.3,4,49.2s20.3,45.2,45.2,45.2s45.2-20.3,45.2-45.2c0-8.6-2.4-16.6-6.5-23.4l0,0L45.6,68.2L24.7,47.3'
              />
            </svg>
          </div>
          <h2>Download Complete!</h2>
          <p>Your bundle has been downloaded successfully.</p>
          <p>Follow the instructions below to install GBE Deck</p>
        </div>

        <div className='success-flex'>
          <div>
            <h3>Import Your Pages</h3>
            <p>
              Open Touch Portal, click the gear icon → Import Pages, and select your
              GBE-Custom-Bundle.tpz2 file.
            </p>
          </div>
          <img src={TpImport} alt='Import pages' className='overlay-image' />
        </div>

        {uniqueDependencies && uniqueDependencies.length > 0 && (
          <div className='dependencies-panel dependencies-panel-success'>
            <h3>Dependencies Required:</h3>
            <ul>
              {uniqueDependencies.map((dep, index) => (
                <div key={index}>
                  <a href={dep.link} target='_blank' rel='noreferrer'>
                    {dep.name}
                  </a>
                  <br />
                  {dep.description}
                </div>
              ))}
            </ul>
          </div>
        )}

        <div className='success-flex'>
          {hasPlugins && (
            <>
              <div>
                <h3>Install Required Plugins</h3>
                <p>
                  Open Touch Portal, click the quick actions button → Import Plugin, and install the
                  required plugins:
                </p>
              </div>
              <img src={TpPlugin} alt='Import plugin' className='overlay-image' />
            </>
          )}
        </div>

        {!showIconPackInstructions && (
          <div>
            <h3>Install Icon Pack</h3>
            <p>
              Want an icon pack with popular icons and system icons built into your Touch Portal
              Desktop App?
              <br />
              <a
                href='https://github.com/Gabriel-Velez/GBE-Deck/raw/main/Icons/GBE-Deck-Icons.tpi?raw=true'
                className='icon-pack-link'
                download
                onClick={() => setShowIconPackInstructions(true)}>
                Click here to download
              </a>
            </p>
          </div>
        )}

        {showIconPackInstructions && (
          <div className='success-flex'>
            <div>
              <h3>Import Icon Pack</h3>
              <p>
                Open Touch Portal, click the quick actions button → Import Icon Pack, and select
                GBE-Deck-Icons.tpi.
              </p>
            </div>
            <img src={TpIconPack} alt='Import icon pack' className='overlay-image' />
          </div>
        )}
      </div>
    </div>
  );
}
