export enum ParticleType {
  Fermion = "fermion",
  Photon  = "photon",
  Gluon   = "gluon",
  Higgs   = "higgs",
  Ghost   = "ghost",
  Scalar  = "scalar",
  WBoson  = "wboson",
  ZBoson  = "zboson",
}

export interface Vertex    { id: number; x: number; y: number; }
export interface TextLabel { id: number; x: number; y: number; text: string; }
export interface Ellipse   { id: number; x: number; y: number; rx: number; ry: number; }
export interface Rectangle { id: number; x: number; y: number; width: number; height: number; }

export interface Particle {
  id: number;
  type: ParticleType;
  startX: number; startY: number;
  endX: number;   endY: number;
  startVertex: number | null;
  endVertex:   number | null;
  bend: number;
  label?: string;
  reversed?: boolean; // whether arrow direction is flipped
}

export interface DiagramState {
  vertices:   Vertex[];
  particles:  Particle[];
  textLabels: TextLabel[];
  ellipses:   Ellipse[];
  rectangles: Rectangle[];
}

export interface Selection {
  vertices:   Set<number>;
  particles:  Set<number>;
  textLabels: Set<number>;
  ellipses:   Set<number>;
  rectangles: Set<number>;
}

export type PaletteItemType =
  | ParticleType
  | "vertex" | "text" | "ellipse" | "rectangle";

export interface PaletteItem {
  type:  PaletteItemType;
  label: string;
  group: string;
}

export interface DragPayload {
  type: PaletteItemType;
  label: string;
}

// For resize handle dragging
export interface DraggingObject {
  type:
    | "selection"
    | "particle_start" | "particle_end" | "particle_bend"
    | "resize-ellipse" | "resize-rectangle";
  id?: number;
  handle?: string;
  corner?: string;
}
