import { useState, useMemo } from 'react';
import { useGetSentOrders, useGetOrders, useUpdateOrderStatus } from '../api';
import { OrdersModuleView } from './OrdersModuleView';
import { EditOrderModal } from './EditOrderModal';
import type { OrderItem } from '../api';

interface OrdersModuleProps {
  onBack: () => void;
}

export function OrdersModule({ onBack }: OrdersModuleProps) {
  const [selectedTab, setSelectedTab] = useState<'sent' | 'draft'>('sent');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);

  // Fetch sent orders (status in ['order', 'pending', 'approved', 'deposit_received'])
  const { data: sentOrdersData, isLoading: sentLoading } = useGetSentOrders();
  const sentOrders = useMemo(() => sentOrdersData?.data || [], [sentOrdersData]);

  // Fetch draft orders (status = 'draft')
  const { data: draftOrdersData, isLoading: draftLoading } = useGetOrders('draft');
  const draftOrders = useMemo(() => draftOrdersData?.data || [], [draftOrdersData]);

  // Update status mutation
  const updateStatusMutation = useUpdateOrderStatus();

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ orderId, status: newStatus });
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleEditOrder = (order: OrderItem) => {
    setEditingOrder(order);
  };

  const handleEditSaved = () => {
    setEditingOrder(null);
  };

  return (
    <>
      <OrdersModuleView
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        sentOrders={sentOrders}
        draftOrders={draftOrders}
        isLoading={selectedTab === 'sent' ? sentLoading : draftLoading}
        expandedOrderId={expandedOrderId}
        onToggleExpand={handleToggleExpand}
        onStatusChange={handleStatusChange}
        isUpdating={updateStatusMutation.isPending}
        onBack={onBack}
        onEditOrder={handleEditOrder}
      />

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={handleEditSaved}
        />
      )}
    </>
  );
}
