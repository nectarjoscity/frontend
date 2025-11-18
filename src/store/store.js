'use client';

import { configureStore } from '@reduxjs/toolkit';
import { nectarApi } from '../services/api';

export const store = configureStore({
  reducer: {
    [nectarApi.reducerPath]: nectarApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(nectarApi.middleware),
});