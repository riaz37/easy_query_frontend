import React, { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { vectorDBService, VectorDBConfig } from '@/lib/api/services/vector-db-service';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/loading';

interface VectorDBSelectorProps {
  selectedConfigId: number | null;
  onConfigSelect: (configId: number, configName: string) => void;
  className?: string;
}

export function VectorDBSelector({
  selectedConfigId,
  onConfigSelect,
  className = '',
}: VectorDBSelectorProps) {
  const [configs, setConfigs] = useState<VectorDBConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await vectorDBService.getVectorDBConfigs();
      if (response.success && response.data && Array.isArray(response.data)) {
        setConfigs(response.data);
      } else {
        setConfigs([]);
      }
    } catch (error) {
      console.error('Failed to fetch vector configs:', error);
      toast.error('Failed to load vector database configs');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = configs.find(config => config.db_id === selectedConfigId);
  const selectedConfigName = selectedConfig?.db_config?.DB_NAME || null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center justify-between px-3 py-1.5 rounded-[99px] transition-all ${className}`}
          style={{
            background: 'var(--components-button-Fill, rgba(255, 255, 255, 0.12))',
            border: '1px solid var(--primary-16, rgba(19, 245, 132, 0.16))',
            color: 'white',
            height: '36px',
            fontSize: '12px',
          }}
        >
          <span className="truncate text-xs">
            {loading ? 'Loading...' : selectedConfigName ? selectedConfigName : 'Select Config'}
          </span>
          <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[300px] border-white/10 text-white"
        style={{
          background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03)), linear-gradient(246.02deg, rgba(19, 245, 132, 0) 91.9%, rgba(19, 245, 132, 0.2) 114.38%)',
          backdropFilter: 'blur(30px)',
          borderRadius: '16px',
        }}
      >
        <DropdownMenuLabel className="text-gray-400 text-xs uppercase tracking-wide">Vector DB Configurations</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : configs.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            No vector DB configs available
          </div>
        ) : (
          configs.map((config) => (
            <DropdownMenuItem
              key={config.db_id}
              onClick={() => onConfigSelect(config.db_id, config.db_config?.DB_NAME || `Config #${config.db_id}`)}
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 rounded-lg mx-1"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="truncate">{config.db_config?.DB_NAME || `Config #${config.db_id}`}</span>
                  {config.db_config?.DB_HOST && (
                    <span className="text-xs text-gray-500 truncate">{config.db_config.DB_HOST}</span>
                  )}
                </div>
                {selectedConfigId === config.db_id && (
                  <Check className="w-4 h-4 text-emerald-400 ml-2" />
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
