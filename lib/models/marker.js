/*  simple implementation of a marker class strictly for storage */
function Marker(x, y, label, orientation) {
  this.name = 'marker';
  this.x = x;
  this.y = y;
  this.label = label;
  this.orientation = orientation;
  this.created = Math.round(+new Date() / 1000);
}

Marker.prototype.updatePoint = function (x, y, orientation) {
  this.x = x;
  this.y = y;
  this.orientation = orientation;
};

Marker.prototype.updateLetter = function (letter) {
  this.label = letter;
};


module.exports = Marker;
