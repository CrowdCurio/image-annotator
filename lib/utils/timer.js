/**
 * A general-purpose Timer implementation. Supports starting, stopping, and reseting.
 */
function Timer() {
  this.StartMilliseconds = 0;
  this.ElapsedMilliseconds = 0;
}

Timer.prototype.start = function () {
  this.StartMilliseconds = new Date().getTime();
};

Timer.prototype.stop = function () {
  this.ElapsedMilliseconds = new Date().getTime() - this.StartMilliseconds;
};

Timer.prototype.reset = function () {
  this.StartMilliseconds = 0;
  this.ElapsedMilliseconds = 0;
};

Timer.prototype.getTime = function () {
  return this.ElapsedMilliseconds;
};

module.exports = Timer;
