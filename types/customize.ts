export type FilamentColor = {
  name: string;
  hex: string;
};

export type FilamentOption = {
  id: string;
  type: string;
  color: string;
  hex: string;
  brand: string;
  finish: string;
  label: string;
};

export type MaterialSlot = {
  key: string;
  label: string;
};

export type Model3DRef = {
  type?: "glb" | "gltf";
  url: string;
};

export type CustomizableProduct = {
  id: string;
  name: string;
  description: string;
  model3dUrl?: string;
  model3d?: Model3DRef;
  defaultHexes?: string[];
  filamentColors: FilamentColor[];
};
