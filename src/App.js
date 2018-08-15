import React, { Component } from 'react';

// import { push as Menu } from 'react-burger-menu'
import AbortController from 'abort-controller';
import Menu from 'react-burger-menu/lib/menus/push';
import { Scrollbars } from 'react-custom-scrollbars';
import Select from 'react-select';
import AsyncSelect from 'react-select/lib/Async';
import Plot from 'react-plotly.js';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';



import logo from './img/ARM_Logo_2017reverse.png';
import './App.css';


import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLongArrowAltRight, faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons'
library.add(faLongArrowAltRight)
library.add(faLongArrowAltLeft)



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

const goodColor = '#00BD70'
const okColor   = '#5b9bc3'
const badColor  = '#c35b5b'

const reqController = new window.AbortController()
const reqSignal = reqController.signal






class App extends Component {

  constructor(props) {
    super(props)

    this.handleMenuChange = this.handleMenuChange.bind(this);
    this.generatePlot = this.generatePlot.bind(this)

    this.state = {
      plotData: [{x: [],y: [],type: 'scatter',mode: 'lines+points',marker: {color: 'red'}}],
      menuIsOpen: true
    }

  }

  handleMenuChange(state) {
    console.log(state.isOpen)
    this.setState({'menuIsOpen':state.isOpen}, () => {
      window.setTimeout(function(){
        window.dispatchEvent(new Event('resize'));
      }, 500)
    })
  };

  generatePlot(reqData){
    fetch('http://dev.arm.gov/~aking/dq/dq-zoom/cgi-bin/get_data.py', {
      headers: {'Content-Type':'application/json'},
      method: 'post',
      signal: reqSignal,
      body: JSON.stringify(reqData)
    }).then(function(response) {
      return response.json();
    }).then((result) => {



      console.log(result)
    });
  }

  render() {
    return (
      <div id="outer-container">
        <Menu onStateChange={ this.handleMenuChange } isOpen={this.state.menuIsOpen} noOverlay pageWrapId={ "page-wrap" } outerContainerId={ "outer-container" }>
          <div className='menu-options'>
            <PlotSelectMenu generatePlot={this.generatePlot} plotData={this.state.plotData}/>
          </div>
        </Menu>
        {/*<div className='sidebar'>

        </div>*/}
        <main style={{width: this.state.menuIsOpen? 'calc(100% - 300px)': '100%'}} id="page-wrap">
          <InteractivePlot/>
        </main>
      </div>
    );
  }
}


class InteractivePlot extends Component {

  render() {
    return(
      <div className='plot-area'>
        <div style={{padding:20, height:'100%'}}>
          <div style={{height:'70%'}}>
            <Plot
              data={this.props.plotData}
              layout={ {autosize: true, title: 'Interactive Plot',  margin: {l: 80,r: 20,b: 80,t: 100}} }
              useResizeHandler={true}
              style={ {width: "100%", height: "100%"} }
            />
          </div>
          <div style={{height:'30%'}}>
            <Plot
              data={[
                {
                  x: [],
                  y: [],
                  type: 'histogram',
                }
              ]}
              layout={{autosize: true, margin: {l: 80,r: 20,b: 0,t: 20} }}
              
              config={{
                displayModeBar:false
              }}
              useResizeHandler={true}
              style={ {width: "100%", height: "100%"} }
            />
          </div>
        </div>
      </div>
    );
  }

}

