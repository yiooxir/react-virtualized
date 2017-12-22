class Register {
  private scrollCliendDOMRef

  constructor() {}

  set scrollClient(element: HTMLElement) {
    this.scrollCliendDOMRef = element
  }

  get scrollClient(): HTMLElement {
    return this.scrollCliendDOMRef
  }
}

const register = new Register()

export {
  register
}
