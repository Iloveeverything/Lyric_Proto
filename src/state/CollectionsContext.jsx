import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const CollectionsContext = createContext(null);

let idCounter = 1;
const nextId = (prefix) => `${prefix}${idCounter++}`;

export function CollectionsProvider({ children }) {
  const [collections, setCollections] = useState([
    { id: "c1", name: "Untitled collection", words: [] },
  ]);

  const createCollection = useCallback((name) => {
    const id = nextId("c");
    setCollections((prev) => [...prev, { id, name, words: [] }]);
    return id;
  }, []);

  const renameCollection = useCallback((collectionId, name) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, name } : c))
    );
  }, []);

  const deleteCollection = useCallback((collectionId) => {
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
  }, []);

  const addWord = useCallback((collectionId, text, source) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, words: [...c.words, { id: nextId("w"), text, source }] }
          : c
      )
    );
  }, []);

  const removeWord = useCallback((collectionId, wordId) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, words: c.words.filter((w) => w.id !== wordId) }
          : c
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      collections,
      createCollection,
      renameCollection,
      deleteCollection,
      addWord,
      removeWord,
    }),
    [collections, createCollection, renameCollection, deleteCollection, addWord, removeWord]
  );

  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  const ctx = useContext(CollectionsContext);
  if (!ctx) {
    throw new Error("useCollections must be used inside a CollectionsProvider");
  }
  return ctx;
}
