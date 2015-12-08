React = require('react')
ReactDOM = require('react-dom')
var $ = require('jquery')

class Player extends React.Component {
  constructor(){
    super();
    this.render = this.render.bind(this);
    this.seek = this.seek.bind(this);
  }

  seek(t) {
    if(this._audio){
      this._audio.currentTime = t;
    }
  }
  render() {
    return(
      <div className="player">
        <audio controls id='audio' currentTime={this.props.currentTime}
          ref={(audio) => this._audio = audio}>
          <source src={this.props.mediaPath} type="audio/mpeg"/>
          Your browser does not support the audio element.
        </audio>
        <p>{this.props.currentTime}</p>
      </div>
    );
  }
}

module.exports.Player = Player
