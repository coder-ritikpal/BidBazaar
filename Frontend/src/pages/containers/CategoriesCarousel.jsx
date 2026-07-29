import React from 'react';
import { useThemeStore } from '@/store/themeStore';
import { getCategoryPageClasses } from '@/styles/containers/categoryPageStyles';
import { categoriesData } from '@/data/categories';
import { Globe } from 'lucide-react';

const CategoriesCarousel = ({ selectedCategory, setSelectedCategory }) => { // Component ka naam CategoriesCarousel kar diya gaya hai
  const theme = useThemeStore((state) => state.theme);
  const allCategories = [
    { id: 'all-categories', name: 'All', icon: Globe },
    ...categoriesData
  ]; // Ab saari categories dikhengi scroll mein

  const {
    // backgroundClasses is not used here as Home.jsx handles the overall background
    carouselHeadingClasses, // Use specific heading classes for the carousel
    categoryCardClasses,
    categoryImageClasses,
    categoryNameClasses,
    carouselContainerClasses, // New
    carouselHeaderClasses, // New
    carouselScrollContainerClasses, // New
    carouselItemLinkClasses, // New
    scrollbarHideClass, // New: moved from local constant
  } = getCategoryPageClasses(theme);


  return (
    <div className={carouselContainerClasses}> {/* Moved padding and transition */}
      <div className={`${carouselScrollContainerClasses} ${scrollbarHideClass}`}>
        {allCategories.map(({ id, name, icon: Icon }) => {
          const isSelected = selectedCategory === name;
          const activeCardClasses = isSelected
            ? (theme === 'dark' ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-purple-600 ring-2 ring-purple-500')
            : '';
          const activeTextClasses = isSelected ? 'text-white' : '';

          return (
            <button key={id} className={carouselItemLinkClasses} onClick={() => setSelectedCategory(name)} aria-pressed={isSelected}>
              <div className={`${categoryCardClasses} ${activeCardClasses}`}>
                <div className={categoryImageClasses}>
                  <Icon aria-label={name} className={activeTextClasses} />
                </div>
                <h2 className={`${categoryNameClasses} ${activeTextClasses}`}>{name}</h2>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesCarousel; // Export renamed component