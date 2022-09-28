import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {

    try {
      if (!hasStock(productId)) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const { data } = await api.get('/products/' + productId);

      let find = false;
      const newCart = cart.map(item => {

        if (item.id === productId) {
          item.amount++;
          find = true;
        }
        return item;
      })

      if (!find) {
        data.amount = 1;
        newCart.push(data);
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch (error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product => product.id != productId);
      setCart(newCart);
    } catch {
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }
      if (!hasStock(productId)) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const newCart = cart.map(product => {
        product.amount = product.id == productId ? amount : product.amount;
        return product;
      })
      setCart(newCart);
    } catch {
      // TODO
    }
  };

  async function hasStock(productId: number) {
    const hasStock = await api.get('/stock/' + productId).then(result => result);
    return hasStock.data.amount != 0;
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
