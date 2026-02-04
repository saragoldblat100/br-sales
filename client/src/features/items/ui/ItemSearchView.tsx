import type { ElementType, ReactNode } from 'react';
import { Search, Package, ArrowRight, RefreshCw, LogOut, ShoppingCart, X } from 'lucide-react';
import type { SalesItem } from '@bravo/shared';
import { ItemCardView } from './ItemCardView';

export interface SearchModeOption {
  id: 'special' | 'code' | 'category' | 'recent' | 'images';
  label: string;
  icon: ElementType;
  count?: number;
}

interface CategoryOption {
  _id: string;
  name: string;
  nameHe?: string;
}

interface ItemSearchViewProps {
  customerName: string;
  onBackToMenu: () => void;
  onChangeCustomer: () => void;
  onLogout: () => void;
  searchMode: SearchModeOption['id'];
  searchModes: SearchModeOption[];
  onSelectMode: (mode: SearchModeOption['id']) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  showSearchInput: boolean;
  categories: CategoryOption[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  displayedItems: SalesItem[];
  isLoading: boolean;
  emptyStateMessage: string;
  onSelectItem: (item: SalesItem) => void;
  itemDetailModal?: ReactNode;
  cartItemsCount: number;
  cart: ReactNode;
  showCartModal: boolean;
  onOpenCart: () => void;
  onCloseCart: () => void;
}

export function ItemSearchView({
  customerName,
  onBackToMenu,
  onChangeCustomer,
  onLogout,
  searchMode,
  searchModes,
  onSelectMode,
  searchQuery,
  onSearchQueryChange,
  showSearchInput,
  categories,
  selectedCategoryId,
  onSelectCategory,
  displayedItems,
  isLoading,
  emptyStateMessage,
  onSelectItem,
  itemDetailModal,
  cartItemsCount,
  cart,
  showCartModal,
  onOpenCart,
  onCloseCart,
}: ItemSearchViewProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="   p-6 relative">
        {/* כפתור התנתקות - שמאל */}
        <button
          onClick={onLogout}
          className="absolute top-4 left-4 w-14 h-14 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center shadow-lg transition-all"
          aria-label="התנתק"
        >
          <LogOut className="w-7 h-7 text-white" />
        </button>

        {/* כפתור חזרה לתפריט - ימין */}
        <button
          onClick={onBackToMenu}
          className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl text-gray-700 transition-all shadow-lg"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="font-medium">חזרה לתפריט</span>
        </button>

        {/* לוגו באמצע */}
        <div className="text-center pt-4">
          <img src="/logoBravo.svg" alt="Bravo" className="h-16 mx-auto mb-2" />
  
        </div>

        {/* שם לקוח + עגלה */}
        <div className="flex items-center justify-center gap-3 mt-4">
          {cartItemsCount > 0 && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              <ShoppingCart className="w-6 h-6 text-white " />
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            </button>
          )}
          <button
            onClick={onChangeCustomer}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800">לקוח : {customerName}</span>
          </button>

          {/* אייקון עגלה */}
          
        </div>
      </div>

      {/* מודאל סל קניות */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <button
                onClick={onCloseCart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-gray-800">סל קניות</h2>
              <div className="w-10" />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {cart}
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          {searchModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                searchMode === mode.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <mode.icon
                className={`w-4 h-4 ${mode.id === 'special' ? 'text-yellow-400' : ''}`}
              />
              <span>{mode.label}</span>
              {mode.count !== undefined && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {mode.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {showSearchInput && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="חפש לפי קוד פריט או שם..."
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              autoFocus
            />
          </div>
        </div>
      )}

      {searchMode === 'category' && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <select
            value={selectedCategoryId || ''}
            onChange={(event) => onSelectCategory(event.target.value || null)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
          >
            <option value="">בחר קטגוריה...</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.nameHe || category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4 min-h-[300px]">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Package className="w-16 h-16 mb-4" />
            <p>{emptyStateMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedItems.map((item) => (
              <ItemCardView
                key={item._id}
                item={item}
                onClick={() => onSelectItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {itemDetailModal}
    </div>
  );
}
