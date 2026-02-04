import { Search, Plus, User, X, Loader2, AlertCircle } from 'lucide-react';
import type { CustomerListItem, CustomerWithSpecialPrices } from '@bravo/shared';

interface CustomerSearchViewProps {
  query: string;
  onQueryChange: (value: string) => void;
  isSearching: boolean;
  isLoadingDetails: boolean;
  shouldShowResults: boolean;
  searchResults: CustomerListItem[];
  selectedCustomerCode: string | null;
  onSelectCustomer: (customer: CustomerListItem) => void;
  selectedCustomer?: CustomerWithSpecialPrices | null;
  onChangeCustomer: () => void;
  showCreateForm: boolean;
  onShowCreateForm: () => void;
  newCustomerName: string;
  onNewCustomerNameChange: (value: string) => void;
  onCreateCustomer: () => void;
  onCancelCreate: () => void;
  isCreating: boolean;
  createError?: string;
}

export function CustomerSearchView({
  query,
  onQueryChange,
  isSearching,
  isLoadingDetails,
  shouldShowResults,
  searchResults,
  selectedCustomerCode,
  onSelectCustomer,
  selectedCustomer,
  onChangeCustomer,
  showCreateForm,
  onShowCreateForm,
  newCustomerName,
  onNewCustomerNameChange,
  onCreateCustomer,
  onCancelCreate,
  isCreating,
  createError,
}: CustomerSearchViewProps) {
  if (selectedCustomer?.customer?.customerCode) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">
                {selectedCustomer.customer.customerName}
              </h3>
              <p className="text-sm text-gray-500">
                קוד: {selectedCustomer.customer.customerCode}
              </p>
              {selectedCustomer.itemsWithSpecialPrices.length > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  {selectedCustomer.itemsWithSpecialPrices.length} פריטים עם מחיר מיוחד
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onChangeCustomer}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            החלף לקוח
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 text-center">בחר לקוח</h2>

      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          {isSearching || isLoadingDetails ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="חפש לפי שם לקוח..."
          className="w-full pr-12 pl-4 py-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-lg"
          autoFocus
        />
      </div>

      {shouldShowResults && (
        <div className="border-2 border-gray-200 rounded-xl max-h-60 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>לא נמצאו לקוחות</p>
              <button
                onClick={onShowCreateForm}
                className="text-red-600 hover:text-red-700 font-medium mt-2"
              >
                צור לקוח חדש
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {searchResults.map((customer) => (
                <li key={customer.customerCode}>
                  <button
                    onClick={() => onSelectCustomer(customer)}
                    disabled={isLoadingDetails}
                    className="w-full px-4 py-3 text-right hover:bg-blue-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{customer.customerName}</p>
                      <p className="text-sm text-gray-500">קוד: {customer.customerCode}</p>
                    </div>
                    {selectedCustomerCode === customer.customerCode && (
                      <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!showCreateForm && (
        <button
          onClick={onShowCreateForm}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:text-red-600 hover:border-red-300 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          צור לקוח חדש
        </button>
      )}

      {showCreateForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onCreateCustomer();
          }}
          className="border-t pt-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם הלקוח החדש
            </label>
            <input
              type="text"
              value={newCustomerName}
              onChange={(event) => onNewCustomerNameChange(event.target.value)}
              placeholder="הזן שם לקוח..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              autoFocus
            />
          </div>

          {createError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{createError}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!newCustomerName.trim() || isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  יוצר...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  צור לקוח
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancelCreate}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ביטול
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
