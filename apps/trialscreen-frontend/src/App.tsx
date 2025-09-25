import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './AppLayout';
import { trpc, trpcClient } from './utils/trpc';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <AppLayout />
      </trpc.Provider>
    </QueryClientProvider>
  );
};

export default App;