import "./App.css";
import CategoryCard from "./components/CategoryCard";
import InfoPanel from "./components/InfoPanel";
import DownloadSuccessOverlay from "./components/DownloadSuccessOverlay";
import data from "./data/pages.json";
import { useState } from "react";

function App() {
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [search, setSearch] = useState("");
  const [isBundling, setIsBundling] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [bundleFilename, setBundleFilename] = useState("");

  const togglePage = (pageName) => {
    setSelectedPages((prev) =>
      prev.includes(pageName) ? prev.filter((p) => p !== pageName) : [...prev, pageName]
    );
  };

  const handleCategoryToggle = (category, pages) => {
    const visiblePages = pages.filter(
      (p) =>
        p.meta.name.toLowerCase().includes(search.toLowerCase()) ||
        p.meta.description.toLowerCase().includes(search.toLowerCase())
    );
    const visiblePageNames = visiblePages.map((p) => p.meta.name);

    const allSelected = visiblePageNames.every((name) => selectedPages.includes(name));

    if (allSelected) {
      setSelectedPages((prev) => prev.filter((p) => !visiblePageNames.includes(p)));
    } else {
      setSelectedPages((prev) => Array.from(new Set([...prev, ...visiblePageNames])));
    }
  };

  const areAllVisiblePagesSelected = () => {
    const visiblePageNames = filteredData.flatMap(([_, pages]) => pages.map((p) => p.meta.name));
    return visiblePageNames.every((name) => selectedPages.includes(name));
  };

  const handleGlobalToggle = () => {
    const visiblePageNames = filteredData.flatMap(([_, pages]) => pages.map((p) => p.meta.name));
    if (areAllVisiblePagesSelected()) {
      setSelectedPages((prev) => prev.filter((p) => !visiblePageNames.includes(p)));
    } else {
      setSelectedPages((prev) => Array.from(new Set([...prev, ...visiblePageNames])));
    }
  };

  const handleDownload = async () => {
    setIsBundling(true);
    setProgress(5);
    setStatusMessage("");
    setBundleFilename("");

    try {
      const res = await fetch("https://gbe-deck-tpz2-bundle.gabriel-dan-velez.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: selectedPages }),
      });

      if (!res.ok) {
        throw new Error(`Worker failed: ${await res.text()}`);
      }

      const { requestId } = await res.json();
      if (!requestId) {
        throw new Error("Worker did not return a bundle request ID");
      }

      setProgress(10);
      pollForReleaseAndDownload(requestId);
    } catch (error) {
      console.error("Download error:", error);
      setStatusMessage(`❌ ${error.message || "Failed to trigger bundle"}`);
      setIsBundling(false);
      setProgress(0);
    }
  };

  const pollForReleaseAndDownload = (requestId) => {
    const tag = `gbe-bundle-${requestId}`;
    const url = `https://api.github.com/repos/Gabriel-Velez/GBE-Deck/releases/tags/${tag}`;
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      attempts++;

      try {
        const res = await fetch(url);
        if (res.ok) {
          const release = await res.json();
          const asset = release.assets.find((item) => item.name.endsWith(".tpz2"));

          if (asset) {
            setIsBundling(false);
            setProgress(100);
            setBundleFilename(asset.name);

            const link = document.createElement("a");
            link.href = asset.browser_download_url;
            link.download = asset.name;
            link.click();
            setShowSuccessOverlay(true);
            window.scrollTo({ top: 0, behavior: "instant" });
            return;
          }
        } else if (res.status !== 404) {
          console.error(`Release polling failed: ${res.status} ${await res.text()}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      setProgress(Math.min((attempts / maxAttempts) * 95, 95));
      if (attempts >= maxAttempts) {
        setStatusMessage("❌ Build timed out. Check the bundle workflow in GitHub Actions.");
        setIsBundling(false);
        setProgress(0);
        return;
      }

      setTimeout(poll, 10000);
    };

    setTimeout(poll, 5000);
  };

  const filteredData = Object.entries(data).map(([category, pages]) => {
    const filteredPages = pages.filter(
      (p) =>
        p.meta.name.toLowerCase().includes(search.toLowerCase()) ||
        p.meta.description.toLowerCase().includes(search.toLowerCase())
    );
    return [category, filteredPages];
  });

  const selectedObjects = Object.values(data)
    .flat()
    .flatMap((p) => p)
    .filter((p) => selectedPages.includes(p.meta.name));

  const uniqueDependencies = [
    ...new Map(
      selectedObjects.flatMap((p) => p.meta.dependencies || []).map((dep) => [dep.link, dep])
    ).values(),
  ];

  return (
    <div className='layout'>
      <button className='dev-toggle' onClick={() => setShowSuccessOverlay((prev) => !prev)}>
        {showSuccessOverlay ? "Hide" : "Show"} Success Overlay
      </button>

      {!showSuccessOverlay && (
        <>
          <main className='grid-area'>
            <div className='sticky-container'>
              <div className='search-container'>
                <input
                  placeholder='🔍 Search'
                  className='search-bar'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className='clear-search'
                    onClick={() => setSearch("")}
                    aria-label='Clear search'>
                    ✖️
                  </button>
                )}
              </div>
            </div>
            {filteredData.map(([category, pages]) => {
              if (pages.length === 0) return null;
              return (
                <CategoryCard
                  key={category}
                  title={category}
                  pages={pages}
                  onSelectPage={(page) => {
                    if (selectedPage?.meta?.name === page.meta.name) {
                      setSelectedPage(null);
                      setTimeout(() => setSelectedPage(page), 0);
                    } else {
                      setSelectedPage(page);
                    }
                  }}
                  togglePage={togglePage}
                  selectedPages={selectedPages}
                  handleCategoryToggle={handleCategoryToggle}
                  isBundling={isBundling}
                />
              );
            })}
          </main>

          <InfoPanel
            selectedPage={selectedPage}
            selectedPages={selectedPages}
            handleDownload={handleDownload}
            handleGlobalToggle={handleGlobalToggle}
            areAllVisiblePagesSelected={areAllVisiblePagesSelected}
            isBundling={isBundling}
            statusMessage={statusMessage}
            uniqueDependencies={uniqueDependencies}
            progress={progress}
            setSelectedPage={setSelectedPage}
          />
        </>
      )}

      {showSuccessOverlay && (
        <DownloadSuccessOverlay
          onClose={() => {
            setShowSuccessOverlay(false);
            setSelectedPages([]);
          }}
          uniqueDependencies={uniqueDependencies}
          bundleFilename={bundleFilename}
        />
      )}
    </div>
  );
}

export default App;
