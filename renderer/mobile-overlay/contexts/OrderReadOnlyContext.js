import { createContext, useContext } from 'react';
export const OrderReadOnlyContext = createContext(false);
export const useOrderReadOnly = () => useContext(OrderReadOnlyContext);
