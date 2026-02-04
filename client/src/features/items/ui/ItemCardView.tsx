import { Package, Star } from 'lucide-react';
import type { SalesItem } from '@bravo/shared';

interface ItemCardViewProps {
  item: SalesItem;
  onClick: () => void;
}

export function ItemCardView({ item, onClick }: ItemCardViewProps) {
  return (
    <button
      onClick={onClick}
      className="relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 text-right w-full"
    >
      {item.hasSpecialPrice && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full">
          <Star className="w-3 h-3" />
          <span>מחיר מיוחד</span>
        </div>
      )}

      <div className="w-full h-32  rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.nameHe || item.englishDescription || item.itemCode}
            className="w-full h-full object-contain"
            onError={(event) => {
              const target = event.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextElementSibling) {
                (target.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className={`flex items-center justify-center ${item.imageUrl ? 'hidden' : ''}`}
          style={{ display: item.imageUrl ? 'none' : 'flex' }}
        >
          <Package className="w-12 h-12 text-gray-400" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-gray-900 line-clamp-2">
          {item.nameHe || item.englishDescription}
        </p>
        <p className="text-sm text-gray-500">{item.itemCode}</p>
        {item.qtyPerCarton && (
          <p className="text-xs text-gray-400">{item.qtyPerCarton} יח' בארגז</p>
        )}
      </div>
    </button>
  );
}
