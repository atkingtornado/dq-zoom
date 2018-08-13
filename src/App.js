import React, { Component } from 'react';

import { push as Menu } from 'react-burger-menu'
import Select from 'react-select';
import { Scrollbars } from 'react-custom-scrollbars';

import logo from './img/ARM_Logo_2017reverse.png';
import './App.css';



// Define all constants to be used throughout the app
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    'border': state.isFocused ? 'none' : 'none',
    'box-shadow': state.isFocused ? 'none' : 'none',
    'cursor': 'pointer'
  }),
  option: (base, state) => ({
    ...base,
    'cursor': 'pointer',
    'backgroundColor': state.isDisabled ? null: state.isSelected ? 'rgba(75, 95, 115, 0.2)' : state.isFocused ? 'rgba(75, 95, 115, 0.05)' : null,
    'color': '#000000'
  })
}

class App extends Component {
  render() {
    return (
      <div id="outer-container">
        <Menu isOpen noOverlay pageWrapId={ "page-wrap" } outerContainerId={ "outer-container" }>
          <div className='menu-options'>
            <PlotSelectMenu/>
          </div>
        </Menu>
        {/*<div className='sidebar'>

        </div>*/}
        <main id="page-wrap">
          <div className='plot-area'>

          </div>
        </main>
      </div>
    );
  }
}

class PlotSelectMenu extends Component {

  render(){
    return( <div tabIndex="0" style={{height:'100%'}}>
        <div className='menu-header'>
          <span><img className='menu-header-logo' src={logo}/></span>
          <p className='menu-header-text'>DQ-Zoom Plotter</p>
        </div>
        <div className='menu-options-scroll'>
          <Scrollbars style={{ width: '100%', height: '100%'}} >
            <div className='menu-options-inner'>
              <p className='menu-options-label'>DATASTREAM</p>
              <Select
                 styles={customSelectStyles}
              />
            </div>
          </Scrollbars>
        </div>
      </div>
    );
  }
}

export default App;
