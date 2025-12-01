"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Brain } from "lucide-react";
import { QueryResultsTable } from "@/components/database-query";
import { DynamicGraph } from "./DynamicGraph";

interface ReportSectionProps {
  section: any;
  index: number;
  expandedSections: Set<number>;
  toggleSection: (index: number) => void;
}

export function ReportSection({
  section,
  index,
  expandedSections,
  toggleSection,
}: ReportSectionProps) {
  const [showGraph, setShowGraph] = useState(true);
  const isExpanded = expandedSections.has(index);

  return (
    <div className="query-content-gradient px-4 sm:px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
      <div className="mb-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => toggleSection(index)}
            className="w-8 h-8 bg-gray-600/30 rounded-full flex items-center justify-center hover:bg-gray-500/40 transition-colors cursor-pointer flex-shrink-0"
          >
            <img src="/ai-results/plus.svg" alt="Plus" className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-lg sm:text-xl font-semibold">
              <span className="text-emerald-400">#{section.section_number}</span>
              <span className="text-white"> Response</span>
            </div>
            <div className="text-sm text-emerald-400 truncate">
              {section.section_name}...
            </div>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-300 mb-2 font-medium">Query:</div>
            <div className="text-white text-sm">{section.query}</div>
          </div>


          {/* Analysis Info */}
          {section.analysis && (
            <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-400/30">
              <div className="text-sm text-emerald-300 mb-2 font-medium">
                Analysis:
              </div>
              <div className="text-white text-sm">
                {typeof section.analysis === "string"
                  ? section.analysis
                  : JSON.stringify(section.analysis, null, 2)}
              </div>
            </div>
          )}

          {/* LLM Analysis */}
          {section.graph_and_analysis?.llm_analysis && (
            <div className="space-y-4">
              {/* Executive Summary */}
              <div className="ai-reports-analysis-card">
                <div className="ai-reports-analysis-title">
                  Executive Summary:
                </div>
                <div className="text-white text-sm leading-relaxed whitespace-pre-line">
                  {
                    section.graph_and_analysis?.llm_analysis?.analysis.split(
                      "\n\n"
                    )[0]
                  }
                </div>
              </div>

              {/* Key Insights */}
              {section.graph_and_analysis?.llm_analysis?.analysis.includes(
                "KEY INSIGHTS:"
              ) && (
                <div className="ai-reports-analysis-card">
                  <div className="ai-reports-analysis-title">
                    Key Insights:
                  </div>
                  <div className="text-white text-sm leading-relaxed">
                    {(() => {
                      const insightsMatch =
                        section.graph_and_analysis?.llm_analysis?.analysis.match(
                          /KEY INSIGHTS:(.*?)(?=TRENDS AND PATTERNS:|ANOMALIES:|BUSINESS IMPLICATIONS:|RECOMMENDATIONS:|$)/s
                        );
                      if (insightsMatch) {
                        return insightsMatch[1]
                          .trim()
                          .split("\n")
                          .map((insight, i) => (
                            <div
                              key={i}
                              className="mb-2"
                            >
                              <span>{insight.trim()}</span>
                            </div>
                          ));
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Trends and Patterns */}
              {section.graph_and_analysis?.llm_analysis?.analysis.includes(
                "TRENDS AND PATTERNS:"
              ) && (
                <div className="ai-reports-analysis-card">
                  <div className="ai-reports-analysis-title">
                    Trends and Patterns:
                  </div>
                  <div className="text-white text-sm leading-relaxed">
                    {(() => {
                      const trendsMatch =
                        section.graph_and_analysis?.llm_analysis?.analysis.match(
                          /TRENDS AND PATTERNS:(.*?)(?=ANOMALIES:|BUSINESS IMPLICATIONS:|RECOMMENDATIONS:|$)/s
                        );
                      if (trendsMatch) {
                        return trendsMatch[1]
                          .trim()
                          .split("\n")
                          .map((trend, i) => (
                            <div
                              key={i}
                              className="mb-2"
                            >
                              <span>{trend.trim()}</span>
                            </div>
                          ));
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Anomalies */}
              {section.graph_and_analysis?.llm_analysis?.analysis.includes(
                "ANOMALIES:"
              ) && (
                <div className="ai-reports-analysis-card">
                  <div className="ai-reports-analysis-title">
                    Anomalies:
                  </div>
                  <div className="text-white text-sm leading-relaxed">
                    {(() => {
                      const anomaliesMatch =
                        section.graph_and_analysis?.llm_analysis?.analysis.match(
                          /ANOMALIES:(.*?)(?=BUSINESS IMPLICATIONS:|RECOMMENDATIONS:|$)/s
                        );
                      if (anomaliesMatch) {
                        return anomaliesMatch[1]
                          .trim()
                          .split("\n")
                          .map((anomaly, i) => (
                            <div
                              key={i}
                              className="mb-2"
                            >
                              <span>{anomaly.trim()}</span>
                            </div>
                          ));
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Business Implications */}
              {section.graph_and_analysis?.llm_analysis?.analysis.includes(
                "BUSINESS IMPLICATIONS:"
              ) && (
                <div className="ai-reports-analysis-card">
                  <div className="ai-reports-analysis-title">
                    Business Implications:
                  </div>
                  <div className="text-white text-sm leading-relaxed">
                    {(() => {
                      const implicationsMatch =
                        section.graph_and_analysis?.llm_analysis?.analysis.match(
                          /BUSINESS IMPLICATIONS:(.*?)(?=RECOMMENDATIONS:|$)/s
                        );
                      if (implicationsMatch) {
                        return implicationsMatch[1]
                          .trim()
                          .split("\n")
                          .map((implication, i) => (
                            <div
                              key={i}
                              className="mb-2"
                            >
                              <span>{implication.trim()}</span>
                            </div>
                          ));
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {section.graph_and_analysis?.llm_analysis?.analysis.includes(
                "RECOMMENDATIONS:"
              ) && (
                <div className="ai-reports-analysis-card">
                  <div className="ai-reports-analysis-title">
                    Recommendations:
                  </div>
                  <div className="text-white text-sm leading-relaxed">
                    {(() => {
                      const recommendationsMatch =
                        section.graph_and_analysis?.llm_analysis?.analysis.match(
                          /RECOMMENDATIONS:(.*?)$/s
                        );
                      if (recommendationsMatch) {
                        return recommendationsMatch[1]
                          .trim()
                          .split("\n")
                          .map((recommendation, i) => (
                            <div
                              key={i}
                              className="mb-2"
                            >
                              <span>{recommendation.trim()}</span>
                            </div>
                          ));
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Visualization */}
          {section.graph_and_analysis && section.table && section.table.data && (
            <div className="mb-6">
              <h3 className="modal-title-enhanced text-lg font-semibold mb-4">
                Data Visualization
              </h3>
              <DynamicGraph
                graphData={section.graph_and_analysis}
                tableData={section.table.data}
                columns={section.table.columns}
              />
            </div>
          )}

          {/* Data Table - Matching Database Query Results */}
          {section.table &&
            section.table.data &&
            section.table.data.length > 0 && (
              <div>
                <h3 className="modal-title-enhanced text-lg font-semibold mb-4">
                  Data Table
                </h3>
                <QueryResultsTable
                  data={section.table.data}
                  columns={section.table.columns}
                />
              </div>
            )}
        </div>
      )}
    </div>
  );
}