export type LabelElementType =
  | "text"
  | "barcode"
  | "qrcode" 
  | "image"  
  | "line"
  | "rectangle";

export interface LabelElement {
  id: string;
  type: LabelElementType;
  constrainToPadding?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;

  field?: string;
  text?: string;
  src?: string; 
  
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textDecorationStyle?: "solid" | "double" | "dotted" | "dashed" | "wavy";
  textAlign?: "left" | "center" | "right";
  color?: string; 
  backgroundColor?: string; 
  listStyle?: "none" | "bullet" | "number"; 
  rotation?: number;
}

export interface PageMargins { top: number; right: number; bottom: number; left: number; }
export interface LabelGrid { rows: number; columns: number; horizontalGap: number; verticalGap: number; }
export interface PageSize { name: string; width: number; height: number; unit: "mm"; }

export interface LabelSection {
  id: string;
  color: string;
  height: number;
  showTopBorder?: boolean;
  showBottomBorder?: boolean;
  borderColor?: string;
}

export interface LabelTemplate {
  id: string;
  name: string;
  page: PageSize;
  margins: PageMargins;
  grid: LabelGrid;
  elements: LabelElement[];
  labelSize: { width: number; height: number; };
  showBorder: boolean;
  borderWidth: number;
  borderStyle: "solid" | "dashed" | "dotted";
  orientation: "landscape" | "portrait";
  smartFill: boolean;
  padding: number;
  backgroundColor?: string;
  sections?: LabelSection[];
  sectionBorderWidth?: number; // 🔴 අලුත්: Divider ඉරි වල ඝනකම (px)
}