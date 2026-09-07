import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLanguage } from "../../i18n/LanguageContext";

export function PeerManager() {
  const { t } = useLanguage();

  const [peers, setPeers] = useState<string[]>([]);
  const [ip, setIp] = useState("");
  const [label, setLabel] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  function refreshPeers() {
    invoke<string[]>("get_peers").then(setPeers).catch(console.error);
  }

  useEffect(refreshPeers, []);

  async function handleAdd() {
    if (!ip.trim()) return;

    await invoke("add_peer", { ip, label });
    setIp("");
    setLabel("");
    refreshPeers();
  }

  async function handleRemove(peerIp: string) {
    await invoke("remove_peer", { ip: peerIp });
    refreshPeers();
  }

  async function handleScanNetwork() {
    setScanning(true);
    setScanMessage(t("searchInProgress"));

    try {
      const myIp = await invoke<string>("get_my_ip");
      const found = await invoke<string[]>("scan_network", { myIp });

      for (const foundIp of found) {
        await invoke("add_peer", {
          ip: foundIp,
          label: "Trouvé automatiquement",
        });
      }

      setScanMessage(
        found.length > 0
          ? `${found.length} ${t("devicesFound")}`
          : t("noDevicesFound")
      );

      refreshPeers();
    } catch (e) {
      setScanMessage(`${t("scanError")}: ${e}`);
    } finally {
      setScanning(false);
    }
  }

  const inputStyle = {
    background: "var(--gesso-surface-elevated)",
    borderRadius: "var(--gesso-radius-md)",
    fontFamily: "var(--gesso-font-body)",
    color: "var(--gesso-fg)",
  };

  return (
    <div
      style={{
        background: "var(--gesso-surface)",
        borderRadius: "var(--gesso-radius-lg)",
      }}
      className="p-5"
    >
      <h3
        style={{
          fontFamily: "var(--gesso-font-display)",
          fontWeight: 700,
          color: "var(--gesso-fg-muted)",
        }}
        className="mb-3 text-xs uppercase tracking-wide"
      >
        {t("synchronizedDevices")}
      </h3>

      {peers.length === 0 ? (
        <p
          style={{
            color: "var(--gesso-fg-muted)",
            fontFamily: "var(--gesso-font-body)",
          }}
          className="mb-4 text-sm"
        >
          {t("noRegisteredDevices")}
        </p>
      ) : (
        <ul className="mb-4 flex flex-col gap-2">
          {peers.map((p) => (
            <li
              key={p}
              style={{
                background: "var(--gesso-surface-elevated)",
                borderRadius: "var(--gesso-radius-md)",
              }}
              className="flex items-center justify-between px-3 py-2"
            >
              <span
                style={{
                  fontFamily: "var(--gesso-font-body)",
                  color: "var(--gesso-fg)",
                }}
                className="text-sm"
              >
                {p}
              </span>

              <button
                type="button"
                onClick={() => handleRemove(p)}
                style={{
                  color: "var(--gesso-secondary)",
                  fontFamily: "var(--gesso-font-body)",
                }}
                className="text-xs font-bold"
              >
                {t("remove")}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleScanNetwork}
        disabled={scanning}
        style={{
          background: "var(--gesso-secondary)",
          borderRadius: "var(--gesso-radius-md)",
        }}
        className="mb-2 w-full py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
      >
        {scanning ? `🔍 ${t("scanning")}` : `🔍 ${t("scanNetwork")}`}
      </button>

      {scanMessage && (
        <p
          style={{
            color: "var(--gesso-fg-muted)",
            fontFamily: "var(--gesso-font-body)",
          }}
          className="mb-4 text-center text-xs"
        >
          {scanMessage}
        </p>
      )}

      <div
        style={{ borderTop: "1px solid var(--gesso-divider)" }}
        className="pt-4"
      >
        <p
          style={{
            fontFamily: "var(--gesso-font-display)",
            fontWeight: 700,
            color: "var(--gesso-fg-muted)",
          }}
          className="mb-2 text-xs uppercase tracking-wide"
        >
          {t("addManually")}
        </p>

        <input
          placeholder={t("ipPlaceholder")}
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          style={inputStyle}
          className="mb-2 w-full px-3 py-2 text-sm outline-none"
        />

        <input
          placeholder={t("namePlaceholder")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={inputStyle}
          className="mb-3 w-full px-3 py-2 text-sm outline-none"
        />

        <button
          type="button"
          onClick={handleAdd}
          style={{
            background: "var(--gesso-primary)",
            borderRadius: "var(--gesso-radius-md)",
          }}
          className="w-full py-3 text-sm font-bold text-white transition active:scale-95"
        >
          {t("addDevice")}
        </button>
      </div>
    </div>
  );
}