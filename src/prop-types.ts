
const ElementType = (props, propName, componentName) => {
  if (props[propName] !== undefined && props[propName] instanceof Element === false) {
    return new Error(
      'Invalid prop `' + propName + '` supplied to' +
      ' `' + componentName + '`. Validation failed.'
    );
  }
}

const BooleanType = (props, propName, componentName) => {
  if (props[propName] !== undefined && typeof  props[propName] !== 'boolean') {
    return new Error(
      'Invalid prop `' + propName + '` supplied to' +
      ' `' + componentName + '`. Validation failed.'
    );
  }
}

export const PropTypes = {
  HTMLElement: ElementType,
  Boolean: BooleanType
}
