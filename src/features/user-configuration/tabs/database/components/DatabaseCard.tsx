import React from 'react';
import { Circle } from 'lucide-react';
import type { DatabaseCardProps } from '../../../../types';

export const DatabaseCard = React.memo<DatabaseCardProps>(({ 
  database,
  onSelect,
  isSelecting = false,
  disabled = false,
}) => {
  const handleClick = () => {
    if (disabled) return;
    onSelect(database.db_id);
  };

  return (
    <div
      className={`relative cursor-pointer transition-all hover:scale-105 rounded-[32px] p-4 query-content-gradient h-[184px] ${
        database.is_current
          ? 'border-2 border-emerald-500'
          : 'border-2 border-transparent'
      } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={handleClick}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-lg">
            {database.db_name}
          </h3>
          <div className={`aspect-square h-4 w-4 rounded-full border flex items-center justify-center ${
            database.is_current
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 bg-transparent'
          }`}>
            {database.is_current && (
              <Circle className="h-2.5 w-2.5 fill-current text-black" />
            )}
          </div>
        </div>
        <div className="text-sm space-y-1">
          <div><span className="text-gray-400">Type</span> <span className="text-white">{database.db_type}</span></div>
          <div className="truncate"><span className="text-gray-400">URL</span> <span className="text-white">{database.db_url}</span></div>
        </div>
      </div>
      {isSelecting && (
        <div className="absolute inset-0 rounded-[32px] flex items-center justify-center bg-black/40">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-transparent" />
        </div>
      )}
    </div>
  );
});

DatabaseCard.displayName = 'DatabaseCard';
