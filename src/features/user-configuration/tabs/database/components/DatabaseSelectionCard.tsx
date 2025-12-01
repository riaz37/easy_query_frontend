import React, { useMemo, useState } from "react";
import { DatabaseCard } from "./DatabaseCard";
import { DatabaseSelectionSkeleton } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DatabaseSelectionCardProps } from "../../../../types";

export const DatabaseSelectionCard = React.memo<DatabaseSelectionCardProps>(
  ({ databases, loading, onDatabaseChange, businessRules }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectingId, setSelectingId] = useState<number | null>(null);
    const itemsPerPage = 6;

    // Calculate pagination
    const totalPages = Math.ceil(databases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDatabases = databases.slice(startIndex, endIndex);

    const handleSelect = async (dbId: number) => {
      if (selectingId !== null) return; // prevent double clicks
      setSelectingId(dbId);
      try {
        await onDatabaseChange(dbId);
      } finally {
        setSelectingId(null);
      }
    };

    const databaseCards = useMemo(() => {
      return currentDatabases.map((db) => (
        <DatabaseCard
          key={db.db_id}
          database={db}
          onSelect={handleSelect}
          isSelecting={selectingId === db.db_id}
          disabled={Boolean(selectingId) && selectingId !== db.db_id}
        />
      ));
    }, [currentDatabases, selectingId]);

    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    const handlePrevious = () => {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    return (
      <div className="query-content-gradient rounded-[32px] p-4 lg:p-6">
        <div className="space-y-4">
          <div className="mb-4 lg:mb-6">
            <h2 className="modal-title-enhanced text-lg lg:text-xl">
              Database Selection
            </h2>
            <p className="text-gray-400 text-sm">
              Choose your current working database
            </p>
          </div>
          <div className="space-y-4">
            {loading ? (
              <DatabaseSelectionSkeleton
                cardCount={6}
                showHeader={false}
                showFooter={false}
                databaseCount={0}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {databaseCards}
                </div>

                {/* Pagination Controls - Matching UsersTableSection style */}
                <div className="users-pagination">
                  {/* Left: Database Count */}
                  <div className="users-pagination-info">
                    {databases.length} Database{databases.length !== 1 ? 's' : ''} Available
                  </div>

                  {/* Right side: Page Info and Controls */}
                  <div className="users-pagination-controls">
                    {/* Page Info and Controls */}
                    <div className="users-page-controls">
                      <span className="text-white text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="users-page-button"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handlePrevious}
                          disabled={currentPage === 1}
                          className="users-page-button"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={currentPage === totalPages}
                          className="users-page-button"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="users-page-button"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

DatabaseSelectionCard.displayName = "DatabaseSelectionCard";
