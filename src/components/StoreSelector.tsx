// src/components/StoreSelector.tsx
import { useState, useEffect } from 'react';

export interface Store {
  id: number;
  name: string;
  short_name: string;
  address?: string;
}

interface StoreSelectorProps {
  userId: number;
  onSelect: (store: Store) => void;
  selectedStore?: Store;
}

export default function StoreSelector({ userId, onSelect, selectedStore }: StoreSelectorProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch(`/api/user-stores/${userId}`);
        const result = await response.json();
        
        if (result.success) {
          setStores(result.stores);
        } else {
          console.error('获取门店列表失败:', result.message);
          setStores([]);
        }
      } catch (error) {
        console.error('获取门店列表失败:', error);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStores();
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const storeId = parseInt(e.target.value);
    const store = stores.find(s => s.id === storeId);
    if (store) {
      onSelect(store);
    }
  };

  if (loading) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          门店选择
        </label>
        <div className="w-full p-3 border border-gray-300 rounded-lg bg-white">
          加载中...
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          门店选择
        </label>
        <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
          暂无分配门店
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        门店选择
      </label>
      <select
        className="w-full p-3 border border-gray-300 rounded-lg bg-white"
        value={selectedStore?.id || ''}
        onChange={handleChange}
      >
        <option value="" disabled>请选择门店</option>
        {stores.map(store => (
          <option key={store.id} value={store.id}>
            [{store.short_name}] {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}