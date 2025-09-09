"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PurchaseForm } from "./purchase-form";

interface PurchaseItem {
  id: string;
  inventoryItemId: string;
  inventoryItem?: {
    name: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
}

interface Purchase {
  id: string;
  vendorName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: PurchaseItem[];
}

export function PurchasesTable() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("common");

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await fetch("/api/purchases");
      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      } else {
        console.error("Failed to fetch purchases");
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "PENDING":
        return "secondary";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Purchases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">{t("loadingPurchases")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Purchases
          </div>
          <PurchaseForm mode="add" onSuccess={fetchPurchases} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No purchases found</h3>
            <p className="text-muted-foreground">
              Get started by creating your first purchase.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase ID</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-mono text-sm">
                    {purchase.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium">
                    {purchase.vendorName}
                  </TableCell>
                  <TableCell>${purchase.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(purchase.status)}>
                      {purchase.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{purchase.items?.length || 0} items</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
