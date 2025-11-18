'use client';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

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
  tagTypes: ['Categories', 'MenuItems', 'Auth', 'Users', 'Orders'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (body) => ({ url: 'api/auth/login', method: 'POST', body }),
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
      query: (body) => ({ url: 'api/menu-items', method: 'POST', body }),
      transformResponse: (response) => response?.data,
      invalidatesTags: (res, err, arg) => [
        { type: 'MenuItems', id: 'LIST' },
        { type: 'MenuItems', id: `LIST-${arg?.category || 'all'}` },
        { type: 'MenuItems', id: `LIST-${arg?.category || 'all'}-active-true` }
      ]
    }),
    updateMenuItem: builder.mutation({
      query: ({ id, ...body }) => ({ url: `api/menu-items/${id}`, method: 'PUT', body }),
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
      transformResponse: (response) => response?.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((o) => ({ type: 'Orders', id: o._id })),
              { type: 'Orders', id: 'LIST' },
            ]
          : [{ type: 'Orders', id: 'LIST' }],
    }),
    getOrderById: builder.query({
      query: (id) => ({ url: `api/orders/${id}` }),
      transformResponse: (response) => response?.data,
      providesTags: (result, error, id) => [{ type: 'Orders', id }],
    }),
    createOrder: builder.mutation({
      query: (body) => ({ url: 'api/orders', method: 'POST', body }),
      transformResponse: (response) => response?.data,
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }]
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
  }),
});

export const {
  useLoginMutation,
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
} = nectarApi;