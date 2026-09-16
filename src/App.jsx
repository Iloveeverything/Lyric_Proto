import React, { useState } from "react";
import { colors, font } from "./theme";
import { CollectionsProvider } from "./state/CollectionsContext";
import TopTabs from "./components/TopTabs";
import Sidebar from "./components/Sidebar";
import BrainstormWorkspace from "./components/BrainstormWorkspace";
import ActionWorkspace from "./components/ActionWorkspace";

export default function App() {
  const [tab, setTab] = useState("brainstorm");
  const [activeCollectionId, setActiveCollectionId] = useState("c1");
  const [sourceCollectionId, setSourceCollectionId] = useState("c1");

  return (
    <CollectionsProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: colors.bg,
          fontFamily: font.base,
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:wght@500;600;700&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
          * { box-sizing: border-box; }
        `}</style>

        <TopTabs tab={tab} setTab={setTab} />

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {tab === "brainstorm" ? (
            <>
              <Sidebar activeCollectionId={activeCollectionId} setActiveCollectionId={setActiveCollectionId} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <BrainstormWorkspace activeCollectionId={activeCollectionId} />
              </div>
            </>
          ) : (
            <>
              <Sidebar activeCollectionId={sourceCollectionId} setActiveCollectionId={setSourceCollectionId} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <ActionWorkspace sourceCollectionId={sourceCollectionId} setSourceCollectionId={setSourceCollectionId} />
              </div>
            </>
          )}
        </div>
      </div>
    </CollectionsProvider>
  );
}
