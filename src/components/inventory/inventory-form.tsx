'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Edit, Save, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface InventoryItem {
  id?: string
  name: string
  sku: string
  description?: string
  quantity: number
  unitPrice: number
}

interface InventoryFormProps {
  item?: InventoryItem
  mode: 'add' | 'edit'
  onSuccess: () => void
}

export function InventoryForm({ item, mode, onSuccess }: InventoryFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<InventoryItem>({
    name: item?.name || '',
    sku: item?.sku || '',
    description: item?.description || '',
    quantity: item?.quantity || 0,
    unitPrice: item?.unitPrice || 0,
  })

  const t = useTranslations('common')
  const tInventory = useTranslations('inventory')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/inventory'
      const method = mode === 'add' ? 'POST' : 'PUT'
      const body = mode === 'edit' ? { ...formData, id: item?.id } : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setOpen(false)
        onSuccess()
        if (mode === 'add') {
          setFormData({
            name: '',
            sku: '',
            description: '',
            quantity: 0,
            unitPrice: 0,
          })
        }
      } else {
        console.error('Failed to save item')
      }
    } catch (error) {
      console.error('Error saving item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    field: keyof InventoryItem,
    value: string | number
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button className="hover-lift animate-scale-in">
            <Plus className="w-4 h-4 mr-2" />
            {t('add')} {tInventory('product')}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="hover-scale">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'add' ? (
              <Plus className="w-5 h-5" />
            ) : (
              <Edit className="w-5 h-5" />
            )}
            {mode === 'add' ? t('add') : t('edit')} {tInventory('product')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? `${t('add')} ${tInventory('productDescription')}`
              : `${t('edit')} ${tInventory('productDescription')}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{tInventory('name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className="hover-glow"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">{tInventory('sku')}</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={e => handleInputChange('sku', e.target.value)}
                className="hover-glow"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {tInventory('itemDescription')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange('description', e.target.value)
                }
                className="hover-glow resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">{tInventory('quantity')}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={e =>
                    handleInputChange('quantity', parseInt(e.target.value) || 0)
                  }
                  className="hover-glow"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">{tInventory('unitPrice')}</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={e =>
                    handleInputChange(
                      'unitPrice',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="hover-glow"
                  required
                />
              </div>
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
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="hover-lift">
              <Save className="w-4 h-4 mr-2" />
              {loading ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
