"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { Spinner } from "@/components/ui/loading";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { QueryResultsTable } from "@/components/database-query/QueryResultsTable";
import { QueryCharts } from "@/components/database-query/QueryCharts";

export default function ReportGenerationResultsPage() {
  const [currentQuery, setCurrentQuery] = useState<any>(null);
  const router = useRouter();

  // Load report result from sessionStorage on component mount
  useEffect(() => {
    const storedResult = sessionStorage.getItem("reportGenerationResult");
    if (storedResult) {
      try {
        const queryData = JSON.parse(storedResult);
        setCurrentQuery(queryData);
      } catch (error) {
        console.error("Error parsing report result:", error);
        toast.error("Failed to load report results");
      }
    } else {
      router.push("/report-generation");
    }
  }, [router]);

  if (!currentQuery) {
    return (
      <PageLayout background="default" maxWidth="6xl">
        <div className="text-center">
          <Spinner
            size="lg"
            variant="accent-emerald"
            className="mx-auto mb-4"
          />
          <p className="text-gray-400 text-lg">Loading report...</p>
        </div>
      </PageLayout>
    );
  }

  // Mock annual report data with tables and charts
  const quarterlyRevenueData = [
    { quarter: "Q1 2024", revenue: 2800000, growth: 12, expenses: 1800000 },
    { quarter: "Q2 2024", revenue: 3100000, growth: 18, expenses: 1950000 },
    { quarter: "Q3 2024", revenue: 3300000, growth: 22, expenses: 2100000 },
    { quarter: "Q4 2024", revenue: 3300000, growth: 25, expenses: 2150000 },
  ];

  const monthlyPerformanceData = [
    { month: "Jan", revenue: 850000, users: 12500 },
    { month: "Feb", revenue: 920000, users: 13200 },
    { month: "Mar", revenue: 1030000, users: 14100 },
    { month: "Apr", revenue: 1100000, users: 15200 },
    { month: "May", revenue: 1150000, users: 16300 },
    { month: "Jun", revenue: 1050000, users: 15800 },
    { month: "Jul", revenue: 1120000, users: 16800 },
    { month: "Aug", revenue: 1180000, users: 17500 },
    { month: "Sep", revenue: 1000000, users: 16200 },
    { month: "Oct", revenue: 1080000, users: 17100 },
    { month: "Nov", revenue: 1110000, users: 17800 },
    { month: "Dec", revenue: 1110000, users: 18000 },
  ];

  const productPerformanceData = [
    { product: "Product A", sales: 4500000, market_share: 35, growth: 28 },
    { product: "Product B", sales: 3200000, market_share: 25, growth: 22 },
    { product: "Product C", sales: 2800000, market_share: 22, growth: 18 },
    { product: "Product D", sales: 2000000, market_share: 18, growth: 15 },
  ];

  const customerSegmentsData = [
    { segment: "Enterprise", customers: 1250, revenue: 6500000, percentage: 52 },
    { segment: "SMB", customers: 3200, revenue: 3800000, percentage: 30 },
    { segment: "Startup", customers: 4500, revenue: 2200000, percentage: 18 },
  ];

  const regionalData = [
    { region: "North America", revenue: 5200000, growth: 32, customers: 18500 },
    { region: "Europe", revenue: 3800000, growth: 28, customers: 14200 },
    { region: "Asia Pacific", revenue: 2500000, growth: 35, customers: 9800 },
    { region: "Other", revenue: 1000000, growth: 20, customers: 2730 },
  ];

  const reportData = {
    title: "Annual Performance Report 2024",
    period: "January 2024 - December 2024",
    generatedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    executiveSummary: {
      overview: "This comprehensive annual report provides a detailed analysis of our performance metrics, key achievements, and strategic insights for the fiscal year 2024. The data demonstrates significant growth across multiple dimensions.",
      keyHighlights: [
        "Total revenue increased by 34% compared to the previous year",
        "Customer base expanded by 28% with improved retention rates",
        "Operational efficiency improved by 22% through process optimization",
        "Market share increased by 15% in key segments"
      ]
    },
    keyMetrics: [
      { label: "Total Revenue", value: "$12.5M", change: "+34%", trend: "up", icon: DollarSign },
      { label: "Active Users", value: "45,230", change: "+28%", trend: "up", icon: Users },
      { label: "Growth Rate", value: "22%", change: "+5%", trend: "up", icon: TrendingUp },
      { label: "Completion Rate", value: "94%", change: "+8%", trend: "up", icon: CheckCircle },
    ],
  };

  const handleDownload = () => {
    toast.success("Report download initiated");
    // In a real implementation, this would generate and download a PDF
  };

  const handleBack = () => {
    router.push("/report-generation");
  };


  return (
    <PageLayout background={[]} maxWidth="6xl">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-white hover:text-green-400 hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Report Generation
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Report Container */}
        <div
          className="rounded-2xl p-8 md:p-12 space-y-8"
          style={{
            background: `linear-gradient(0deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03)),
linear-gradient(230.27deg, rgba(19, 245, 132, 0) 71.59%, rgba(19, 245, 132, 0.2) 98.91%),
linear-gradient(67.9deg, rgba(19, 245, 132, 0) 66.65%, rgba(19, 245, 132, 0.2) 100%)`,
            backdropFilter: "blur(30px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Report Header */}
          <div className="border-b border-white/10 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-emerald-500/20">
                <BarChart3 className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {reportData.title}
                </h1>
                <div className="flex items-center gap-4 text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{reportData.period}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Generated: {reportData.generatedDate}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-lg mt-4">
              Report Request: <span className="text-white font-medium">{currentQuery.query}</span>
            </p>
          </div>

          {/* Executive Summary */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-400 rounded-full"></div>
              Executive Summary
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              {reportData.executiveSummary.overview}
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {reportData.executiveSummary.keyHighlights.map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">{highlight}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Key Metrics */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-400 rounded-full"></div>
              Key Performance Indicators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportData.keyMetrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <IconComponent className="h-6 w-6 text-emerald-400" />
                      <Badge
                        variant="outline"
                        className={`border-0 ${
                          metric.trend === "up"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {metric.change}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Financial Performance Section with Charts */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-400 rounded-full"></div>
              Financial Performance
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              Our financial performance this year has been exceptional, with total revenue reaching $12.5 million, representing a 34% increase from the previous year. This growth was driven by strong performance across all product lines and successful expansion into new markets.
            </p>

            {/* Quarterly Revenue Table */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quarterly Financial Data</h3>
              <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <QueryResultsTable 
                  data={quarterlyRevenueData} 
                  columns={["quarter", "revenue", "growth", "expenses"]} 
                />
              </div>
            </div>
          </section>

          {/* Product Performance Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-400 rounded-full"></div>
              Product Performance
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              Product performance metrics show strong growth across all product lines, with Product A leading in sales volume and market share.
            </p>

            {/* Product Performance Table */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-4">Product Performance Details</h3>
              <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <QueryResultsTable 
                  data={productPerformanceData} 
                  columns={["product", "sales", "market_share", "growth"]} 
                />
              </div>
            </div>
          </section>

          {/* Customer Engagement Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-400 rounded-full"></div>
              Customer Engagement
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              Customer engagement metrics show significant improvement, with our active user base growing to 45,230 users, a 28% increase year-over-year. Customer satisfaction scores reached an all-time high of 4.7 out of 5.0.
            </p>

            {/* Customer Segments Table */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-4">Customer Segment Details</h3>
              <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <QueryResultsTable 
                  data={customerSegmentsData} 
                  columns={["segment", "customers", "revenue", "percentage"]} 
                />
              </div>
            </div>
          </section>

          {/* Regional Performance Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-400 rounded-full"></div>
              Regional Performance
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              Regional expansion efforts have yielded strong results across all markets, with Asia Pacific showing the highest growth rate at 35%.
            </p>

            {/* Regional Performance Table */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-4">Regional Performance Details</h3>
              <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <QueryResultsTable 
                  data={regionalData} 
                  columns={["region", "revenue", "growth", "customers"]} 
                />
              </div>
            </div>
          </section>

          {/* Data Visualization & Comparisons */}
          <section className="space-y-6 pt-6 border-t border-white/10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-400 rounded-full"></div>
              Data Visualization & Comparative Analysis
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              The following visualizations provide comprehensive comparisons across different parameters, enabling deeper insights into performance trends and relationships.
            </p>

            {/* Quarterly Revenue vs Growth Comparison */}
            <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Quarterly Revenue vs Growth Rate Comparison</h3>
              <QueryCharts 
                data={quarterlyRevenueData.map(q => ({
                  name: q.quarter,
                  revenue: q.revenue,
                  growth: q.growth,
                }))} 
                columns={["name", "revenue", "growth"]} 
              />
            </div>

            {/* Monthly Revenue vs Users Comparison */}
            <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Monthly Revenue vs Active Users Trend</h3>
              <QueryCharts 
                data={monthlyPerformanceData.map(m => ({
                  name: m.month,
                  revenue: m.revenue,
                  users: m.users,
                }))} 
                columns={["name", "revenue", "users"]} 
              />
            </div>

            {/* Product Sales vs Market Share Comparison */}
            <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Product Sales vs Market Share Distribution</h3>
              <QueryCharts 
                data={productPerformanceData.map(p => ({
                  name: p.product,
                  sales: p.sales,
                  market_share: p.market_share,
                  growth: p.growth,
                }))} 
                columns={["name", "sales", "market_share", "growth"]} 
              />
            </div>

            {/* Customer Segments Revenue vs Customers Comparison */}
            <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Customer Segments: Revenue vs Customer Count</h3>
              <QueryCharts 
                data={customerSegmentsData.map(s => ({
                  name: s.segment,
                  customers: s.customers,
                  revenue: s.revenue,
                  percentage: s.percentage,
                }))} 
                columns={["name", "customers", "revenue", "percentage"]} 
              />
            </div>

            {/* Regional Performance: Revenue vs Growth vs Customers */}
            <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Regional Performance: Revenue, Growth & Customer Base</h3>
              <QueryCharts 
                data={regionalData.map(r => ({
                  name: r.region,
                  revenue: r.revenue,
                  growth: r.growth,
                  customers: r.customers,
                }))} 
                columns={["name", "revenue", "growth", "customers"]} 
              />
            </div>

            {/* Quarterly Revenue vs Expenses Comparison */}
            <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Quarterly Revenue vs Expenses Analysis</h3>
              <QueryCharts 
                data={quarterlyRevenueData.map(q => ({
                  name: q.quarter,
                  revenue: q.revenue,
                  expenses: q.expenses,
                }))} 
                columns={["name", "revenue", "expenses"]} 
              />
            </div>
          </section>

          {/* Conclusion */}
          <section className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-400 rounded-full"></div>
              Conclusion
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              The year 2024 has been marked by exceptional growth and achievement across all key performance indicators. Our strategic focus on customer satisfaction, operational efficiency, and innovation has positioned us strongly for continued success in the future. The comprehensive data presented in this report demonstrates our commitment to transparency and data-driven decision making.
            </p>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-white/10 text-center text-gray-400 text-sm">
            <p>This report was generated using AI-powered analysis</p>
            <p className="mt-2">© 2024 EasyQuery. All rights reserved.</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
