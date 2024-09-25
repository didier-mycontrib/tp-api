function errCallback(err,status){
	document.getElementById('spanMessage').innerText="error:" + err + " [" + status + "]";
}

function displaySelectedProd(prod){
	  document.getElementById('spanId').innerText=prod.id;
	  document.getElementById('txtLabel').value=prod.label;
	  document.getElementById('txtPrice').value=prod.price;
}

function initProdFromNewInput(){
	var prod = { id : undefined , 
				label : undefined, 
				price: undefined};
	prod.id = document.getElementById('spanId').innerText;
	prod.label=document.getElementById('txtLabel').value;
	prod.price=Number(document.getElementById('txtPrice').value);
    return prod;
}

function onSelectRow(evt){
  let selectedTD = evt.target;
  let idSelectedRow=(selectedTD.parentNode).id;
  let codeOfSelectedProd = idSelectedRow.substring(2); //after p_
  makeAjaxGetRequest("../product-api/v1/public/products/"+codeOfSelectedProd,function(data){
	var selectedProd = JSON.parse(data);
	displaySelectedProd(selectedProd);
  });
}

function callbackAfterUpdate(data){
	document.getElementById('spanMessage').innerText="updated data (server side):" + data;
	refreshAllDataInTable();//ici sans optimisation !
}

function onUpdateProd(evt){
	var prod = initProdFromNewInput();
	var jsonData = JSON.stringify(prod);//new value to send to backend
	var url = "../product-api/v1/private/products/"+prod.id+"?v=true"
	makeAjaxPutRequest(url,jsonData,callbackAfterUpdate,errCallback)
}

function addRowInTable(prod){
	  var eltTbody = document.getElementById("bodyTableau");
	  var newRow = eltTbody.insertRow(-1) ;
	  newRow.setAttribute("id","p_"+prod.id);
	  newRow.insertCell(0).innerText = prod.id;
	  newRow.insertCell(1).innerText = prod.label;
	  newRow.insertCell(2).innerText = prod.price;
	  newRow.addEventListener("click",onSelectRow);
}

function refreshAllDataInTable(){
	document.getElementById("bodyTableau").innerHTML="";//supprimer eventuelles anciennes lignes
	//page courante d'url = http://localhost:8233/html/ajax_prod.html
	//URL relative ici en .. pour remonter de http://localhost:8233/html
	//vers http://localhost:8233
	
	makeAjaxGetRequest("../product-api/v1/public/products",function(data){
		tabProd = JSON.parse(data);
		for(let i in tabProd){
			addRowInTable(tabProd[i]);
		}
	});
}

window.onload=function(){
	refreshAllDataInTable();
	document.getElementById("btnUpdate").addEventListener("click",onUpdateProd);
}