"use client";

import { useState, useEffect, useCallback } from "react";
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
  unitPrice: number;
}

interface PurchaseItem {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
}

interface Purchase {
  id?: string;
  total: number;
  status: string;
  items: PurchaseItem[];
}

interface PurchaseFormProps {
  purchase?: Purchase;
  mode: "add" | "edit";
  onSuccess: () => void;
}

export function PurchaseForm({ purchase, mode, onSuccess }: PurchaseFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [formData, setFormData] = useState<Purchase>({
    total: purchase?.total || 0,
    status: purchase?.status || "PENDING",
    items: purchase?.items || [],
  });

  const t = useTranslations("common");
  const tPurchases = useTranslations("purchases");

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data);
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  };

  const addPurchaseItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { inventoryItemId: "", quantity: 1, unitPrice: 0 },
      ],
    }));
  };

  const removePurchaseItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updatePurchaseItem = (
    index: number,
    field: keyof PurchaseItem,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const calculateTotal = useCallback(() => {
    const total = formData.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);
    setFormData((prev) => ({ ...prev, total }));
  }, [formData.items]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = "/api/purchases";
      const method = mode === "add" ? "POST" : "PUT";
      const body =
        mode === "edit" ? { ...formData, id: purchase?.id } : formData;

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
        console.error("Failed to save purchase");
      }
    } catch (error) {
      console.error("Error saving purchase:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "add" ? (
          <Button className="hover-lift animate-scale-in">
            <Plus className="w-4 h-4 mr-2 animate-float" />
            {t("add")} {tPurchases("purchase")}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="hover-scale">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "add" ? (
              <Plus className="w-5 h-5" />
            ) : (
              <Edit className="w-5 h-5" />
            )}
            {mode === "add" ? t("add") : t("edit")} {tPurchases("purchase")}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? `${t("add")} ${tPurchases("purchaseDescription")}`
              : `${t("edit")} ${tPurchases("purchaseDescription")}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">{tPurchases("status")}</Label>
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>{tPurchases("items")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPurchaseItem}
                className="hover-scale"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("add")} {tPurchases("item")}
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">
                    {tPurchases("item")} {index + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePurchaseItem(index)}
                    className="hover-scale"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>{tPurchases("product")}</Label>
                    <Select
                      value={item.inventoryItemId}
                      onValueChange={(value) => {
                        updatePurchaseItem(index, "inventoryItemId", value);
                        const selectedItem = inventoryItems.find(
                          (inv) => inv.id === value
                        );
                        if (selectedItem) {
                          updatePurchaseItem(
                            index,
                            "unitPrice",
                            selectedItem.unitPrice
                          );
                        }
                      }}
                    >
                      <SelectTrigger className="hover-glow">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((invItem) => (
                          <SelectItem key={invItem.id} value={invItem.id}>
                            {invItem.name} ({invItem.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{tPurchases("quantity")}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updatePurchaseItem(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="hover-glow"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{tPurchases("unitPrice")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updatePurchaseItem(
                          index,
                          "unitPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="hover-glow"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-medium">
                    {tPurchases("subtotal")}: $
                    {(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="text-right">
              <span className="text-lg font-bold">
                {tPurchases("total")}: ${formData.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
              disabled={loading || formData.items.length === 0}
              className="hover-lift"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
