import React, { Component } from 'react';

import { push as Menu } from 'react-burger-menu'
import { Scrollbars } from 'react-custom-scrollbars';
import Select from 'react-select';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


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
   constructor(props) {

    super(props);

    this.state = {
      startDate: moment().startOf('day'),
      endDate:   moment().startOf('day'),
    }

    this.handleDateChange = this.handleDateChange.bind(this);
  }

  handleDateChange({startDate, endDate}){
    startDate = startDate || this.state.startDate
    endDate   = endDate   || this.state.endDate

    if (startDate.isAfter(endDate)) {
      endDate = startDate
    }

    this.setState({ 
      startDate: startDate, 
      endDate: endDate,
    })
  }


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
              <br/>
              <p className='menu-options-label'>SITE</p>
              <Select
                 styles={customSelectStyles}
              />
              <p className='menu-options-label'>DATASTREAM CLASS</p>
              <Select
                 styles={customSelectStyles}
              />
              <p className='menu-options-label'>FACILITY</p>
              <Select
                 styles={customSelectStyles}
              />
              <p className='menu-options-label'>LEVEL</p>
              <Select
                 styles={customSelectStyles}
              />
              <br/>
              <DateRange
                dateChange = {this.handleDateChange}
                startDate = {this.state.startDate}
                endDate = {this.state.endDate}
              />
              <br/>
              <p className='menu-options-label'>VARIABLE</p>
              <Select
                 styles={customSelectStyles}
              />

              <GenPlotsButton
                disabled = {this.state.getPlotsIsDisabled}
                onClick = {this.getPlots}
              />
            </div>
          </Scrollbars>
        </div>
      </div>
    );
  }
}

class DateRange extends React.Component {

  handleChangeStart = (startDate) => this.props.dateChange({ startDate })
  handleChangeEnd = (endDate) => this.props.dateChange({ endDate })

  render () {
    return <div>
      <div class='sdate-div'>
        <p className='menu-options-label'>START DATE</p>
        <DatePicker
          selected={this.props.startDate}
          selectsStart
          startDate={this.props.startDate}
          endDate={this.props.endDate}
          onChange={this.handleChangeStart}
          className="date-input"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </div>
      <div class='date-switch-div'>
        <div class="start_to_end_button" class="match_button"><i class="fas fa-long-arrow-alt-right fa-2x"></i></div>
        <div class="end_to_start_button" class="match_button"><i class="fas fa-long-arrow-alt-left fa-2x"></i></div>
      </div>
      <div class='edate-div'>
        <p className='menu-options-label'>END DATE</p>
        <DatePicker
          selected={this.props.endDate}
          selectsEnd
          startDate={this.props.startDate}
          endDate={this.props.endDate}
          onChange={this.handleChangeEnd} 
          className="date-input"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </div>
    </div>
  }
}

class GenPlotsButton extends React.Component {

  render(){
    return <div className='plot-menu-button-div'>
      <button disabled={this.props.disabled} onClick={this.props.onClick} className='plot-menu-button'>Get Plots</button>
    </div>
  }
}

export default App;
