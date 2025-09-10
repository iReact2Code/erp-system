"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Save, X, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface SaleItem {
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Sale {
  id?: string;
  total: number;
  status: string;
  items?: SaleItem[];
}

interface SaleFormProps {
  sale?: Sale;
  mode: "add" | "edit";
  onSuccess: () => void;
}

export function SaleForm({ sale, mode, onSuccess }: SaleFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [formData, setFormData] = useState<Sale>({
    total: sale?.total || 0,
    status: sale?.status || "PENDING",
    items: sale?.items || [],
  });

  const t = useTranslations("common");
  const tSales = useTranslations("sales");

  useEffect(() => {
    if (open) {
      fetchInventoryItems();
    }
  }, [open]);

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(
          data.filter((item: InventoryItem) => item.quantity > 0)
        );
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  };

  const addSaleItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          inventoryItemId: "",
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
    }));
  };

  const removeSaleItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  const updateSaleItem = (
    index: number,
    field: keyof SaleItem,
    value: string | number
  ) => {
    setFormData((prev) => {
      const updatedItems = [...(prev.items || [])];
      const item = { ...updatedItems[index] };

      if (field === "inventoryItemId" && typeof value === "string") {
        const selectedItem = inventoryItems.find((inv) => inv.id === value);
        if (selectedItem) {
          item.inventoryItem = selectedItem;
          item.inventoryItemId = value;
          item.unitPrice = selectedItem.unitPrice;
          item.total = item.quantity * selectedItem.unitPrice;
        }
      } else if (field === "quantity" && typeof value === "number") {
        item.quantity = value;
        item.total = value * item.unitPrice;
      } else if (field === "unitPrice" && typeof value === "number") {
        item.unitPrice = value;
        item.total = item.quantity * value;
      }

      updatedItems[index] = item;

      // Calculate total
      const total = updatedItems.reduce((sum, item) => sum + item.total, 0);

      return {
        ...prev,
        items: updatedItems,
        total,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = "/api/sales";
      const method = mode === "add" ? "POST" : "PUT";
      const body = mode === "edit" ? { ...formData, id: sale?.id } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setOpen(false);
        onSuccess();
        if (mode === "add") {
          setFormData({
            total: 0,
            status: "PENDING",
            items: [],
          });
        }
      } else {
        console.error("Failed to save sale");
      }
    } catch (error) {
      console.error("Error saving sale:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "add" ? (
          <Button className="hover-lift">
            <Plus className="w-4 h-4 mr-2" />
            {tSales("addSale")}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="hover-scale">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "add" ? (
              <Plus className="w-5 h-5" />
            ) : (
              <Edit className="w-5 h-5" />
            )}
            {mode === "add" ? t("add") : t("edit")} {tSales("sale")}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? `${t("add")} ${tSales("saleDescription")}`
              : `${t("edit")} ${tSales("saleDescription")}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">{tSales("status")}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="hover-glow">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">{tSales("pending")}</SelectItem>
                <SelectItem value="COMPLETED">{tSales("completed")}</SelectItem>
                <SelectItem value="CANCELLED">{tSales("cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>{tSales("items")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSaleItem}
                className="hover-scale"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("add")} {tSales("item")}
              </Button>
            </div>

            {(formData.items || []).map((item, index) => (
              <div key={index} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">
                    {tSales("item")} {index + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSaleItem(index)}
                    className="hover-scale text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label>{tSales("product")}</Label>
                    <Select
                      value={item.inventoryItemId}
                      onValueChange={(value) =>
                        updateSaleItem(index, "inventoryItemId", value)
                      }
                    >
                      <SelectTrigger className="hover-glow">
                        <SelectValue
                          placeholder={`${t("select")} ${tSales("product")}`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((invItem) => (
                          <SelectItem key={invItem.id} value={invItem.id}>
                            {invItem.name} (SKU: {invItem.sku}) -{" "}
                            {tSales("available")}: {invItem.quantity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{tSales("quantity")}</Label>
                    <Input
                      type="number"
                      min="1"
                      max={item.inventoryItem?.quantity || 999}
                      value={item.quantity}
                      onChange={(e) =>
                        updateSaleItem(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="hover-glow"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{tSales("unitPrice")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateSaleItem(
                          index,
                          "unitPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="hover-glow"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{tSales("total")}</Label>
                    <Input
                      type="number"
                      value={item.total.toFixed(2)}
                      className="bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            ))}

            {(formData.items || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t("noItems")}. {t("clickAdd")} {tSales("item")} {t("toStart")}.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-lg font-semibold">
              {tSales("grandTotal")}: ${formData.total.toFixed(2)}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="hover-scale"
              >
                <X className="w-4 h-4 mr-2" />
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={loading || (formData.items || []).length === 0}
                className="hover-lift"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
