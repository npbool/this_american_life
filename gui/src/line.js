var React = require('react');
var ReactDOM = require('react-dom');
var player = require(__dirname+'/build/player');
var $ = require("jquery");
var sqlite3 = require('sqlite3').verbose();

class Main extends React.Component {
  constructor() {
    super();
    this.state = {currentTime: 0, num: 573, data:[]};
    this.handleSeek = this.handleSeek.bind(this);
    this.queryData = this.queryData.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
  }
  handleSeek(t) {
    if(this._player){
      this._player.seek(t+17);
    }
  }
  componentDidMount() {
    this.queryData();
  }
  queryData() {
    var db = new sqlite3.Database('../crawler/episodes.db');
    var self = this;
    db.serialize(()=>{
      db.each(`SELECT json FROM episodes WHERE num=${self.state.num}`, (err, row)=>{
        var data = JSON.parse(row.json);
        self.setState({data: data})
      });
    });
    db.close();
  }

  render() {
    var acts = [];
    if(this.state.data.acts){
      acts = this.state.data.acts.map((act,i)=>{
        var key = `act-${i}`;
        return (
          <Act act={act} key={key} index={i} handle={this.handleSeek}/>
        )
      });
    }
    var mediaPath = `media/${this.state.num}.mp3`
    return (
      <div>
        <h1>{this.state.data.title}</h1>
        <div className="app">
          {acts}
        </div>
        <player.Player mediaPath={mediaPath}
          ref={ (p) => this._player = p}/>
      </div>
    );
  }
}

class Act extends React.Component {
  render() {
    var pars = this.props.act.para.map((p,i)=>{
      var key = `par-${this.props.index}-${i}`;
      return(
        <Paragraph para={p} key={key} handle={this.props.handle}/>
      );
    });
    return(
      <div>
        <h2>{this.props.act.title}</h2>
        <div className="par-list">
          {pars}
        </div>
      </div>
    );
  }
}

class Paragraph extends React.Component {
  constructor() {
    super();
  }
  handleClick(t,e){
    var [h,m,s] = t.split(':');
    var seconds = h*3600+m*60+parseFloat(s);
    this.props.handle(seconds);
  }
  render() {
    var lines = this.props.para.lines.map((l, i)=>{
      var key = `key-${i}`;
      return(
        <p key={key} onClick={this.handleClick.bind(this,l.begin)}>{l.text}</p>
      )
    });
    return(
      <div className="paragraph">
        {lines}
      </div>
    );
  }
}

ReactDOM.render(
  <Main />,
  document.getElementById("root")
);
