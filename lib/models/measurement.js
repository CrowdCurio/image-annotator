/*  implementation of the measurement class */
function Measurement(id, margin, x1, y1, x2, y2) {
  this.name = 'measurement';
  this.id = id;
  this.margin = margin;
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;
  this.orientation = 0;
}

module.exports = Measurement;
