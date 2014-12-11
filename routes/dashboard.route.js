var fs = require('fs');
var targz = require('tar.gz');
var formidable = require('formidable');
var ncp = require('ncp').ncp;
var Apio = require("../apio.js");

var deleteFolderRecursive = function(path) {
    console.log('deleting the directory '+path);
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
          var curPath = path + "/" + file;
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(path);
    }
};

module.exports = {
	index : function(req,res) {
			res.sendfile("public/dashboardApp/dashboard.html");
		},
	updateApioApp : function(req,res){
	    var objectId = req.body.objectId;
	    var ino = req.body.ino;
	    var html = req.body.html;
	    var js = req.body.js;
	    var mongo = req.body.mongo;
	    console.log('updating the object: '+objectId);
	    //si potrebbero usare writeFile (asincrono) annidati ed eliminare il try catch
	    try {
	        fs.writeFileSync('public/applications/'+objectId+'/' + objectId + '/' + objectId + '.ino',ino);
	        fs.writeFileSync('public/applications/'+objectId+'/' + objectId + '.html',html);
	        fs.writeFileSync('public/applications/'+objectId+'/' + objectId + '.js',js);
	        fs.writeFileSync('public/applications/'+objectId+'/' + objectId + '.mongo',mongo);
	        //fs.writeFileSync('public/applications/'+objectId+'/' + objectId + '/Makefile',makefile);
	        //fs.writeFileSync('public/applications/'+objectId+'/' + objectId + '.json',JSON.stringify(objectToSave));
	    } catch(e) {
	        res.status(500).send();
	        return;
	    }

	    res.send(200);
	   
	},
	modifyApioApp : function(req,res){
	    var id = req.body.id;
	    var path = 'public/applications/'+id+'/'+id;
	    console.log(path);
	    var object = {};

	    object.js = fs.readFileSync(path+'.js', {encoding: 'utf8'});
	    object.html = fs.readFileSync(path+'.html', {encoding: 'utf8'});
	    //object.json = fs.readFileSync(path+'.json', {encoding: 'utf8'});
	    object.mongo = fs.readFileSync(path+'.mongo', {encoding: 'utf8'});
	    path = 'public/applications/'+id+'/_'+id;
	    object.ino = fs.readFileSync(path+'/_'+id+'.ino', {encoding: 'utf8'});
	    
	    /*console.log('js:\n'+object.js);
	    console.log('html:\n'+object.html);
	    console.log('json:\n'+object.json);
	    console.log('mongo:\n'+object.mongo);
	    console.log('ino:\n'+object.ino);*/

	    res.send(object);

	},
	createNewApioAppFromEditor : function(req,res){
	    var obj = req.body.object;
	    var mongo = req.body.mongo;
	    var ino = req.body.ino;
	    var html = req.body.html;
	    var js = req.body.js;
	    var makefile = req.body.makefile;    

	    console.log('APIO: Creating application ' + obj.objectId);
	    fs.mkdirSync("public/applications/" + obj.objectId);
	    fs.mkdirSync("public/applications/" + obj.objectId +'/' + obj.objectId);

	    fs.writeFileSync('public/applications/'+obj.objectId+'/' + obj.objectId + '/' + obj.objectId + '.ino',ino);
	    fs.writeFileSync('public/applications/'+obj.objectId+'/' + obj.objectId + '/Makefile',makefile);
	    fs.writeFileSync('public/applications/'+obj.objectId+'/' + obj.objectId + '.html',html);
	    fs.writeFileSync('public/applications/'+obj.objectId+'/' + obj.objectId + '.js',js);
	    fs.writeFileSync('public/applications/'+obj.objectId+'/' + obj.objectId + '.mongo',mongo);
	    fs.writeFileSync('public/applications/'+obj.objectId+'/' + obj.objectId + '.json',JSON.stringify(obj));

	    Apio.Database.registerObject(obj,function(error){
	        if (error) {
	            console.log("/apio/Database/createNewApioAppFromEditor Error while saving");
	            res.send(500);
	        }else{
	            res.send();
	        }
	    });   

	},
	createNewApioApp : function(req,res){
	    var obj = req.body.object;
	    //console.log('properties : '+ obj.properties);
	    var mongo = req.body.mongo;
	    var ino = req.body.ino;
	    var html = req.body.html;
	    var js = req.body.js;
	    var makefile = req.body.makefile;
	    console.log('makefile: '+makefile);
	    console.log('req.makefile: '+req.body.makefile);
	    var objectToSave = {properties:{}};

	    objectToSave.name = obj.objectName;
	    objectToSave.objectId = obj.objectId;
	    objectToSave.protocol = obj.protocol;
	    objectToSave.address = obj.address;

	    for (var key in obj.properties){
	        console.log('key : '+key);
	        if(obj.properties[key].type!=='List'){ 
	            console.log('obj.properties[key].name: ' + obj.properties[key].name);
	            console.log('obj.properties[key].defaultValue: ' + obj.properties[key].defaultValue);
	            objectToSave.properties[obj.properties[key].name] =  obj.properties[key].defaultValue;
	            console.log('objectToSave.properties[obj.properties[key].name]: ' + objectToSave.properties[obj.properties[key].name]);
	        }else{

	            var returnFirstListItemValue = function(o){
	                //bisognerebbe far settare la voce della select che vogliono come prima voce attraverso il wizard
	                for(var k in o) return k;
	            }

	            console.log('obj.properties[key].name: ' + obj.properties[key].name);
	            console.log('obj.properties[key].firstItemValue: ' + returnFirstListItemValue(obj.properties[key].items));
	            objectToSave.properties[obj.properties[key].name] = returnFirstListItemValue(obj.properties[key].items);
	            console.log('objectToSave.properties[obj.properties[key].name]: ' + objectToSave.properties[obj.properties[key].name]);
	        }
	        console.log();
	    }; 

	    //objectToSave.db=JSON.parse(mongo.slice(7,mongo.length)); //problema db : { db : { ... }}
	    console.log('mongo: '+mongo);
	    objectToSave.db=JSON.parse(mongo); //problema db : { db : { ... }}

	    console.log('Object' + obj.objectId + 'is being manipulated by the server');
	    console.log('APIO: Creating application ' + obj.objectId);

	    Apio.Database.registerObject(objectToSave,function(error){
	        if (error) {
	            console.log("/apio/Database/createNewApioApp Error while saving");
	            res.send(500);
	        }else{
	            //QUA

	            fs.mkdirSync("public/applications/" + obj.objectId);
	            fs.mkdirSync("public/applications/" + obj.objectId +'/_' + obj.objectId);
	            fs.mkdirSync("public/applications/" + obj.objectId +'/_' + obj.objectId+'/XBee');

	            fs.writeFileSync('public/applications/'+obj.objectId+'/_' + obj.objectId + '/_' + obj.objectId + '.ino',ino);
	            fs.writeFileSync('public/applications/'+obj.objectId+'/_' + obj.objectId + '/Makefile',makefile);
	            fs.writeFileSync('public/applications/'+obj.objectId+'/' + obj.objectId + '.html',html);
	            fs.writeFileSync('public/applications/'+obj.objectId+'/' + obj.objectId + '.js',js);
	            fs.writeFileSync('public/applications/'+obj.objectId+'/' + obj.objectId + '.mongo',mongo);
	            //fs.writeFileSync('public/applications/'+obj.objectId+'/' + obj.objectId + '.json',JSON.stringify(objectToSave));
	            
	            var source = 'public/arduino/';
	            console.log('obj.protocol: '+ obj.protocol);
	            if(obj.protocol==='z'){
	                source += 'XBee';
	            }else{
	                source += 'LWM';
	            }
	            console.log('source: '+ source);
	            var destination = 'public/applications/'+obj.objectId+'/_' + obj.objectId ;

	            ncp.limit = 16;

	            ncp(source, destination, function (err) {
	             if (err) {
	               return console.error(err);
	             }
	             console.log('done!');
	            });

	            res.send();
	        }
	    });   

	},
	exportApioApp : function(req,res){
	    console.log('/apio/app/export')
	    var id = req.query.id;
	    var dummy = '8=====D';
	    var path = 'public/applications/'+id+'/'+id;
	    var object = {};
	    var jsonObject = {};

	    object.js = fs.readFileSync(path+'.js', {encoding: 'utf8'});
	    object.html = fs.readFileSync(path+'.html', {encoding: 'utf8'});
	    //object.json = fs.readFileSync(path+'.json', {encoding: 'utf8'});
	    object.mongo = fs.readFileSync(path+'.mongo', {encoding: 'utf8'});
	    object.ino = fs.readFileSync(path+'/'+id+'.ino', {encoding: 'utf8'});
	    object.makefile = fs.readFileSync(path+'/Makefile', {encoding: 'utf8'});

	    //jsonObject = JSON.parse(object.json);
	    jsonObject = JSON.parse(object.mongo);
	    console.log('jsonObject.name: '+jsonObject.name);
	    
	    //TO FIX: MAKE REPLACE RECURSIVE
	    object.js=object.js.replace('ApioApplication'+id,'ApioApplication'+dummy+'');
	    object.js=object.js.replace('ApioApplication'+id,'ApioApplication'+dummy+'');
	    object.js=object.js.replace('ApioApplication'+id,'ApioApplication'+dummy+'');
	    
	    object.html=object.html.replace('ApioApplication'+id,'ApioApplication'+dummy+'');
	    object.html=object.html.replace('ApioApplication'+id,'ApioApplication'+dummy+'');
	    object.html=object.html.replace('applications/'+id+'/'+id+'.js','applications/'+dummy+'/'+dummy+'.js');

	    //object.json=object.json.replace('"objectId":"'+id+'"','"objectId":"'+dummy+'"');
	    object.mongo=object.mongo.replace('"objectId":"'+id+'"','"objectId":"'+dummy+'"');

	    try {
	        var path = 'public/';
	        console.log('path + dummy:'+path + dummy);
	        console.log('target: public/exported/'+jsonObject.name+'.tar.gz');
	        fs.mkdirSync(path+'/temp');
	        path = 'public/temp';
	        fs.mkdirSync(path +'/'+ dummy);
	        fs.mkdirSync(path +'/'+ dummy + '/' + dummy);
	        fs.writeFileSync(path+'/'+dummy+'/' + dummy + '/' + dummy + '.ino',object.ino);
	        fs.writeFileSync(path+'/'+dummy+'/' + dummy + '.html',object.html);
	        fs.writeFileSync(path+'/'+dummy+'/' + dummy + '.js',object.js);
	        fs.writeFileSync(path+'/'+dummy+'/' + dummy + '.mongo',object.mongo);
	        fs.writeFileSync(path+'/'+dummy+'/' + dummy + '/Makefile',object.makefile);
	        //fs.writeFileSync(path+'/'+dummy+'/' + dummy + '.json',object.json);
	 
	        //var compress = new targz().compress('/applications/:id', '/applications/temp/:id.tar.gz', function(err){
	        
	        var compress = new targz().compress(path +'/'+ dummy, path+'/'+jsonObject.name+'.tar.gz', function(err){
	            if(err)
	                console.log(err);
	            else
	            {
	                res.download(path+'/'+jsonObject.name+'.tar.gz',jsonObject.name+'.tar.gz',function(err){
	                    if(err){
	                        console.log(err);
	                    }else{
	                        console.log('deleting temp folder '+'public/temp')
	                        deleteFolderRecursive(path);
	                        //fs.unlinkSync(path+jsonObject.name+'.tar.gz');
	                    }
	                });
	                console.log('The compression has ended!');
	            }
	        });

	    } catch(e) {
	        res.status(500).send();
	        console.log(e);
	        return;
	    }
	
	},
	exportInoApioApp : function(req,res){
	    console.log('/apio/app/exportIno')
	    var obj = {};
	    obj.objectId = req.query.id;
	    
	    try {
	            var compress = new targz().compress("public/applications/" + obj.objectId +'/_' + obj.objectId, "public/applications/" + obj.objectId +'/' + obj.objectId +'.tar.gz', function(err){
	                if(err)
	                    console.log(err);
	                else
	                {
	                    console.log('QUA')
	                    console.log("public/applications/" + obj.objectId +'/' + obj.objectId +'.tar.gz');
	                    console.log(obj.objectId+'.tar.gz')
	                    console.log('FINE')
	                    res.download("public/applications/" + obj.objectId +'/' + obj.objectId +'.tar.gz',obj.objectId+'.tar.gz',function(err){
	                        if(err){
	                            console.log('There is an error')
	                            console.log(err);
	                        }else{
	                            console.log('Download has been executed')
	                            console.log('deleting temp folder '+'public/temp')

	                            //deleteFolderRecursive(path);
	                            //fs.unlinkSync(path+jsonObject.name+'.tar.gz');
	                        }
	                    });
	                    console.log('The compression has ended!');
	                }
	            });
	    } catch(e) {
	        res.status(500).send();
	        console.log(e);
	        return;
	    }
	    
	},
	deleteApioApp : function(req,res){
	    var id = req.body.id;

	    Apio.Database.deleteObject(id,function(err){
	       // Apio.Database.db.collection('Objects').remove({objectId : id}, function(err){
	        if(err){
	            console.log('error while deleting the object '+id+' from the db');
	            res.status(500).send();
	        }
	        else{

	           deleteFolderRecursive('public/applications/'+id);
	           res.send(200);
	        }

	    })
	    
	},
	uploadApioApp : function(req,res){
	    console.log('/apio/app/upload')
	    fs.mkdirSync('upload');
	    
	    var form = new formidable.IncomingForm();
	        form.uploadDir = "upload";
	        form.keepExtensions = true;


	        form.on('file', function(name, file) {
	            console.log('file name: '+file.name);
	            console.log('file path: '+file.path);
	            fs.rename(file.path, 'upload/'+file.name);

	            var compress = new targz().extract('upload/'+file.name, 'upload/temp', function(err){
	                if(err)
	                    console.log(err);

	                console.log('The extraction has ended!');
	                //recupero max actual id
	                Apio.Database.getMaximumObjectId(function(error, data){
	                    if(error){
	                        console.log('error: '+error);
	                    }
	                    else if(data){
	                        console.log(data);
	                        //qui rinomino i cazzetti nell'id attuale

	                        var id = '8=====D';
	                        var path = 'upload/temp/'+id+'/'+id;
	                        var object = {};
	                        var jsonObject = {};

	                        object.js = fs.readFileSync(path+'.js', {encoding: 'utf8'});
	                        object.html = fs.readFileSync(path+'.html', {encoding: 'utf8'});
	                        //object.json = fs.readFileSync(path+'.json', {encoding: 'utf8'});
	                        object.mongo = fs.readFileSync(path+'.mongo', {encoding: 'utf8'});
	                        object.ino = fs.readFileSync(path+'/'+id+'.ino', {encoding: 'utf8'});
	                        object.makefile = fs.readFileSync(path+'/Makefile', {encoding: 'utf8'});

	                        //jsonObject = JSON.parse(object.json);
	                        jsonObject = JSON.parse(object.mongo);
	                        console.log('jsonObject.name: '+jsonObject.name);

	                        var dummy = (parseInt(data)+1).toString();
	                        
	                        
	                        object.js=object.js.replace('ApioApplication'+id,'ApioApplication'+dummy+'');
	                        object.js=object.js.replace('ApioApplication'+id,'ApioApplication'+dummy+'');
	                        object.js=object.js.replace('ApioApplication'+id,'ApioApplication'+dummy+'');
	                        
	                        object.html=object.html.replace('ApioApplication'+id,'ApioApplication'+dummy+'');
	                        object.html=object.html.replace('ApioApplication'+id,'ApioApplication'+dummy+'');
	                        object.html=object.html.replace('applications/'+id+'/'+id+'.js','applications/'+dummy+'/'+dummy+'.js');

	                        //object.json=object.json.replace('"objectId":"'+id+'"','"objectId":"'+dummy+'"');
	                        object.mongo=object.mongo.replace('"objectId":"'+id+'"','"objectId":"'+dummy+'"');
	                        
	                        //Apio.Database.db.collection('Objects').insert(JSON.parse(object.json),function(err,data){
	                        Apio.Database.db.collection('Objects').insert(JSON.parse(object.mongo),function(err,data){
	                            if(err)
	                                console.log(err);
	                            else
	                            {
	                                var path = 'public/applications/';
	                                console.log('path + dummy:'+path + dummy);

	                                fs.mkdirSync(path +'/'+ dummy);
	                                fs.mkdirSync(path +'/'+ dummy + '/' + dummy);
	                                fs.writeFileSync(path+'/'+dummy+'/' + dummy + '/' + dummy + '.ino',object.ino);
	                                fs.writeFileSync(path+'/'+dummy+'/' + dummy + '.html',object.html);
	                                fs.writeFileSync(path+'/'+dummy+'/' + dummy + '.js',object.js);
	                                fs.writeFileSync(path+'/'+dummy+'/' + dummy + '.mongo',object.mongo);
	                                fs.writeFileSync(path+'/'+dummy+'/' + dummy + '/Makefile',object.makefile);
	                                //fs.writeFileSync(path+'/'+dummy+'/' + dummy + '.json',object.json);
	                                deleteFolderRecursive('upload');
	                            }
	                        });
	                        
	                        

	                        //fine
	                    }

	                })
	            });

	        });

	        form.parse(req, function(err, fields, files) {
	          console.log('received upload:\n\n');
	          res.send(200);
	        });

	    return;

	},
	maximumIdApioApp : function(req,res){
	    console.log('/apio/app/maximumId');
	    Apio.Database.getMaximumObjectId(function(error,data){
	        if(error){
	            console.log('error: '+error);
	        }
	        else if(data){
	            console.log(data);
	            res.send(data);
	        }
	    });
	
	}

}