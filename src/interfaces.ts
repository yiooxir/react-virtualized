import React from 'react'

type Height = number
type Width = number
export type Sizes = {[key: string]: Height}

export namespace SizeBufferNs {
  export interface Props {
    onSizes: (arg: Sizes) => void
    sizeBufferDOMRef: (arg: HTMLDivElement) => void
  }
}

export namespace WithSizeNs {
  export interface State {
    sizes: Sizes
    width: Width
    count: number
    firstVirtualIndex: number,
    lastVirtualIndex: number
  }

  export interface Props {
    virtual: boolean
    baseWidth: number
    minCount: number
    maxCount: number
    scrollSelector: string
  }
}

export namespace VirtualListNs {
  export interface State {

  }

  export interface Props extends WithSizeNs.Props {
    options?: WithSizeNs.State
    wrapRef?: React.Ref<HTMLElement>
  }
}

export namespace VirtualColNs {
  export interface Props {
    options?: WithSizeNs.State
    index: number
  }
}

export namespace Utils {
  export interface NormalizeCountArgs {
    min?: number
    max?: number
  }

  export const defaultNCArgs = {
    min: 1,
    max: 99999999
  }
}


