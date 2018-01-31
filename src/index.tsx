import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { VirtualList } from "./virtual-list"

class Item extends Component<any> {
  state = {
    name: this.props.name,
    height: this.props.height
  }

  render() {
    return (
      <div
        id={ `item_${this.props.name}` }
        onClick={ () => this.setState({name: Math.random(), height: `${Math.random() * 300 + 30}px`}) }
        className='test-element inner'
        style={ {height: this.state.height} }>
        name - { this.state.name }({ this.props.name / 4 } )
      </div>
    )
  }
}

const MainItem = () => {
  return <div key={ 'ert' }>main item</div>
}

let index = 0

const generateItem = (i) => {
  index = i
  return <Item key={ i.toString() } name={ i } height={ `${Math.random() * 300 + 30}px` }/>
}

// console.time('start')
const items = Array(20).fill('').map((e, i) => generateItem(i))
// console.timeEnd('start')
// console.time('render')
class App extends Component {
  state = {
    items: items
  }

  addItem = () => {
    this.setState({
      items: [generateItem(index + 999), ...this.state.items]
    })
  }

  render() {
    const items = [MainItem(), ...this.state.items]
    return (
      <div className="App">
        <button onClick={ this.addItem }>add item</button>
        <div className="wrap" id='scroll'>
          <div>123</div>
          <VirtualList
            virtual={ true }
            baseWidth={ 120 }
            maxCount={ 2 }
            minCount={ 1 }
            scrollSelector={ '#scroll' }
          >
            { items }
          </VirtualList>
        </div>
      </div>
    )
  }

}

ReactDOM.render(<App/>, document.getElementById('root'));

// Hot Module Replacement
// if ((module as any).hot) {
//   (module as any).hot.accept();
// }