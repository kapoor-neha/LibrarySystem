var menuxhr, allDefaultTagsArr= new Array();;
function __alertModalBox(msg){
	$("#globalMessage").html(msg);
	$('#globalPrompt').modal('show');
}

function generate_code(name,code){
	var val=document.getElementById(name).value;
	var patt=/[^A-Za-z0-9_-]/g;
	var result=val.replace(patt,' ');
	result=result.replace(/-/g, ' ');
	result=result.replace(/\s+/g, ' ');
	result = result.replace(/^\s+|\s+$/g,'');
	result=result.replace(/\s/g, '-');
	result=result.toLowerCase();
	document.getElementById(code).value=result;
}
//called from every entry form to pass all values as json to save request
function dataAsJson(name, form){
	var x = $("#"+name).serializeArray();
	var outputObj = new Object();
    $.each(x, function(i, field){
    	if(field.name!="id" && field.name!="table_name" && field.name!="unique_field" && field.name!="data"){
    		$("input[name="+field.name+"]").removeAttr('name');
        	outputObj[field.name]   = field.value;
     	}
    });
    $("#data").val(JSON.stringify(outputObj));
	form.submit();
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}


//to check entered digit is number
	function checknumber(e)	{
		var k = e.which;
		/* numeric inputs can come from the keypad or the numeric row at the top */
		 if ((k<48 || k>57) && (k!=46) && (k!=8) && (k!=0)) {
			e.preventDefault();
			//alert("Allowed characters are 0-9, +, -, (, )");
			return false;
		}
	}
$(function () {
	$('.num').keypress(function(e){
		checknumber(e);	
	}); 
});