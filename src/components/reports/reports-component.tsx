"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ReportData {
  totalInventoryItems: number;
  totalSales: number;
  totalPurchases: number;
  totalRevenue: number;
  lowStockItems: number;
  recentTransactions: {
    type: "sale" | "purchase";
    amount: number;
    date: string;
    description: string;
  }[];
}

export function ReportsComponent() {
  const [reportData, setReportData] = useState<ReportData>({
    totalInventoryItems: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const t = useTranslations("common");
  const tReports = useTranslations("reports");

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch inventory data
      const inventoryResponse = await fetch("/api/inventory");
      const inventory = inventoryResponse.ok
        ? await inventoryResponse.json()
        : [];

      // Fetch sales data
      const salesResponse = await fetch("/api/sales");
      const sales = salesResponse.ok ? await salesResponse.json() : [];

      // Fetch purchases data
      const purchasesResponse = await fetch("/api/purchases");
      const purchases = purchasesResponse.ok
        ? await purchasesResponse.json()
        : [];

      // Calculate metrics
      const totalRevenue = sales.reduce(
        (sum: number, sale: { totalAmount: number }) => sum + sale.totalAmount,
        0
      );
      const lowStockItems = inventory.filter(
        (item: { quantity: number }) => item.quantity < 10
      ).length;

      // Create recent transactions
      const recentTransactions = [
        ...sales
          .slice(0, 3)
          .map(
            (sale: {
              totalAmount: number;
              createdAt: string;
              customerName: string;
            }) => ({
              type: "sale" as const,
              amount: sale.totalAmount,
              date: sale.createdAt,
              description: `Sale to ${sale.customerName}`,
            })
          ),
        ...purchases
          .slice(0, 3)
          .map(
            (purchase: {
              totalAmount: number;
              createdAt: string;
              vendorName: string;
            }) => ({
              type: "purchase" as const,
              amount: purchase.totalAmount,
              date: purchase.createdAt,
              description: `Purchase from ${purchase.vendorName}`,
            })
          ),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setReportData({
        totalInventoryItems: inventory.length,
        totalSales: sales.length,
        totalPurchases: purchases.length,
        totalRevenue,
        lowStockItems,
        recentTransactions,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            {tReports("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">{t("loadingReports")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            {tReports("title")}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.totalInventoryItems}
            </div>
            <p className="text-xs text-muted-foreground">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Completed transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reportData.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From sales transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Alert
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items below 10 units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No transactions found</h3>
              <p className="text-muted-foreground">
                Start by creating sales or purchases to see activity here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportData.recentTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Badge
                      variant={
                        transaction.type === "sale" ? "default" : "secondary"
                      }
                    >
                      {transaction.type === "sale" ? "Sale" : "Purchase"}
                    </Badge>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold">
                    ${transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
