import React from 'react';
import { useThemeStore } from '@/store/themeStore';
import { getCategoryPageClasses } from '@/styles/containers/categoryPageStyles';
import { Link } from 'react-router-dom';
import { categoriesData } from '@/data/categories';

const CategoriesPage = () => {
  const theme = useThemeStore((state) => state.theme);

  const {
    backgroundClasses, // This will be used for the full page background
    pageHeadingClasses, // Use specific heading classes for the page
    categoryCardClasses,
    categoryImageClasses,
    categoryNameClasses,
    pageContainerClasses, // New
    gridContainerClasses, // New
    categoryLinkBlockClasses, // New
  } = getCategoryPageClasses(theme);

  return (
    <div className={`${backgroundClasses} ${pageContainerClasses}`}> {/* Moved responsive padding to pageContainerClasses */}
      <h1 className={pageHeadingClasses}>All Auction Categories</h1>
      <div className={gridContainerClasses}> {/* Moved grid classes */}
        {categoriesData.map(({ id, name, icon: Icon }) => (
          <Link to={`/category/${id}`} key={id} className={categoryLinkBlockClasses}>
            <div className={categoryCardClasses}>
              <div className={categoryImageClasses}>
                <Icon aria-label={name} />
              </div>
              <h2 className={categoryNameClasses}>{name}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;