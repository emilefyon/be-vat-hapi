
// Retrieve
var config = require('config'),
mysql      = require('mysql');;

// Get configuration
var dbConfig = config.get("Database");


var pool = mysql.createPool({
	host     : dbConfig.host,
	user     : dbConfig.user,
	password : dbConfig.password,
	database : dbConfig.database
});

const getConnection = () => new Promise((fulfill, reject) => {
	pool.getConnection((err, connection) => {
		if (err) return reject(err);
		else fulfill (connection);
	})
})

	const getCompaniesWithInformation = (nbItems) => {
		return getConnection().then((connection) => {
			return new Promise((fulfill, reject) => {
				connection.query('SELECT EnterpriseNumber from vw_enterprises_tofetch LIMIT 0,?', parseInt(nbItems) || 0, (err, rows) => {
					enterprises = rows.map((row) => [row.EnterpriseNumber])
					console.log(enterprises)
					connection.query('INSERT INTO enterprises_batch (`EnterpriseNumber`) VALUES ? ON DUPLICATE KEY UPDATE Started=NOW()', [enterprises], (err, rows) => {
						connection.release();
						if(err) return reject(err)
						return fulfill(enterprises);
					}); 
				}); 
			});
		});
	}

	const companyFetchStart = (enterpriseNumber) => {
		return getConnection().then((connection) => {
			return new Promise((fulfill, reject) => {
				val = {EnterpriseNumber: enterpriseNumber}
				connection.query('INSERT INTO enterprises_batch SET ? ON DUPLICATE KEY UPDATE Started=NOW()', val, (err, rows) => {
					connection.release();
					if(err) return reject(err)
					return fulfill(rows);
				}); 
			});
		});
	}

	const companyFetchDone = (enterpriseNumber) => {
		return getConnection().then((connection) => {
			return new Promise((fulfill, reject) => {
				val = {EnterpriseNumber: enterpriseNumber}
				connection.query('UPDATE enterprises_batch SET Finished=NOW() WHERE ?', val, (err, rows) => {
					connection.release();
					if(err) return reject(err)
					return fulfill(rows);
				}); 
			});
		});
	}

	const companyFetchError = (enterpriseNumber) => {
		return getConnection().then((connection) => {
			return new Promise((fulfill, reject) => {
				val = {EnterpriseNumber: enterpriseNumber}
				connection.query('UPDATE enterprises_batch SET Error=\'Error\' WHERE ?', val, (err, rows) => {
					connection.release();
					if(err) return reject(err)
					return fulfill(rows);
				}); 
			});
		});
	}

	const insertPublicationData = (data) => {
		return getConnection().then((connection) => {
			return new Promise((fulfill, reject) => {
				// console.log(data.publication)
				sql = 'INSERT INTO publications SET ?'
				connection.query(sql, data.publication, (err, rows) => {
					const dataLedger = data.ledger.map((ledger) => {
						return [
							data.publication.PublicationId,
							ledger.LedgerId,
							ledger.Amount,
							ledger.UnitRef,
							ledger.Period
						]
					})
					// console.log(dataLedger)
					sql = 'INSERT INTO publication_data (PublicationId, LedgerId, Amount, UnitRef, Period) VALUES ?'
					connection.query(sql, [dataLedger], (err, rows) => {
						connection.release();
						if(err) return reject(err)
						return fulfill({status: 'Publication posted'});
					})
				})
			})
		})
	}



	const close = () => {
		pool.end();
	}

 
module.exports = {
	getCompaniesWithInformation, companyFetchStart, companyFetchDone, companyFetchError, insertPublicationData
}


