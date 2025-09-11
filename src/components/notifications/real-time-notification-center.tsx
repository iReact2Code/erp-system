'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveDashboardLayout } from '@/components/layout/responsive-components'
import { Bell } from 'lucide-react'

export default function RealTimeNotificationCenter() {
  return (
    <div className="space-y-6">
      <ResponsiveDashboardLayout title="Notifications">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="py-8 text-center text-muted-foreground">
              Notification center coming soon...
            </p>
          </CardContent>
        </Card>
      </ResponsiveDashboardLayout>
    </div>
  )
}
