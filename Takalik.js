(function (){
	var Takalik=this.Takalik={};
	Takalik.VERSION = "0.0.1";
	var _ObjectProto=Object.prototype.toString;

	var addEvent = function addEvent(element, event, callback){
		if( window.addEventListener ) {
			element.addEventListener(event, callback, false);
		}
		else if( window.attachEvent ) {
			element.attachEvent('on'+event, callback);
		}
		else {
			element['on'+event] = callback;
		}
	};

	/*Takalik.form = {validate: function validate(options){if(Takalik.utils.isObject(options)) {if(Takalik.utils.isString(options.form)) {var form = Takalik.utils.getElement(options.form); if(form) {Takalik.utils.listener(form, {input: function input(target){var input = target.target; if(input.validity.valid) {if(document.querySelector(".message-form-error")) {document.querySelector(".message-form-error").style.display = "none"; } input.style.background = "white"; } else {var message = document.createElement("span"); var parent = input.parentNode; if(!document.querySelector(".message-form-error")) {message.className = "message-form-error"; message.innerText = "Error"; parent.appendChild(message); } } } }); } else {console.log("Hola"); } } } } };*/
	
	Takalik.utils={
		isObject:function isObject(object){
			if(_ObjectProto.call(object) === "[object Object]") return true;
			return false;
		},
		isArray:function isArray(array){
			if(_ObjectProto.call(array) === "[object Array]") return true;
			return false;
		},
		isNumber: function isNumber(number){
			if(_ObjectProto.call(number) === "[object Number]") return true;
			return false;
		},
		isDefined:function isDefined(el){
			if(arguments.length == 1){
				if(el == undefined) return false;
				return true;
			}
			return console.error("UNDEFINED");
		},
		isString: function isString(str){
			if(_ObjectProto.call(str) === "[object String]") return true;
			return false;
		},
		isFunction: function isFunction(fn){
			if(_ObjectProto.call(fn) === "[object Function]") return true;
			return false;
		},
		hasProperty: function hasProperty(element, property){
			if(typeof element == "object"){
				if( element.hasOwnProperty(property) ) {
					return true;
				}
				if(element[property]) {
					return true;
				}
				return false;
			}
		},
		each:function each(el,callback,context){
			if( Takalik.utils.isDefined(el) ){
				for(var i in el){
					if(context) callback.call(context,el[i],i);
					else callback(el[i],i);
				}
				return;
			}
			return console.error("undefined value")
		},
		getElement: function getElement(element){
			if(element) {
				if( Takalik.utils.isString(element)){
					var prefix = element.substring(0,1);
					var name_element = element.substr(1);
					var node_element;
					switch(prefix) {
						case ".": 
							node_element = document.getElementsByClassName(name_element);
							if(node_element) {
								if(node_element.length == 1) {
									node_element = node_element[0];
								}
							}
							break;
						case "#": 
							node_element = document.getElementById(name_element);
							break;
						default:
							var el = document.querySelectorAll(element);
							if(el) {
								if(el.length == 1){ 
									node_element = el[0]; 
								}
								else {
									node_element = el;
								}
							}
							break;
					}
					if(node_element) {
						return node_element;
					}
					return null;
				}
			}
			return null;
		},
		listener: function listener(element, events, context) {
			if(events) {
				if(!Takalik.utils.isObject(events)){
					return console.error("Events is not an object");
				}
			}

			if(Takalik.utils.isString(element)) {
				var element = Takalik.utils.getElement(element);
				if( "string" != typeof element) {
					Takalik.utils.each(events, function each(fn,evt){
						addEvent(element,evt,fn)
					});
				}
			}
			else if(!Takalik.utils.isArray(element) && !Takalik.utils.isString(element) && !Takalik.utils.isNumber(element)) {
				var commonProvidersEvents = ["addEventListener","attachEvent"];
				Takalik.utils.each(events, function each(fn, evt){
					commonProvidersEvents.push("on"+evt);
				});

				Takalik.utils.each(commonProvidersEvents, function each(evt){
					if( element[evt] ) {
						Takalik.utils.each(events, function each(fn, evt){
							addEvent(element,evt,fn);
						});
					}
				});
			}
		},
		extend:function extend(superClass,subClass,callback,context){
			context = context || {};
			if(Takalik.utils.isObject(superClass)){
				Takalik.utils.each(superClass,function each(el){
					if(Takalik.utils.isObject(subClass)){
						if(!Takalik.utils.hasProperty(subClass,el)){
							subClass[el]=superClass[el];
						}
					}
					if(Takalik.utils.isFunction(subClass)){
						if(!Takalik.utils.hasProperty(subClass.prototype,el)){
							subClass.prototype[el]=superClass[el];
						}	
					}
				});
				subClass.superclass = superClass.prototype;
			}

			/*if(Takalik.utils.isFunction(superClass)){Takalik.utils.each(superClass.prototype, function each(property){if(!Takalik.utils.hasProperty(subClass) || !Takalik.utils.hasProperty(subClass.prototype)) {} }); }*/ 
		}
	};

	function executeSql(database,request,data,success,error){
		database.transaction(function (tx){tx.executeSql(request,data,function (a,b){success(b);return true;}, function (a){error(a);return true;});});
		return false;
	};

	function ModelTable(db,properties){
		var accepted_operators = ["||", "*", "/", "%", "+", "-", "<<", ">>", "&", "|", "<", "<=", ">", ">=", "=", "==", "<>", "!=", "IN", "AND", "OR", "IS", "LIKE", "GLOB"];
		var nameTable=properties.name;
		var newTable=this;
		var hasPrimaryKey = false;

		var fields = properties.fields.map(function (property) {
  				var notNull = (property.notNull && property.notNull == true) ? " NOT NULL" : "";
  				if(!hasPrimaryKey && property.primary) {
  					var structure_pk = "";
  					hasPrimaryKey = true;
  					if(property.increment) {
  						structure_pk += property.name + " INTEGER PRIMARY KEY AUTOINCREMENT" + notNull ;
  					}
  					else {
  						structure_pk += property.name + " " + property.type + " PRIMARY KEY" + notNull;
  					}
  					return structure_pk;
  				}
  				var namefield = property.name;
  				if(property.type && property.type.toUpperCase().match("INTEGER|TEXT|NULL|REAL|BLOB") ) {
  					return namefield += ' ' + property.type + notNull; 
  				}
  				return namefield += ' TEXT' + notNull;
			});
		var table;
		var foreignsql = [];
		var prefix_on = "ON";
		var aux = "";
		if(properties.fields.forEach) {
			properties.fields.forEach(function each(_table, index){
				if(_table.foreignWith) {
					table = _table.foreignWith.table;
					var field_foreign = _table.foreignWith.field;
					if(_table.foreignWith.cascade) {
						if(_table.foreignWith.cascade.delete) {
							aux += prefix_on + " DELETE CASCADE ";
						}
						if(_table.foreignWith.cascade.update) {
							aux += prefix_on + " UPDATE CASCADE ";
						}
					}
					if(aux.length > 0) {
						foreignsql.push("FOREIGN KEY("+ _table.name +") REFERENCES "+ table +"("+ field_foreign +") "+ aux);
					}
					else {
					foreignsql.push("FOREIGN KEY("+ _table.name +") REFERENCES "+ table +"("+ field_foreign +")");
					}
				}
			});
		}
		if(foreignsql.length > 0) {
			foreignsql.forEach(function each(foreignkey,index){
				fields.push(foreignkey);
			})
		}

		executeSql(db.db,"CREATE TABLE IF NOT EXISTS " + nameTable + " ( "+ fields.join(", ") +" ) ", [], function success(l){	
			db.tables.push(nameTable);
			var fields_names = fields.map(function (field){
				var _field = {
					isPrimaryKey: function isPrimaryKey(){return !false;}
				};
				if(field.split(" ")[0].toUpperCase() != "FOREIGN") {	
					var isPrimaryKey=function isPrimaryKey(element){
						if(element.match("PRIMARY KEY AUTOINCREMENT")) {
							return true;
						}
						return false;	
					};
					var fieldType = function fieldType(element){
						if(element.toUpperCase().match("INTEGER|TEXT|NULL|REAL|BLOB")){
							return element.toUpperCase().match("INTEGER|TEXT|NULL|REAL|BLOB")[0];
						}
						return "TEXT";
					};
					_field.name = field.split(" ")[0];
					_field.isPrimaryKey = function (){
						return isPrimaryKey(field);
					};
					_field.type = fieldType(field);
				}
				return _field;
			});

			function fieldsTableToString(names){
				var _elements = [];
				names.forEach(function (val){
					if(!val.isPrimaryKey()){
						_elements.push(val.name);
					}
				});
				return _elements;
			};
			function fieldsTableType(names){
				var _elements = {};

				names.forEach(function (val){
					if(!val.isPrimaryKey()){
						_elements[val.name] = val.type;
					}
				});
				return _elements;
			}

			newTable.find = function find(data,callback){
				/*Incomplete*/
				var elements = data.fields,
					request;
				
				request = "SELECT " + elements.join(",") + " FROM " + nameTable;

				if(data.condition) request += " WHERE " + data.condition.join(" ");
				if(data.limit) request +=" LIMIT "+data.limit;

				executeSql(db.db,request,[], function (result){
					if(result.rows && result.rows.length > 1){
						var results = [];
						for(var i = 0,len = result.rows.length; i < len ; i++){
							results.push(result.rows.item(i));
						}
						callback(results);
					}
					else
					{
						callback(result.rows.item(0));
					}
				}, function (error){
					callback(null);
				});
				return newTable;
			};

			newTable.update=function update(options,callback){
				var elements=[],
					request="UPDATE " + nameTable + " SET ";

				for(var i in options.elements)
				{
					for(var j in options.elements[i])
					{
						elements.push(j+"="+options.elements[i][j]);	
					}
				}
				request += elements.join(",");
				if(options.condition != undefined)
				{
					request += " WHERE " + options.condition.join(" ");	
				}

				executeSql(db.db,request,[], function (result){
					console.log(result);
				}, function (e){
					console.log(e);
				});
			};

			newTable.delete = function (properties,callback){
				var request = "DELETE FROM " + nameTable;
				
				if(properties.condition != undefined) request+=" WHERE "+properties.condition.join(" ");

				executeSql(db.db,request,[], function (a){
					if(a.rowsAffected > 0) return callback(true);
					return callback(false);
				}, function (e){
					callback(e);
				});
			};

			newTable.add = function add(elements, callback){
				var _elements = fieldsTableToString(fields_names),
					_elementsToString = _elements.join(", "), 
					_elementsType = fieldsTableType(fields_names),
					request = "INSERT INTO "+nameTable+"("+ _elementsToString +") VALUES ",
					values = [],
					rowInsert = 0,
					selectQuery = [],
					rowNotInserted = 0,
					temporal = [];
				if(Takalik.utils.isObject(elements)) {
					if(elements.select) {
						var query = "SELECT "+elements.select.fields.join(", ") + " FROM "+elements.select.table;
						var conditions = [];
						var array_columns_table_select = db[elements.select.table].getColumns();
						var columns = {};
						array_columns_table_select.forEach(function each(column, index){
							columns[column.column] = column.type
						});

						if(elements.select.where) {
							for(var operator in elements.select.where) {
								if(operator.toUpperCase().match("AND|OR|LIKE|BETWEEN")) {
									var _aux = elements.select.where[operator];
									for(var field in _aux) {
										if (field in columns) {
											switch(operator.toUpperCase()) {
												case "LIKE":
													conditions.push({
														type		:	operator.toUpperCase(),
														condition	:	field + " LIKE '" + _aux[field] + "'"
													});
													break;
												case "AND":
												case "OR":
													conditions.push({
														type		: 	operator.toUpperCase(),
														condition	: 	field + " " + _aux[field].condition + " " + _aux[field].value
													});
													break;
												case "BETWEEN":
													conditions.push({
														type		:	operator.toUpperCase(),
														condition	:	field + " BETWEEN " + _aux[field].from + " AND " + _aux[field].to
													});
													break;
												default:
													break;
											}
										}
										else {
											conditions.length = 0;
											return console.error(field + " is not a column of " + nameTable);
										}
									}
								}
							}
							Takalik.utils.each(conditions, function each(value, index){
								if(index == (conditions.length-1)) {
									selectQuery.push(value.condition);
								}
								else {
									if(value.type == "AND" || value.type == "OR") {
										selectQuery.push(value.condition + " " + value.type + " ");
									}
									else {
										selectQuery.push(value.condition + " AND ");
									}
								}
							});
							query += selectQuery.join("");
						}
						var req = "INSERT INTO " + nameTable + " " + query;

						/*executeSql(db.db, req, [], function success(){
							console.log(arguments);
						}, function error(){
							console.log(arguments);
						});*/
					}
					else {
						elements = [elements];
						for(var i in elements)
						{
							for(var j in elements[i])
							{
								if(_elementsToString.match(j))
								{
									if(_elementsType[j] == "TEXT")
									{
										temporal.push("'"+(elements[i][j]).trim()+"'");	
										continue;
									}
									temporal.push((elements[i][j]).trim());	
								}
								continue;
							}
							values.push("INSERT INTO "+nameTable + "("+ _elementsToString +") VALUES ("+ temporal.join(", ") +")")
							temporal.length = 0;
						}

						var returnCallback=function returnCallback(count){
							if(count == values.length){
								callback({
									rowsToInsert: values.length,
									rowsInserted: rowInsert,
									rowsFails: rowNotInserted,
									finished: true
								});
							}
						}

						values.forEach(function (val){
							executeSql(db.db, val,[], function (a){
								/*rowInsert += 1;
								returnCallback(rowInsert);*/
								return true;
							}, function (transaction, error){
								/*rowNotInserted += 1;
								returnCallback(rowInsert);*/
								return true;
							});
						});
					}
				}
				else if(Takalik.utils.isString(elements)) {
					//incomplete
				}
				
			};
			newTable.begin = function begin(){

			};
			newTable.addColumn = function addColumn(){

			};
			newTable.resetIndex = function resetIndex(){

			};
			newTable.getColumns = function getColumns(){
				var columns = [];
				fields_names.forEach(function each(column, index){
					if(column.name) {
						columns.push({
							column 		: 	column.name,
							type 		: 	column.type,
							primaryKey 	: 	(column.isPrimaryKey()) ? true : false
						});
					} 
				});
				return columns;
			};
			db[nameTable] = newTable;
		}, function error(){
			console.log("Holaaa");
		});
	};

	function ModelDB(props){
		this.name=props.name;
		this.space = props.space.detail.size + " " + (props.space.detail.measure).toLowerCase();
		this.description = props.description;
		this.version = props.version;
		this.db = window.openDatabase(props.name,props.version,props.description,props.space.size);
		this.tables = [];
		this.update = function update(){
			
		};
		return this;
	}
	ModelDB.prototype = {
		__defineTable: function __defineTable(table){
			var DB = this;
			var exists_table = false;
			if(DB.tables.length > 0){
				Takalik.utils.each(DB.tables,function each(property){
					if(property==table.name){exists_table=true;return console.error("'"+table.name+"'"+" already exists in database");}
				},this);
			}
			if(!exists_table) new ModelTable(DB, table);
			//if(!exists_table) DB[table.name]=new ModelTable(DB,table);
		},
		createTable: function createTable(properties){
			if(!Takalik.utils.isDefined(properties)) return console.error("Table's information is not defined");
			if(Takalik.utils.isObject(properties)) properties=[properties];

			Takalik.utils.each(properties, function each(property,value){
				this.__defineTable(property);
			},this);
		},
		createIndex: function createIndex(){
			//Incomplete
		},
		alterTable: function alterTable(){
			/*
				{
					table: "tabla",
					addColumn: {
						name: "alfonso",
						type: "TEXT"
					}
				}
				or
				{
					table: "tabla",
					addColumns: [{name: "hola",type: "INTEGER"},{name: "testing", type: "TEXT"}]
				}
			*/
		},
		destroyTable: function destroyTable(){
			return "In construction";
		},
		getTables: function getTables(){

		}
	};
	Takalik.localSQL={
		createDB: function createDB(props){
			if(!Takalik.utils.isDefined(props)) console.error("Information of database is not defined");
			if(!Takalik.utils.isObject(props)) console.error("Information of database is not an object");

			if(props.space){
				var _measureAccepted={
					"byte": function byte(value){return value;},
					"kb": function kb(value){return value*1024},
					"mb": function mb(value){return value*1024*1024}
				};

				if(props.space.measure in _measureAccepted){
					props.space={
						detail: props.space,
						size: _measureAccepted[props.space.measure](props.space.size)
					};
				}
			} else{console.error("Space of database is not defined");}
			return new ModelDB(props);
		}
	}


	/*var providersIndexedDB = {
		database: window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB,
		transaction: window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction,
		range: window.IDBKeyRange || window.webkitIDBKeyRange || window.mozIDBKeyRange,
		cursor: window.IDBCursor || window.webkitIDBCursor || window.mozIDBCursor
	};

	var factoryIdb = function factoryIdb(name,context){};*/

	Takalik.localIndexedDB = function idb(name){};

}).call(this);