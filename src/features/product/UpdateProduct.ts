import { useState } from "react";
import { updateProduct, adjustProductQuantity, ProductUpdate } from "../../api/products";

export function useProductUpdate(onUpdated?: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const editProduct = async (id: string, product: ProductUpdate, quantityDelta?: number) => {
    setError(null);
    setIsUpdating(true);
    try {
      await updateProduct(id, product);
      if (quantityDelta && quantityDelta !== 0) {
        await adjustProductQuantity(id, quantityDelta);
      }
      onUpdated?.();
    } catch (e) {
      const message = getErrorMessage(e);
      console.error("Échec de la mise à jour du produit:", message);
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return { editProduct, error, isUpdating };
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Une erreur inconnue est survenue.";
}