import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import formatValue from '../utils/formatValue';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function storeProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    }

    storeProducts();
  }, [products]);

  const increment = useCallback(
    async id => {
      const productsList = products;

      const productIndex = productsList.findIndex(product => product.id === id);

      if (productIndex > -1) {
        const productToIncrement = productsList[productIndex];

        productToIncrement.quantity
          ? (productToIncrement.quantity += 1)
          : (productToIncrement.quantity = 1);

        productsList[productIndex] = productToIncrement;

        setProducts([...productsList]);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const cartProducts = products;

      const productIndex = cartProducts.findIndex(product => product.id === id);

      if (productIndex > -1) {
        const productToDecrement = cartProducts[productIndex];

        if (productToDecrement.quantity > 1) {
          productToDecrement.quantity -= 1;
          cartProducts[productIndex] = productToDecrement;
        } else {
          cartProducts.splice(productIndex, 1);
        }

        setProducts([...cartProducts]);
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const foundCartProduct = products.find(
        cartProduct => cartProduct.id === product.id,
      );

      if (foundCartProduct) {
        increment(foundCartProduct.id);
      } else {
        setProducts(state => [...state, { ...product, quantity: 1 }]);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
