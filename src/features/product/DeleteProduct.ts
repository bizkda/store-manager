import { useState } from "react";
import { deleteProduct } from "../../api/products";

export function useProductDelete(onDeleted?: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const removeProduct = async (id: string) => {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteProduct(id);
      onDeleted?.();
    } catch (e) {
      const message = getErrorMessage(e);
      console.error("Échec de la suppression du produit:", message);
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return { removeProduct, error, isDeleting };
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Une erreur inconnue est survenue.";
}