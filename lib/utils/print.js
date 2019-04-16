// Helper functions
function print(message) {
  let currentDate = `[${  new Date().toUTCString()  }] `;
  console.log(currentDate + message);
}


module.exports = print;
