// Role constants
export const ROLES = {
    OWNER: 'OWNER',
    USER: 'USER',
    KURIR: 'KURIR',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Order status constants
export const ORDER_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    READY_TO_SHIP: 'READY_TO_SHIP',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Delivery status constants
export const DELIVERY_STATUS = {
    ASSIGNED: 'ASSIGNED',
    PICKED_UP: 'PICKED_UP',
    ON_THE_WAY: 'ON_THE_WAY',
    ARRIVED: 'ARRIVED',
    DELIVERED: 'DELIVERED',
    CONFIRMED: 'CONFIRMED',
} as const;

export type DeliveryStatus = (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];

// Status labels in Indonesian
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING: 'Menunggu Konfirmasi',
    CONFIRMED: 'Dikonfirmasi',
    PROCESSING: 'Sedang Diproses',
    READY_TO_SHIP: 'Siap Dikirim',
    SHIPPED: 'Dalam Pengiriman',
    DELIVERED: 'Terkirim',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
    ASSIGNED: 'Ditugaskan',
    PICKED_UP: 'Barang Diambil',
    ON_THE_WAY: 'Dalam Perjalanan',
    ARRIVED: 'Sampai di Lokasi',
    DELIVERED: 'Diserahkan',
    CONFIRMED: 'Dikonfirmasi',
};

export const ROLE_LABELS: Record<Role, string> = {
    OWNER: 'Owner',
    USER: 'User',
    KURIR: 'Kurir',
};
