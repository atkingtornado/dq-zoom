import React, { Component } from 'react';

// import { push as Menu } from 'react-burger-menu'
// import 'abortcontroller-polyfill/dist/polyfill-patch-fetch'
import axios from 'axios';
import * as math from 'mathjs';
import Menu from 'react-burger-menu/lib/menus/push';
import { Scrollbars } from 'react-custom-scrollbars';
import Select from 'react-select';
import Toggle from 'react-toggle'
import AsyncSelect from 'react-select/lib/Async';
import Plot from 'react-plotly.js';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-toggle/style.css';


import logo from './img/ARM_Logo_2017reverse.png';
import './App.css';


import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLongArrowAltRight, faLongArrowAltLeft, faSpinner } from '@fortawesome/free-solid-svg-icons'
library.add(faLongArrowAltRight, faLongArrowAltLeft, faSpinner)

var nj = require('numjs');

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

const max_size = 100000;

const plotOptions = {
  scrollZoom: true, 
  displaylogo: false,
  modeBarButtonsToRemove: ['sendDataToCloud','toImage'],
}


const CancelToken = axios.CancelToken;
let cancel;


class App extends Component {

  constructor(props) {
    super(props)

    this.handleMenuChange = this.handleMenuChange.bind(this);
    this.generatePlot = this.generatePlot.bind(this);
    this.checkNull = this.checkNull.bind(this);
    this.checkBad = this.checkBad.bind(this);
    this.formatDate = this.formatDate.bind(this);
    this.formatTitleDate = this.formatTitleDate.bind(this)
    this.closest = this.closest.bind(this)
    this.createHist = this.createHist.bind(this)
    this.getStats = this.getStats.bind(this)
    this.handlePlotChange = this.handlePlotChange.bind(this)
    this.handlePlotClick = this. handlePlotClick.bind(this)
    this.handleTimeLoggingToggle = this.handleTimeLoggingToggle.bind(this)

    this.state = {
      allData: {},
      plotData: [{x: [],y: [],type: 'scatter',mode: 'lines+points',marker: {color: 'red'}}],
      plotLayout: {autosize: true, title: 'Interactive Plot',  margin: {l: 80,r: 40,b: 80,t: 100}},
      histData: [{x: [],y: [],type: 'histogram'}],
      histLayout: {autosize: true, margin: {l: 80,r: 40,b: 80,t: 10} },
      histLabel: '',
      menuIsOpen: true,
      plotIs2D: false,
      plotIsLoading: false,
      timeLoggingIsActive: false,
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

  handleTimeLoggingToggle() { 
    this.setState({
      timeLoggingIsActive: !this.state.timeLoggingIsActive
    })
  }

  checkNull(val) {
    return val === null;
  }

  checkBad(val){
    if (val === -9999){
      return null;
    }
    else{
      return val;
    }
  }

  formatDate(dateobj){
    let tempYear = dateobj.getUTCFullYear()
    let tempMonth = dateobj.getUTCMonth() + 1
    let tempDay = dateobj.getUTCDate()
    let tempHour = dateobj.getUTCHours()
    let tempMinute = dateobj.getUTCMinutes()
    let tempSecond = dateobj.getUTCSeconds()


    if (tempMonth < 10) {
      tempMonth = "0" + tempMonth
    }
    if (tempDay < 10) {
      tempDay= "0" + tempDay
    }
    if (tempHour < 10) {
      tempHour = "0" + tempHour
    }
    if (tempMinute < 10) {
      tempMinute = "0" + tempMinute
    }
    if (tempSecond < 10) {
      tempSecond = "0" + tempSecond
    }

    return tempYear+'-'+tempMonth+'-'+tempDay+' '+tempHour+':'+tempMinute+':'+tempSecond
  }

  formatTitleDate(datestring){
    let tempYear = datestring.substring(0,4)
    let tempMonth = datestring.substring(5,7)
    let tempDay = datestring.substring(8,10)
    let tempHour = datestring.substring(11,13)
    let tempMinute = datestring.substring(14,16)
    let tempSecond = datestring.substring(17,19)

    let titleDate = tempYear+tempMonth+tempDay+'.'+tempHour+tempMinute+tempSecond

    return titleDate
  }

  closest (arr, num) {
    let curr = arr[0];
    let diff = Math.abs (num - curr);
    for (let val = 0; val < arr.length; val++) {
      let newdiff = Math.abs (num - arr[val]);
      if (newdiff < diff) {
        diff = newdiff;
        curr = val;
      }
    }
    return curr;
  }

  createHist(data, min, max){
    let hist_xlabel = this.state.histLabel
    let layout_h = 
    {
      margin: {
        l: 80,
        r: 40,
        b: 80,
        t: 10,
      },
      xaxis: {
        title: hist_xlabel,
        fixedrange: true
      },
      yaxis: {
        fixedrange: true
      },
    }
    let hbin=(max-min)/20.
    let hist_trace=[{
      x: data,
      name: 'histogram',
      type: "histogram",
      xbins: {
        end: max,
        size: hbin,
        start: min
      }
    }];

    this.setState({
      histData: hist_trace,
      histLayout: layout_h
    })
  }

  getStats(data){
    //flatten 2d data
    data = [].concat.apply([], data);
    let min;
    let max;
    let mean;
    let stdev;

    if(data.length == 0)
    {
      this.createHist([], 0, 0)
    }
    else
    {
      try{
        data = data.filter(function(e){ return e === 0 || e })

        let min = math.format(math.min(data),{precision: 4})
        let max = math.format(math.max(data),{precision: 4})
        let mean = math.format(math.mean(data),{precision: 4})
        let stdev = math.format(math.std(data),{precision: 4})

        this.createHist(data, min, max)
      }
      catch(err){
        this.createHist([], 0, 0)
      }
    }
  }

  handlePlotChange(eventdata){
    //Back to original zoom   
    let ds = Object.keys(this.state.allData)[0]
    if('xaxis.autorange' in eventdata && 'yaxis.autorange' in eventdata){
      let tempLayout = {...this.state.plotLayout}
      tempLayout.title = this.state.allData[ds].title;
      this.setState({plotLayout:tempLayout})

      if(this.state.plotIs2D){
        this.getStats(this.state.allData[ds].data)

        let xsize = this.state.allData[ds].time.length;
        let ysize = this.state.allData[ds].range.length;
        let i = 1
        while(xsize*ysize > max_size){
            xsize = xsize/i
            ysize = ysize/i
            i+=1
        }
        let dx = i
        let dy = i

        let new_sparse_data = nj.array(this.state.allData[ds].data).slice([null, null, dy], [null, null, dx])
        let new_sparse_times = nj.array(this.state.allData[ds].time).slice([null, null, dx])
        let new_sparse_range = nj.array(this.state.allData[ds].range).slice([null, null, dy])

        let tempPlotData = this.state.plotData

        tempPlotData[0].x = new_sparse_times.tolist()
        tempPlotData[0].y = new_sparse_range.tolist()
        tempPlotData[0].z = new_sparse_data.tolist()

        this.setState({plotData:tempPlotData})
      }
      else{
        this.getStats(this.state.allData[ds].data)
      }
    }

    // Scale data based on zoom
    else if((('xaxis.range[0]' in eventdata && 'xaxis.range[1]' in eventdata) || ('yaxis.range[0]' in eventdata && 'yaxis.range[1]' in eventdata)) ){

      let min_x_ndx = null;
      let max_x_ndx = null;

      let min_y_ndx = null;
      let max_y_ndx = null;

      // If zoomed in X
      let xsize;
      if('xaxis.range[0]' in eventdata && 'xaxis.range[1]' in eventdata){

        let indx = this.state.allData[ds].title.indexOf("for") + 3;
        let new_title = this.state.allData[ds].title.substring(0, indx + 1);
        let min_title_date = this.formatTitleDate(eventdata['xaxis.range[0]'])
        let max_title_date = this.formatTitleDate(eventdata['xaxis.range[1]'])

        new_title +=  min_title_date + "-" + max_title_date

        let tempLayout = {...this.state.plotLayout}
        tempLayout.title = new_title
        this.setState({plotLayout:tempLayout})

        let min_date = new Date(eventdata['xaxis.range[0]'].replace(/-/g, '/').split('.')[0])
        let max_date = new Date(eventdata['xaxis.range[1]'].replace(/-/g, '/').split('.')[0])
        min_x_ndx = 0
        max_x_ndx = this.state.allData[ds].time.length-1

        if(this.plotIs2D){
          min_date = this.state.allData[ds].timeObj[this.closest(this.state.allData[ds].timeObj, min_date)]
          max_date = this.state.allData[ds].timeObj[this.closest(this.state.allData[ds].timeObj, max_date)]
        }

        for(let i=0; i<this.state.allData[ds].time.length; i++){
          let curr_date = new Date(this.state.allData[ds].time[i].replace(/-/g, '/').split('.')[0])

          if(curr_date >= min_date && min_x_ndx == 0){
            min_x_ndx = i-1
          }

          if(curr_date >= max_date && max_x_ndx == this.state.allData[ds].time.length-1){
            max_x_ndx = i+2
          }
        }
        if(min_x_ndx < 0){
          min_x_ndx = 0;
        }
        if(max_x_ndx > this.state.allData[ds].time.length-1){
          max_x_ndx = this.state.allData[ds].time.length-1
        }
        xsize = max_x_ndx-min_x_ndx
      }

                
      // If zoomed in Y
      let ysize;
      if('yaxis.range[0]' in eventdata && 'yaxis.range[1]' in eventdata && this.state.plotIs2D){
        let min_range = eventdata['yaxis.range[0]']
        let max_range = eventdata['yaxis.range[1]']
        min_y_ndx = 0
        max_y_ndx = this.state.allData[ds].range.length-1

        min_range = this.state.allData[ds].range[this.closest(this.state.allData[ds].range, min_range)]
        max_range = this.state.allData[ds].range[this.closest(this.state.allData[ds].range, max_range)]

        for(let i=0; i<this.state.allData[ds].range.length; i++){
          let curr_range = this.state.allData[ds].range[i]

          if(curr_range >= min_range && min_y_ndx == 0){
            min_y_ndx = i-1
          }

          if(curr_range >= max_range && max_y_ndx == this.state.allData[ds].range.length-1){
            max_y_ndx = i+1
          }
        }
        if(min_y_ndx < 0){
          min_y_ndx = 0;
        }
        if(max_y_ndx > this.state.allData[ds].range.length){
          max_y_ndx = this.state.allData[ds].range.length
        }

        ysize = max_y_ndx-min_y_ndx
      }

      let i = 1
      while(xsize*ysize > max_size){
        xsize = xsize/i
        ysize = ysize/i
        i+=1
      }

      let dx = i
      let dy = i


      if(this.state.plotIs2D){       

        let new_sparse_data = nj.array(this.state.allData[ds].data).slice([min_y_ndx, max_y_ndx, dy], [min_x_ndx, max_x_ndx, dx])
        let new_sparse_times = nj.array(this.state.allData[ds].time).slice([min_x_ndx, max_x_ndx, dx])
        let new_sparse_range = nj.array(this.state.allData[ds].range).slice([min_y_ndx, max_y_ndx, dy])

        let tempPlotData = this.state.plotData

        tempPlotData[0].x = new_sparse_times.tolist()
        tempPlotData[0].y = new_sparse_range.tolist()
        tempPlotData[0].z = new_sparse_data.tolist()

        this.setState({plotData:tempPlotData})
        this.getStats(nj.array(this.state.allData[ds].data).slice([min_y_ndx+1, max_y_ndx, null], [min_x_ndx+1, max_x_ndx-1, null]).tolist())
      }
      else{console.log(min_x_ndx, max_x_ndx)
        this.getStats(this.state.allData[ds].data.slice(min_x_ndx+1, max_x_ndx-2))
      }
    }
  }

  handlePlotClick(data){
    console.log(data)
  }


  generatePlot(reqData, is2D){
    cancel()
    this.setState({plotIsLoading:true})
    axios.post('http://dev.arm.gov/~aking/dq/dq-zoom/cgi-bin/get_data.py', JSON.stringify(reqData), {
      cancelToken: new CancelToken(function executor(c) {
        // An executor function receives a cancel function as a parameter
        cancel = c;
      })
    }).then(res => {
      let result = res.data

      let times = result.times;
      let data = result.data;
      let dqrs = result.dqrs
      let title = result.title;
      let ylabel = result.ylabel;
      let variable = result.variable;
      let response = result.dqr_webservice_response;
      let qc_data = result.qc_data;
      let hist_xlabel = result.hist_xlabel;
      let coordlabel = result.coordlabel;

      let range = [];
      let xsize = 0;
      let ysize = 0;

      if(is2D){
        range = result.range;
        xsize = times.length;
        ysize = range.length;
      }

      let suspect_dqrs = null
      let missing_dqrs = null
      let incorrect_dqrs = null

      let suspect_dqr_numbers = []
      let missing_dqr_numbers = []
      let incorrect_dqr_numbers = []

      let sus_data = []
      let mis_data = []
      let inc_data = []

      let plot_data = []

      let colors = ['blue','purple']

      if ('suspect' in dqrs){
          suspect_dqrs = dqrs.suspect
      }else{
          suspect_dqr_numbers = null
      }
      if ('missing' in dqrs){
          missing_dqrs = dqrs.missing
      }else{
          missing_dqr_numbers = null
      }
      if ('incorrect' in dqrs){
          incorrect_dqrs = dqrs.incorrect
      }else{
          incorrect_dqr_numbers = null
      }

      for (let key in suspect_dqrs){
          suspect_dqr_numbers.push(key)
          sus_data.push(suspect_dqrs[key].data)
          colors.push("#CCCC00")
      }
      for (let key in missing_dqrs){
          missing_dqr_numbers.push(key)
          mis_data.push(missing_dqrs[key].data)
          colors.push("black")
      }
      for (let key in incorrect_dqrs){
          incorrect_dqr_numbers.push(key)
          inc_data.push(incorrect_dqrs[key].data)
          colors.push("red")
      }

      let display_qc = true

      if (qc_data === -9999) {
        display_qc = false
      } else {
        if(qc_data.every(this.checkNull)){
          display_qc = false
        }
      }

      // Loop through times and change to format expected by plotly
      let times_datetime = []
      let times_objects  = []
      for (let i=0; i < times.length; i++) {
        let userDate = new Date()
        let userOffset = userDate.getTimezoneOffset() * 60000
        let momentoffset = moment(times[i]+userOffset).utcOffset()*60000

        let temp = new Date(times[i]);

        times_objects.push(new Date(temp.getUTCFullYear(), temp.getUTCMonth(), temp.getUTCDate(), temp.getUTCHours(), temp.getUTCMinutes(), temp.getUTCSeconds() ))
        times_datetime.push(this.formatDate(temp))

        if (data[i] === -9999) {
          data[i] = null
        }
      }



      // Prepare data for plotting
      data = data.map(this.checkBad);

      if(is2D && reqData.coordinate === 'all'){
        let xsize = times_datetime.length;
        let ysize = range.length;
        let i = 1
        while(xsize*ysize > max_size){
          xsize = xsize/i
          ysize = ysize/i
          i+=1
        }
        let dx = i
        let dy = i

        let new_sparse_data = nj.array(data).slice([null, null, dy], [null, null, dx])
        let new_sparse_times = nj.array(times_datetime).slice([null, null, dx])
        let new_sparse_range = nj.array(range).slice([null, null, dy])

        plot_data.push({
            z: new_sparse_data.tolist(),
            x: new_sparse_times.tolist(),
            y: new_sparse_range.tolist(),
            colorscale: 'Jet',
            type: 'heatmap',
            name: variable,
            colorbar:{
                title: hist_xlabel,
                titleside: 'right',
            },
            zauto: true,
        })
    }
    else{
        plot_data.push({
            x: times_datetime,
            y: data,
            type: 'lines+markers',
            name: variable,
        })
    }

   if (display_qc){
      qc_data = qc_data.map(this.checkBad)
      plot_data.push({
        x: times_datetime,
        y: qc_data,
        type: 'lines+markers',
        name: "(Embedded QC)"
      })
    }

      
    for(let x=0; x < sus_data.length; ++x){
      sus_data[x] = sus_data[x].map(this.checkBad)
      plot_data.push({
        x: times_datetime,
        y: sus_data[x],
        type: 'lines+markers',
        name: suspect_dqr_numbers[x]+ " " +"<a href='https://www.archive.arm.gov/ArchiveServices/DQRService?dqrid=" + suspect_dqr_numbers[x] + "'>(Link)</a>",
        marker: {
          color: 'rgb(204, 204, 0)'
        },
        line: {
          color: 'rgb(204, 204, 0)'
        }
      })
    }

    for(let x=0; x < mis_data.length; ++x){
      mis_data[x] = mis_data[x].map(this.checkBad)
      plot_data.push({
        x: times_datetime,
        y: mis_data[x],
        type: 'lines+markers',
        name: missing_dqr_numbers[x] + " " +"<a href='https://www.archive.arm.gov/ArchiveServices/DQRService?dqrid=" + missing_dqr_numbers[x] + "'>(Link)</a>",
        marker: {
          color: 'rgb(0, 0, 0)'
        },
        line: {
          color: 'rgb(0, 0, 0)'
        }
      })
    }

    for(let x=0; x < inc_data.length; ++x){
      inc_data[x] = inc_data[x].map(this.checkBad)
      plot_data.push({
        x: times_datetime,
        y: inc_data[x],
        type: 'lines+markers',
        name: incorrect_dqr_numbers[x] + " " +"<a href='https://www.archive.arm.gov/ArchiveServices/DQRService?dqrid=" + incorrect_dqr_numbers[x] + "'>(Link)</a>",
        marker: {
            color: 'rgb(255, 0, 0)'
        },
        line: {
            color: 'rgb(255, 0, 0)'
        }           
      })
    }

    // Determine axis type to use (log/linear) based on user selection
    let axisType = 'linear'

    // Prepare day/night shading for plotting
    let shading_and_lines = []
    for(let i = 0; (i<result.sun_start.length) && (i<result.sun_end.length); i++){
        if(result.sun_start[i] != -9999 || result.sun_end[i] != -9999){
            let sun_start = new Date(result.sun_start[i])
            let sun_end = new Date(result.sun_end[i])

            let UTC_sun_start = this.formatDate(sun_start)
            let UTC_sun_end = this.formatDate(sun_end)

            let curr_shade = {
                type: 'rect',
                layer: 'below',
                xref: 'x',
                yref: 'paper',
                x0: UTC_sun_start,
                y0: 0,
                x1: UTC_sun_end,
                y1: 1,
                fillcolor: 'rgb(255, 255, 220)',
                opacity: 0.8,
                line: {
                    width: 0,
                }
            }
            shading_and_lines.push(curr_shade)
            // highlight_period(sun_start, sun_end)
        }
    }
    // Prepare vertical solar noon lines for plotting
    if(result.solar_noon != -9999){
        for(let i = 0; i < result.solar_noon.length; i++) {
            let solar_noon = new Date(result.solar_noon[i])

            let UTC_solar_noon = this.formatDate(solar_noon)

            let curr_line = {
                type: 'line',
                layer: 'below',
                xref: 'x',
                yref: 'paper',
                x0: UTC_solar_noon,
                y0: 0,
                x1: UTC_solar_noon,
                y1: 1,
                line: {
                    color: '#e9d710',
                    width: 2,
                    dash: 'dash',
                }
            }
            
            shading_and_lines.push(curr_line)
        }
    }

    let layout = {
        showlegend: true,
        legend: {
            bgcolor:'rgba(100, 100, 100, 0.1)',
            x: 0,
            y: 1
        },
        title: title,
        // autosize: true,
        plot_bgcolor: 'rgb(220, 220, 220)',
        shapes: shading_and_lines,
        yaxis: {
            title: ylabel,
            type: axisType,
        },
        xaxis: {
            title: 'Date/Time (UTC)',
        },
        margin: {
           r: 20,
        }
    };


    // var tempData = {...this.state.allData}
    let tempData = {}
    tempData[reqData.ds] = {}
    tempData[reqData.ds].data = data
    tempData[reqData.ds].range = range
    tempData[reqData.ds].title = title
    tempData[reqData.ds].time = times_datetime
    tempData[reqData.ds].timeObj = times_objects


    this.setState({
      histLabel: hist_xlabel,
      plotIs2D: is2D,
      allData: tempData,
      plotData: plot_data,
      plotLayout: layout,
      plotIsLoading:false,
    })

    this.getStats(data)

    })
  }

  render() {
    return (
    <div>
      <div style={this.state.plotIsLoading ? {display:'block'} : {display:'none'}} className='load-overlay'>
      </div>
      <div style={this.state.plotIsLoading ? {display:'block'} : {display:'none'}} className='centered-div'>
        <p>Loading plot data...</p>
        <FontAwesomeIcon className='load-icon' icon="spinner" size="2x" />
      </div>
      <div id="outer-container">
        <Menu onStateChange={ this.handleMenuChange } isOpen={this.state.menuIsOpen} noOverlay pageWrapId={ "page-wrap" } outerContainerId={ "outer-container" }>
          <div className='menu-options'>
            <PlotSelectMenu timeLoggingIsActive={this.state.timeLoggingIsActive} handleTimeLoggingToggle={this.handleTimeLoggingToggle} generatePlot={this.generatePlot}/>
          </div>
        </Menu>
        {/*<div className='sidebar'>

        </div>*/}
        <main style={{width: this.state.menuIsOpen? 'calc(100% - 300px)': '100%'}} id="page-wrap">
          <InteractivePlot onPlotClick={this.handlePlotClick} onRelayout={this.handlePlotChange} plotData={this.state.plotData} plotLayout={this.state.plotLayout} histData={this.state.histData} histLayout={this.state.histLayout}/>
        </main>
      </div>
    </div>
    );
  }
}


class InteractivePlot extends Component {

  render() {
    return(
      <div className='plot-area'>
        <div style={{height:'100%'}}>
          <div style={{height:'80%'}}>
            <Plot
              onRelayout={this.props.onRelayout}
              onClick={this.props.onPlotClick}
              data={this.props.plotData}
              layout={this.props.plotLayout}
              config={plotOptions}
              useResizeHandler={true}
              style={{width: "100%", height: "100%"}}
            />
          </div>
          <div style={{height:'20%'}}>
            <Plot
              data={this.props.histData}
              layout={this.props.histLayout}
              config={{displayModeBar:false}}
              useResizeHandler={true}
              style={{width: "100%", height: "100%"}}
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
    axios.get('http://dev.arm.gov/~aking/dq/dq-zoom/cgi-bin/list_datastreams.py', {
      cancelToken: new CancelToken(function executor(c) {
        // An executor function receives a cancel function as a parameter
        cancel = c;
      })
    }).catch(function(thrown) {
      if (axios.isCancel(thrown)) {
        console.log('Request canceled', thrown.message);
      } else {
        // handle error
      }
    }).then(res => {
      let result = res.data
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

    });
  }

  getDates(ds){
    cancel();
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

    axios.post('http://dev.arm.gov/~aking/dq/dq-zoom/cgi-bin/get_dates.py', {
      "ds":ds
    }, {
      cancelToken: new CancelToken(function executor(c) {
        // An executor function receives a cancel function as a parameter
        cancel = c;
      })
    }).then(res => {
      let result = res.data
      let momentDates = []
      for(let i=0;i<result.dates.length;i++){
        momentDates.push(moment(result.dates[i]).startOf('day'))
      }
      this.setState({
        startDate: moment(result.dates[result.dates.length-1]),
        endDate: moment(result.dates[result.dates.length-1]),
        dates: momentDates,
        dateInfoText: "Data available from " + moment(result.sdate).format('MM/DD/YYYY') + ' to ' + moment(result.edate).format('MM/DD/YYYY'),
        dateInfoTextColor:  goodColor,
      })
      this.getVariables(ds, moment(result.sdate).format('YYYY/MM/DD'))
    }).catch(function(thrown) {
      if (axios.isCancel(thrown)) {
        console.log('Request canceled');
        return
      } else {
        // handle error
      }
    })
  }

  getVariables(ds, sdate){
    this.setState({
      variableInfoText: 'Fetching available variables...',
      variableInfoTextColor:  okColor,
    })
    
    axios.post('http://dev.arm.gov/~aking/dq/dq-zoom/cgi-bin/get_variables.py', {
      "ds":ds,
      "sdate":sdate
    }, {
      cancelToken: new CancelToken(function executor(c) {
        // An executor function receives a cancel function as a parameter
        cancel = c;
      })
    }).then(res => {
      let result = res.data
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
    }).catch(function(thrown) {
      if (axios.isCancel(thrown)) {
        console.log('Request canceled');
        return
      } else {
        // handle error
      }
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
      'coordinate': this.state.has2D ? String(this.state.selectedCoordVar.value) : '',
      'qc_check': '',
      'coord_dim': this.state.has2D ? this.state.coordVarDim : '',
    }
    this.props.generatePlot(reqData,this.state.has2D && this.state.selectedCoordVar.value === 'all')
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
              <p className='menu-options-info' style={{ color:this.state.dateInfoTextColor}}>{this.state.dateInfoText}</p>
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

              <p className='menu-options-label'>TIME LOGGING</p>
              <label>
                <div style={{float:'right'}}>
                  <Toggle
                    className='custom-toggle'
                    defaultChecked={this.props.timeLoggingIsActive}
                    icons={false}
                    onChange={this.props.handleTimeLoggingToggle}
                  />
                </div>
              </label>

              <br/><br/>
              <p className='menu-options-label'>Y-AXIS LOG SCALE</p>
              <label>
                <div style={{float:'right'}}>
                  <Toggle
                    className='custom-toggle'
                    defaultChecked={false}
                    icons={false}
                    onChange={this.props.handleTimeLoggingToggle} 
                  />
                </div>
              </label>

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
          minDate={this.props.dates[0]}
          maxDate={this.props.dates[this.props.dates.length -1]}
          //includeDates={this.props.dates}
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
          minDate={this.props.dates[0]}
          maxDate={this.props.dates[this.props.dates.length -1]}
          //includeDates={this.props.dates}
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
