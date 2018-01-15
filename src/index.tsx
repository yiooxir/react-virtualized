import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import {VirtualList} from "../src/virtual";

class Item extends Component<any> {
  state = {
    name: this.props.name
  }

  render() {
    return (
      <div
        onClick={() => this.setState({ name: Math.random() })}
        className='inner'
        style={{height: this.props.height}}>{this.state.name}({this.props.name / 4} )</div>
    )
  }
}
{/*<Item key={i} name={i} height={`${Math.random() * 100 + 30}px`}/>*/}
const items = Array(50).fill('').map((e, i) => (
  <Item key={i.toString()} name={i} height={`100px`}/>
))

const App = () => (
  <div className="App">
    <div className="wrap" id='scroll'>
      <VirtualList
        baseWidth={120}
        maxCount={6}
        minCount={4}
        scrollSelector={'#scroll'}
      >
        {items}
      </VirtualList>
    </div>
  </div>
);

ReactDOM.render(<App />, document.getElementById('root'));

// Hot Module Replacement
// if ((module as any).hot) {
//   (module as any).hot.accept();
// }