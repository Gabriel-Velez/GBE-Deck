function CategoryCard({
  title,
  pages,
  onSelectPage,
  togglePage,
  selectedPages,
  handleCategoryToggle,
  isBundling,
}) {
  const visiblePageNames = pages.map((p) => p.meta.name);
  const allSelected = visiblePageNames.every((name) => selectedPages.includes(name));

  return (
    <div className='category-card'>
      <div className='card-header'>
        <strong>{title}</strong>
        <button onClick={() => handleCategoryToggle(title, pages)} disabled={isBundling}>
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>

      {pages.map((page) => {
        const isChecked = selectedPages.includes(page.meta.name);

        return (
          <div key={page.file} className='card-item' onClick={() => onSelectPage(page)}>
            {/* ✅ Checkbox area */}
            <label className='card-checkbox-area' onClick={(e) => e.stopPropagation()}>
              <input
                type='checkbox'
                checked={isChecked}
                onChange={() => togglePage(page.meta.name)}
                disabled={isBundling}
              />
            </label>

            {/* ✅ Title area: clicking sets InfoPanel ONLY */}
            <div className='card-title-area'>{page.meta.name}</div>

            <span className='version-pill'>v{page.meta.version}</span>
          </div>
        );
      })}
    </div>
  );
}

export default CategoryCard;