class PlotSelectMenu extends Component {
   constructor(props) {
    super(props);

    this.state = {
      dsTree:             {},
      datastreams:        [],
      selectedDatastream: '',
      dsLoaded:           false,
      sites:              [],
      selectedSite:       '',
      classes:            [],
      selectedClass:      '',
      levels:             [],
      selectedFacility:   '',
      facilities:         [],
      selectedLevel:      '',
      variables:          [],
      selectedVariable:   '',
      variableInfoText:   'Select a date to get available variables',
      variableInfoTextColor:  okColor,
      coordVars:          [],
      selectedCoordVar:   '',
      coordVarLabel:      '',
      coordVarDim:        '',
      coordVarData:       {},
      has2D:              false,
      startDate:          moment().startOf('day'),
      endDate:            moment().startOf('day'),
      dates:              [],
      dateInfoText:       'Select a datastream to get available dates',
      dateInfoTextColor:  okColor,
      genPlotsIsDisabled: true,
    }

    this.handleDsChange       = this.handleDsChange.bind(this);
    this.handleSiteChange     = this.handleSiteChange.bind(this);
    this.handleClassChange    = this.handleClassChange.bind(this);
    this.handleFacilityChange = this.handleFacilityChange.bind(this);
    this.handleLevelChange    = this.handleLevelChange.bind(this);
    this.handleDateChange     = this.handleDateChange.bind(this);
    this.handleDateSwitch     = this.handleDateSwitch.bind(this);
    this.handleVariableChange = this.handleVariableChange.bind(this);
    this.handleCoordVarChange = this.handleCoordVarChange.bind(this);
    this.getDatastreams       = this.getDatastreams.bind(this);
    this.getDates             = this.getDates.bind(this);
    this.getVariables         = this.getVariables.bind(this);
    this.loadOptions          = this.loadOptions.bind(this);
    this.decomposeDatastream  = this.decomposeDatastream.bind(this);
    this.genPlots             = this.genPlots.bind(this)
  }

  handleDsChange(selectedOption){

    if(selectedOption.length !== 0){

      let selectedSite     = this.decomposeDatastream(selectedOption.value)['site']
      let selectedClass    = this.decomposeDatastream(selectedOption.value)['instrument']
      let selectedFacility = this.decomposeDatastream(selectedOption.value)['facility']
      let selectedLevel    = this.decomposeDatastream(selectedOption.value)['data_level']

      let tempSites        = Object.keys(this.state.dsTree)
      let tempClasses      = Object.keys(this.state.dsTree[selectedSite])
      let tempFacilities   = Object.keys(this.state.dsTree[selectedSite][selectedClass])
      let tempLevels       = this.state.dsTree[selectedSite][selectedClass][selectedFacility]



      this.setState({
        selectedDatastream:selectedOption,
        sites: tempSites.map((s, i) => ({ value: s, label: s })),
        classes: tempClasses.map((c, i) => ({ value: c, label: c })),
        facilities: tempFacilities.map((f, i) => ({ value: f, label: f })),
        levels: tempLevels.map((l, i) => ({ value: l, label: l })),
        selectedSite: { value: selectedSite, label: selectedSite },
        selectedClass: { value: selectedClass, label: selectedClass },
        selectedFacility: { value: selectedFacility, label:  selectedFacility },
        selectedLevel: { value: selectedLevel, label: selectedLevel },

      })
    }
    else{
      this.setState({
        selectedDatastream:selectedOption,
      })
    }
  }

  handleSiteChange(selectedOption){
    if(selectedOption.length !== 0){

      let selectedSite     = selectedOption.value

      let tempClasses      = Object.keys(this.state.dsTree[selectedSite])
      let selectedClass    = tempClasses[0]

      let tempFacilities   = Object.keys(this.state.dsTree[selectedSite][selectedClass])
      let selectedFacility = tempFacilities[0]

      let tempLevels       = this.state.dsTree[selectedSite][selectedClass][selectedFacility]
      let selectedLevel    = tempLevels[0]

      let selectedDatastream = selectedSite.toLowerCase() + selectedClass + selectedFacility + '.' + selectedLevel


      this.setState({
        selectedSite: selectedOption,
        classes: tempClasses.map((c, i) => ({ value: c, label: c })),
        facilities: tempFacilities.map((f, i) => ({ value: f, label: f })),
        levels: tempLevels.map((l, i) => ({ value: l, label: l })),
        selectedClass: { value: selectedClass, label: selectedClass },
        selectedFacility: { value: selectedFacility, label:  selectedFacility },
        selectedLevel: { value: selectedLevel, label: selectedLevel },
        selectedDatastream: { value: selectedDatastream, label: selectedDatastream },
      })
    }
    else{
      this.setState({
        selectedSite: selectedOption,
        classes: [],
        facilities: [],
        levels: [],
        selectedClass: '',
        selectedFacility: '',
        selectedLevel: '',
        selectedDatastream: '',
      })
    }
  }

