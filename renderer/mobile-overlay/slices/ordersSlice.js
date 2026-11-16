import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { uri } from '@services/URL';
import i18next from 'i18next';

// Async thunk for fetching orders
export const fetchOrders = createAsyncThunk(
    'orders/fetchOrders',
    async (params = {}, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth?.token;
            
            if (!token) {
                throw new Error('No authentication token');
            }

            console.log('Fetching orders with token:', token ? 'Token exists' : 'No token');
            console.log('Fetching orders with params:', params);

            // ساختن query string
            const queryParams = new URLSearchParams();
            if (params.from_date) queryParams.append('from_date', params.from_date);
            if (params.to_date) queryParams.append('to_date', params.to_date);
            if (params.status !== undefined && params.status !== null) queryParams.append('status', params.status);
            if (params.per_page) queryParams.append('per_page', params.per_page);
            
            const queryString = queryParams.toString();
            const url = `${uri}/orders${queryString ? `?${queryString}` : ''}`;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept-Language': i18next.language || 'en' // Default language header
                }
            });

            if (response.data?.success) {
                return response.data.data || [];
            }

            // بدونِ پرچمِ `success` بی‌سروصدا [] برمی‌گشت، که از دیدِ کاربر یعنی
            // «لیست خالی» و از دیدِ توسعه‌دهنده یعنی هیچ سرنخی. اگر پاکتِ پاسخ
            // چیزِ دیگری بود، لااقل دیده شود.
            console.warn('[ordersSlice] GET /orders returned an unexpected envelope:', JSON.stringify(response.data)?.slice(0, 500));
            return [];
        } catch (error) {
            console.error('Fetch orders error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'خطا در دریافت لیست سفارشات');
        }
    }
);

const ordersSlice = createSlice({
    name: 'orders',
    initialState: {
        data: [],
        loading: false,
        error: null,
        lastFetch: null,
        activeRequestId: null,
    },
    reducers: {
        clearOrders: (state) => {
            state.data = [];
            state.error = null;
            state.lastFetch = null;
            state.activeRequestId = null;
            state.loading = false;
        },
        updateOrderStatus: (state, action) => {
            const { orderId, status } = action.payload;
            const order = state.data.find(o => o.id === orderId);
            if (order) {
                order.status = status;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOrders.pending, (state, action) => {
                state.activeRequestId = action.meta.requestId;
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                if (state.activeRequestId !== action.meta.requestId) return;
                state.activeRequestId = null;
                state.loading = false;
                state.data = action.payload;
                state.lastFetch = new Date().toISOString();
                state.error = null;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                if (state.activeRequestId !== action.meta.requestId) return;
                state.activeRequestId = null;
                state.loading = false;
                state.error = action.payload || 'خطا در دریافت سفارشات';
            });
    }
});

export const { clearOrders, updateOrderStatus } = ordersSlice.actions;
export default ordersSlice.reducer;
