const fs = require('fs');
const request = require('request');
const http = require('http');
const urlForDownload = require('url');
const exec = require('child_process').exec;

//variables
let earthquakeObject = [];
let eqInstance = {};
let eqOutput;


//date format and setting variblae for  today and yesterday for API string
function dateFormat (date, fstr, utc) {
  utc = utc ? 'getUTC' : 'get';
  return fstr.replace (/%[YmdHMS]/g, function (m) {
    switch (m) {
    case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
    case '%m': m = 1 + date[utc + 'Month'] (); break;
    case '%d': m = date[utc + 'Date'] (); break;
    case '%H': m = date[utc + 'Hours'] (); break;
    case '%M': m = date[utc + 'Minutes'] (); break;
    case '%S': m = date[utc + 'Seconds'] (); break;
    default: return m.slice (1); // unknown code, remove %
    }
    // add leading zero if required
    return ('0' + m).slice (-2);
  });
}

//set date range for url request
let date = dateFormat (new Date (), "%Y-%m-%d", true)
let d = new Date();
let yesterDate = dateFormat (new Date(d.setDate(d.getDate()-5)), "%Y-%m-%d", true);

//set parameters for makeRequest function
let url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime="+yesterDate+"&endtime="+date+"&minmagnitude=5";
let options = {json: true};


//kick it offffff
makeRequest();

// get into the url and 
function makeRequest(){
	request(url, options, (error, res, eqRaw1) => {
	    if (error) {
	        return  console.log(error)
	    };
	    if (!error && res.statusCode == 200) {
	    	fs.writeFileSync('./eq.json', JSON.stringify(eqRaw1))

	    	//on to next function, to get the shape
			getShakemap(eqRaw1);
	    };
	});
}


//check for shakemaps
function getShakemap(data){

	//loop through each feature
	data.features.forEach(d=> {

		//build data object from initial url and stringify
		eqInstance[d.id] = {"properties" : d.properties}
		let eqObject = JSON.stringify(eqInstance[d.id])

		//set path for function and create folder with earthquake ID
		let filepath = './'+d.id;
		let dirpath = '/'+d.id

		//find details url to look into object for shakemap
		let details = d.properties.detail;

		// loop through 
		request(details, options, (error, res, eqdeet) => {
		    if (error) {
		        return  console.log(error)
		    };

		    if (!error && res.statusCode == 200) {
		    	//check for shakemap on earthquake, if so, make folder, downlaod file.
		    	if (eqdeet.properties.products.shakemap){
		    		//create folder with earthquake ID name and change access to read write for all
		    		createDir(dirpath)
		    		fs.chmodSync(filepath, '777');
		    	} else {
		    		console.log( d.id + "is hazz no shakemap!")
		    		return
		    	}
		    	//define path to shakemap
		    	let shakeMapURL = eqdeet.properties.products.shakemap[0].contents['download/shape.zip'].url
		    	//downlaod shakeemap
	    		download_file_wget(shakeMapURL,filepath)
	    		
	    		fs.writeFileSync(filepath+'/eqData.JSON', eqObject, (err) => {
				    // throws an error, you could also catch it here
				    if (err) throw err;

				    // success case, the file was saved
				    console.log('eqData saved!');
				});
							        
		    };
		});

	})

}


//function to create diretories w/ earthquake ID
const createDir = (dirPath) => {

	fs.mkdirSync(process.cwd() + dirPath, {recursive:true}, (error) => {
		console.log("directory created, that'll do, Pig")
		if (error) {
			console.log("ya done messed up!: ", error);
		} else {
			
		}
	});
}


// Function for downloading file using wget
var download_file_wget = function(file_url, filepath) {
  // extract the file name
  var file_name = urlForDownload.parse(file_url).pathname.split('/').pop();
  // compose the wget command
  var wget = 'wget -P ' + filepath + ' ' + file_url;
  // excute wget using child_process' exec function

  var child = exec(wget, function(err, stdout, stderr) {
    if (err) throw err;
    else console.log(file_name + 'is hazz shapemap and downloaded to ' + filepath);
  });
};

		
//earthquakeObject.push(eqInstance)

		
		//write out to file

// console.log("eqO",earthquakeObject)

// call functions at end of functions
// find shake map thne make dir, then downlaod
// make object with earthqkaue data
// need to JOSN.parse object with lat long, epicenter etc?

// further-
// steal wen fu to see legned and key, 
// build automatic into illustrator tempalte
// butild ato text to dump in with where when extractContents()


// do all d3 stuff in node, 



