import { useState } from "react";
import { addProduct, getProductByBarcode, Product } from "../../api/products";
import { checkout, NewSale } from "../../api/sales";
import { scan, Format, requestPermissions } from "@tauri-apps/plugin-barcode-scanner";
import { useProductSearch } from "./useProductSearch";
import { useLanguage } from "../../i18n/LanguageContext";
import { printReceipt } from "./print";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";

interface CartItem {
  product: Product;
  quantite: number;
}

interface SaleCardProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onSaleComplete: () => void;
  onNavigateToAddProduct: () => void;
}


export function SaleCard({ cart, setCart, onSaleComplete, onNavigateToAddProduct }: SaleCardProps) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [receiptText, setReceiptText] = useState<string | null>(null);
  
  const { nom, setNom, prixMin, setPrixMin, prixMax, setPrixMax, results, searched } = useProductSearch();
  const [scannedNotFound, setScannedNotFound] = useState(false);
  const [discountType, setDiscountType] = useState<"none" | "percent" | "amount">("none");
  const [discountValue, setDiscountValue] = useState(0);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualQty, setManualQty] = useState("1");

  const subtotal = cart.reduce((sum, i) => sum + i.product.prix_vente * i.quantite, 0);

  const discountAmount =
    discountType === "percent"
      ? (subtotal * discountValue) / 100
      : discountType === "amount"
      ? discountValue
      : 0;


  const new_total = Math.max(subtotal - discountAmount, 0);
  const [searchOpen, setSearchOpen] = useState(false);
  async function startScan() {
    setScanning(true);
    try {
      const permission = await requestPermissions();
      if (permission !== "granted") {
        setMessage(t("cameraPermissionDenied"));
        setScanning(false);
        return;
      }
      const result = await scan({
        windowed: false,
        formats: [Format.EAN13, Format.EAN8, Format.UPC_A, Format.UPC_E],
      });

      const product = await getProductByBarcode(result.content);
      if (product) {
        addToCart(product);
        setMessage(`${product.nom} ${t("addedToCart")}`);
        setScannedNotFound(false);
      } else {
        setMessage("");
        setScannedNotFound(true);
      }
    } catch (e: any) {
      console.error("Scan échoué:", e?.message);
    } finally {
      setScanning(false);
    }
  }

