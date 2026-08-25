import { print_thermal_printer, type PrintJobRequest, ENCODE } from "tauri-plugin-thermal-printer";
import { list_thermal_printers } from "tauri-plugin-thermal-printer";

const defaultStyle = {
  bold: false, underline: false, align: "left" as const, italic: false,
  invert: false, font: "A" as const, rotate: false, upside_down: false, size: "normal" as const,
};

export async function printReceipt(
  receipt: {
    id: string;
    date_vente: string;
    total: number;
  },
  cart: {
    product: {
      nom: string;
      prix_vente: number;
    };
    quantite: number;
  }[]
) {
  const printers = await list_thermal_printers();

  console.log("=== THERMAL PRINTERS ===");
  console.log(JSON.stringify(printers, null, 2));

  const usbPrinter = printers.find(
    (p) => p.interface_type.toLowerCase() === "usb"
  );

  if (!usbPrinter) {
    console.error("Aucune imprimante USB détectée");
    return;
  }

  console.log("Imprimante sélectionnée:", usbPrinter);



  const job: PrintJobRequest = {
    printer: usbPrinter.name,
    paper_size: "Mm80",
    options: {
      code_page: 0,
      encode: ENCODE.ACCENT_REMOVER,
      use_gbk: false,
    },
    sections: [
      { Title: { text: "Store Manager", styles: { ...defaultStyle, bold: true, align: "center", size: "double" } } },
      { Line: { character: "=" } },
      { Text: { text: `Vente: ${receipt.id}`, styles: { ...defaultStyle } } },
      { Text: { text: `Date: ${receipt.date_vente}`, styles: { ...defaultStyle } } },
      { Line: { character: "=" } },
      {
        Table: {
          columns: 3,
          column_widths: [26, 8, 14],

          header: [
            { text: "Article", styles: { ...defaultStyle, bold: true } },
            { text: "Qté", styles: { ...defaultStyle, bold: true, align: "right" } },
            { text: "Total", styles: { ...defaultStyle, bold: true, align: "right" } },
          ],
          body: cart.map((i) => [
            { text: i.product.nom, styles: undefined },
            { text: i.quantite.toString(), styles: { ...defaultStyle, align: "right" as const } },
            { text: (i.quantite * i.product.prix_vente).toFixed(2), styles: { ...defaultStyle, align: "right" as const } },
          ]),
          truncate: false,
        },
      },
      { Line: { character: "=" } },
      { Text: { text: `Total: ${receipt.total.toFixed(2)} DA`, styles: { ...defaultStyle, bold: true, align: "center" } } },
      { Text: { text: "Merci !", styles: { ...defaultStyle, align: "center" } } },
      { Line: { character: "-" } },
      { Text: { text: "App développée par bizkda", styles: { ...defaultStyle, align: "center", size: "normal" } } },
      { Text: { text: "linkedin.com/in/bizkda", styles: { ...defaultStyle, align: "center", size: "normal" } } },
      { Feed: { feed_type: "lines", value: 3 } },
    ],
  };

  try {
    await print_thermal_printer(job);
  } catch (e) {
    console.error("Impression échouée:", e);
  }
}