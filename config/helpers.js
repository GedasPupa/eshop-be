const Mysqli = require('mysqli');


let conn = new Mysqli({
    Host: 'localhost', // IP/domain name 
    post: 3306, // port, default 3306 
    user: 'gedaspupa', // username 
    passwd: 'gedaspupa123', // password 
    db: 'eshop'
  });

  let db = conn.emit({fromSlave: false, db: ''});


  module.exports = {
    database: db
  };