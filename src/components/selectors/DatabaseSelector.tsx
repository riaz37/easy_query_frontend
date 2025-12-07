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
import { adminService } from '@/lib/api/services/admin-service';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/loading';

interface MSSQLDatabase {
  db_id: number;
  db_name: string;
  db_url?: string;
  business_rule?: string;
}

interface DatabaseSelectorProps {
  selectedDatabaseId: number | null;
  onDatabaseSelect: (dbId: number, dbName: string) => void;
  className?: string;
}

export function DatabaseSelector({
  selectedDatabaseId,
  onDatabaseSelect,
  className = '',
}: DatabaseSelectorProps) {
  const [databases, setDatabases] = useState<MSSQLDatabase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllDatabases();
      if (response.success && response.data?.configs && Array.isArray(response.data.configs)) {
        setDatabases(response.data.configs);
      } else {
        setDatabases([]);
      }
    } catch (error) {
      console.error('Failed to fetch databases:', error);
      toast.error('Failed to load databases');
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedDatabase = databases.find(db => db.db_id === selectedDatabaseId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-tour="database-selector"
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
            {loading ? 'Loading...' : selectedDatabase ? selectedDatabase.db_name : 'Select Database'}
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
        <DropdownMenuLabel className="text-gray-400 text-xs uppercase tracking-wide">MSSQL Databases</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : databases.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            No databases available
          </div>
        ) : (
          databases.map((db) => (
            <DropdownMenuItem
              key={db.db_id}
              onClick={() => onDatabaseSelect(db.db_id, db.db_name)}
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 rounded-lg mx-1"
            >
              <div className="flex items-center justify-between w-full">
                <span className="truncate">{db.db_name}</span>
                {selectedDatabaseId === db.db_id && (
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