async function addManualProduct() {
  const price = parseFloat(manualPrice);
  const qty = parseFloat(manualQty) || 1;

  if (!manualName.trim() || isNaN(price) || price < 0) {
    setMessage(t("invalidManualProduct") || "Nom ou prix invalide");
    return;
  }

  try {
    const newProductId = await addProduct({
      nom: manualName.trim(),
      code_barre: null,       // pas de code-barre
      prix_vente: price,
      prix_achat: 0,          // ou demandez-le aussi si besoin
      quantite: qty,          // stock initial = quantité vendue
      seuil_reappro: 0,
    });

    const manualProduct: Product = {
      id: newProductId,
      nom: manualName.trim(),
      code_barre: null,
      prix_vente: price,
      prix_achat: 0,
      quantite: qty,
      seuil_reappro: 0,
    };

    setCart((prev) => [...prev, { product: manualProduct, quantite: qty }]);
    setMessage(`${manualProduct.nom} ${t("addedToCart")}`);

    setManualName("");
    setManualPrice("");
    setManualQty("1");
    setManualOpen(false);
  } catch (e) {
    setMessage(`${t("error")}: ${e}`);
  }
}
  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantite: i.quantite + 1 } : i
        );
      }
      return [...prev, { product, quantite: 1 }];
    });
  }

  function updateQuantity(productId: string, newQuantite: number) {
    setCart((prev) => {
      if (newQuantite <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((i) =>
        i.product.id === productId ? { ...i, quantite: newQuantite } : i
      );
    });
  }

  async function handleCheckout() {
    const sale: NewSale = {
      items: cart.map((i) => ({
        produit_nom: i.product.nom,
        produit_id: i.product.id,
        quantite: i.quantite,
        prix_unitaire: i.product.prix_vente,
      })),
      
    };
    try {
      const receipt = await checkout(sale);
      receipt.total = new_total;
      await printReceipt(receipt, cart);     
      const text = [
        "GRAND BAZARD ANAS",
        "================",
        `DATE: ${new Date(receipt.date_vente).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        "-------Articles---------",
        ...cart.map(
          (i) => `${i.product.nom} x ${i.quantite} = ${(i.quantite * i.product.prix_vente).toFixed(2)} DA`
        ),   

        "--------Total--------",   

        `SubTotal: ${subtotal} DA`,
        `Remise: ${discountAmount} DA`,
        `Total: ${receipt.total.toFixed(2)} DA`,
        
        "--------Thank you--------",
        "Thank you! beautiful you!!!",
        "",
        "App développée par abdrezakworks@gmail.com",
      ].join("\n");

      setReceiptText(text);
      setMessage(`${t("saleRecorded")}: ${receipt.total} DA`);
      setCart([]);
      onSaleComplete();
    
    } catch (e) {
      setMessage(`${t("error")}: ${e}`);
    }
  }

  const searchInputStyle = {
    background: "var(--gesso-surface)",
    borderRadius: "var(--gesso-radius-md)",
    fontFamily: "var(--gesso-font-body)",
    color: "var(--gesso-fg)",
  };

  return (
    <div className="flex h-screen flex-col" >
      {/* Zone caméra */}
      <div className="relative h-1/8 min-h-0 overflow-hidden">
        {scanning ? (
          <p
            style={{ fontFamily: "var(--gesso-font-body)" }}
            className="absolute top-6 left-0 right-0 text-center text-sm font-medium text-white drop-shadow-lg"
          >
            {t("scanPrompt")}
          </p>
        ) : (
          <button
            type="button"
            onClick={startScan}
            style={{ background: "var(--gesso-primary)", borderRadius: "var(--gesso-radius-md)" }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-3 text-sm font-bold text-white shadow-lg"
          >
            📷 {t("scanBarcode")}
          </button>
        )}
      </div>



      {/* Fiche vente */}
      <div
        style={{
          background: "var(--gesso-canvas)",
          borderTopLeftRadius: "var(--gesso-radius-lg)",
          borderTopRightRadius: "var(--gesso-radius-lg)",
          boxShadow: "var(--gesso-shadow-lg)",
        }}
        className="flex h-7/8 min-h-0 flex-col"
      >
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--gesso-divider)" }} className="shrink-0 px-6 py-4">

          {message && (
            <p
              style={{
                background: "rgba(91,63,228,0.1)",
                color: "var(--gesso-primary)",
                fontFamily: "var(--gesso-font-body)",
              }}
              className="mt-2 rounded-lg px-3 py-2 text-sm font-medium"
            >
              {message}
            </p>
          )}
          {receiptText && (
            <div
              style={{ background: "var(--gesso-surface)", borderRadius: "var(--gesso-radius-md)" }}
              className="mt-3 flex flex-col items-center gap-2 p-4"
            >
              <p style={{ color: "var(--gesso-fg-muted)", fontFamily: "var(--gesso-font-body)" }} className="text-xs">
                Scannez pour voir le ticket
              </p>
              <div style={{ background: "white", padding: 8, borderRadius: 8 }}>
                <QRCode value={receiptText} size={140} />
              </div>
              <button
                type="button"
                onClick={() => setReceiptText(null)}
                style={{ color: "var(--gesso-primary)", fontFamily: "var(--gesso-font-body)" }}
                className="text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          )}

          {scannedNotFound && (
            <p
              style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg-muted)" }}
              className="mt-2 text-sm"
            >
              {t("unknownProduct")} —{" "}
              <button
                type="button"
                onClick={onNavigateToAddProduct}
                style={{ color: "red", fontFamily: "var(--gesso-font-body)" }}
                className="font-bold underline"
              >
                {t("addIt")}
              </button>
            </p>
          )}
        </div>
        {/* Barre de recherche */}
        <div
          style={{ background: "var(--gesso-canvas)" }}
          className="flex flex-col gap-2 px-6 py-3"
        >
          {/* Nom — now a toggle */}
          <button
            onClick={() => setSearchOpen((prev) => !prev)}
            style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 700, color: "var(--gesso-fg-muted)" }}
            className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide"
          >
            {t("search")}
            <span
              style={{
                transform: searchOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 150ms ease-out",
              }}
            >
              ▾
            </span>
          </button>

          {searchOpen && (
            <>
              <div>
                <input
                  placeholder={t("searchPlaceholder")}
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  style={searchInputStyle}
                  className="w-full px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Prix */}
              <div className="flex w-full gap-2">
                <input
                  placeholder={t("priceMin")}
                  type="number"
                  value={prixMin}
                  onChange={(e) => setPrixMin(e.target.value)}
                  style={searchInputStyle}
                  className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                />

                <input
                  placeholder={t("priceMax")}
                  type="number"
                  value={prixMax}
                  onChange={(e) => setPrixMax(e.target.value)}
                  style={searchInputStyle}
                  className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                />
              </div>
            </>
          )}
        </div>
         <div className="flex flex-col items-center">
  <button
    type="button"
    onClick={() => setManualOpen((prev) => !prev)}
    style={{
      background: "var(--gesso-surface-elevated)",
      borderRadius: "var(--gesso-radius-md)",
      fontFamily: "var(--gesso-font-body)",
      color: "var(--gesso-fg)",
    }}
    className="mt-1 px-3 py-1.5 text-xs font-bold"
  >
    ➕ {t("addManualProduct") || "Article sans code-barre"}
  </button>

  {manualOpen && (
    <div
      style={{ background: "var(--gesso-surface)", borderRadius: "var(--gesso-radius-md)" }}
      className="mt-2 flex w-full max-w-sm flex-col items-center gap-2 p-3"
    >
      <input
        placeholder={t("productName") || "Nom du produit"}
        value={manualName}
        onChange={(e) => setManualName(e.target.value)}
        style={searchInputStyle}
        className="w-full px-3 py-2 text-center text-sm outline-none"
      />
      <div className="flex w-full justify-center gap-2">
        <input
          placeholder={t("price") || "Prix"}
          type="number"
          value={manualPrice}
          onChange={(e) => setManualPrice(e.target.value)}
          style={searchInputStyle}
          className="min-w-0 flex-1 px-3 py-2 text-center text-sm outline-none"
        />
        <input
          placeholder={t("quantity") || "Qté"}
          type="number"
          value={manualQty}
          onChange={(e) => setManualQty(e.target.value)}
          style={searchInputStyle}
          className="w-16 px-3 py-2 text-center text-sm outline-none"
        />
      </div>

      <button
        type="button"
        onClick={addManualProduct}
        style={{ background: "var(--gesso-secondary)", borderRadius: "var(--gesso-radius-md)" }}
        className="w-full py-2 text-sm font-bold text-white transition active:scale-95"
      >
        {t("addToCart") || "Ajouter au panier"}
      </button>
    </div>
  )}
</div>
        {/* Contenu scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">

            <>
              {searched && results.length === 0 && (
                <p style={{ color: "var(--gesso-fg-muted)" }} className="text-sm">
                  {t("productNotFound")} —{" "}
                  <button
                    type="button"
                    onClick={onNavigateToAddProduct}
                    style={{ color: "red", fontFamily: "var(--gesso-font-body)" }}
                    className="font-bold underline"
                  >
                    {t("addIt")}
                  </button>
                </p>
              )}
            {results.length > 0 && (
              <ul className="flex flex-col gap-2">
                {results.map((p) => (
                  <li
                    key={p.id}
                    style={{ background: "var(--gesso-surface)", borderRadius: "var(--gesso-radius-md)" }}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg)" }} className="text-sm">
                      {p.nom} — {p.prix_vente} DA — stock: {p.quantite}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      style={{ background: "var(--gesso-secondary)", borderRadius: "var(--gesso-radius-md)" }}
                      className="px-3 py-1.5 text-sm font-medium text-white transition active:scale-95"
                    >
                      {t("add")}
                    </button>
                  </li>
                ))}
              </ul>
              )}


          </>

          <h3
  style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 700, color: "var(--gesso-fg-muted)" }}
  className="mb-2 mt-6 text-xs uppercase tracking-wide"
>
  {t("cart")}
</h3>

{cart.length === 0 ? (
  <p style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg-muted)" }} className="text-sm">
    {t("emptyCart")}
  </p>
) : (
  <AnimatePresence>
  <ul className="flex flex-col gap-2">
    {[...cart].reverse().map((i ) => (
      <motion.li
         key={i.product.id}
        layout
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        style={{ background: "var(--gesso-cart)", borderRadius: "var(--gesso-radius-md)" }}
        className="flex flex-col gap-2 px-4 py-3 text-sm"
      >

        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg)" }}>
            {i.product.nom}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateQuantity(i.product.id, i.quantite - 1)}
              style={{ background: "var(--gesso-surface-elevated)", color: "var(--gesso-fg)" }}
              className="h-7 w-7 rounded-full text-base font-bold"
            >
              −
            </button>

            <input
              type="number"
              value={i.quantite}
              onChange={(e) => updateQuantity(i.product.id, parseFloat(e.target.value) || 0)}
              style={{
                background: "var(--gesso-surface-elevated)",
                borderRadius: "var(--gesso-radius-md)",
                fontFamily: "var(--gesso-font-body)",
                color: "var(--gesso-fg)",
              }}
              className="w-12 px-1 py-1 text-center text-sm outline-none"
            />

            <button
              type="button"
              onClick={() => updateQuantity(i.product.id, i.quantite + 1)}
              style={{ background: "var(--gesso-secondary)" }}
              className="h-7 w-7 rounded-full text-base font-bold text-white"
            >
              +
            </button>
          </div>
        </div>

        <span
          style={{
            fontFamily: "var(--gesso-font-body)",
            color: "var(--gesso-fg)",
            fontWeight: 700,
            textAlign: "right",
          }}
        >
          {(i.quantite * i.product.prix_vente).toFixed(2)}
        </span>
      </motion.li>
    ))}
  </ul>
  </AnimatePresence>
)}
        </div>

       {/* Footer checkout */}
<div
  style={{ borderTop: "1px solid var(--gesso-divider)", background: "var(--gesso-canvas)" }}
  className="shrink-0 flex flex-col gap-3 p-4"
>
  {/* Remise — pills + input inline */}
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1">
      {[
        { value: "none", label: "—" },
        { value: "percent", label: "%" },
        { value: "amount", label: "DA" },
      ].map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            setDiscountType(opt.value as "none" | "percent" | "amount");
            setDiscountValue(0);
          }}
          style={{
            background:
              discountType === opt.value
                ? "var(--gesso-primary)"
                : "var(--gesso-surface-elevated)",
            color: discountType === opt.value ? "white" : "var(--gesso-fg)",
            borderRadius: "var(--gesso-radius-md)",
            fontFamily: "var(--gesso-font-body)",
          }}
          className="h-7 w-9 text-xs font-bold transition active:scale-95"
        >
          {opt.label}
        </button>
      ))}
    </div>

    {discountType !== "none" && (
      <input
        type="number"
        min={0}
        autoFocus
        value={discountValue}
        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
        style={{
          background: "var(--gesso-surface-elevated)",
          borderRadius: "var(--gesso-radius-md)",
          fontFamily: "var(--gesso-font-body)",
          color: "var(--gesso-fg)",
        }}
        className="h-7 w-16 px-2 text-center text-xs outline-none"
      />
    )}

    {/* Sous-total / remise condensés à droite (pas le total, il est en bas) */}
    <div
      className="ml-auto flex items-center gap-2 text-xs"
      style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg-muted)" }}
    >
      <span>{subtotal.toFixed(2)}</span>
      {discountAmount > 0 && (
        <span style={{ color: "var(--gesso-secondary)" }}>-{discountAmount.toFixed(2)}</span>
      )}
    </div>
  </div>

  {/* Total + checkout */}
  <div className="flex items-center justify-between">
    <span
      style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg-muted)" }}
      className="text-base"
    >
      {t("total")}
    </span>
    <span
      style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900, color: "var(--gesso-fg)" }}
      className="text-2xl"
    >
      {new_total.toFixed(2)}
    </span>
  </div>

  {cart.length > 0 && (
    <button
      type="button"
      onClick={handleCheckout}
      style={{ background: "var(--gesso-primary)", borderRadius: "var(--gesso-radius-md)" }}
      className="w-full py-4 text-base font-bold text-white transition active:scale-95"
    >
      {t("checkout")}
    </button>
  )}
</div>
    </div>
  </div>
  );
}
