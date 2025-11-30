'use client';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'https://backend-blue-eta-17.vercel.app';

export const nectarApi = createApi({
  reducerPath: 'nectarApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('nv_token');
        if (token) headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Categories', 'MenuItems', 'Auth', 'Users', 'Orders', 'Team', 'Inventory', 'MenuItemIngredients', 'InventoryTransactions', 'InventoryAnalytics', 'Expenses', 'ExpenseAnalytics', 'FinancialReports'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (body) => ({ url: 'api/auth/login', method: 'POST', body }),
      transformResponse: (response) => response?.data,
      invalidatesTags: ['Auth']
    }),
    register: builder.mutation({
      query: (body) => ({ url: 'api/auth/register', method: 'POST', body }),
      transformResponse: (response) => response?.data,
      invalidatesTags: ['Auth']
    }),
    getCategories: builder.query({
      query: ({ active } = {}) => ({
        url: 'api/categories',
        params: active !== undefined ? { active } : undefined,
      }),
      transformResponse: (response) => response?.data || [],
      providesTags: (result, error, arg) => {
        const activeKey = arg?.active !== undefined ? `-active-${arg.active}` : '';
        const listTag = `LIST${activeKey}`;

        return result
          ? [
            ...result.map((c) => ({ type: 'Categories', id: c._id })),
            { type: 'Categories', id: 'LIST' },
            { type: 'Categories', id: listTag },
          ]
          : [{ type: 'Categories', id: 'LIST' }, { type: 'Categories', id: listTag }];
      },
    }),
    createCategory: builder.mutation({
      query: (body) => ({ url: 'api/categories', method: 'POST', body }),
      transformResponse: (response) => response?.data,
      invalidatesTags: [
        { type: 'Categories', id: 'LIST' },
        { type: 'Categories', id: 'LIST-active-true' }
      ]
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/categories/${id}`, method: 'PUT', body }),
      transformResponse: (response) => response?.data,
      invalidatesTags: (result, error, arg) => [
        { type: 'Categories', id: 'LIST' },
        { type: 'Categories', id: 'LIST-active-true' },
        { type: 'Categories', id: arg.id }
      ]
    }),
    deleteCategory: builder.mutation({
      query: ({ id, soft = true }) => ({ url: `api/categories/${id}`, method: 'DELETE', params: { soft } }),
      transformResponse: (response) => response?.data,
      invalidatesTags: [
        { type: 'Categories', id: 'LIST' },
        { type: 'Categories', id: 'LIST-active-true' }
      ]
    }),
    getMenuItems: builder.query({
      query: ({ category, active, available } = {}) => ({
        url: 'api/menu-items',
        params: {
          ...(category ? { category } : {}),
          ...(active !== undefined ? { active } : {}),
          ...(available !== undefined ? { available } : {}),
        },
      }),
      transformResponse: (response) => response?.data || [],
      providesTags: (result, error, arg) => {
        const categoryKey = arg?.category || 'all';
        const activeKey = arg?.active !== undefined ? `-active-${arg.active}` : '';
        const listTag = `LIST-${categoryKey}${activeKey}`;

        const tags = result
          ? [
            ...result.map((i) => ({ type: 'MenuItems', id: i._id })),
            { type: 'MenuItems', id: listTag },
          ]
          : [{ type: 'MenuItems', id: listTag }];

        // Also add a general MenuItems tag for broader invalidation
        tags.push({ type: 'MenuItems', id: 'LIST' });
        return tags;
      },
    }),
    createMenuItem: builder.mutation({
      query: (body) => {
        // Check if body is FormData (has image file)
        const isFormData = body instanceof FormData;
        return {
          url: 'api/menu-items',
          method: 'POST',
          body: isFormData ? body : JSON.stringify(body),
          ...(isFormData ? {} : {
            headers: { 'Content-Type': 'application/json' },
          }),
        };
      },
      transformResponse: (response) => response?.data,
      invalidatesTags: (res, err, arg) => [
        { type: 'MenuItems', id: 'LIST' },
        { type: 'MenuItems', id: `LIST-${arg?.category || 'all'}` },
        { type: 'MenuItems', id: `LIST-${arg?.category || 'all'}-active-true` }
      ]
    }),
    updateMenuItem: builder.mutation({
      query: ({ id, body, ...rest }) => {
        // Handle both FormData and regular object
        const payload = body || rest;
        const isFormData = payload instanceof FormData;

        return {
          url: `api/menu-items/${id}`,
          method: 'PUT',
          body: isFormData ? payload : JSON.stringify(payload),
          ...(isFormData ? {} : {
            headers: { 'Content-Type': 'application/json' },
          }),
        };
      },
      transformResponse: (response) => response?.data,
      invalidatesTags: (result, error, arg) => [
        { type: 'MenuItems', id: 'LIST' },
        { type: 'MenuItems', id: `LIST-${arg?.category || 'all'}` },
        { type: 'MenuItems', id: `LIST-${arg?.category || 'all'}-active-true` },
        { type: 'MenuItems', id: arg.id }
      ]
    }),
    deleteMenuItem: builder.mutation({
      query: ({ id, soft = true, category }) => ({ url: `api/menu-items/${id}`, method: 'DELETE', params: { soft } }),
      transformResponse: (response) => response?.data,
      invalidatesTags: (result, error, arg) => {
        console.log('Invalidating tags for deleted item:', arg);
        return [
          { type: 'MenuItems', id: 'LIST' },
          { type: 'MenuItems', id: 'LIST-all' },
          { type: 'MenuItems', id: `LIST-${arg?.category}` },
          { type: 'MenuItems', id: `LIST-${arg?.category}-active-true` },
          { type: 'MenuItems', id: arg.id }
        ];
      }
    }),
    // Orders
    getOrders: builder.query({
      query: () => ({ url: 'api/orders' }),
      transformResponse: (response) => {
        console.log('Orders API response:', response);
        return response?.data || response || [];
      },
      providesTags: (result) =>
        result
          ? [
            ...result.map((o) => ({ type: 'Orders', id: o._id })),
            { type: 'Orders', id: 'LIST' },
          ]
          : [{ type: 'Orders', id: 'LIST' }],
      // Keep query subscribed so cache invalidation works
      keepUnusedDataFor: 60, // Keep data for 60 seconds even if not subscribed
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),
    getOrderById: builder.query({
      query: (id) => ({ url: `api/orders/${id}` }),
      transformResponse: (response) => response?.data,
      providesTags: (result, error, id) => [{ type: 'Orders', id }],
    }),
    createOrder: builder.mutation({
      query: (body) => {
        console.log('[API] Creating order with body:', body);
        return { url: 'api/orders', method: 'POST', body };
      },
      transformResponse: (response) => {
        console.log('[API] Order creation response:', response);
        return response?.data || response;
      },
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }],
      // Explicitly trigger refetch after order creation
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        // Optimistic update: invalidate cache immediately
        dispatch(nectarApi.util.invalidateTags([{ type: 'Orders', id: 'LIST' }]));

        try {
          await queryFulfilled;
          console.log('[API] Order created successfully, invalidating cache and refetching');

          // Invalidate tags again to ensure refetch
          dispatch(nectarApi.util.invalidateTags([{ type: 'Orders', id: 'LIST' }]));

          // Also trigger a manual refetch for any active subscriptions
          dispatch(nectarApi.endpoints.getOrders.initiate(undefined, { forceRefetch: true }));

          // Notify other tabs/windows about order creation (cross-tab communication)
          if (typeof window !== 'undefined') {
            localStorage.setItem('nectarv_order_created', Date.now().toString());
            // Also dispatch a custom event for same-tab communication
            window.dispatchEvent(new Event('nectarv_order_created'));
            // Remove the localStorage item after a short delay to allow other tabs to detect it
            setTimeout(() => {
              localStorage.removeItem('nectarv_order_created');
            }, 100);
          }
        } catch (error) {
          console.error('[API] Order creation failed:', error);
        }
      },
    }),
    updateOrder: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/orders/${id}`, method: 'PUT', body }),
      transformResponse: (response) => response?.data,
      invalidatesTags: (result, error, arg) => [
        { type: 'Orders', id: 'LIST' },
        { type: 'Orders', id: arg.id }
      ]
    }),
    deleteOrder: builder.mutation({
      query: ({ id }) => ({ url: `api/orders/${id}`, method: 'DELETE' }),
      transformResponse: (response) => response?.data,
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }]
    }),
    // Current User (Me)
    getCurrentUser: builder.query({
      query: () => ({ url: 'api/users/me' }),
      transformResponse: (response) => response?.data,
      providesTags: [{ type: 'Auth', id: 'CURRENT_USER' }],
    }),
    // Team Management
    getTeamMembers: builder.query({
      query: () => ({ url: 'api/users' }),
      transformResponse: (response) => response?.data || [],
      providesTags: (result) =>
        result
          ? [
            ...result.map((u) => ({ type: 'Team', id: u._id })),
            { type: 'Team', id: 'LIST' },
          ]
          : [{ type: 'Team', id: 'LIST' }],
    }),
    getTeamMember: builder.query({
      query: (id) => ({ url: `api/users/${id}` }),
      transformResponse: (response) => response?.data,
      providesTags: (result, error, id) => [{ type: 'Team', id }],
    }),
    createTeamMember: builder.mutation({
      query: (body) => ({ url: 'api/users', method: 'POST', body }),
      transformResponse: (response) => response?.data,
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),
    updateTeamMember: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/users/${id}`, method: 'PUT', body }),
      transformResponse: (response) => response?.data,
      invalidatesTags: (result, error, arg) => [
        { type: 'Team', id: 'LIST' },
        { type: 'Team', id: arg.id },
      ],
    }),
    deleteTeamMember: builder.mutation({
      query: ({ id }) => ({ url: `api/users/${id}`, method: 'DELETE' }),
      transformResponse: (response) => response?.data,
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),
    // Contact Form
    submitContactForm: builder.mutation({
      query: (body) => ({ url: 'api/contact', method: 'POST', body }),
      transformResponse: (response) => response,
    }),
    // Payment endpoints
    createVirtualAccount: builder.mutation({
      query: (body) => ({ url: 'api/payments/create-virtual-account', method: 'POST', body }),
      transformResponse: (response) => response?.data,
    }),
    verifyPayment: builder.mutation({
      query: (body) => ({ url: 'api/payments/verify', method: 'POST', body }),
      transformResponse: (response) => response?.data,
    }),
    // Inventory endpoints
    getInventoryItems: builder.query({
      query: (params = {}) => ({
        url: 'api/inventory',
        params: params
      }),
      transformResponse: (response) => response?.data || [],
      providesTags: ['Inventory']
    }),
    getInventoryItem: builder.query({
      query: (id) => `api/inventory/${id}`,
      transformResponse: (response) => response?.data,
      providesTags: (result, error, id) => [{ type: 'Inventory', id }]
    }),
    createInventoryItem: builder.mutation({
      query: (data) => ({
        url: 'api/inventory',
        method: 'POST',
        body: data
      }),
      transformResponse: (response) => response?.data,
      invalidatesTags: ['Inventory']
    }),
    updateInventoryItem: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `api/inventory/${id}`,
        method: 'PUT',
        body: data
      }),
      transformResponse: (response) => response?.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Inventory', id }, 'Inventory']
    }),
    deleteInventoryItem: builder.mutation({
      query: (id) => ({
        url: `api/inventory/${id}`,
        method: 'DELETE'
      }),
      transformResponse: (response) => response?.data,
      invalidatesTags: ['Inventory']
    }),
    restockInventoryItem: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `api/inventory/${id}/restock`,
        method: 'POST',
        body: data
      }),
      transformResponse: (response) => response?.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Inventory', id }, 'Inventory']
    }),
    getMenuItemIngredients: builder.query({
      query: (menuItemId) => `api/inventory/menu-item/${menuItemId}/ingredients`,
      transformResponse: (response) => response?.data || [],
      providesTags: (result, error, menuItemId) => [{ type: 'MenuItemIngredients', id: menuItemId }]
    }),
    addMenuItemIngredient: builder.mutation({
      query: (data) => ({
        url: 'api/inventory/menu-item/ingredients',
        method: 'POST',
        body: data
      }),
      transformResponse: (response) => response?.data,
      invalidatesTags: (result, error, { menuItemId }) => [
        { type: 'MenuItemIngredients', id: menuItemId },
        'MenuItems'
      ]
    }),
    removeMenuItemIngredient: builder.mutation({
      query: (id) => ({
        url: `api/inventory/ingredients/${id}`,
        method: 'DELETE'
      }),
      transformResponse: (response) => response?.data,
      invalidatesTags: ['MenuItemIngredients', 'MenuItems']
    }),
    getInventoryTransactions: builder.query({
      query: (params = {}) => ({
        url: 'api/inventory/transactions',
        params: params
      }),
      transformResponse: (response) => response?.data || [],
      providesTags: ['InventoryTransactions']
    }),
    getInventoryAnalytics: builder.query({
      query: (params = {}) => ({
        url: 'api/inventory/analytics',
        params: params
      }),
      transformResponse: (response) => response?.data,
      providesTags: ['InventoryAnalytics']
    }),

    // Expense Management
    getExpenses: builder.query({
      query: (params = {}) => ({
        url: 'api/accounting/expenses',
        params: params
      }),
      transformResponse: (response) => response?.data || [],
      providesTags: ['Expenses']
    }),
    createExpense: builder.mutation({
      query: (body) => ({
        url: 'api/accounting/expenses',
        method: 'POST',
        body
      }),
      transformResponse: (response) => response?.data,
      invalidatesTags: ['Expenses', 'ExpenseAnalytics', 'FinancialReports']
    }),
    updateExpense: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `api/accounting/expenses/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response) => response?.data,
      invalidatesTags: ['Expenses', 'ExpenseAnalytics', 'FinancialReports']
    }),
    deleteExpense: builder.mutation({
      query: (id) => ({
        url: `api/accounting/expenses/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Expenses', 'ExpenseAnalytics', 'FinancialReports']
    }),
    getExpenseAnalytics: builder.query({
      query: (params = {}) => ({
        url: 'api/accounting/expenses/analytics',
        params: params
      }),
      transformResponse: (response) => response?.data,
      providesTags: ['ExpenseAnalytics']
    }),

    // Financial Reports
    getProfitLossStatement: builder.query({
      query: (params) => ({
        url: 'api/accounting/reports/profit-loss',
        params: params
      }),
      transformResponse: (response) => response?.data,
      providesTags: ['FinancialReports']
    }),
    getCashFlowStatement: builder.query({
      query: (params) => ({
        url: 'api/accounting/reports/cash-flow',
        params: params
      }),
      transformResponse: (response) => response?.data,
      providesTags: ['FinancialReports']
    }),
    getRevenueAnalysis: builder.query({
      query: (params) => ({
        url: 'api/accounting/reports/revenue-analysis',
        params: params
      }),
      transformResponse: (response) => response?.data,
      providesTags: ['FinancialReports']
    }),
    getTaxSummary: builder.query({
      query: (params) => ({
        url: 'api/accounting/reports/tax-summary',
        params: params
      }),
      transformResponse: (response) => response?.data,
      providesTags: ['FinancialReports']
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetMenuItemsQuery,
  useLazyGetMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useGetCurrentUserQuery,
  useGetTeamMembersQuery,
  useGetTeamMemberQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useSubmitContactFormMutation,
  useGetInventoryItemsQuery,
  useGetInventoryItemQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useRestockInventoryItemMutation,
  useGetMenuItemIngredientsQuery,
  useAddMenuItemIngredientMutation,
  useRemoveMenuItemIngredientMutation,
  useGetInventoryTransactionsQuery,
  useGetInventoryAnalyticsQuery,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpenseAnalyticsQuery,
  useGetProfitLossStatementQuery,
  useGetCashFlowStatementQuery,
  useGetRevenueAnalysisQuery,
  useGetTaxSummaryQuery,
  useCreateVirtualAccountMutation,
  useVerifyPaymentMutation,
} = nectarApi;