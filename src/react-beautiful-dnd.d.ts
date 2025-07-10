declare module 'react-beautiful-dnd' {
  import * as React from 'react';

  export interface DraggableProvided {
    draggableProps: {
      style?: React.CSSProperties;
      [key: string]: any;
    };
    dragHandleProps: {
      [key: string]: any;
    } | null;
    innerRef: (element: HTMLElement | null) => void;
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    placeholder?: React.ReactNode;
    droppableProps: {
      [key: string]: any;
    };
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    draggingOver?: string;
    dropAnimation?: {
      duration: number;
      curve: string;
      moveTo: {
        x: number;
        y: number;
      };
    };
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: string;
    draggingFromThisWith?: string;
    isUsingPlaceholder: boolean;
  }

  export interface DraggableProps {
    draggableId: string;
    index: number;
    children: (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot
    ) => React.ReactNode;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    shouldRespectForcePress?: boolean;
  }

  export interface DroppableProps {
    droppableId: string;
    children: (
      provided: DroppableProvided,
      snapshot: DroppableStateSnapshot
    ) => React.ReactNode;
    type?: string;
    mode?: 'standard' | 'virtual';
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    direction?: 'horizontal' | 'vertical';
    ignoreContainerClipping?: boolean;
    renderClone?: (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
      rubric: any
    ) => React.ReactNode;
    getContainerForClone?: () => HTMLElement;
  }

  export interface DragDropContextProps {
    onDragEnd: (result: DropResult) => void;
    onDragStart?: (initial: any) => void;
    onDragUpdate?: (update: any) => void;
    children: React.ReactNode;
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
    destination: {
      droppableId: string;
      index: number;
    } | null;
    reason: 'DROP' | 'CANCEL';
  }

  export const DragDropContext: React.FC<DragDropContextProps>;
  export const Droppable: React.FC<DroppableProps>;
  export const Draggable: React.FC<DraggableProps>;
}
