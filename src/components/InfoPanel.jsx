import React, { useState, useEffect } from "react";

export default function InfoPanel({
  selectedPage,
  selectedPages,
  handleDownload,
  handleGlobalToggle,
  areAllVisiblePagesSelected,
  isBundling,
  statusMessage,
  uniqueDependencies,
  progress,
}) {
  const selectedCount = selectedPages.length;
  const [currentScreenshot, setCurrentScreenshot] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setCurrentScreenshot(0);

    // ✅ Auto-expand when a page is selected (on mobile or always, your choice)
    if (selectedPage && window.innerWidth <= 1250) {
      setIsExpanded(true);
    }
  }, [selectedPage]);

  const screenshots = selectedPage?.meta?.screenshot
    ? Array.isArray(selectedPage.meta.screenshot)
      ? selectedPage.meta.screenshot
      : [selectedPage.meta.screenshot]
    : [];

  const handleNext = () => {
    if (screenshots.length > 1) {
      setCurrentScreenshot((prev) => (prev + 1) % screenshots.length);
    }
  };

  const handlePrev = () => {
    if (screenshots.length > 1) {
      setCurrentScreenshot((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!selectedPage) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  return (
    <aside className={`info-panel${isExpanded ? " expanded" : " collapsed"}`}>
      <div className='info-toggle' onClick={() => setIsExpanded(!isExpanded)}>
        <span>{isExpanded ? "▼" : "▲"}</span>
      </div>

      <div className='info-content'>
        {screenshots.length > 0 && (
          <div className='carousel'>
            <img
              src={screenshots[currentScreenshot]}
              alt={`Screenshot ${currentScreenshot + 1}`}
              className='screenshot-image'
            />
            {screenshots.length > 1 && (
              <div className='carousel-controls'>
                <button onClick={handlePrev}>&lt;</button>
                <span>
                  {currentScreenshot + 1} / {screenshots.length}
                </span>
                <button onClick={handleNext}>&gt;</button>
              </div>
            )}
          </div>
        )}

        <div className='meta-block'>
          {selectedPage ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h2>{selectedPage.meta.name}</h2>
                <span className='version-pill'>v{selectedPage.meta.version}</span>
              </div>
              <p>
                <strong>By:</strong> {selectedPage.meta.author}
              </p>
              <p>{selectedPage.meta.description}</p>
            </>
          ) : (
            <>
              <h2>GBE Deck</h2>
              <p>
                <strong>Modular all-in-one macro deck.</strong>
              </p>
              <p>Select a category or page to see more info.</p>
            </>
          )}
        </div>

        {uniqueDependencies && uniqueDependencies.length > 0 && (
          <div className='dependencies-panel'>
            <h4>Dependencies Required:</h4>
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
      </div>

      <div className='download-footer'>
        <div className='button-wrapper'>
          <button
            className='submit-button'
            onClick={handleDownload}
            disabled={selectedPages.length === 0 || isBundling}>
            {isBundling ? "Bundling..." : "Download"}
          </button>
          <button className='select-all-btn' onClick={handleGlobalToggle}>
            {areAllVisiblePagesSelected() ? "Deselect\u00A0All" : "Select\u00A0All"}
          </button>
        </div>

        {isBundling && (
          <div className='progress-container'>
            <div className='progress-bar' style={{ width: `${progress}%` }}></div>
          </div>
        )}
        <p>{statusMessage}</p>
        <p>
          <strong>Total pages selected:</strong> {selectedCount}
        </p>
      </div>
    </aside>
  );
}