  handleClassChange(selectedOption){
    if(selectedOption.length !== 0){
      let selectedSite     = this.state.selectedSite.value
      let selectedClass    = selectedOption.value

      let tempFacilities   = Object.keys(this.state.dsTree[selectedSite][selectedClass])
      let selectedFacility = tempFacilities[0]

      let tempLevels       = this.state.dsTree[selectedSite][selectedClass][selectedFacility]
      let selectedLevel    = tempLevels[0]

      let selectedDatastream = selectedSite.toLowerCase() + selectedClass + selectedFacility + '.' + selectedLevel


      this.setState({
        facilities: tempFacilities.map((f, i) => ({ value: f, label: f })),
        levels: tempLevels.map((l, i) => ({ value: l, label: l })),
        selectedClass: selectedOption,
        selectedFacility: { value: selectedFacility, label:  selectedFacility },
        selectedLevel: { value: selectedLevel, label: selectedLevel },
        selectedDatastream: { value: selectedDatastream, label: selectedDatastream },
      })
    }
    else{
      this.setState({
        facilities: [],
        levels: [],
        selectedClass: selectedOption,
        selectedFacility: '',
        selectedLevel: '',
        selectedDatastream: '',
      })
    }
  }

  handleFacilityChange(selectedOption){

    if(selectedOption.length !== 0){
      let selectedSite     = this.state.selectedSite.value
      let selectedClass    = this.state.selectedClass.value
      let selectedFacility = selectedOption.value

      let tempLevels       = this.state.dsTree[selectedSite][selectedClass][selectedFacility]
      let selectedLevel    = tempLevels[0]

      let selectedDatastream = selectedSite.toLowerCase() + selectedClass + selectedFacility + '.' + selectedLevel

      this.setState({
        levels: tempLevels.map((l, i) => ({ value: l, label: l })),
        selectedFacility: selectedOption,
        selectedLevel: { value: selectedLevel, label: selectedLevel },
        selectedDatastream: { value: selectedDatastream, label: selectedDatastream },
      })
    }
    else{
      this.setState({
        levels: [],
        selectedFacility: selectedOption,
        selectedLevel: '',
        selectedDatastream: '',
      })
    }
  }

  handleLevelChange(selectedOption){
    if(selectedOption.length !== 0){
      let selectedSite     = this.state.selectedSite.value
      let selectedClass    = this.state.selectedClass.value
      let selectedFacility = this.state.selectedFacility.value
      let selectedLevel    = selectedOption.value

      let selectedDatastream = selectedSite.toLowerCase() + selectedClass + selectedFacility + '.' + selectedLevel

      this.setState({
        selectedLevel: selectedOption,
        selectedDatastream: { value: selectedDatastream, label: selectedDatastream },
      })
    }
    else{
      this.setState({
        selectedLevel: selectedOption,
        selectedDatastream: '',
      })
    }
  }

