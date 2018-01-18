import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { VirtualList } from "./virtual"

class Item extends Component<any> {
  state = {
    name: this.props.name,
    height: this.props.height
  }

  render() {
    return (
      <div
        id={ this.props.name }
        onClick={ () => this.setState({name: Math.random(), height: `${Math.random() * 300 + 30}px`}) }
        className='test-element inner'
        style={ {height: this.state.height} }>{ this.state.name }({ this.props.name / 4 } )</div>
    )
  }
}

const items = Array(50).fill('').map((e, i) => (
  <Item key={ i.toString() } name={ i } height={ `${Math.random() * 300 + 30}px` }/>
))

const App = () => (
  <div className="App">
    <div className="wrap" id='scroll'>
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
);

ReactDOM.render(<App/>, document.getElementById('root'));

// Hot Module Replacement
// if ((module as any).hot) {
//   (module as any).hot.accept();
// }