import { deleteProduct } from "../../api/products";

export function useProductDelete(onDeleted?: () => void) {
    const removeProduct = async (id: string) => {
        await deleteProduct(id);
        onDeleted?.();
    };

    return { removeProduct };
}