  handleDateSwitch(type){
    if(type === 'starttoend'){
      this.setState({ 
        endDate: this.state.startDate,
      })
    }
    else{
      this.setState({ 
        startDate: this.state.endDate,
      })
    }
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

  handleVariableChange(selectedOption){

    let has2D = false
    let coordVarLabel = ''
    let coordVarDim= ''
    let coordVars = []

    if(selectedOption.value in this.state.coordVarData){
      has2D = true
      coordVarLabel = this.state.coordVarData[selectedOption.value].coord_label
      coordVars = this.state.coordVarData[selectedOption.value].coord_data.map((v, i) => ({ value: v, label: v }))
      coordVarDim = this.state.coordVarData[selectedOption.value].coord_dim
    }

    if(has2D){
      coordVars.unshift({ value: 'all', label: 'ALL (2D Plot)' })
    }
    

    this.setState({
      has2D: has2D,
      selectedVariable: selectedOption,
      coordVarLabel: coordVarLabel,
      coordVarDim: coordVarDim,
      selectedCoordVar: coordVars[0],
      coordVars: coordVars
    })
  }

  handleCoordVarChange(selectedOption){
    this.setState({
      selectedCoordVar: selectedOption,
    })
  }

  getDatastreams(){
    fetch('http://dev.arm.gov/~aking/dq/dq-zoom/cgi-bin/list_datastreams.py', {reqSignal}).then(function (response) {
      return response.json();
    }).then((result) => {
      let dsOptions = result.datastreams.map((ds, i) => ({ value: ds, label: ds }))
      let tempDsTree = {}

      for (let i=0; i<result.datastreams.length; i++){

          let ds_parts = this.decomposeDatastream(result.datastreams[i])
          let site = ds_parts["site"];
          let instrument = ds_parts["instrument"];
          let facility = ds_parts["facility"];
          let data_level = ds_parts["data_level"];

          

          if (!tempDsTree[site]) tempDsTree[site] = {};
          if (!tempDsTree[site][instrument]) tempDsTree[site][instrument] = {};
          if (!tempDsTree[site][instrument][facility]) tempDsTree[site][instrument][facility] = [];
          if (-1 === tempDsTree[site][instrument][facility].indexOf(data_level)) tempDsTree[site][instrument][facility].push(data_level);

      }

      let selectedSite     = this.decomposeDatastream(dsOptions[0].value)['site']
      let selectedClass    = this.decomposeDatastream(dsOptions[0].value)['instrument']
      let selectedFacility = this.decomposeDatastream(dsOptions[0].value)['facility']
      let selectedLevel    = this.decomposeDatastream(dsOptions[0].value)['data_level']

      let tempSites        = Object.keys(tempDsTree)
      let tempClasses      = Object.keys(tempDsTree[selectedSite])
      let tempFacilities   = Object.keys(tempDsTree[selectedSite][selectedClass])
      let tempLevels       = tempDsTree[selectedSite][selectedClass][selectedFacility]


      this.setState({
        dsTree:tempDsTree,
        datastreams:dsOptions,
        selectedDatastream:dsOptions[0],
        sites: tempSites.map((s, i) => ({ value: s, label: s })),
        classes: tempClasses.map((c, i) => ({ value: c, label: c })),
        facilities: tempFacilities.map((f, i) => ({ value: f, label: f })),
        levels: tempLevels.map((l, i) => ({ value: l, label: l })),
        selectedSite: { value: selectedSite, label: selectedSite },
        selectedClass: { value: selectedClass, label: selectedClass },
        selectedFacility: { value: selectedFacility, label:  selectedFacility },
        selectedLevel: { value: selectedLevel, label: selectedLevel },

        dsLoaded:true
      })

    }).catch(error => {
      if (error.name === 'AbortError') return;
    });
  }

  getDates(ds){
    this.setState({
      dateInfoText: 'Fetching available dates...',
      dateInfoTextColor: okColor,
      variableInfoText: 'Select a date to get available variables',
      variableInfoTextColor: okColor,
      variables: [],
      selectedVariable: '',
      coordVars: [],
      selectedCoordVar: '',
      has2D: false,
      genPlotsIsDisabled: true
    })
    console.log(ds, JSON.stringify(ds))
    fetch('http://dev.arm.gov/~aking/dq/dq-zoom/cgi-bin/get_dates.py', {
      headers: {'Content-Type':'application/json'},
      method: 'post',
      signal: reqSignal,
      body: JSON.stringify({"ds":ds})
    }).then(function(response) {
      return response.json();
    }).then((result) => {
      let momentDates = []
      for(let i=0;i<result.dates.length;i++){
        momentDates.push(moment(result.dates[i]))
      }
      this.setState({
        startDate: moment(result.dates[result.dates.length-1]),
        endDate: moment(result.dates[result.dates.length-1]),
        dates: momentDates,
        dateInfoText: "Data available from " + moment(result.sdate).format('MM/DD/YYYY') + ' to ' + moment(result.edate).format('MM/DD/YYYY'),
        dateInfoTextColor:  goodColor,
      })
      this.getVariables(ds, moment(result.sdate).format('YYYY/MM/DD'))
    });
  }

  getVariables(ds, sdate){
    this.setState({
      variableInfoText: 'Fetching available variables...',
      variableInfoTextColor:  okColor,
    })
    console.log(JSON.stringify({"ds":ds,"sdate":sdate}))
    fetch('http://dev.arm.gov/~aking/dq/dq-zoom/cgi-bin/get_variables.py', {
      headers: {'Content-Type':'application/json'},
      method: 'post',
      signal: reqSignal,
      body: JSON.stringify({"ds":ds,"sdate":sdate})
    }).then(function(response) {
      return response.json();
    }).then((result) => {
      let tempVars = []
      let coordVarData = {}

      for(let i=0; i<result.variables.length;i++){
        if(result.variable_dims.num_dims[i] > 1){
          tempVars.push({ value: result.variables[i], label: result.variables[i] + ' (2D)' })
          coordVarData[result.variables[i]] = {"coord_data":result.coord_data[result.variable_dims.coord_var[i]].data, "coord_label":result.coord_data[result.variable_dims.coord_var[i]].label.toUpperCase(), "coord_dim": result.variable_dims.coord_var[i]}
        }
        else{
          tempVars.push({ value: result.variables[i], label: result.variables[i] })
        }
      }

      tempVars.sort(function(a, b) {
        var nameA = a.label.toUpperCase(); // ignore upper and lowercase
        var nameB = b.label.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });



      this.setState({
        variableInfoText: result.variables.length + ' available variables',
        variableInfoTextColor:  goodColor,
        variables: tempVars,
        selectedVariable: tempVars[0],
        genPlotsIsDisabled: false,
        coordVarData: coordVarData
      }, () => {
        this.handleVariableChange(tempVars[0])
      })
      console.log(result)
    });
  }

  decomposeDatastream(datastream){
    let site = ''
    let instrument = ''
    let facility = ''
    let data_level = ''

    if(datastream!==''){
      let dot_index = datastream.indexOf(".");
      let instrument_and_facility = datastream.slice(3, dot_index);

      site = datastream.slice(0,3).toUpperCase();
      data_level = datastream.slice(dot_index + 1);
      let facility_index = instrument_and_facility.search(/[A-Z]+[0-9]+/);
      instrument = instrument_and_facility.slice(0, facility_index);
      facility = instrument_and_facility.slice(facility_index);
    }

    return {"site": site, "instrument": instrument, "facility": facility, "data_level":data_level};
  }


  genPlots(){
    let reqData = {
      'ds':this.state.selectedDatastream.value,
      'sdate':this.state.startDate.format('YYYY-MM-DD'),
      'edate':this.state.endDate.format('YYYY-MM-DD'),
      'variable': this.state.selectedVariable.value,
      'coordinate': this.state.has2D ? this.state.selectedCoordVar.value : '',
      'qc_check': '',
      'coord_dim': this.state.has2D ? this.state.coordVarDim : '',
    }
    this.props.generatePlot(reqData)
  }


  loadOptions = inputValue =>
    new Promise(resolve => {
      if(inputValue !== ''){
        setTimeout(() => {
        resolve(this.state.datastreams.filter(i => i.label.toLowerCase().startsWith(inputValue.toLowerCase())));
        }, 1000);
      }
      else{
         resolve([])
      }

  });


  componentDidUpdate(prevProps, prevState, snapshot) {
    if(this.state.selectedDatastream.value !== prevState.selectedDatastream.value && typeof this.state.selectedDatastream.value !== 'undefined'){
      this.getDates(this.state.selectedDatastream.value)
    }
  }

  componentDidMount(){
    this.getDatastreams()
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
              <AsyncSelect
                isDisabled={!this.state.dsLoaded}
                cacheOptions
                styles={customSelectStyles}
                loadOptions={this.loadOptions}
                noOptionsMessage={() => 'Start typing to see options.'}
                onChange={this.handleDsChange}
                value={this.state.selectedDatastream}
              />
              <p className='menu-options-info' style={this.state.dsLoaded ? {color:goodColor} : {color:okColor}}> {this.state.dsLoaded ? this.state.datastreams.length + ' available datastreams': 'Fetching datastream options...'} </p>
              <br/>
              <p className='menu-options-label'>SITE</p>
              <Select
                isDisabled={!this.state.sites.length > 0}
                options={this.state.sites}
                styles={customSelectStyles}
                onChange={this.handleSiteChange}
                value={this.state.selectedSite}
              />
              <p className='menu-options-label'>DATASTREAM CLASS</p>
              <Select
                isDisabled={!this.state.classes.length > 0}
                options={this.state.classes}
                styles={customSelectStyles}
                onChange={this.handleClassChange}
                value={this.state.selectedClass}
              />
              <p className='menu-options-label'>FACILITY</p>
              <Select
                isDisabled={!this.state.facilities.length > 0}
                options={this.state.facilities}
                styles={customSelectStyles}
                onChange={this.handleFacilityChange}
                value={this.state.selectedFacility}
              />
              <p className='menu-options-label'>LEVEL</p>
              <Select
                isDisabled={!this.state.levels.length > 0}
                options={this.state.levels}
                styles={customSelectStyles}
                onChange={this.handleLevelChange}
                value={this.state.selectedLevel}
              />
              <br/>
              <DateRange
                dateChange = {this.handleDateChange}
                dateSwitch = {this.handleDateSwitch}
                startDate = {this.state.startDate}
                endDate = {this.state.endDate}
                dates = {this.state.dates}
              />
              <p className='menu-options-info' style={{ marginTop:20, color:this.state.dateInfoTextColor}}>{this.state.dateInfoText}</p>
              <br/>
              <p className='menu-options-label'>VARIABLE</p>
              <Select
                isDisabled={!this.state.variables.length > 0}
                options={this.state.variables}
                styles={customSelectStyles}
                onChange={this.handleVariableChange}
                value={this.state.selectedVariable}
              />
              <p className='menu-options-info' style={{color:this.state.variableInfoTextColor}}>{this.state.variableInfoText}</p>
              {this.state.has2D ? 
                <div>
                  <p className='menu-options-label'>{this.state.coordVarLabel}</p>
                  <Select
                    isDisabled={!this.state.coordVars.length > 0}
                    options={this.state.coordVars}
                    styles={customSelectStyles}
                    onChange={this.handleCoordVarChange}
                    value={this.state.selectedCoordVar}
                  />
                </div>
                :
                <div></div>
              }

              <GenPlotsButton
                disabled = {this.state.genPlotsIsDisabled}
                onClick = {this.genPlots}
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
      <div className='sdate-div'>
        <p className='menu-options-label'>START DATE</p>
        <DatePicker
          selected={this.props.startDate}
          selectsStart
          startDate={this.props.startDate}
          endDate={this.props.endDate}
          includeDates={this.props.dates}
          onChange={this.handleChangeStart}
          className="date-input"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </div>
      <div className='date-switch-div'>
        <div onClick={()=>this.props.dateSwitch('starttoend')} className="start_to_end_button match_button"><FontAwesomeIcon size="2x" icon="long-arrow-alt-right" /></div>
        <div onClick={()=>this.props.dateSwitch('endtostart')} className="end_to_start_button match_button"><FontAwesomeIcon size="2x" icon="long-arrow-alt-left" /></div>
      </div>
      <div className='edate-div'>
        <p className='menu-options-label'>END DATE</p>
        <DatePicker
          selected={this.props.endDate}
          selectsEnd
          startDate={this.props.startDate}
          endDate={this.props.endDate}
          includeDates={this.props.dates}
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
      <button disabled={this.props.disabled} onClick={this.props.onClick} className='plot-menu-button'>Generate Plots</button>
    </div>
  }
}

export default App;
